/**
 * ValidationScreen.js — Animation succès après validation
 * "Mission terminée 🎉" + paiement libéré + stats
 * Params : { mission, freelancer }
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

export default function ValidationScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { mission, freelancer } = route.params ?? {};

  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const ringAnim    = useRef(new Animated.Value(0)).current;
  const confettiY   = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Séquence animée
    Animated.sequence([
      // Cercle qui pousse
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      // Pulse ring
      Animated.timing(ringAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }).start();
    Animated.timing(confettiY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }).start();
  }, []);

  const ringScale   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0B1A0E', COLORS.bg, COLORS.bg]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>

          {/* ── Icône succès animée ── */}
          <View style={styles.iconArea}>
            {/* Ring pulsant */}
            <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            {/* Cercle principal */}
            <Animated.View style={[styles.successCircleWrap, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.successCircle}>
                <Ionicons name="checkmark" size={52} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* ── Textes ── */}
          <Animated.View style={[styles.textBlock, { opacity: fadeAnim, transform: [{ translateY: confettiY }] }]}>
            <View style={styles.successBadge}>
              <Ionicons name="ribbon" size={22} color="#22C55E" />
            </View>
            <Text style={styles.title}>Mission terminée !</Text>
            <Text style={styles.sub}>
              Votre contenu est optimisé et prêt à performer.
            </Text>

            {/* Paiement libéré */}
            <View style={styles.paymentCard}>
              <LinearGradient colors={['#22C55E20', '#22C55E08']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
              <View style={styles.paymentRow}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTitle}>Paiement libéré au freelance</Text>
                  <Text style={styles.paymentSub}>Envoyé à {freelancer?.name ?? 'le freelance'}</Text>
                </View>
              </View>
            </View>

            {/* Stats mission */}
            <View style={styles.statsRow}>
              {[
                { icon: 'time-outline',     label: 'Délai',    val: mission?.deadline ?? '24h' },
                { icon: 'star',             label: 'Note',     val: '5.0 ★'                    },
                { icon: 'trending-up',      label: 'Gain',     val: '+25 pts'                   },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Ionicons name={s.icon} size={16} color={COLORS.primary} />
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Actions ── */}
          <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Review', { mission, freelancer });
              }}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.primaryGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.primaryText}>Laisser un avis</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Main')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryText}>Plus tard</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe:      { flex: 1 },
  content:   { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xl },

  // Icône
  iconArea: { alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl },
  ring: {
    position: 'absolute',
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, borderColor: '#22C55E',
  },
  successCircleWrap: { ...SHADOW.md },
  successCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },

  // Textes
  textBlock:   { alignItems: 'center', gap: SPACING.sm, width: '100%' },
  successBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#22C55E18', borderWidth: 1, borderColor: '#22C55E35',
    alignItems: 'center', justifyContent: 'center',
  },
  title:       { fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  sub:         { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  // Paiement
  paymentCard: {
    width: '100%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#22C55E30',
    borderRadius: RADIUS.xl, padding: SPACING.md, overflow: 'hidden',
  },
  paymentRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paymentLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  paymentSub:   { fontSize: 11, color: COLORS.textMuted },
  paymentAmount:{ fontSize: 22, fontWeight: '900', color: '#22C55E' },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.md, width: '100%' },
  statItem: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 14, alignItems: 'center', gap: 5,
  },
  statVal:   { fontSize: 14, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Actions
  actions:       { width: '100%', gap: SPACING.sm },
  primaryBtn:    { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  primaryGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  primaryText:   { fontSize: 15, fontWeight: '900', color: '#fff' },
  secondaryBtn:  { alignItems: 'center', paddingVertical: 12 },
  secondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
});
