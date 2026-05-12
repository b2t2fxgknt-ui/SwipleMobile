/**
 * SearchScreen.js — Recherche ghostwriting
 * Freelance : chercher des briefs clients
 * Client    : chercher des ghostwriters
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Données ghostwriting ──────────────────────────────────────────────────────

const ALL_BRIEFS = [
  {
    id: 'sb1', type: 'Script + Montage', urgent: false,
    clientName: 'Sophie C.', clientInitials: 'SC', color: '#EF4444',
    title: 'Ghostwriter pour coach business féminin',
    niche: 'Coaching', platform: 'TikTok',
    budgetMin: 120, budgetMax: 150, postsPerMonth: 4, deadline: '48h',
    tags: ['Coaching', 'Business'],
  },
  {
    id: 'sb2', type: 'Script seul', urgent: true,
    clientName: 'Marc R.', clientInitials: 'MR', color: '#8B5CF6',
    title: 'Scripts TikTok pour consultant SEO',
    niche: 'SEO / Marketing', platform: 'TikTok',
    budgetMin: 70, budgetMax: 90, postsPerMonth: 8, deadline: '24h',
    tags: ['Marketing', 'SEO'],
  },
  {
    id: 'sb3', type: 'Pack mensuel', urgent: false,
    clientName: 'Julie T.', clientInitials: 'JT', color: '#10B981',
    title: 'Pack 8 vidéos/mois pour formateur Excel',
    niche: 'Formation / Productivité', platform: 'TikTok + Instagram',
    budgetMin: 350, budgetMax: 450, postsPerMonth: 8, deadline: '5j',
    tags: ['Formation', 'Productivité'],
  },
  {
    id: 'sb4', type: 'Script + Montage', urgent: true,
    clientName: 'Amina L.', clientInitials: 'AL', color: '#3B82F6',
    title: 'Contenu TikTok pour thérapeute holistique',
    niche: 'Bien-être / Santé', platform: 'TikTok',
    budgetMin: 100, budgetMax: 130, postsPerMonth: 4, deadline: '72h',
    tags: ['Bien-être', 'Santé'],
  },
  {
    id: 'sb5', type: 'Script seul', urgent: false,
    clientName: 'Pierre B.', clientInitials: 'PB', color: '#F59E0B',
    title: 'Scripts pour avocat en droit du travail',
    niche: 'Juridique', platform: 'TikTok',
    budgetMin: 80, budgetMax: 100, postsPerMonth: 6, deadline: '48h',
    tags: ['Juridique', 'Droit'],
  },
  {
    id: 'sb6', type: 'Script + Montage', urgent: false,
    clientName: 'Célia R.', clientInitials: 'CR', color: '#EC4899',
    title: 'Ghostwriter pour nutritionniste sportive',
    niche: 'Nutrition / Sport', platform: 'TikTok',
    budgetMin: 120, budgetMax: 150, postsPerMonth: 4, deadline: '48h',
    tags: ['Nutrition', 'Sport'],
  },
  {
    id: 'sb7', type: 'Pack mensuel', urgent: false,
    clientName: 'David K.', clientInitials: 'DK', color: '#06B6D4',
    title: 'Pack mensuel pour investisseur immobilier',
    niche: 'Immobilier', platform: 'TikTok',
    budgetMin: 300, budgetMax: 400, postsPerMonth: 6, deadline: '5j',
    tags: ['Immobilier', 'Investissement'],
  },
  {
    id: 'sb8', type: 'Script seul', urgent: true,
    clientName: 'Laura M.', clientInitials: 'LM', color: '#84CC16',
    title: 'Scripts food & restaurant pour chef',
    niche: 'Food / Restauration', platform: 'TikTok + Instagram',
    budgetMin: 60, budgetMax: 80, postsPerMonth: 8, deadline: '24h',
    tags: ['Food', 'Cuisine'],
  },
];

const ALL_GHOSTWRITERS = [
  {
    id: 'gw1', initials: 'LM', name: 'Lucas M.',
    specialty: 'Script + Montage', color: '#EF4444',
    rating: 4.9, missions: 34, priceFrom: 80, priceTo: 200,
    responseTime: '< 2h', deliveryTime: '48h',
    bio: 'Spécialisé niches business & coaching. Scripts percutants + montage dynamique.',
    tags: ['Business', 'Coaching', 'Motivation'],
  },
  {
    id: 'gw2', initials: 'CA', name: 'Chloé A.',
    specialty: 'Script seul', color: '#8B5CF6',
    rating: 4.7, missions: 21, priceFrom: 25, priceTo: 80,
    responseTime: '< 4h', deliveryTime: '24h',
    bio: 'Ex-journaliste reconvertie. Storytelling et accroches redoutables.',
    tags: ['Lifestyle', 'Développement perso', 'Finance'],
  },
  {
    id: 'gw3', initials: 'RB', name: 'Raphaël B.',
    specialty: 'Pack mensuel', color: '#10B981',
    rating: 5.0, missions: 12, priceFrom: 300, priceTo: 600,
    responseTime: '< 1h', deliveryTime: '5j',
    bio: 'Livrables dans les délais, zéro mauvaise surprise. Spé formation & B2B.',
    tags: ['Formation', 'B2B', 'Productivité'],
  },
  {
    id: 'gw4', initials: 'SW', name: 'Sara W.',
    specialty: 'Script + Montage', color: '#3B82F6',
    rating: 4.8, missions: 27, priceFrom: 80, priceTo: 180,
    responseTime: '< 3h', deliveryTime: '72h',
    bio: 'Spécialisée bien-être, santé et dev perso. Ton authentique garanti.',
    tags: ['Bien-être', 'Santé', 'Méditation'],
  },
  {
    id: 'gw5', initials: 'TN', name: 'Thomas N.',
    specialty: 'Script seul', color: '#F59E0B',
    rating: 4.6, missions: 45, priceFrom: 30, priceTo: 90,
    responseTime: '< 2h', deliveryTime: '24h',
    bio: '5 ans de copywriting persuasif. Spécialiste accroche virale et hook TikTok.',
    tags: ['Marketing', 'Copywriting', 'Vente'],
  },
  {
    id: 'gw6', initials: 'EM', name: 'Emma M.',
    specialty: 'Pack mensuel', color: '#EC4899',
    rating: 4.9, missions: 19, priceFrom: 350, priceTo: 700,
    responseTime: '< 1h', deliveryTime: '3j',
    bio: 'Stratégie éditoriale, scripts et montage. Mode, beauté, lifestyle.',
    tags: ['Mode', 'Beauté', 'Lifestyle'],
  },
  {
    id: 'gw7', initials: 'AD', name: 'Alexandre D.',
    specialty: 'Script + Montage', color: '#06B6D4',
    rating: 4.7, missions: 38, priceFrom: 90, priceTo: 220,
    responseTime: '< 2h', deliveryTime: '48h',
    bio: 'Expertise finance personnelle & investissement. Vulgarisation impeccable.',
    tags: ['Finance', 'Investissement', 'Crypto'],
  },
  {
    id: 'gw8', initials: 'ML', name: 'Marie L.',
    specialty: 'Script seul', color: '#84CC16',
    rating: 4.8, missions: 16, priceFrom: 25, priceTo: 70,
    responseTime: '< 3h', deliveryTime: '24h',
    bio: 'Ghostwriter spécialisée restauration et food. Accroches irrésistibles.',
    tags: ['Food', 'Restauration', 'Recettes'],
  },
];

const BRIEF_FILTERS = [
  { id: 'all',              label: 'Tous' },
  { id: 'Script seul',      label: 'Script seul' },
  { id: 'Script + Montage', label: 'Script + Montage' },
  { id: 'Pack mensuel',     label: 'Pack mensuel' },
  { id: 'urgent',           label: 'Urgents' },
];

const GW_FILTERS = [
  { id: 'all',              label: 'Tous' },
  { id: 'Script seul',      label: 'Script seul' },
  { id: 'Script + Montage', label: 'Script + Montage' },
  { id: 'Pack mensuel',     label: 'Pack mensuel' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Pertinence' },
  { id: 'price_asc', label: 'Budget ↑'  },
  { id: 'price_desc',label: 'Budget ↓'  },
];

const TYPE_COLOR = {
  'Script seul':      '#8B5CF6',
  'Script + Montage': '#EF4444',
  'Pack mensuel':     '#10B981',
};
const TYPE_ICON = {
  'Script seul':      'document-text-outline',
  'Script + Montage': 'videocam-outline',
  'Pack mensuel':     'calendar-outline',
};

// ── Carte brief ───────────────────────────────────────────────────────────────

function BriefCard({ item, onPress }) {
  const color = TYPE_COLOR[item.type] ?? item.color ?? COLORS.primary;
  const icon  = TYPE_ICON[item.type]  ?? 'document-text-outline';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <LinearGradient
        colors={[color + '0C', 'transparent']}
        style={StyleSheet.absoluteFill}
        borderRadius={RADIUS.xl}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }}
      />
      <View style={[styles.cardIcon, { backgroundColor: color + '18', borderColor: color + '35' }]}>
        <Ionicons name={icon} size={20} color={color} />
        {item.urgent && <View style={styles.urgentDot} />}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardType, { color }]}>{item.type}</Text>
          {item.urgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={9} color="#EF4444" />
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardName} numberOfLines={2}>{item.title}</Text>
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 2).map((t, i) => (
            <View key={i} style={[styles.tagChip, { borderColor: color + '35', backgroundColor: color + '10' }]}>
              <Text style={[styles.tagChipText, { color }]}>{t}</Text>
            </View>
          ))}
          <Text style={styles.platformText}>{item.platform}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.priceVal, { color }]}>{item.budgetMin}–{item.budgetMax}€</Text>
        <Text style={styles.priceUnit}>{item.postsPerMonth} vidéos/mois</Text>
        <View style={[styles.pill, { backgroundColor: color + '12', borderColor: color + '30' }]}>
          <Ionicons name="alarm-outline" size={9} color={color} />
          <Text style={[styles.pillText, { color }]}>{item.deadline}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Carte ghostwriter ─────────────────────────────────────────────────────────

function GhostwriterCard({ item, onPress }) {
  const full = Math.floor(item.rating);
  const half = item.rating % 1 >= 0.5;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <LinearGradient
        colors={[item.color + '0C', 'transparent']}
        style={StyleSheet.absoluteFill}
        borderRadius={RADIUS.xl}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }}
      />
      <View style={[styles.gwAvatar, { backgroundColor: item.color + '22', borderColor: item.color + '50' }]}>
        <Text style={[styles.gwInitials, { color: item.color }]}>{item.initials}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={[styles.cardType, { color: item.color }]}>{item.specialty}</Text>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <Ionicons
              key={i}
              name={i < full ? 'star' : (i === full && half ? 'star-half' : 'star-outline')}
              size={11} color="#F59E0B"
            />
          ))}
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.missionsText}>· {item.missions} missions</Text>
        </View>
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 2).map((t, i) => (
            <View key={i} style={[styles.tagChip, { borderColor: item.color + '35', backgroundColor: item.color + '10' }]}>
              <Text style={[styles.tagChipText, { color: item.color }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.priceVal, { color: item.color }]}>{item.priceFrom}€</Text>
        <Text style={styles.priceUnit}>à partir de</Text>
        <View style={[styles.pill, { backgroundColor: item.color + '12', borderColor: item.color + '30' }]}>
          <Ionicons name="chatbubble-outline" size={9} color={item.color} />
          <Text style={[styles.pillText, { color: item.color }]}>{item.responseTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function SearchScreen({ route }) {
  const navigation   = useNavigation();
  const role         = route?.params?.role ?? 'prestataire';
  const isFreelancer = role === 'prestataire' || role === 'freelancer';
  const accentColor  = isFreelancer ? COLORS.prestataire : COLORS.primary;
  const filters      = isFreelancer ? BRIEF_FILTERS : GW_FILTERS;

  const [query,        setQuery]        = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort,   setActiveSort]   = useState('relevance');

  const filtered = useMemo(() => {
    const allItems = isFreelancer ? ALL_BRIEFS : ALL_GHOSTWRITERS;
    let items = allItems.filter(item => {
      const text = isFreelancer
        ? `${item.title} ${item.niche} ${item.type} ${item.tags.join(' ')}`.toLowerCase()
        : `${item.name} ${item.specialty} ${item.tags.join(' ')} ${item.bio}`.toLowerCase();
      const matchQ = query === '' || text.includes(query.toLowerCase());
      let matchF = true;
      if (activeFilter !== 'all') {
        if (activeFilter === 'urgent') matchF = !!item.urgent;
        else matchF = isFreelancer ? item.type === activeFilter : item.specialty === activeFilter;
      }
      return matchQ && matchF;
    });
    if (activeSort === 'price_asc')  items = [...items].sort((a, b) => (a.budgetMin ?? a.priceFrom) - (b.budgetMin ?? b.priceFrom));
    if (activeSort === 'price_desc') items = [...items].sort((a, b) => (b.budgetMin ?? b.priceFrom) - (a.budgetMin ?? a.priceFrom));
    return items;
  }, [query, activeFilter, activeSort, isFreelancer]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant={isFreelancer ? 'prestataire' : 'acheteur'} />
      </View>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeTop}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>
            {isFreelancer ? 'Trouver des briefs' : 'Trouver un ghostwriter'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isFreelancer ? 'Niche, type de brief…' : 'Nom, spécialité, niche…'}
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {filters.map(f => {
            const active = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && { backgroundColor: accentColor, borderColor: accentColor }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(f.id); }}
                activeOpacity={0.72}
              >
                <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort + count */}
        <View style={styles.metaRow}>
          <Text style={styles.resultCount}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {SORT_OPTIONS.map(s => {
              const active = activeSort === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sortChip, active && { borderColor: accentColor }]}
                  onPress={() => setActiveSort(s.id)}
                  activeOpacity={0.72}
                >
                  <Text style={[styles.sortChipText, active && { color: accentColor }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Résultats */}
      <ScrollView contentContainerStyle={styles.resultsList} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>Essaie d'autres termes ou filtres.</Text>
          </View>
        ) : (
          filtered.map(item =>
            isFreelancer
              ? <BriefCard    key={item.id} item={item} onPress={() => navigation.navigate('BriefDetail', { brief: item })} />
              : <GhostwriterCard key={item.id} item={item} onPress={() => navigation.navigate('GhostwriterProfile', { ghostwriter: item })} />
          )
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeTop:   { backgroundColor: 'transparent' },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xs,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, color: COLORS.text, fontWeight: '800' },

  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  clearBtn:    { padding: 4 },

  filtersRow:     { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: 8 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  filterChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

  metaRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm },
  resultCount:  { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  sortChip:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  sortChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  resultsList: { padding: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.xs },

  card: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm, alignItems: 'center',
    overflow: 'hidden', ...SHADOW.sm,
  },
  cardIcon: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0, position: 'relative',
  },
  urgentDot: {
    position: 'absolute', top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444',
    borderWidth: 1.5, borderColor: COLORS.card,
  },
  cardBody:     { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardType:     { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardName:     { fontSize: 13, color: COLORS.text, fontWeight: '700', marginBottom: 4 },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 2 },
  tagChip:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full, borderWidth: 1 },
  tagChipText:  { fontSize: 10, fontWeight: '600' },
  platformText: { fontSize: 10, color: COLORS.textLight, fontWeight: '500' },

  urgentBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444440' },
  urgentBadgeText: { fontSize: 9, color: '#EF4444', fontWeight: '700' },

  cardRight: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  priceVal:  { fontSize: 16, fontWeight: '900' },
  priceUnit: { fontSize: 10, color: COLORS.textMuted },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full, borderWidth: 1, marginTop: 4 },
  pillText:  { fontSize: 9, fontWeight: '700' },

  gwAvatar:    { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  gwInitials:  { fontSize: 18, fontWeight: '900' },
  starsRow:    { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  ratingText:  { fontSize: 11, color: COLORS.text, fontWeight: '700', marginLeft: 2 },
  missionsText:{ fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  empty:      { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700' },
  emptyText:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
});
