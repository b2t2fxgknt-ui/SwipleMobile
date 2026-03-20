import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,

  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Constantes creator economy ─────────────────────────────────────────────────

const CATEGORY_ACCENT = {
  video:     '#7C3AED',
  thumbnail: '#EC4899',
  script:    '#3B82F6',
  ugc:       '#F59E0B',
  subtitles: '#10B981',
};

const CATEGORY_ICON = {
  video:     'videocam-outline',
  thumbnail: 'image-outline',
  script:    'create-outline',
  ugc:       'phone-portrait-outline',
  subtitles: 'text-outline',
};

// Brief category → icon mapping
const BRIEF_ICON = {
  tiktok:  'logo-tiktok',
  reels:   'logo-instagram',
  youtube: 'logo-youtube',
  ugc:     'phone-portrait-outline',
  script:  'create-outline',
  video:   'videocam-outline',
};

const SERVICE_FILTERS = [
  { id: 'all',        label: 'Tout'         },
  { id: 'video',      label: 'Montage'      },
  { id: 'thumbnail',  label: 'Miniatures'   },
  { id: 'script',     label: 'Script'       },
  { id: 'ugc',        label: 'UGC'          },
  { id: 'subtitles',  label: 'Sous-titres'  },
];

const BRIEF_FILTERS = [
  { id: 'all',       label: 'Tout'        },
  { id: 'tiktok',   label: 'TikTok'      },
  { id: 'reels',    label: 'Reels'       },
  { id: 'youtube',  label: 'YouTube'     },
  { id: 'ugc',      label: 'UGC'         },
  { id: 'script',   label: 'Script'      },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Pertinence' },
  { id: 'price_asc', label: 'Prix ↑'    },
  { id: 'price_desc',label: 'Prix ↓'    },
];

// ── Services (vue acheteur) ────────────────────────────────────────────────────

