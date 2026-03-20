/**
 * CreatorCard.js — Carte compacte profil créateur
 * Intégration : en haut de MissionBriefScreen / MissionTrackingScreen
 *
 * Affiche en 3 secondes :
 *   WHO  → avatar initiales, pseudo, plateforme
 *   WHAT → niche + style court
 *   HOW  → 3 stats clés (abonnés, vues moy., engagement)
 *
 * Tap "Voir profil" → bottom sheet CreatorProfileSheet
 */

import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, SafeAreaView, Animated,
  TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Config plateforme ──────────────────────────────────────────────────────────
const PLATFORM_CFG = {
  TikTok:    { color: '#010101', bg: '#01010114', icon: 'phone-portrait-outline',   label: 'TikTok'    },
  Instagram: { color: '#E1306C', bg: '#E1306C14', icon: 'camera-outline',           label: 'Instagram' },
  YouTube:   { color: '#FF0000', bg: '#FF000014', icon: 'play-circle-outline',       label: 'YouTube'   },
  Reels:     { color: '#833AB4', bg: '#833AB414', icon: 'videocam-outline',          label: 'Reels'     },
};

// ── Utilitaire format ─────────────────────────────────────────────────────────
function statColor(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return COLORS.text;
  if (value.includes('%')) return num >= 4 ? '#22C55E' : num >= 2 ? '#F59E0B' : '#EF4444';
  return COLORS.text;
}

