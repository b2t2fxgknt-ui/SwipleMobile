/**
 * ExpertsScreen.js — Experts IA recommandés pour créateurs de contenu
 * Sélection basée sur l'audit vidéo · TikTok / Instagram / YouTube
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { FREELANCERS, CATEGORY_ACCENT, CATEGORY_ICON, matchFreelancers } from '../../data/freelancers';
import FreelancerProfileSheet from '../../components/ui/FreelancerProfileSheet';
import { useFavorites } from '../../lib/FavoritesContext';

// ── Données ───────────────────────────────────────────────────────────────────
const RECOMMENDED = matchFreelancers(['hook', 'subtitle', 'sound', 'framing'], 3);

const CAT_FILTERS = [
  { key: 'all',               label: 'Tous',    icon: 'apps-outline'      },
  { key: 'video_montage',     label: 'Montage', icon: 'film-outline'       },
  { key: 'design',            label: 'Design',  icon: 'color-palette-outline' },
  { key: 'copywriting',       label: 'Script',  icon: 'document-text-outline' },
  { key: 'reseaux_sociaux',   label: 'Réseaux', icon: 'share-social-outline'  },
  { key: 'ia_automatisation', label: 'IA',      icon: 'sparkles-outline'  },
];

// ── Carte Expert recommandée ──────────────────────────────────────────────────
function ExpertCard({ f, navigation, onViewProfile, onToggleFav, isFav }) {
  const accent   = CATEGORY_ACCENT[f.category] ?? COLORS.primary;
  const iconName = CATEGORY_ICON[f.category]   ?? 'briefcase';

  function handleOrder() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MissionConfirmation', {
      mission: {
        type:     f.specialty.split(' ')[0],
        icon:     'timer-outline',
        color:    accent,
        title:    `Mission ${f.specialty}`,
        problem:  'Optimisation IA recommandée',
        duration: '15–60s',
        budget:   f.price,
        revisions: 2,
        deadline: f.deliveryTime,
      },
      freelancer: {
        name:      f.name,
        initials:  f.initials,
        specialty: f.specialty,
        rating:    f.rating,
        level:     f.level,
        color:     accent,
      },
    });
  }

  return (
    <View style={styles.expertCard}>
      {/* Gradient de fond subtil */}
      <LinearGradient
        colors={[accent + '12', 'transparent']}
        style={StyleSheet.absoluteFill}
        borderRadius={RADIUS.xl}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Cœur favori */}
      <TouchableOpacity
        style={styles.favBtn}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFav?.(f); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#EF4444' : COLORS.textMuted} />
      </TouchableOpacity>

      {/* ── Identité ── */}
      <TouchableOpacity style={styles.expertTop} onPress={() => onViewProfile?.(f)} activeOpacity={0.78}>
        {/* Avatar */}
        <View style={[styles.expertAvatar, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
          <Ionicons name={iconName} size={15} color={accent} />
          <Text style={[styles.expertInitials, { color: accent }]}>{f.initials}</Text>
        </View>

        {/* Info principale */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.nameRow}>
            <Text style={styles.expertName}>{f.name}</Text>
            <View style={[styles.levelPill, { backgroundColor: accent + '18', borderColor: accent + '35' }]}>
              <Text style={[styles.levelText, { color: accent }]}>{f.level}</Text>
            </View>
          </View>
          <Text style={styles.expertSpecialty}>{f.specialty}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingNum}>{f.rating}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.ratingMeta}>{f.reviewCount} avis</Text>
            <Text style={styles.dot}>·</Text>
            <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
            <Text style={styles.ratingMeta}>{f.deliveryTime}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Raison IA ── */}
      <View style={[styles.matchReason, { borderColor: accent + '40', backgroundColor: accent + '0C' }]}>
        <Ionicons name="sparkles" size={11} color={accent} />
        <Text style={[styles.matchReasonText, { color: accent }]}>{f.matchReason}</Text>
      </View>

      {/* ── Compétences ── */}
      <View style={styles.skillsRow}>
        {f.skills.slice(0, 3).map(s => (
          <View key={s} style={styles.skillChip}>
            <Text style={styles.skillText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* ── Résultat client ── */}
      <View style={styles.resultRow}>
        <View style={styles.resultSide}>
          <Text style={styles.resultLabel}>AVANT</Text>
          <Text style={styles.resultValue}>{f.before.metric}</Text>
          <Text style={styles.resultSub}>{f.before.views}</Text>
        </View>
        <View style={styles.resultArrow}>
          <Ionicons name="trending-up" size={18} color="#22C55E" />
        </View>
        <View style={[styles.resultSide, styles.resultAfter]}>
          <Text style={[styles.resultLabel, { color: '#22C55E' }]}>APRÈS</Text>
          <Text style={[styles.resultValue, { color: '#22C55E' }]}>{f.after.metric}</Text>
          <Text style={styles.resultSub}>{f.after.views}</Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.expertFooter}>
        <View>
          <Text style={styles.priceLabel}>À partir de</Text>
          <Text style={[styles.priceValue, { color: accent }]}>{f.price}€</Text>
        </View>
        {f.responseTime && (
          <View style={styles.responsePill}>
            <View style={styles.responseGreen} />
            <Text style={styles.responseText}>Répond en {f.responseTime}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: accent }]}
          onPress={handleOrder}
          activeOpacity={0.85}
        >
          <Text style={styles.orderBtnText}>Commander</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Carte compacte (exploration) ──────────────────────────────────────────────
function CompactCard({ f, navigation, onViewProfile, onToggleFav, isFav }) {
  const accent   = CATEGORY_ACCENT[f.category] ?? COLORS.primary;
  const iconName = CATEGORY_ICON[f.category]   ?? 'briefcase';

  function handleOrder() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('MissionConfirmation', {
      mission: {
        type:     f.specialty.split(' ')[0],
        icon:     'timer-outline',
        color:    accent,
        title:    `Mission ${f.specialty}`,
        problem:  'Demande directe',
        duration: '15–60s',
        budget:   f.price,
        revisions: 2,
        deadline: f.deliveryTime,
      },
      freelancer: {
        name:      f.name,
        initials:  f.initials,
        specialty: f.specialty,
        rating:    f.rating,
        level:     f.level,
        color:     accent,
      },
    });
  }

  return (
    <View style={styles.compactCard}>
      <TouchableOpacity
        onPress={() => onViewProfile?.(f)}
        activeOpacity={0.75}
        style={[styles.compactAvatar, { backgroundColor: accent + '1A', borderColor: accent + '35' }]}
      >
        <Ionicons name={iconName} size={13} color={accent} />
        <Text style={[styles.compactInitials, { color: accent }]}>{f.initials}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, gap: 3 }}>
        <TouchableOpacity onPress={() => onViewProfile?.(f)} activeOpacity={0.75}>
          <Text style={styles.compactName}>{f.name}</Text>
        </TouchableOpacity>
        <Text style={styles.compactSpecialty} numberOfLines={1}>{f.specialty}</Text>
        <View style={styles.compactMeta}>
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text style={styles.compactRating}>{f.rating}</Text>
          <Text style={styles.compactDot}>·</Text>
          <Text style={[styles.compactPrice, { color: accent }]}>{f.price}€</Text>
          <Text style={styles.compactDot}>·</Text>
          <Text style={styles.compactDelivery}>{f.deliveryTime}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFav?.(f); }}
        style={styles.compactFavBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={15} color={isFav ? '#EF4444' : COLORS.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.compactOrderBtn, { borderColor: accent + '50', backgroundColor: accent + '10' }]}
        onPress={handleOrder}
        activeOpacity={0.8}
      >
        <Text style={[styles.compactOrderText, { color: accent }]}>Commander</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function ExpertsScreen() {
  const navigation        = useNavigation();
  const { toggleFavorite, isFavorite, favorites } = useFavorites();
  const [explore,         setExplore]        = useState(false);
  const [query,           setQuery]          = useState('');
  const [catFilter,       setCatFilter]      = useState('all');
  const [sheetFreelancer, setSheetFreelancer]= useState(null);
  const exploreAnim = useRef(new Animated.Value(0)).current;

  function buildOrder(f) {
    const accent = CATEGORY_ACCENT[f.category] ?? COLORS.primary;
    return {
      mission: {
        type: f.specialty.split(' ')[0], icon: 'timer-outline', color: accent,
        title: `Mission ${f.specialty}`, problem: 'Optimisation IA recommandée',
        duration: '15–60s', budget: f.price, revisions: 2, deadline: f.deliveryTime,
      },
      freelancer: {
        name: f.name, initials: f.initials, specialty: f.specialty,
        rating: f.rating, level: f.level, color: accent,
      },
    };
  }

  function toggleExplore(val) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExplore(val);
    Animated.timing(exploreAnim, {
      toValue: val ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
    if (!val) { setQuery(''); setCatFilter('all'); }
  }

  const filtered = useMemo(() => {
    let list = FREELANCERS;
    if (catFilter !== 'all') list = list.filter(f => f.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.specialty.toLowerCase().includes(q) ||
        f.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [query, catFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {/* Fond "marketplace" distinct — gradient chaud + bulle prestataire */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
        <LinearGradient
          colors={[COLORS.primary + '18', 'transparent']}
          style={[StyleSheet.absoluteFill, { height: 260 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
      </View>

      <FreelancerProfileSheet
        visible={!!sheetFreelancer}
        freelancer={sheetFreelancer ? { ...sheetFreelancer, color: CATEGORY_ACCENT[sheetFreelancer.category] ?? COLORS.primary, icon: CATEGORY_ICON[sheetFreelancer.category] ?? 'briefcase-outline' } : null}
        onClose={() => setSheetFreelancer(null)}
        onOrder={() => {
          if (!sheetFreelancer) return;
          const { mission, freelancer } = buildOrder(sheetFreelancer);
          navigation.navigate('MissionConfirmation', { mission, freelancer });
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={11} color={COLORS.primary} />
              <Text style={styles.aiBadgeText}>SÉLECTION IA</Text>
            </View>
            <Text style={styles.headerTitle}>
              Experts{'\n'}<Text style={{ color: COLORS.primary }}>recommandés</Text>
            </Text>
            <Text style={styles.headerSub}>
              Optimise ta vidéo avec les meilleurs créateurs
            </Text>
          </View>
          {/* Bouton Favoris */}
          <TouchableOpacity
            style={styles.favoritesBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Favorites'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={16} color="#EF4444" />
            {favorites.length > 0 && (
              <View style={styles.favBadge}>
                <Text style={styles.favBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Barre de stats rapides (marketplace uniquement) ── */}
        <View style={styles.marketplaceBand}>
          {[
            { icon: 'shield-checkmark', label: 'Paiement sécurisé', color: '#22C55E' },
            { icon: 'time-outline',     label: 'Livraison rapide',  color: '#F59E0B' },
            { icon: 'refresh-outline',  label: '2 révisions offertes', color: COLORS.primary },
          ].map((m, i) => (
            <View key={i} style={styles.mbItem}>
              <Ionicons name={m.icon} size={12} color={m.color} />
              <Text style={[styles.mbLabel, { color: m.color }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ── SECTION LABEL ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>MATCHÉS AVEC TON AUDIT</Text>
          <View style={styles.sectionLabelLine} />
        </View>

        {/* ── CARTES RECOMMANDÉES ── */}
        <View style={styles.cardsStack}>
          {RECOMMENDED.map(f => (
            <ExpertCard key={f.id} f={f} navigation={navigation} onViewProfile={setSheetFreelancer}
              isFav={isFavorite(f.id)} onToggleFav={toggleFavorite} />
          ))}
        </View>

        {/* ── EXPLORER ── */}
        {!explore ? (
          <TouchableOpacity
            style={styles.exploreToggle}
            onPress={() => toggleExplore(true)}
            activeOpacity={0.8}
          >
            <View style={styles.exploreToggleInner}>
              <Ionicons name="compass-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.exploreToggleText}>Explorer tous les experts</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.exploreSection}>

            <View style={styles.exploreDivider}>
              <View style={styles.divLine} />
              <Text style={styles.divLabel}>EXPLORER</Text>
              <View style={styles.divLine} />
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={15} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Nom, spécialité, compétence…"
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={COLORS.primary}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={15} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filtres */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CAT_FILTERS.map(c => {
                const active = catFilter === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCatFilter(c.key); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={c.icon} size={11} color={active ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Compteur */}
            <Text style={styles.resultsCount}>
              {filtered.length} expert{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </Text>

            {/* Liste */}
            <View style={styles.compactList}>
              {filtered.length > 0
                ? filtered.map(f => <CompactCard key={f.id} f={f} navigation={navigation} onViewProfile={setSheetFreelancer}
                    isFav={isFavorite(f.id)} onToggleFav={toggleFavorite} />)
                : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={32} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>Aucun expert trouvé</Text>
                    <Text style={styles.emptySub}>Essaie un autre terme ou filtre</Text>
                  </View>
                )
              }
            </View>

            <TouchableOpacity
              style={styles.collapseBtn}
              onPress={() => toggleExplore(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={13} color={COLORS.textMuted} />
              <Text style={styles.collapseBtnText}>Réduire</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: SPACING.lg, paddingTop: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: { flex: 1, gap: 6 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4,
  },
  aiBadgeText:  { fontSize: 9, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  headerTitle:  { fontSize: 24, fontWeight: '800', color: COLORS.text, lineHeight: 30 },
  headerSub:    { fontSize: 12, color: COLORS.textMuted },
  headerStat:   { alignItems: 'center', paddingTop: 4 },
  headerStatNum:{ fontSize: 26, fontWeight: '900' },
  headerStatLabel:{ fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center', lineHeight: 14 },

  // Trust bar
  trustBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 18,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primary + '06',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  // Section label
  // Marketplace band
  marketplaceBand: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 9, paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  mbItem:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  mbLabel: { fontSize: 9, fontWeight: '700' },

  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg,
  },
  sectionLabelText: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, letterSpacing: 1, flexShrink: 0 },
  sectionLabelLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  // Cards
  cardsStack: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md },

  // Favoris
  favoritesBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  favBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: COLORS.bg,
  },
  favBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  favBtn: {
    position: 'absolute', top: 12, right: 12, zIndex: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.bg + 'CC', alignItems: 'center', justifyContent: 'center',
  },
  compactFavBtn: { padding: 4 },

  // Expert card
  expertCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md, gap: 11,
    overflow: 'hidden', ...SHADOW.sm,
  },
  expertTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  expertAvatar: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 1, flexShrink: 0,
  },
  expertInitials: { fontSize: 12, fontWeight: '800' },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expertName:     { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  levelPill: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  levelText:       { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  expertSpecialty: { fontSize: 12, color: COLORS.textMuted },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum:       { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  dot:             { fontSize: 10, color: COLORS.textMuted },
  ratingMeta:      { fontSize: 11, color: COLORS.textMuted },

  // Match reason
  matchReason: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: RADIUS.md, padding: 9,
  },
  matchReasonText: { fontSize: 11, fontWeight: '600', flex: 1, color: COLORS.textMuted },

  // Skills
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3,
  },
  skillText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  // Result row
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 10, gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  resultSide:  { flex: 1, alignItems: 'center', gap: 2 },
  resultAfter: { borderWidth: 1, borderColor: '#22C55E25', backgroundColor: '#22C55E08', borderRadius: RADIUS.sm, padding: 4 },
  resultArrow: { alignItems: 'center' },
  resultLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  resultValue: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  resultSub:   { fontSize: 10, color: COLORS.textMuted },

  // Footer
  expertFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, gap: 8,
  },
  priceLabel:    { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },
  priceValue:    { fontSize: 19, fontWeight: '900' },
  responsePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1,
  },
  responseGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  responseText:  { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  orderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.lg, paddingVertical: 9, paddingHorizontal: 14,
  },
  orderBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // Explorer toggle
  exploreToggle: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  exploreToggleInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
  },
  exploreToggleText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },

  // Explore section
  exploreSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: 12 },
  exploreDivider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },
  divLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.8 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.text, padding: 0 },

  // Cat filters
  catRow:            { gap: 7, paddingRight: SPACING.lg },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 11, paddingVertical: 6, backgroundColor: COLORS.card,
  },
  catChipActive:     { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '45' },
  catChipText:       { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  catChipTextActive: { color: COLORS.primary },

  // Results
  resultsCount: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  compactList:  { gap: 8 },

  // Compact card
  compactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  compactAvatar: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  compactInitials:  { fontSize: 10, fontWeight: '800' },
  compactName:      { fontSize: 13, fontWeight: '700', color: COLORS.text },
  compactSpecialty: { fontSize: 11, color: COLORS.textMuted },
  compactMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactRating:    { fontSize: 10, fontWeight: '700', color: '#F59E0B' },
  compactDot:       { fontSize: 10, color: COLORS.textMuted },
  compactPrice:     { fontSize: 10, fontWeight: '800' },
  compactDelivery:  { fontSize: 10, color: COLORS.textMuted },
  compactOrderBtn: {
    borderWidth: 1.5, borderRadius: RADIUS.md,
    paddingVertical: 7, paddingHorizontal: 11,
  },
  compactOrderText: { fontSize: 11, fontWeight: '800' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  emptySub:   { fontSize: 12, color: COLORS.textMuted },

  // Collapse
  collapseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
  },
  collapseBtnText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