const ALL_SERVICES = [
  { id: '1',  freelancerName: 'Lucas M.',  emoji: '👨‍🎬', title: 'Montage vidéo TikTok en 24h',          category: 'video',     categoryLabel: 'Montage',     price: 49, deliveryTime: '24h', rating: 4.9, reviewCount: 127, popular: true,  level: 'Top vendeur', tags: ['TikTok', 'Trending'], description: 'Montage dynamique et professionnel adapté aux tendances TikTok.', includes: ['Montage complet', 'Sous-titres', 'Musique trending', '2 révisions', '9:16'] },
  { id: '2',  freelancerName: 'Marie L.',  emoji: '🎨', title: 'Miniature YouTube +CTR',                  category: 'thumbnail', categoryLabel: 'Miniatures',  price: 29, deliveryTime: '12h', rating: 4.8, reviewCount: 89,  popular: false, level: 'Confirmé',   tags: ['YouTube', 'CTR'],     description: 'Design percutant optimisé CTR.', includes: ['Miniature HD', 'Source PSD', '3 propositions', '2 révisions'] },
  { id: '3',  freelancerName: 'Thomas D.', emoji: '✍️', title: 'Script viral Reels & Shorts',             category: 'script',    categoryLabel: 'Script',      price: 35, deliveryTime: '48h', rating: 4.7, reviewCount: 54,  popular: false, level: 'Confirmé',   tags: ['Reels', 'Viral'],     description: 'Scripts optimisés rétention et viralité.', includes: ['Script complet', 'Hook', 'Structure narrative', '1 révision'] },
  { id: '4',  freelancerName: 'Sofia B.',  emoji: '🎬', title: 'Montage UGC pro TikTok',                  category: 'ugc',       categoryLabel: 'UGC',         price: 79, deliveryTime: '72h', rating: 5.0, reviewCount: 203, popular: true,  level: 'Top vendeur', tags: ['UGC', 'TikTok'],      description: 'Expert en UGC natif. Montage organique sans feeling pub.', includes: ['Montage UGC', 'Natif', 'Musique trending', 'Stickers', '3 révisions'] },
  { id: '5',  freelancerName: 'Emma P.',   emoji: '💬', title: 'Sous-titres animés TikTok',               category: 'subtitles', categoryLabel: 'Sous-titres', price: 19, deliveryTime: '6h',  rating: 4.9, reviewCount: 312, popular: true,  level: 'Top vendeur', tags: ['Sous-titres', 'Animés'], description: 'Sous-titres animés façon TikTok.', includes: ['Sous-titres animés', '3 styles', 'Sync', 'Couleurs perso', '6h'] },
  { id: '6',  freelancerName: 'Alex K.',   emoji: '🎵', title: 'Hook 0-3s accrocheur',                    category: 'script',    categoryLabel: 'Script',      price: 45, deliveryTime: '24h', rating: 4.8, reviewCount: 76,  popular: false, level: 'Expert',      tags: ['Hook', 'Rétention'],  description: 'Hooks viraux basés sur 500+ vidéos analysées.', includes: ['3 hooks', 'Analyse', 'Format adapté', '2 révisions'] },
  { id: '7',  freelancerName: 'Paul M.',   emoji: '🖼️', title: 'Pack 5 miniatures YouTube',              category: 'thumbnail', categoryLabel: 'Miniatures',  price: 99, deliveryTime: '48h', rating: 4.6, reviewCount: 41,  popular: false, level: 'Confirmé',   tags: ['YouTube', 'Pack'],    description: 'Pack de 5 miniatures cohérentes.', includes: ['5 miniatures', 'Charte graphique', 'Fichiers sources', '1 révision'] },
  { id: '8',  freelancerName: 'Julie R.',  emoji: '🎙️', title: 'Voix-off professionnelle',              category: 'video',     categoryLabel: 'Montage',     price: 39, deliveryTime: '24h', rating: 4.7, reviewCount: 58,  popular: false, level: 'Confirmé',   tags: ['Voix-off', 'Audio'],  description: 'Voix-off pro en français pour vidéos.', includes: ['Voix-off HD', 'Fichier WAV', '2 prises', '1 révision'] },
  { id: '9',  freelancerName: 'Léa K.',    emoji: '✂️', title: 'Montage Reels Instagram',               category: 'video',     categoryLabel: 'Montage',     price: 35, deliveryTime: '24h', rating: 4.8, reviewCount: 93,  popular: false, level: 'Confirmé',   tags: ['Reels', 'Instagram'], description: 'Montage Reels tendance pour Instagram.', includes: ['Montage 30-60s', 'Musique trending', 'Transitions', '2 révisions'] },
  { id: '10', freelancerName: 'Marc D.',   emoji: '🎞️', title: 'Générique / Intro YouTube',             category: 'video',     categoryLabel: 'Montage',     price: 59, deliveryTime: '48h', rating: 4.5, reviewCount: 29,  popular: false, level: 'Confirmé',   tags: ['YouTube', 'Intro'],   description: 'Générique animé personnalisé pour ta chaîne.', includes: ['Générique 5-10s', 'Fichier AE', 'Couleurs perso', '2 révisions'] },
];

// ── Briefs créateurs (vue prestataire) ────────────────────────────────────────

