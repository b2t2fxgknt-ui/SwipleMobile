/**
 * MissionConfirmationScreen.js
 * Résumé de la mission + explication escrow + CTA "Confirmer et payer"
 * Params : { mission, freelancer }
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
 StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Mock fallback (si pas de params navigation) ───────────────────────────────
const DEFAULT_MISSION = {
  type: 'Hook',
  icon: 'timer-outline',
  color: '#EF4444',
  title: 'Refonte du hook TikTok',
  problem: 'Tu perds l\'attention dès les 2 premières secondes',
  duration: '15–30s',
  budget: 45,
  revisions: 2,
  deadline: '24h',
};

const DEFAULT_FREELANCER = {
  name: 'Sophie L.',
  initials: 'SL',
  specialty: 'Experte Hook & Accroche',
  rating: 4.9,
  level: 'Top',
  color: '#EF4444',
};

// ── Étapes escrow ─────────────────────────────────────────────────────────────
const ESCROW_STEPS = [
  { icon: 'lock-closed',        label: 'Tu paies maintenant',          sub: 'Argent sécurisé, jamais débité directement' },
  { icon: 'briefcase-outline',  label: 'Le freelance travaille',        sub: 'Il reçoit le brief et démarre sous 2h' },
  { icon: 'checkmark-circle',   label: 'Tu valides la livraison',       sub: 'Paiement libéré uniquement si tu es satisfait' },
];

// ── Ligne de prix ─────────────────────────────────────────────────────────────
function PriceLine({ label, value, accent, large, muted }) {
  return (
    <View style={styles.priceLine}>
      <Text style={[styles.priceLabel, muted && { color: COLORS.textLight }]}>{label}</Text>
      <Text style={[
        styles.priceValue,
        large  && styles.priceValueLarge,
        accent && { color: COLORS.primary },
        muted  && { color: COLORS.textLight },
      ]}>
        {value}
      </Text>
    </View>
  );
}

// ── Badge rassurant ───────────────────────────────────────────────────────────
function TrustBadge({ icon, label, color }) {
  return (
    <View style={[styles.trustBadge, { borderColor: color + '35', backgroundColor: color + '10' }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.trustBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function MissionConfirmationScreen() {
  const navigation = useNavigation();
  const route      = useRoute();

  const mission    = route.params?.mission    ?? DEFAULT_MISSION;
  const freelancer = route.params?.freelancer ?? DEFAULT_FREELANCER;

  const [agreed, setAgreed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const serviceFee = Math.round(mission.budget * 0.1);
  const total      = mission.budget + serviceFee;

  function handleConfirm() {
    if (!agreed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('PaymentProcessing', { mission, freelancer, total });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Back header ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Confirmer la mission</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Badges de confiance ── */}
            <View style={styles.trustRow}>
              <TrustBadge icon="shield-checkmark"  label="Paiement sécurisé"  color="#22C55E" />
              <TrustBadge icon="person-circle"      label="Freelance vérifié"   color={COLORS.primary} />
              <TrustBadge icon="refresh-circle"     label="2 révisions incluses" color="#F59E0B" />
            </View>

            {/* ── Résumé mission ── */}
            <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>LA MISSION</Text></View>
            <View style={[styles.card, { borderColor: mission.color + '30' }]}>
              <LinearGradient
                colors={[mission.color + '16', mission.color + '04']}
                style={StyleSheet.absoluteFill}
                borderRadius={RADIUS.xl}
              />
              <View style={styles.missionHeader}>
                <View style={[styles.missionIconBox, { backgroundColor: mission.color + '20', borderColor: mission.color + '40' }]}>
                  <Ionicons name={mission.icon} size={20} color={mission.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.missionType, { color: mission.color }]}>{mission.type}</Text>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                </View>
              </View>

              {/* Problème détecté */}
              <View style={styles.problemBox}>
                <Ionicons name="analytics-outline" size={13} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.problemLabel}>Problème détecté par l'IA</Text>
                  <Text style={styles.problemText}>"{mission.problem}"</Text>
                </View>
              </View>

              <View style={styles.missionMeta}>
                <View style={styles.metaChip}>
                  <Ionicons name="videocam-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaChipText}>Vidéo {mission.duration}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="alarm-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaChipText}>Livraison {mission.deadline}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="refresh-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaChipText}>{mission.revisions} révisions</Text>
                </View>
              </View>
            </View>

            {/* ── Freelance sélectionné ── */}
            <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>FREELANCE SÉLECTIONNÉ</Text></View>
            <View style={styles.card}>
              <View style={styles.freelanceRow}>
                <View style={[styles.freelanceAvatar, { backgroundColor: freelancer.color + '20', borderColor: freelancer.color + '40' }]}>
                  <Text style={[styles.freelanceInitials, { color: freelancer.color }]}>{freelancer.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.freelanceNameRow}>
                    <Text style={styles.freelanceName}>{freelancer.name}</Text>
                    <View style={[styles.levelBadge, { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '35' }]}>
                      <Text style={[styles.levelText, { color: COLORS.primary }]}>{freelancer.level}</Text>
                    </View>
                  </View>
                  <Text style={styles.freelanceSpecialty}>{freelancer.specialty}</Text>
                  <View style={styles.freelanceMeta}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.freelanceRating}>{freelancer.rating}</Text>
                    <View style={[styles.verifiedBadge]}>
                      <Ionicons name="shield-checkmark" size={10} color="#22C55E" />
                      <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Récapitulatif prix ── */}
            <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>RÉCAPITULATIF</Text></View>
            <View style={styles.card}>
              <PriceLine label="Mission"                  value={`${mission.budget}€`} />
              <View style={styles.priceDivider} />
              <PriceLine label="Frais de service (10%)"  value={`${serviceFee}€`} muted />
              <View style={styles.priceDivider} />
              <PriceLine label="Total sécurisé"          value={`${total}€`} large accent />
              <View style={[styles.escrowNote, { backgroundColor: '#22C55E0C', borderColor: '#22C55E25' }]}>
                <Ionicons name="lock-closed" size={12} color="#22C55E" />
                <Text style={styles.escrowNoteText}>
                  Votre argent est sécurisé jusqu'à validation de la livraison
                </Text>
              </View>
            </View>

            {/* ── Comment ça marche (escrow) ── */}
            <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>COMMENT ÇA MARCHE</Text></View>
            <View style={styles.card}>
              {ESCROW_STEPS.map((step, i) => (
                <View key={i}>
                  <View style={styles.escrowStep}>
                    <View style={[styles.escrowStepNum, { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '30' }]}>
                      <Ionicons name={step.icon} size={15} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.escrowStepLabel}>{step.label}</Text>
                      <Text style={styles.escrowStepSub}>{step.sub}</Text>
                    </View>
                  </View>
                  {i < ESCROW_STEPS.length - 1 && (
                    <View style={styles.escrowConnector}>
                      <View style={styles.escrowLine} />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* ── Accord CGU ── */}
            <TouchableOpacity
              style={styles.agreeRow}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgreed(a => !a); }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
                {agreed && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.agreeText}>
                J'accepte les{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>conditions générales</Text>
                {' '}et la politique d'escrow Swiple
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>

        {/* ── CTA sticky ── */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.88}
            style={[styles.ctaBtn, !agreed && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={styles.ctaText}>Confirmer et payer · {total}€</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>Paiement 100% sécurisé · Libéré à la validation</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },

  // Trust badges
  trustRow:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingVertical: SPACING.md },
  trustBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  trustBadgeText: { fontSize: 11, fontWeight: '700' },

  // Section label
  sectionLabel:     { marginTop: SPACING.sm, marginBottom: 8 },
  sectionLabelText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8 },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOW.sm,
  },

  // Mission
  missionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.sm },
  missionIconBox: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  missionType:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  missionTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.text },
  problemBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.primary + '0C', borderRadius: RADIUS.md, padding: 10, marginBottom: SPACING.sm },
  problemLabel:   { fontSize: 10, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  problemText:    { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, fontStyle: 'italic' },
  missionMeta:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 5 },
  metaChipText:   { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  // Freelance
  freelanceRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  freelanceAvatar:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  freelanceInitials: { fontSize: 17, fontWeight: '800' },
  freelanceNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  freelanceName:     { fontSize: 15, fontWeight: '800', color: COLORS.text },
  levelBadge:        { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  levelText:         { fontSize: 10, fontWeight: '800' },
  freelanceSpecialty:{ fontSize: 12, color: COLORS.textMuted, marginBottom: 5 },
  freelanceMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  freelanceRating:   { fontSize: 12, fontWeight: '700', color: '#F59E0B', marginRight: 4 },
  verifiedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#22C55E0F', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  verifiedText:      { fontSize: 10, fontWeight: '700', color: '#22C55E' },

  // Prix
  priceLine:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  priceLabel:      { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  priceValue:      { fontSize: 13, fontWeight: '700', color: COLORS.text },
  priceValueLarge: { fontSize: 18, fontWeight: '900' },
  priceDivider:    { height: 1, backgroundColor: COLORS.border },
  escrowNote:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: RADIUS.md, padding: 10, marginTop: 12 },
  escrowNoteText:  { fontSize: 11, color: '#22C55E', fontWeight: '600', flex: 1, lineHeight: 15 },

  // Escrow steps
  escrowStep:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  escrowStepNum:  { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  escrowStepLabel:{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  escrowStepSub:  { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },
  escrowConnector:{ paddingLeft: 18, paddingVertical: 4 },
  escrowLine:     { width: 1, height: 16, backgroundColor: COLORS.border, marginLeft: -1 },

  // Agree
  agreeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: 4,
  },
  checkbox:  { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  agreeText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  // CTA
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'E8', paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  ctaBtn:      { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 8, ...SHADOW.md },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText:     { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  ctaSub:      { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
});
