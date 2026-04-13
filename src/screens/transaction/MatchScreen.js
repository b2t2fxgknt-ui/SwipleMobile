/**
 * MatchScreen.js — Écran MATCH animé
 * Apparaît quand un client choisit un ghostwriter.
 * Sparks + avatars + texte rebondissant → auto-dismiss 2.5s
 * Params : { mission, freelancer, client }
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const { width } = Dimensions.get('window');

const SPARK_COLORS = ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#fff', '#FBBF24'];
const SPARK_COUNT  = 14;

// ── Particule étincelle ───────────────────────────────────────────────────────

function Spark({ angle, distance, color, size, delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  const tx      = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] });
  const ty      = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const scale   = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.2, 0.2] });

  return (
    <Animated.View style={[
      styles.spark,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      { transform: [{ translateX: tx }, { translateY: ty }, { scale }], opacity },
    ]} />
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function MatchScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { mission, freelancer, client } = route.params ?? {};

  const scaleAnim      = useRef(new Animated.Value(0)).current;
  const subAnim        = useRef(new Animated.Value(0)).current;
  const clientSlide    = useRef(new Animated.Value(-width * 0.6)).current;
  const freelancerSlide = useRef(new Animated.Value(width * 0.6)).current;
  const heartScale     = useRef(new Animated.Value(0)).current;
  const glowAnim       = useRef(new Animated.Value(0)).current;
  const ctaAnim        = useRef(new Animated.Value(0)).current;

  const sparks = Array.from({ length: SPARK_COUNT }, (_, i) => ({
    angle:    (i / SPARK_COUNT) * Math.PI * 2,
    distance: 70 + (i % 3) * 35,
    color:    SPARK_COLORS[i % SPARK_COLORS.length],
    size:     5 + (i % 4) * 2,
    delay:    100 + (i % 5) * 60,
  }));

  useEffect(() => {
    // Haptic immédiat
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 1. Avatars glissent
    Animated.parallel([
      Animated.spring(clientSlide,     { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      Animated.spring(freelancerSlide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();

    // 2. Cœur + sparks après 250ms
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.spring(heartScale, { toValue: 1, tension: 40, friction: 4, useNativeDriver: true }).start();
    }, 250);

    // 3. "MATCH !" rebondit après 450ms
    setTimeout(() => {
      Animated.spring(scaleAnim, { toValue: 1, tension: 38, friction: 5, useNativeDriver: true }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 450);

    // 4. Sous-titre fade in
    setTimeout(() => {
      Animated.timing(subAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 750);

    // 5. CTA apparaît
    setTimeout(() => {
      Animated.spring(ctaAnim, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }).start();
    }, 950);

    // 6. Pulse glow en boucle
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // 7. Auto-dismiss 2.5s
    const timer = setTimeout(() => handleContinue(), 2500);
    return () => clearTimeout(timer);
  }, []);

  function handleContinue() {
    if (mission) {
      navigation.replace('MissionBrief', { mission, freelancer });
    } else {
      navigation.goBack();
    }
  }

  const clientInitials    = client?.initials    ?? mission?.clientInitials ?? 'CL';
  const clientName        = client?.name         ?? mission?.clientName     ?? 'Client';
  const freelancerInitials = freelancer?.initials ?? 'GW';
  const glowOpacity       = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A18', '#150B2E', '#0A0A18']}
        style={StyleSheet.absoluteFill}
      />

      {/* Halo central */}
      <Animated.View style={[styles.centralGlow, { opacity: glowOpacity }]} />

      {/* ── Avatars ── */}
      <View style={styles.avatarsRow}>

        {/* Client */}
        <Animated.View style={[styles.avatarWrap, { transform: [{ translateX: clientSlide }] }]}>
          <LinearGradient
            colors={[COLORS.primary + 'DD', COLORS.primary + '55']}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarInitials}>{clientInitials}</Text>
          </LinearGradient>
          <View style={[styles.avatarBadge, { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary + '55' }]}>
            <Text style={[styles.avatarBadgeText, { color: COLORS.primary }]}>Client</Text>
          </View>
        </Animated.View>

        {/* Cœur central + sparks */}
        <View style={styles.heartCenter}>
          <Animated.View style={[styles.heartGlow, { opacity: glowOpacity }]} />
          <View style={styles.sparksWrap}>
            {sparks.map((s, i) => <Spark key={i} {...s} />)}
          </View>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name="heart" size={38} color="#EF4444" />
          </Animated.View>
        </View>

        {/* Ghostwriter */}
        <Animated.View style={[styles.avatarWrap, { transform: [{ translateX: freelancerSlide }] }]}>
          <LinearGradient
            colors={[COLORS.prestataire + 'DD', COLORS.prestataire + '55']}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarInitials}>{freelancerInitials}</Text>
          </LinearGradient>
          <View style={[styles.avatarBadge, { backgroundColor: COLORS.prestataire + '22', borderColor: COLORS.prestataire + '55' }]}>
            <Text style={[styles.avatarBadgeText, { color: COLORS.prestataire }]}>Ghostwriter</Text>
          </View>
        </Animated.View>

      </View>

      {/* ── MATCH ! ── */}
      <Animated.View style={[styles.matchBlock, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.matchText}>MATCH !</Text>
      </Animated.View>

      {/* ── Sous-titre ── */}
      <Animated.Text style={[styles.matchSub, { opacity: subAnim }]}>
        {clientName} a choisi ta candidature 🎉
      </Animated.Text>

      {/* ── CTA ── */}
      <Animated.View style={[styles.ctaWrap, { transform: [{ scale: ctaAnim }], opacity: ctaAnim }]}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.85} style={styles.cta}>
          <LinearGradient
            colors={[COLORS.prestataire, '#059669']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>Commencer la mission</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.autoText}>Redirection automatique…</Text>
      </Animated.View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A18',
    alignItems: 'center', justifyContent: 'center', gap: 28,
  },

  centralGlow: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: COLORS.primary,
    top: '50%', left: '50%',
    marginTop: -180, marginLeft: -140,
  },

  // Avatars
  avatarsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: SPACING.lg,
  },
  avatarWrap:   { alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 30, fontWeight: '900', color: '#fff' },
  avatarBadge: {
    borderRadius: RADIUS.full, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  avatarBadgeText: { fontSize: 11, fontWeight: '700' },

  // Cœur
  heartCenter: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70 },
  heartGlow: {
    position: 'absolute',
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#EF4444',
  },
  sparksWrap: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  spark: { position: 'absolute' },

  // MATCH text
  matchBlock: { alignItems: 'center' },
  matchText: {
    fontSize: 52, fontWeight: '900', color: '#fff',
    letterSpacing: 4,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  matchSub: {
    fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', paddingHorizontal: SPACING.xl,
    lineHeight: 24,
  },

  // CTA
  ctaWrap:     { alignItems: 'center', gap: 12, width: '100%', paddingHorizontal: SPACING.lg },
  cta:         { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17,
  },
  ctaText:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  autoText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
});