const ALL_BRIEFS = [
  { id: '1', creator: 'Léa — TikTok 450K',         emoji: '🎵', title: 'Monteur vidéo TikTok',       categories: ['tiktok', 'video'], budgetMin: 40,  budgetMax: 60,  urgency: true  },
  { id: '2', creator: 'Marque beauté — Insta',      emoji: '💄', title: 'Designer miniatures YouTube', categories: ['youtube'],         budgetMin: 25,  budgetMax: 40,  urgency: false },
  { id: '3', creator: 'Tech YouTuber — 200K',       emoji: '🤖', title: 'Scénariste Script Tech',      categories: ['youtube', 'script'], budgetMin: 50, budgetMax: 80,  urgency: false },
  { id: '4', creator: 'Startup D2C — TikTok',       emoji: '🛍️', title: 'Éditeur UGC Brand',          categories: ['tiktok', 'ugc', 'reels'], budgetMin: 70, budgetMax: 100, urgency: true },
  { id: '5', creator: 'Influenceur Lifestyle — 1M', emoji: '✨', title: 'Sous-titres animés TikTok',   categories: ['tiktok'],          budgetMin: 15,  budgetMax: 25,  urgency: false },
  { id: '6', creator: 'Créateur Fitness — 120K',    emoji: '💪', title: 'Montage Reels workout',       categories: ['reels', 'video'],  budgetMin: 30,  budgetMax: 50,  urgency: true  },
  { id: '7', creator: 'Fashion Creator — 80K',      emoji: '👗', title: 'Hook + Script TikTok',        categories: ['tiktok', 'script'], budgetMin: 35, budgetMax: 55,  urgency: false },
  { id: '8', creator: 'Gaming Channel — 500K',      emoji: '🎮', title: 'Montage YouTube Gaming',      categories: ['youtube', 'video'], budgetMin: 60, budgetMax: 90,  urgency: false },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ServiceCard({ item, accentColor, onPress }) {
  const accent   = CATEGORY_ACCENT[item.category] ?? accentColor;
  const iconName = CATEGORY_ICON[item.category]   ?? 'briefcase-outline';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.78}>
      <View style={[styles.cardEmojiBox, { backgroundColor: accent + '15' }]}>
        <Ionicons name={iconName} size={24} color={accent} />
      </View>

      <View style={styles.cardBody}>
        <View style={[styles.catChip, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
          <Text style={[styles.catChipText, { color: accent }]}>{item.categoryLabel}</Text>
        </View>
        <Text style={styles.cardName} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSub}>par {item.freelancerName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewsText}>({item.reviewCount})</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.priceVal, { color: accent }]}>{item.price}€</Text>
        <Text style={styles.priceUnit}>base</Text>
        <View style={[styles.viewBtn, { borderColor: accent + '55', backgroundColor: accent + '10' }]}>
          <Text style={[styles.viewBtnText, { color: accent }]}>Voir</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BriefCard({ item, accentColor, onPress }) {
  const primaryCat = item.categories?.[0];
  const iconName   = BRIEF_ICON[primaryCat] ?? 'flash-outline';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardAvatarCol}>
        <View style={[styles.briefAvatar, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={iconName} size={22} color={accentColor} />
        </View>
        {item.urgency && <View style={styles.urgentDot} />}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.title}</Text>
          {item.urgency && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSub}>{item.creator}</Text>
        <View style={styles.tagsRow}>
          {item.categories.slice(0, 2).map((c, i) => (
            <View key={i} style={[styles.catChip, { borderColor: accentColor + '35', backgroundColor: accentColor + '10' }]}>
              <Text style={[styles.catChipText, { color: accentColor }]}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.priceVal, { color: accentColor }]}>{item.budgetMin}–{item.budgetMax}€</Text>
        <Text style={styles.priceUnit}>/ vidéo</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SearchScreen({ route }) {
  const navigation    = useNavigation();
  const role          = route?.params?.role ?? 'acheteur';
  const isPrestataire = role === 'prestataire';
  const accentColor   = isPrestataire ? COLORS.prestataire : COLORS.primary;

  const filters = isPrestataire ? BRIEF_FILTERS : SERVICE_FILTERS;

  const [query,        setQuery]        = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort,   setActiveSort]   = useState('relevance');

  const allItems = isPrestataire ? ALL_BRIEFS : ALL_SERVICES;

  const filtered = useMemo(() => {
    let items = allItems.filter(item => {
      const text = isPrestataire
        ? `${item.title} ${item.creator}`.toLowerCase()
        : `${item.title} ${item.freelancerName} ${item.categoryLabel}`.toLowerCase();
      const matchQ = query === '' || text.includes(query.toLowerCase());
      const matchF = activeFilter === 'all'
        || (isPrestataire ? item.categories.includes(activeFilter) : item.category === activeFilter);
      return matchQ && matchF;
    });

    if (activeSort === 'price_asc')  items = [...items].sort((a, b) => (a.price ?? a.budgetMin) - (b.price ?? b.budgetMin));
    if (activeSort === 'price_desc') items = [...items].sort((a, b) => (b.price ?? b.budgetMin) - (a.price ?? a.budgetMin));
    return items;
  }, [query, activeFilter, activeSort, isPrestataire]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant={isPrestataire ? 'prestataire' : 'acheteur'} />
      </View>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeTop}>

        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>
            {isPrestataire ? 'Trouver des demandes' : 'Explorer les services'}
          </Text>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isPrestataire ? 'Titre, créateur…' : 'Titre, catégorie…'}
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres catégories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {filters.map(f => {
            const active = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && { backgroundColor: accentColor, borderColor: accentColor }]}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.72}
              >
                <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort + count */}
        <View style={styles.metaRow}>
          <Text style={styles.resultCount}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </Text>
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
      <ScrollView
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>Essaie avec d'autres termes ou filtres.</Text>
          </View>
        ) : (
          filtered.map(item =>
            isPrestataire
              ? <BriefCard   key={item.id} item={item} accentColor={accentColor}
                  onPress={() => navigation.navigate('BriefDetail', { brief: item })}
                />
              : <ServiceCard key={item.id} item={item} accentColor={accentColor}
                  onPress={() => navigation.navigate('ServiceDetail', {
                    service: { ...item, freelancerEmoji: item.freelancerEmoji ?? item.emoji },
                  })}
                />
          )
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeTop:   { backgroundColor: COLORS.bg },

  titleRow: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  screenTitle: { fontSize: 26, color: COLORS.text, ...FONT.bold },

  // Search bar
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  clearBtn:    { padding: 4 },

  // Filters
  filtersRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  filterChipText: { fontSize: 13, color: COLORS.textMuted, ...FONT.medium },

  // Sort
  metaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm,
  },
  resultCount: { fontSize: 13, color: COLORS.textLight, ...FONT.medium },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  sortChipText: { fontSize: 12, color: COLORS.textMuted, ...FONT.medium },

  resultsList: { padding: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.xs },

  // Cards
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
    alignItems: 'center',
  },
  cardEmojiBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  briefAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody:      { flex: 1 },
  cardAvatarCol: { alignItems: 'center', gap: 4 },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
  cardName:      { fontSize: 14, color: COLORS.text, ...FONT.semibold, flexShrink: 1 },
  cardSub:       { fontSize: 11, color: COLORS.textMuted, marginBottom: 5 },
  ratingText:    { fontSize: 12, color: COLORS.text, ...FONT.semibold },
  reviewsText:   { fontSize: 11, color: COLORS.textLight },

  tagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 3 },
  catChip: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  catChipText: { fontSize: 10, ...FONT.medium },

  urgentDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  urgentBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: COLORS.error + '18', borderWidth: 1, borderColor: COLORS.error + '44' },
  urgentBadgeText:  { fontSize: 10, color: COLORS.error, ...FONT.semibold },

  cardRight: { alignItems: 'flex-end', gap: 3 },
  priceVal:  { fontSize: 18, color: COLORS.text, ...FONT.bold },
  priceUnit: { fontSize: 10, color: COLORS.textMuted },
  viewBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, marginTop: 4,
  },
  viewBtnText: { fontSize: 12, ...FONT.semibold },

  // Empty state
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  emptyTitle: { fontSize: 18, color: COLORS.text, ...FONT.semibold },
  emptyText:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
});
