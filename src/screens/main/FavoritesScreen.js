/**
 * FavoritesScreen.js — Freelances sauvegardés côté acheteur
 * Sources : FavoritesContext (cœurs depuis ExpertsScreen + FreelancerProfileSheet)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Platform, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import { useFavorites } from '../../lib/FavoritesContext';
import { CATEGORY_ACCENT, CATEGORY_ICON } from '../../data/freelancers';
import FreelancerProfileSheet from '../../components/ui/FreelancerProfileSheet';

// ─── FavoriteCard ─────────────────────────────────────────────────────────────

function FavoriteCard({ f, onViewProfile, onRemove, onOrder }) {
  const accent   = f.color ?? CATEGORY_ACCENT[f.category] ?? COLORS.primary;
  const iconName = f.icon  ?? CATEGORY_ICON[f.category]   ?? 'briefcase-outline';

  return (
    <View style={[styles.card, { borderColor: accent + '25' }]}>
      <LinearGradient
        colors={[accent + '10', 'transparent']}
        style={StyleSheet.absoluteFill}
        borderRadius={RADIUS.xl}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Remove button */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemove(f)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="heart" size={18} color="#EF4444" />
      </TouchableOpacity>

      {/* Identity row */}
      <TouchableOpacity style={styles.identityRow} onPress={() => onViewProfile(f)} activeOpacity={0.8}>
        <View style={[styles.avatar, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
          <Ionicons name={iconName} size={14} color={accent} />
          <Text style={[styles.avatarInitials, { color: accent }]}>{f.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{f.name}</Text>
            <View style={[styles.levelPill, { backgroundColor: accent + '18', borderColor: accent + '30' }]}>
              <Text style={[styles.levelText, { color: accent }]}>{f.level ?? 'Expert'}</Text>
            </View>
          </View>
          <Text style={styles.specialty} numberOfLines={1}>{f.specialty}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.rating}>{f.rating}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.reviews}>{f.reviewCount} avis</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.delivery}>{f.deliveryTime}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Skills */}
      {f.skills?.length > 0 && (
        <View style={styles.skillsRow}>
          {f.skills.slice(0, 3).map(s => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>À partir de</Text>
          <Text style={[styles.priceVal, { color: accent }]}>{f.price}€</Text>
        </View>
        {f.responseTime && (
          <View style={styles.responsePill}>
            <View style={styles.greenDot} />
            <Text style={styles.responseText}>Répond en {f.responseTime}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: accent }]}
          onPress={() => onOrder(f)}
          activeOpacity={0.85}
        >
          <Text style={styles.orderBtnText}>Commander</Text>
          <Ionicons name="arrow-forward" size={12} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFavorites({ onExplore }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="heart-outline" size={36} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Aucun favori pour l'instant</Text>
      <Text style={styles.emptySub}>
        Appuyez sur le cœur d'un expert pour le sauvegarder ici et le retrouver facilement.
      </Text>
      <TouchableOpacity style={styles.exploreCta} onPress={onExplore} activeOpacity={0.88}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.exploreCtaGrad}
        >
          <Ionicons name="compass-outline" size={15} color="#fff" />
          <Text style={styles.exploreCtaText}>Explorer les experts</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [sheetFreelancer, setSheetFreelancer] = useState(null);

  function handleOrder(f) {
    const accent = f.color ?? CATEGORY_ACCENT[f.category] ?? COLORS.primary;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MissionConfirmation', {
      mission: {
        type: f.specialty?.split(' ')[0] ?? 'Mission',
        icon: 'timer-outline', color: accent,
        title: `Mission ${f.specialty}`,
        problem: 'Commande depuis mes favoris',
        duration: '15–60s', budget: f.price, revisions: 2, deadline: f.deliveryTime,
      },
      freelancer: {
        name: f.name, initials: f.initials, specialty: f.specialty,
        rating: f.rating, level: f.level ?? 'Expert', color: accent,
      },
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mes favoris</Text>
            {favorites.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <FreelancerProfileSheet
        visible={!!sheetFreelancer}
        freelancer={sheetFreelancer}
        onClose={() => setSheetFreelancer(null)}
        onOrder={() => {
          if (!sheetFreelancer) return;
          setSheetFreelancer(null);
          handleOrder(sheetFreelancer);
        }}
      />

      {favorites.length === 0 ? (
        <EmptyFavorites onExplore={() => navigation.goBack()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Info bar */}
          <View style={styles.infoBar}>
            <Ionicons name="heart" size={12} color="#EF4444" />
            <Text style={styles.infoBarText}>
              {favorites.length} expert{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.cards}>
            {favorites.map(f => (
              <FavoriteCard
                key={f.id}
                f={f}
                onViewProfile={(freelancer) => setSheetFreelancer(freelancer)}
                onRemove={(freelancer) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleFavorite(freelancer);
                }}
                onOrder={handleOrder}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 4 : 16,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, ...FONT.semibold, color: COLORS.text },
  headerBadge: {
    backgroundColor: '#EF4444', borderRadius: RADIUS.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  headerBadgeText: { fontSize: 11, ...FONT.bold, color: '#fff' },

  scroll: { padding: SPACING.md },
  cards:  { gap: SPACING.md },

  infoBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingBottom: SPACING.md,
  },
  infoBarText: { fontSize: 12, color: COLORS.textMuted, ...FONT.medium },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, padding: SPACING.md, gap: SPACING.sm,
    overflow: 'hidden', position: 'relative', ...SHADOW.sm,
  },
  removeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EF444415', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  identityRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', gap: 1,
    borderWidth: 1,
  },
  avatarInitials: { fontSize: 10, ...FONT.bold },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name:      { fontSize: 15, ...FONT.semibold, color: COLORS.text },
  levelPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full, borderWidth: 1 },
  levelText: { fontSize: 9, ...FONT.bold },
  specialty: { fontSize: 12, color: COLORS.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  rating:    { fontSize: 11, ...FONT.semibold, color: COLORS.text },
  dot:       { fontSize: 10, color: COLORS.textLight },
  reviews:   { fontSize: 11, color: COLORS.textMuted },
  delivery:  { fontSize: 11, color: COLORS.textMuted },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skillChip: {
    backgroundColor: COLORS.cardElevated, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border,
  },
  skillText: { fontSize: 10, color: COLORS.textMuted, ...FONT.medium },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  priceLabel: { fontSize: 9, color: COLORS.textMuted, ...FONT.medium },
  priceVal:   { fontSize: 18, fontWeight: '900' },
  responsePill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  greenDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  responseText: { fontSize: 10, color: COLORS.textMuted },
  orderBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  orderBtnText: { fontSize: 12, ...FONT.bold, color: '#fff' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, ...FONT.bold, color: COLORS.text, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  exploreCta: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.sm, marginTop: 4 },
  exploreCtaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24 },
  exploreCtaText: { fontSize: 14, ...FONT.bold, color: '#fff' },
});
