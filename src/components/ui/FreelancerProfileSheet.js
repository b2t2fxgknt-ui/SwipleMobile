/**
 * FreelancerProfileSheet.js
 * Bottom sheet réutilisable pour visualiser le profil d'un freelancer.
 * Utilisé depuis ExpertsScreen et OrdersScreen.
 *
 * Props :
 *   visible      — boolean
 *   freelancer   — { name, initials, specialty, skills, price, rating,
 *                    reviewCount, level, category, bio, deliveryTime,
 *                    responseTime, before, after, color, icon }
 *   onClose      — () => void
 *   onOrder      — (() => void) | null  — si null, pas de bouton Commander
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, Modal, Animated, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import { CATEGORY_ACCENT, CATEGORY_ICON } from '../../data/freelancers';

export default function FreelancerProfileSheet({ visible, freelancer, onClose, onOrder }) {
  const slideAnim = useRef(new Animated.Value(700)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function close() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 700, duration: 260, useNativeDriver: true }),
      Animated.timing(bgAnim,    { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }

  if (!visible || !freelancer) return null;

  const accent   = freelancer.color ?? CATEGORY_ACCENT[freelancer.category] ?? COLORS.primary;
  const iconName = freelancer.icon  ?? CATEGORY_ICON[freelancer.category]  ?? 'briefcase-outline';

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, {
        opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
      }]}>
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        {/* ── Header identité ── */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: accent + '22', borderColor: accent + '45' }]}>
            <Ionicons name={iconName} size={15} color={accent} />
            <Text style={[styles.avatarInitials, { color: accent }]}>
              {freelancer.initials ?? freelancer.name?.[0] ?? '?'}
            </Text>
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{freelancer.name}</Text>
              {freelancer.level ? (
                <View style={[styles.levelBadge, { backgroundColor: accent + '18', borderColor: accent + '35' }]}>
                  <Text style={[styles.levelText, { color: accent }]}>{freelancer.level}</Text>
                </View>
              ) : null}
            </View>
            {freelancer.specialty ? (
              <Text style={[styles.specialty, { color: accent }]}>{freelancer.specialty}</Text>
            ) : null}
            {freelancer.rating ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingNum}>{freelancer.rating}</Text>
                {freelancer.reviewCount ? (
                  <Text style={styles.ratingMeta}>· {freelancer.reviewCount} avis</Text>
                ) : null}
                {freelancer.responseTime ? (
                  <>
                    <Text style={styles.ratingDot}>·</Text>
                    <View style={styles.onlineRow}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.ratingMeta}>Répond en {freelancer.responseTime}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          <TouchableOpacity onPress={close} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Corps scrollable ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Bio */}
          {freelancer.bio ? (
            <Text style={styles.bio}>{freelancer.bio}</Text>
          ) : null}

          {/* Meta chips: prix + livraison */}
          <View style={styles.metaRow}>
            {freelancer.price ? (
              <View style={[styles.chip, { borderColor: '#22C55E35', backgroundColor: '#22C55E0A' }]}>
                <Ionicons name="cash-outline" size={11} color="#22C55E" />
                <Text style={[styles.chipText, { color: '#22C55E', fontWeight: '800' }]}>
                  À partir de {freelancer.price}€
                </Text>
              </View>
            ) : null}
            {freelancer.deliveryTime ? (
              <View style={styles.chip}>
                <Ionicons name="alarm-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.chipText}>Livraison {freelancer.deliveryTime}</Text>
              </View>
            ) : null}
          </View>

          {/* Compétences */}
          {freelancer.skills?.length > 0 ? (
            <View style={styles.skillsWrap}>
              {freelancer.skills.map(s => (
                <View key={s} style={[styles.skillChip, { backgroundColor: accent + '12', borderColor: accent + '30' }]}>
                  <Text style={[styles.skillText, { color: accent }]}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Résultats avant / après */}
          {(freelancer.before && freelancer.after) ? (
            <View style={[styles.baRow, { borderColor: accent + '25' }]}>
              <LinearGradient
                colors={[accent + '08', 'transparent']}
                style={StyleSheet.absoluteFill}
                borderRadius={RADIUS.lg}
              />
              <View style={styles.baSide}>
                <Text style={styles.baLabel}>AVANT</Text>
                <Text style={styles.baMetric}>{freelancer.before.metric}</Text>
                <Text style={styles.baSub}>{freelancer.before.views}</Text>
              </View>
              <View style={styles.baArrow}>
                <Ionicons name="trending-up" size={22} color="#22C55E" />
              </View>
              <View style={[styles.baSide, { alignItems: 'flex-end' }]}>
                <Text style={[styles.baLabel, { color: '#22C55E' }]}>APRÈS</Text>
                <Text style={[styles.baMetric, { color: '#22C55E' }]}>{freelancer.after.metric}</Text>
                <Text style={styles.baSub}>{freelancer.after.views}</Text>
              </View>
            </View>
          ) : null}

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* ── CTA Commander ── */}
        {onOrder ? (
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                close();
                onOrder();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[accent, accent + 'BB']}
                style={styles.orderBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="briefcase-outline" size={16} color="#fff" />
                <Text style={styles.orderBtnText}>Commander ce freelance</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl + 4,
    borderTopRightRadius: RADIUS.xl + 4,
    borderTopWidth: 1, borderColor: COLORS.border,
    paddingBottom: 34,
    ...SHADOW.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 1, flexShrink: 0,
  },
  avatarInitials: { fontSize: 14, fontWeight: '900', marginTop: 1 },

  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name:       { fontSize: 16, fontWeight: '800', color: COLORS.text },
  levelBadge: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  levelText:  { fontSize: 9, fontWeight: '800' },
  specialty:  { fontSize: 12, fontWeight: '600' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum: { fontSize: 11, fontWeight: '800', color: '#F59E0B' },
  ratingMeta:{ fontSize: 10, color: COLORS.textMuted },
  ratingDot: { fontSize: 10, color: COLORS.textMuted },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },

  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, flexShrink: 0 },

  // Scroll
  scrollArea:   { maxHeight: 360 },
  scrollContent:{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: 12 },

  bio: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip:  { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  skillText:  { fontSize: 11, fontWeight: '700' },

  baRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, overflow: 'hidden',
  },
  baSide:   { gap: 4 },
  baArrow:  { alignItems: 'center' },
  baLabel:  { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.8 },
  baMetric: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  baSub:    { fontSize: 10, color: COLORS.textMuted },

  // CTA
  ctaRow:       { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  orderBtn:     { borderRadius: RADIUS.xl, overflow: 'hidden' },
  orderBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  orderBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
