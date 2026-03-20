/**
 * PaymentProcessingScreen.js
 * Animation de traitement du paiement → puis navigation vers MissionTracking
 * Params : { mission, freelancer, total }
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import { useMissions } from '../../lib/MissionsContext';

// ── Étapes du paiement ────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, icon: 'shield-checkmark',  label: 'Vérification de sécurité…',   duration: 900  },
  { id: 1, icon: 'lock-closed',       label: 'Sécurisation du paiement…',    duration: 1100 },
  { id: 2, icon: 'server',            label: 'Création du compte escrow…',   duration: 900  },
  { id: 3, icon: 'paper-plane',       label: 'Mission envoyée au freelance', duration: 800  },
];

// ── Cercle de progression ─────────────────────────────────────────────────────
function ProgressRing({ progress, size = 120, stroke = 7, color }) {
  const radius      = (size - stroke) / 2;
  const anim        = useRef(new Animated.Value(0)).current;
  const rotateAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.ringOuter, { width: size, height: size, borderRadius: size / 2, borderColor: color, transform: [{ rotate }] }]} />
      <View style={[styles.ringInner, { width: size - stroke * 4, height: size - stroke * 4, borderRadius: (size - stroke * 4) / 2, borderColor: color + '25' }]} />
    </View>
  );
}

export default function PaymentProcessingScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { acceptMission } = useMissions();

  const { mission, freelancer, total } = route.params ?? {};

  const [stepIndex, setStepIndex] = useState(0);
  const [done,      setDone]      = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const stepFade  = useRef(new Animated.Value(1)).current;

  // Fade in initial
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    runSteps();
  }, []);

  async function runSteps() {
    for (let i = 0; i < STEPS.length; i++) {
      await wait(STEPS[i].duration);
      if (i < STEPS.length - 1) {
        // Fade out step
        await animateTo(stepFade, 0, 200);
        setStepIndex(i + 1);
        await animateTo(stepFade, 1, 200);
      }
    }
    // Final success
    await wait(400);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // ── Ajouter la mission dans ProjetsScreen → onglet "En cours" ──
    if (mission) {
      acceptMission({
        ...mission,
        id: mission.id ?? `order_${Date.now()}`,
        clientName: 'Moi (client)',
        acceptedAt: new Date().toISOString(),
      });
    }
    setDone(true);
    // ← Pas d'auto-navigation : l'utilisateur appuie sur le bouton lui-même
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0E0E16', COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

          {/* ── Icône centrale ── */}
          <View style={styles.iconWrapper}>
            {done ? (
              <Animated.View style={styles.successRing}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.successCircle}>
                  <Ionicons name="checkmark" size={48} color="#fff" />
                </LinearGradient>
              </Animated.View>
            ) : (
              <>
                <ProgressRing size={130} color={COLORS.primary} />
                <View style={styles.ringCenterIcon}>
                  <Animated.View style={{ opacity: stepFade }}>
                    <Ionicons name={STEPS[stepIndex]?.icon} size={36} color={COLORS.primary} />
                  </Animated.View>
                </View>
              </>
            )}
          </View>

          {/* ── Texte ── */}
          {done ? (
            <View style={styles.doneBlock}>
              <Text style={styles.doneTitle}>Mission lancée !</Text>
              <Text style={styles.doneSub}>
                {total}€ sécurisés · Freelance notifié
              </Text>
              <View style={[styles.doneNote, { borderColor: '#22C55E25', backgroundColor: '#22C55E0C' }]}>
                <Ionicons name="lock-closed" size={13} color="#22C55E" />
                <Text style={styles.doneNoteText}>
                  Votre argent est protégé jusqu'à validation
                </Text>
              </View>
            </View>
          ) : (
            <Animated.View style={[styles.stepBlock, { opacity: stepFade }]}>
              <Text style={styles.stepLabel}>{STEPS[stepIndex]?.label}</Text>
            </Animated.View>
          )}

          {/* ── Indicateur de progression ── */}
          {!done && (
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === stepIndex && { backgroundColor: COLORS.primary, width: 20 },
                    i < stepIndex  && { backgroundColor: '#22C55E' },
                  ]}
                />
              ))}
            </View>
          )}

          {/* ── Carte récap + CTA ── */}
          {done && (
            <>
              <View style={styles.recapCard}>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Mission</Text>
                  <Text style={styles.recapValue}>{mission?.type ?? '—'}</Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Freelance</Text>
                  <Text style={styles.recapValue}>{freelancer?.name ?? '—'}</Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Montant sécurisé</Text>
                  <Text style={[styles.recapValue, { color: '#22C55E' }]}>{total ?? '—'}€</Text>
                </View>
              </View>

              {/* ── Bouton principal : voir suivi ── */}
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.replace('MissionTracking', { mission, freelancer });
                }}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#4F46E5']}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="layers-outline" size={16} color="#fff" />
                  <Text style={styles.ctaText}>Voir le suivi de commande</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Lien secondaire : retour Commandes ── */}
              <TouchableOpacity
                style={styles.ctaSecondary}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Main', { screen: 'Commandes', params: { initialTab: 'active' } });
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.ctaSecondaryText}>
                  Commande visible dans{' '}
                  <Text style={{ color: COLORS.primary, fontWeight: '800' }}>Commandes → En cours</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function animateTo(anim, toValue, duration) {
  return new Promise(resolve =>
    Animated.timing(anim, { toValue, duration, useNativeDriver: true }).start(resolve)
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe:      { flex: 1 },
  content:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },

  // Ring
  iconWrapper:  { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  ringOuter:    { position: 'absolute', borderWidth: 3, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' },
  ringInner:    { position: 'absolute', borderWidth: 1.5 },
  ringCenterIcon:{ position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  // Success
  successRing:   { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },

  // Step text
  stepBlock: { alignItems: 'center', marginBottom: SPACING.xl },
  stepLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' },

  // Dots
  dots: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },

  // Done
  doneBlock:    { alignItems: 'center', gap: 8, marginBottom: SPACING.xl },
  doneTitle:    { fontSize: 24, fontWeight: '900', color: COLORS.text },
  doneSub:      { fontSize: 14, color: COLORS.textMuted },
  doneNote:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 },
  doneNoteText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },

  // CTA buttons
  ctaBtn:         { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden', marginTop: SPACING.md },
  ctaGradient:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText:        { fontSize: 15, fontWeight: '900', color: '#fff' },
  ctaSecondary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.sm, paddingHorizontal: SPACING.md },
  ctaSecondaryText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16 },

  // Recap
  recapCard:    { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md },
  recapRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  recapLabel:   { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  recapValue:   { fontSize: 13, fontWeight: '800', color: COLORS.text },
  recapDivider: { height: 1, backgroundColor: COLORS.border },
});