// ═══════════════════════════════════════════════════════════════════
//  BOTTOM SHEET — mini profil créateur
// ═══════════════════════════════════════════════════════════════════
export function CreatorProfileSheet({ visible, creator, accentColor, onClose, onChat }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      Animated.timing(bgAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }),
      Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [onClose]);

  React.useEffect(() => { if (visible) open(); }, [visible]);

  if (!visible && !creator) return null;
  const pc   = PLATFORM_CFG[creator?.platform] ?? PLATFORM_CFG.TikTok;
  const acc  = accentColor ?? COLORS.primary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* Fond flouté */}
      <Animated.View style={[styles.sheetOverlay, { opacity: bgAnim }]}>
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>

          {/* ── En-tête profil ── */}
          <View style={styles.sheetHead}>
            <View style={[styles.sheetAvatar, { backgroundColor: acc + '22', borderColor: acc + '40' }]}>
              <Text style={[styles.sheetAvatarText, { color: acc }]}>
                {creator?.initials ?? '??'}
              </Text>
              {/* Badge plateforme */}
              <View style={[styles.platformDot, { backgroundColor: pc.color, borderColor: COLORS.card }]}>
                <Ionicons name={pc.icon} size={9} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetName}>{creator?.name ?? '—'}</Text>
              <Text style={styles.sheetUsername}>{creator?.username ?? '—'}</Text>
              <View style={[styles.platformBadge, { backgroundColor: pc.bg, borderColor: pc.color + '35' }]}>
                <Ionicons name={pc.icon} size={10} color={pc.color} />
                <Text style={[styles.platformBadgeText, { color: pc.color }]}>{pc.label}</Text>
              </View>
            </View>
            <View style={styles.sheetHeadActions}>
              {onChat && (
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChat(); }}
                  style={[styles.sheetChatBtn, { backgroundColor: acc }]}
                  activeOpacity={0.75}
                >
                  <Ionicons name="chatbubble" size={15} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={close} style={styles.sheetCloseBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionLabel}>AUDIENCE</Text>
            <View style={styles.statsGrid}>
              {[
                { label: 'Abonnés',    value: creator?.followers,   icon: 'people-outline'    },
                { label: 'Vues moy.',  value: creator?.avgViews,    icon: 'eye-outline'        },
                { label: 'Engagement', value: creator?.engagement,  icon: 'heart-outline'      },
                { label: 'Vidéos/sem',value: creator?.postFreq,    icon: 'calendar-outline'   },
              ].filter(s => s.value).map((s, i) => (
                <View key={i} style={[styles.statBox, { borderColor: acc + '25', backgroundColor: acc + '07' }]}>
                  <Ionicons name={s.icon} size={14} color={acc} />
                  <Text style={[styles.statBoxNum, { color: statColor(s.value) }]}>{s.value}</Text>
                  <Text style={styles.statBoxLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Niche & Style ── */}
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionLabel}>NICHE & STYLE</Text>
            <View style={styles.nicheRow}>
              {(creator?.tags ?? []).map((tag, i) => (
                <View key={i} style={[styles.nicheChip, { backgroundColor: acc + '12', borderColor: acc + '28' }]}>
                  <Text style={[styles.nicheChipText, { color: acc }]}>{tag}</Text>
                </View>
              ))}
            </View>
            {!!creator?.style && (
              <Text style={styles.styleNote}>{creator.style}</Text>
            )}
          </View>

          {/* ── Objectif mission ── */}
          {!!creator?.objective && (
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>OBJECTIF MISSION</Text>
              <View style={[styles.objectiveBox, { borderLeftColor: acc }]}>
                <Text style={styles.objectiveText}>{creator.objective}</Text>
              </View>
            </View>
          )}

          {/* ── Do / Don't ── */}
          {(creator?.dos?.length > 0 || creator?.donts?.length > 0) && (
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>À SAVOIR</Text>
              <View style={styles.dosDontsRow}>
                {creator?.dos?.length > 0 && (
                  <View style={[styles.dosDontsBox, { borderColor: '#22C55E30', backgroundColor: '#22C55E08' }]}>
                    <View style={styles.dosDontsHead}>
                      <Ionicons name="checkmark-circle-outline" size={12} color="#22C55E" />
                      <Text style={[styles.dosDontsTitle, { color: '#22C55E' }]}>À FAIRE</Text>
                    </View>
                    {creator.dos.map((d, i) => (
                      <Text key={i} style={[styles.dosDontsItem, { color: '#22C55E' }]}>· {d}</Text>
                    ))}
                  </View>
                )}
                {creator?.donts?.length > 0 && (
                  <View style={[styles.dosDontsBox, { borderColor: '#EF444430', backgroundColor: '#EF44440A' }]}>
                    <View style={styles.dosDontsHead}>
                      <Ionicons name="close-circle-outline" size={12} color="#EF4444" />
                      <Text style={[styles.dosDontsTitle, { color: '#EF4444' }]}>À ÉVITER</Text>
                    </View>
                    {creator.donts.map((d, i) => (
                      <Text key={i} style={[styles.dosDontsItem, { color: '#EF4444' }]}>· {d}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── Historique collabs ── */}
          <View style={[styles.collabBadge, { borderColor: creator?.collab > 0 ? '#F59E0B30' : COLORS.border, backgroundColor: creator?.collab > 0 ? '#F59E0B08' : COLORS.card }]}>
            <Ionicons
              name={creator?.collab > 0 ? 'star' : 'star-outline'}
              size={14}
              color={creator?.collab > 0 ? '#F59E0B' : COLORS.textMuted}
            />
            <Text style={[styles.collabText, { color: creator?.collab > 0 ? '#F59E0B' : COLORS.textMuted }]}>
              {creator?.collab > 0
                ? `${creator.collab} collaboration${creator.collab > 1 ? 's' : ''} précédente${creator.collab > 1 ? 's' : ''}`
                : 'Première collaboration'}
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  CREATOR CARD — composant principal compact
// ═══════════════════════════════════════════════════════════════════
export default function CreatorCard({ creator, accentColor }) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const pc  = PLATFORM_CFG[creator?.platform] ?? PLATFORM_CFG.TikTok;
  const acc = accentColor ?? COLORS.primary;

  const mainStats = [
    { icon: 'people-outline', value: creator?.followers,  label: 'abonnés'  },
    { icon: 'eye-outline',    value: creator?.avgViews,   label: 'vues moy.' },
    { icon: 'heart-outline',  value: creator?.engagement, label: 'eng.'     },
  ].filter(s => s.value);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSheetOpen(true); }}
        activeOpacity={0.85}
      >
        {/* Gradient teinté discret */}
        <LinearGradient
          colors={[acc + '0A', 'transparent']}
          style={StyleSheet.absoluteFill}
          borderRadius={RADIUS.xl}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />

        {/* ── Ligne principale ── */}
        <View style={styles.mainRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: acc + '20', borderColor: acc + '40' }]}>
            <Text style={[styles.avatarText, { color: acc }]}>{creator?.initials ?? '??'}</Text>
            <View style={[styles.platformMini, { backgroundColor: pc.color }]}>
              <Ionicons name={pc.icon} size={8} color="#fff" />
            </View>
          </View>

          {/* Identité */}
          <View style={styles.identity}>
            <View style={styles.identityTop}>
              <Text style={styles.creatorName}>{creator?.name ?? '—'}</Text>
              {/* Indicateur actif */}
              <View style={styles.activeDot} />
            </View>
            <Text style={styles.username}>{creator?.username ?? '—'}</Text>
            <Text style={styles.niche} numberOfLines={1}>{creator?.niche ?? '—'}</Text>
          </View>

          {/* CTA profil */}
          <TouchableOpacity
            style={[styles.profileBtn, { borderColor: acc + '40', backgroundColor: acc + '0E' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSheetOpen(true); }}
            activeOpacity={0.75}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={[styles.profileBtnText, { color: acc }]}>Profil</Text>
            <Ionicons name="chevron-forward" size={11} color={acc} />
          </TouchableOpacity>
        </View>

        {/* ── Stats row ── */}
        {mainStats.length > 0 && (
          <View style={styles.statsRow}>
            {mainStats.map((s, i) => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <Ionicons name={s.icon} size={10} color={statColor(s.value)} />
                  <Text style={[styles.statValue, { color: statColor(s.value) }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < mainStats.length - 1 && <View style={styles.statSep} />}
              </React.Fragment>
            ))}
            {/* Tags niche */}
            <View style={{ flex: 1 }} />
            {(creator?.tags ?? []).slice(0, 2).map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: acc + '0E', borderColor: acc + '25' }]}>
                <Text style={[styles.tagText, { color: acc }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <CreatorProfileSheet
        visible={sheetOpen}
        creator={creator}
        accentColor={acc}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Card principale ──
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm + 2,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  mainRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  platformMini: {
    position: 'absolute', bottom: -1, right: -1,
    width: 15, height: 15, borderRadius: 7.5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.card,
  },
  identity: { flex: 1, gap: 1 },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creatorName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  activeDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  username: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  niche:    { fontSize: 11, color: COLORS.textMuted },
  profileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  profileBtnText: { fontSize: 11, fontWeight: '700' },

  // ── Stats row ──
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue:{ fontSize: 10, fontWeight: '800' },
  statLabel:{ fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  statSep:  { width: 1, height: 10, backgroundColor: COLORS.border },
  tag: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  tagText: { fontSize: 9, fontWeight: '700' },

  // ── Bottom sheet ──
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000080' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.85,
    borderTopWidth: 1, borderColor: COLORS.border,
  },
  dragHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetScroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 16 },

  // En-tête sheet
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: SPACING.md },
  sheetAvatar: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  sheetAvatarText: { fontSize: 20, fontWeight: '900' },
  platformDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  sheetName:     { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  sheetUsername: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  platformBadgeText: { fontSize: 10, fontWeight: '700' },
  sheetHeadActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetChatBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Section générique
  sheetSection: { marginBottom: SPACING.md },
  sheetSectionLabel: {
    fontSize: 9, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bg, borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.sm, alignItems: 'center', gap: 4,
  },
  statBoxNum:   { fontSize: 16, fontWeight: '900' },
  statBoxLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },

  // Niche
  nicheRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  nicheChip: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  nicheChipText: { fontSize: 12, fontWeight: '700' },
  styleNote:     { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginTop: 4 },

  // Objectif
  objectiveBox: {
    borderLeftWidth: 3, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg, padding: SPACING.sm,
  },
  objectiveText: { fontSize: 13, color: COLORS.text, lineHeight: 19, fontWeight: '600' },

  // Do/Don't
  dosDontsRow: { flexDirection: 'row', gap: 8 },
  dosDontsBox: {
    flex: 1, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.sm, gap: 5,
  },
  dosDontsHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dosDontsTitle:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  dosDontsItem: { fontSize: 11, lineHeight: 16, fontWeight: '500' },

  // Collab
  collabBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: 12,
  },
  collabText: { fontSize: 12, fontWeight: '700' },
});
