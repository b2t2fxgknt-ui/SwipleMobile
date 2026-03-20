/**
 * DeliveryScreen.js — Visualisation de la livraison + validation / révision
 * Avant / Après, révisions restantes, CTA double
 * Params : { mission, freelancer }
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, PanResponder, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useMissions } from '../../lib/MissionsContext';

const { width: SW } = Dimensions.get('window');
const MAX_REVISIONS = 1;
const REVISIONS_USED = 0;

// ── Comparaison avant/après ────────────────────────────────────────────────────
function BeforeAfterSlider({ color }) {
  const sliderX    = useRef(new Animated.Value(0.5)).current;
  const posRef     = useRef(0.5);
  const startRef   = useRef(0.5);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder:        () => true,
    onMoveShouldSetPanResponder:         () => true,
    onPanResponderTerminationRequest:    () => false,
    onPanResponderGrant: () => {
      startRef.current = posRef.current;
    },
    onPanResponderMove: (_, g) => {
      const cardWidth = SW - SPACING.lg * 2 - SPACING.md * 2;
      const newPos = Math.max(0.05, Math.min(0.95, startRef.current + g.dx / cardWidth));
      posRef.current = newPos;
      sliderX.setValue(newPos);
    },
  })).current;

  const cardWidth = SW - SPACING.lg * 2 - SPACING.md * 2;
  // Utiliser des valeurs en pixels (plus fiable qu'un pourcentage animé)
  const leftWidthPx = sliderX.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, cardWidth],
  });

  return (
    <View style={styles.baContainer} {...panResponder.panHandlers}>
      {/* Fond APRÈS (optimisé) */}
      <LinearGradient colors={[color + '25', color + '10']} style={styles.baAfterBg} />
      <View style={styles.baAfterContent}>
        <Ionicons name="trending-up" size={32} color={color} />
        <Text style={[styles.baLabel, { color }]}>APRÈS</Text>
        <Text style={styles.baDesc}>Hook optimisé par l'IA</Text>
        <View style={[styles.baBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
          <Ionicons name="sparkles" size={12} color={color} />
          <Text style={[styles.baBadgeText, { color }]}>+3,2s de rétention</Text>
        </View>
      </View>

      {/* Overlay AVANT — fond opaque pour masquer l'APRÈS côté gauche */}
      <Animated.View style={[styles.baBeforeOverlay, { width: leftWidthPx }]}>
        <LinearGradient colors={['#3B82F618', '#3B82F605']} style={StyleSheet.absoluteFill} />
        <View style={styles.baBeforeContent}>
          <Ionicons name="trending-down" size={32} color="#EF4444" />
          <Text style={[styles.baLabel, { color: '#EF4444' }]}>AVANT</Text>
          <Text style={styles.baDesc}>Hook original</Text>
          <View style={[styles.baBadge, { backgroundColor: '#EF444418', borderColor: '#EF444435' }]}>
            <Ionicons name="time-outline" size={12} color="#EF4444" />
            <Text style={[styles.baBadgeText, { color: '#EF4444' }]}>1,8s d'attention</Text>
          </View>
        </View>
      </Animated.View>

      {/* Curseur */}
      <Animated.View style={[styles.baCursor, { left: sliderX.interpolate({ inputRange: [0, 1], outputRange: [0, cardWidth] }) }]}>
        <View style={[styles.baCursorLine, { backgroundColor: '#fff' }]} />
        <View style={styles.baCursorHandle}>
          <Ionicons name="chevron-back" size={10} color="#fff" />
          <Ionicons name="chevron-forward" size={10} color="#fff" />
        </View>
      </Animated.View>

      <Text style={styles.baDragHint}>◀ Glisse pour comparer ▶</Text>
    </View>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function DeliveryScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { updateStatus } = useMissions();
  const { mission, freelancer } = route.params ?? {};

  const mColor = mission?.color ?? COLORS.primary;
  const revisionsLeft = MAX_REVISIONS - REVISIONS_USED;

  function handleValidate() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // ── Met à jour le statut dans ProjetsScreen → onglet "Validés" ──
    if (mission?.id) updateStatus(mission.id, 'valide');
    navigation.replace('Validation', { mission, freelancer });
  }

  function handleRevision() {
    if (revisionsLeft === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('RevisionRequest', { mission, freelancer, revisionsLeft });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Livraison reçue</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Badge livraison ── */}
          <View style={[styles.deliveryBanner, { borderColor: '#22C55E30', backgroundColor: '#22C55E0A' }]}>
            <Ionicons name="cloud-download" size={18} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{freelancer?.name ?? 'Le freelance'} a livré votre mission</Text>
              <Text style={styles.bannerSub}>Validez pour libérer le paiement · {revisionsLeft > 0 ? '1 révision gratuite incluse' : 'Révision gratuite utilisée'}</Text>
            </View>
          </View>

          {/* ── Comparateur Avant / Après ── */}
          <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>COMPARAISON AVANT / APRÈS</Text></View>
          <View style={styles.card}>
            <BeforeAfterSlider color={mColor} />
          </View>

          {/* ── Stats améliorations ── */}
          <View style={styles.statsRow}>
            {[
              { icon: 'eye',           label: 'Rétention',  val: '+68%',  color: '#22C55E' },
              { icon: 'play-circle',   label: 'Complétions',val: '+41%',  color: COLORS.primary },
              { icon: 'trending-up',   label: 'Viral score', val: '82/100',color: '#F59E0B' },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { borderColor: s.color + '30' }]}>
                <LinearGradient colors={[s.color + '14', s.color + '04']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                <Ionicons name={s.icon} size={16} color={s.color} />
                <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Note du freelance ── */}
          <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>MESSAGE DU FREELANCE</Text></View>
          <View style={styles.card}>
            <View style={styles.noteRow}>
              <View style={[styles.noteAvatar, { backgroundColor: mColor + '20', borderColor: mColor + '40' }]}>
                <Text style={[styles.noteInitials, { color: mColor }]}>{freelancer?.initials ?? 'SL'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noteName}>{freelancer?.name ?? 'Sophie L.'}</Text>
                <Text style={styles.noteText}>
                  "J'ai retravaillé le hook pour démarrer directement sur l'action.
                  Le pattern d'ouverture est maintenant une question-choc qui force la curiosité."
                </Text>
              </View>
            </View>
          </View>

          {/* ── Révisions restantes ── */}
          <View style={[styles.revisionsBar, { borderColor: revisionsLeft > 0 ? '#F59E0B30' : '#EF444430', backgroundColor: revisionsLeft > 0 ? '#F59E0B08' : '#EF44440A' }]}>
            <Ionicons name="refresh-circle-outline" size={16} color={revisionsLeft > 0 ? '#F59E0B' : '#EF4444'} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.revisionsText, { color: revisionsLeft > 0 ? '#F59E0B' : '#EF4444' }]}>
                {revisionsLeft > 0
                  ? '1 révision gratuite incluse'
                  : 'Révision gratuite utilisée'}
              </Text>
              <Text style={[styles.revisionsSub, { color: revisionsLeft > 0 ? '#F59E0B99' : '#EF444499' }]}>
                Révisions supplémentaires : 5€ / retouche
              </Text>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* ── CTA sticky ── */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity onPress={handleValidate} activeOpacity={0.88} style={styles.validateBtn}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.validateGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.validateText}>Valider et payer</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>Paiement libéré uniquement après votre validation</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  deliveryBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  bannerSub:   { fontSize: 11, color: COLORS.textMuted },

  sectionLabel:     { marginTop: SPACING.xs, marginBottom: 6 },
  sectionLabelText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8 },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOW.sm,
  },

  // Comparateur B/A
  baContainer: {
    height: 200, borderRadius: RADIUS.lg, overflow: 'hidden',
    backgroundColor: COLORS.bg, position: 'relative',
  },
  baAfterBg:      { ...StyleSheet.absoluteFillObject },
  baAfterContent: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 },
  baBeforeOverlay:{ position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden', backgroundColor: COLORS.bg },
  baBeforeContent:{ alignItems: 'center', justifyContent: 'center', gap: 6, height: '100%' },
  baLabel:        { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  baDesc:         { fontSize: 11, color: COLORS.textMuted },
  baBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  baBadgeText:    { fontSize: 11, fontWeight: '700' },
  baCursor:       { position: 'absolute', top: 0, bottom: 0, width: 2, alignItems: 'center' },
  baCursorLine:   { ...StyleSheet.absoluteFillObject, width: 2 },
  baCursorHandle: { position: 'absolute', top: '50%', marginTop: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  baDragHint:     { position: 'absolute', bottom: 10, alignSelf: 'center', fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderRadius: RADIUS.lg,
    paddingVertical: 12, alignItems: 'center', gap: 4, overflow: 'hidden',
  },
  statVal:   { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Note freelance
  noteRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  noteAvatar:   { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  noteInitials: { fontSize: 14, fontWeight: '800' },
  noteName:     { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 5 },
  noteText:     { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, fontStyle: 'italic' },

  revisionsBar: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: RADIUS.lg, padding: 12, marginBottom: SPACING.sm },
  revisionsText:{ fontSize: 12, fontWeight: '700' },
  revisionsSub: { fontSize: 10, fontWeight: '500', marginTop: 1 },

  // CTAs
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'EC', paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm,
  },
  revisionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.primary + '50', borderRadius: RADIUS.xl,
    paddingVertical: 13, backgroundColor: COLORS.primary + '0A',
  },
  revisionBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  validateBtn:     { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  validateGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  validateText:    { fontSize: 16, fontWeight: '900', color: '#fff' },
  ctaSub:          { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
});
