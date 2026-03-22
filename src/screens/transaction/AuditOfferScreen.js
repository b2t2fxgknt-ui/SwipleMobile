/**
 * AuditOfferScreen.js
 * Hub de conversion post-audit — présente les 3 options de correction :
 *   A. Pack complet (dominant) — 60€
 *   B. Corrections ciblées (par problème) — 20–50€
 *   C. DIY (autonome)
 *
 * Navigation params: { score, criticalCount }
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Données ───────────────────────────────────────────────────────────────────

const PACK_PRICE    = 60;
const PACK_ORIGINAL = 127;

const PACK_ITEMS = [
  { icon: 'flash-outline',         label: 'Hook réécrit (0–3s)',           desc: 'Accrocher en moins de 3s' },
  { icon: 'cut-outline',           label: 'Montage + rythme optimisé',      desc: 'Cuts dynamiques & transitions' },
  { icon: 'text-outline',          label: 'Sous-titres animés',             desc: 'Format TikTok/Reels natif' },
  { icon: 'musical-note-outline',  label: 'Son trending ajouté',            desc: 'Courbe montante TikTok Studio' },
  { icon: 'chatbubble-outline',    label: 'Feedback final détaillé',        desc: 'Points forts + axes de progression' },
];

// Corrections ciblées — générées depuis les issues de l'audit
const TARGETED_FIXES = [
  {
    id: 'tf1',
    problem: 'Hook trop lent',
    solution: '3 hooks viraux rédigés',
    expertName: 'Thomas G.',
    expertInitials: 'TG',
    expertBadge: 'Copywriter',
    rating: 4.9,
    price: 29,
    deliveryTime: '24h',
    color: '#EF4444',
    icon: 'flash-outline',
  },
  {
    id: 'tf2',
    problem: 'Sous-titres manquants',
    solution: 'Sous-titres pro intégrés',
    expertName: 'Léa M.',
    expertInitials: 'LM',
    expertBadge: 'Monteur',
    rating: 4.8,
    price: 49,
    deliveryTime: '24h',
    color: '#F59E0B',
    icon: 'text-outline',
  },
  {
    id: 'tf3',
    problem: 'Rythme de montage',
    solution: 'Cuts & rythme optimisés',
    expertName: 'Sam V.',
    expertInitials: 'SV',
    expertBadge: 'Monteur',
    rating: 4.7,
    price: 39,
    deliveryTime: '48h',
    color: '#8B5CF6',
    icon: 'cut-outline',
  },
];

const DIY_ACTIONS = [
  'Réécrire les 2 premières secondes avec un hook choc',
  'Activer les sous-titres auto dans CapCut (5 min)',
  'Remplacer la musique par un son trending',
  'Recadrer le sujet dans la zone dorée (15%–55%)',
  'Ajouter 5–8 hashtags ciblés',
];

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function AuditOfferScreen() {
  const navigation = useNavigation();
  const route      = useRoute();

  const score        = route.params?.score        ?? 56;
  const criticalCount = route.params?.criticalCount ?? 2;

  const targetedTotal = TARGETED_FIXES.reduce((s, f) => s + f.price, 0);
  const packSaving    = targetedTotal - PACK_PRICE;

  function handlePack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Experts');
  }

  function handleTargeted(fix) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Experts');
  }

  function handleDiy() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── TopBar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle}>Comment corriger ta vidéo ?</Text>
            <Text style={styles.topBarSub}>Score {score}/100 · {criticalCount} problème{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} détecté{criticalCount > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ══ A. PACK DOMINANT ══════════════════════════════════════════ */}
          <View style={styles.packCard}>
            <LinearGradient
              colors={['#7C3AED20', '#7C3AED08']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.xl}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />

            {/* Header avec badges */}
            <View style={styles.packTop}>
              <View style={styles.packRecommBadge}>
                <Ionicons name="sparkles" size={10} color="#fff" />
                <Text style={styles.packRecommText}>RECOMMANDÉ</Text>
              </View>
              <View style={styles.packPriceRow}>
                <Text style={styles.packOriginal}>{PACK_ORIGINAL}€</Text>
                <Text style={styles.packPrice}>{PACK_PRICE}€</Text>
                <View style={styles.packSavingBadge}>
                  <Text style={styles.packSavingText}>
                    -{Math.round((1 - PACK_PRICE / PACK_ORIGINAL) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.packTitle}>Pack Optimisation Viralité</Text>
            <Text style={styles.packSub}>Tout ce qu'il faut pour que ta vidéo performe · Livraison 24–48h</Text>

            {/* Items */}
            <View style={styles.packItems}>
              {PACK_ITEMS.map((item, i) => (
                <View key={i} style={styles.packItem}>
                  <View style={styles.packItemCheck}>
                    <Ionicons name="checkmark" size={11} color="#22C55E" />
                  </View>
                  <Ionicons name={item.icon} size={14} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packItemLabel}>{item.label}</Text>
                    <Text style={styles.packItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Économie vs ciblé */}
            {packSaving > 0 && (
              <View style={styles.packSavingRow}>
                <Ionicons name="trending-down" size={13} color="#22C55E" />
                <Text style={styles.packSavingRowText}>
                  Tu économises <Text style={{ fontWeight: '800', color: '#22C55E' }}>{packSaving}€</Text> vs les corrections séparées
                </Text>
              </View>
            )}

            {/* CTA Principal */}
            <TouchableOpacity onPress={handlePack} activeOpacity={0.88} style={styles.packCtaWrap}>
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6']}
                style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.lg }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Ionicons name="rocket" size={17} color="#fff" />
              <Text style={styles.packCtaText}>Optimiser ma vidéo — {PACK_PRICE}€</Text>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </TouchableOpacity>

            <View style={styles.packTrust}>
              <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.packTrustText}>Paiement sécurisé · Fonds libérés après validation · Révision gratuite</Text>
            </View>
          </View>

          {/* ── Social proof ── */}
          <View style={styles.socialRow}>
            <Ionicons name="people" size={13} color="#22C55E" />
            <Text style={styles.socialText}>
              <Text style={{ fontWeight: '800', color: COLORS.text }}>+2 400 créateurs</Text> ont amélioré leurs vues ce mois-ci avec ce pack
            </Text>
          </View>

          {/* ══ DIVIDER ══════════════════════════════════════════════════ */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>ou cibler un problème précis</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ══ B. CORRECTIONS CIBLÉES ═══════════════════════════════════ */}
          <View style={styles.targetedSection}>
            <View style={styles.targetedHeader}>
              <Ionicons name="git-merge-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.targetedHeaderText}>CORRECTIONS CIBLÉES</Text>
            </View>
            <Text style={styles.targetedSub}>Basées sur ton audit · règle les problèmes un par un</Text>

            {TARGETED_FIXES.map((fix) => (
              <View key={fix.id} style={styles.fixCard}>
                <LinearGradient
                  colors={[fix.color + '08', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.lg}
                />

                {/* Problem pill */}
                <View style={[styles.fixProblemRow, { borderLeftColor: fix.color }]}>
                  <Ionicons name="alert-circle-outline" size={11} color={fix.color} />
                  <Text style={[styles.fixProblem, { color: fix.color }]}>{fix.problem}</Text>
                  <View style={[styles.fixArrow, { backgroundColor: fix.color + '15' }]}>
                    <Ionicons name="arrow-forward" size={10} color={fix.color} />
                  </View>
                  <Text style={styles.fixSolution}>{fix.solution}</Text>
                </View>

                {/* Expert + CTA */}
                <View style={styles.fixBottom}>
                  <View style={styles.fixExpert}>
                    <View style={[styles.fixAvatar, { backgroundColor: fix.color + '20' }]}>
                      <Text style={[styles.fixAvatarText, { color: fix.color }]}>{fix.expertInitials}</Text>
                    </View>
                    <View>
                      <View style={styles.fixExpertName}>
                        <Text style={styles.fixName}>{fix.expertName}</Text>
                        <View style={[styles.fixBadge, { backgroundColor: fix.color + '15', borderColor: fix.color + '30' }]}>
                          <Text style={[styles.fixBadgeText, { color: fix.color }]}>{fix.expertBadge}</Text>
                        </View>
                      </View>
                      <View style={styles.fixMeta}>
                        <Ionicons name="star" size={10} color="#F59E0B" />
                        <Text style={styles.fixRating}>{fix.rating}</Text>
                        <Text style={styles.fixDot}>·</Text>
                        <Text style={styles.fixDelivery}>{fix.deliveryTime}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.fixCta, { borderColor: fix.color + '40', backgroundColor: fix.color + '12' }]}
                    onPress={() => handleTargeted(fix)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.fixCtaPrice, { color: fix.color }]}>{fix.price}€</Text>
                    <Text style={[styles.fixCtaLabel, { color: fix.color }]}>Corriger →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Note pack plus avantageux */}
            <View style={styles.packNudge}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
              <Text style={styles.packNudgeText}>
                Le pack complet revient à <Text style={{ fontWeight: '800', color: COLORS.primary }}>{PACK_PRICE}€</Text> au lieu de {targetedTotal}€ pour les 3 corrections
              </Text>
              <TouchableOpacity onPress={handlePack} activeOpacity={0.8}>
                <Text style={styles.packNudgeCta}>Prendre le pack →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══ DIVIDER ══════════════════════════════════════════════════ */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ══ C. DIY ═══════════════════════════════════════════════════ */}
          <View style={styles.diyCard}>
            <View style={styles.diyHeader}>
              <View style={styles.diyIconBox}>
                <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.diyTitle}>Je me débrouille seul</Text>
                <Text style={styles.diySub}>Plan d'action complet basé sur ton audit · ~20 min</Text>
              </View>
            </View>

            {/* Preview checklist (3 items) */}
            <View style={styles.diyPreview}>
              {DIY_ACTIONS.slice(0, 3).map((action, i) => (
                <View key={i} style={styles.diyPreviewRow}>
                  <View style={styles.diyPreviewDot} />
                  <Text style={styles.diyPreviewText} numberOfLines={1}>{action}</Text>
                </View>
              ))}
              <Text style={styles.diyPreviewMore}>+{DIY_ACTIONS.length - 3} autres actions…</Text>
            </View>

            {/* CTA DIY */}
            <TouchableOpacity style={styles.diyCta} onPress={handleDiy} activeOpacity={0.82}>
              <Ionicons name="list-outline" size={15} color={COLORS.primary} />
              <Text style={styles.diyCtaText}>Voir le plan d'action complet</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // TopBar
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  topBarSub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },

  // ── Pack card ─────────────────────────────────────────────────────────────
  packCard: {
    backgroundColor: COLORS.card,
    borderWidth: 2, borderColor: COLORS.primary + '50',
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    overflow: 'hidden', gap: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22, shadowRadius: 18, elevation: 10,
    marginBottom: SPACING.sm,
  },
  packTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packRecommBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  packRecommText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.6 },
  packPriceRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  packOriginal:   { fontSize: 13, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  packPrice:      { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  packSavingBadge: {
    backgroundColor: '#22C55E15', borderWidth: 1, borderColor: '#22C55E35',
    borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2,
  },
  packSavingText: { fontSize: 11, fontWeight: '900', color: '#22C55E' },
  packTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  packSub:   { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  packItems: { gap: 9 },
  packItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  packItemCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#22C55E18', borderWidth: 1, borderColor: '#22C55E35',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  packItemLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  packItemDesc:  { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  packSavingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#22C55E0C', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#22C55E25', padding: 9,
  },
  packSavingRowText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },

  packCtaWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: RADIUS.lg, overflow: 'hidden',
    ...SHADOW.md,
  },
  packCtaText: { fontSize: 16, fontWeight: '900', color: '#fff' },

  packTrust: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
  },
  packTrustText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', flex: 1, lineHeight: 14 },

  // Social row
  socialRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#22C55E0A', borderWidth: 1, borderColor: '#22C55E25',
    borderRadius: RADIUS.lg, padding: 10, marginBottom: SPACING.md,
  },
  socialText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: SPACING.md },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  dividerTxt:  { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  // ── Corrections ciblées ───────────────────────────────────────────────────
  targetedSection: { gap: 10, marginBottom: SPACING.sm },
  targetedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  targetedHeaderText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  targetedSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: -4, marginBottom: 4 },

  fixCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, overflow: 'hidden', gap: 10,
    ...SHADOW.sm,
  },
  fixProblemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderLeftWidth: 3, paddingLeft: 8,
  },
  fixProblem:   { fontSize: 11, fontWeight: '700' },
  fixArrow: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  fixSolution:  { fontSize: 11, fontWeight: '600', color: COLORS.text, flex: 1 },

  fixBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fixExpert: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  fixAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fixAvatarText: { fontSize: 13, fontWeight: '800' },
  fixExpertName: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  fixName:  { fontSize: 13, fontWeight: '700', color: COLORS.text },
  fixBadge: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 },
  fixBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  fixMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fixRating:   { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  fixDot:      { fontSize: 11, color: COLORS.textMuted },
  fixDelivery: { fontSize: 11, color: COLORS.textMuted },

  fixCta: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 9,
    alignItems: 'center', flexShrink: 0,
  },
  fixCtaPrice: { fontSize: 15, fontWeight: '900' },
  fixCtaLabel: { fontSize: 11, fontWeight: '700', marginTop: 1 },

  // Nudge pack
  packNudge: {
    gap: 6, backgroundColor: COLORS.primary + '0A',
    borderWidth: 1, borderColor: COLORS.primary + '25',
    borderRadius: RADIUS.lg, padding: 12,
  },
  packNudgeText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  packNudgeCta:  { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  // ── DIY ───────────────────────────────────────────────────────────────────
  diyCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 12,
  },
  diyHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  diyIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  diyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  diySub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 16 },

  diyPreview: { gap: 7, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  diyPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  diyPreviewDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: COLORS.textMuted, marginTop: 6, flexShrink: 0,
  },
  diyPreviewText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  diyPreviewMore: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginTop: 2 },

  diyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary + '10', borderWidth: 1.5, borderColor: COLORS.primary + '35',
    borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: SPACING.md,
  },
  diyCtaText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
