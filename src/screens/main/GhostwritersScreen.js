/**
 * GhostwritersScreen.js — Annuaire des ghostwriters TikTok.
 * Clients : découvrir des profils, filtrer par spécialité, inviter sur un brief.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import { useBriefs } from '../../lib/BriefsContext';

// ── Mock ghostwriters ─────────────────────────────────────────────────────────

const MOCK_GHOSTWRITERS = [
  {
    id: 'gw1', initials: 'LM', name: 'Lucas M.',
    specialty: 'Script + Montage', color: '#EF4444',
    rating: 4.9, missions: 34, priceFrom: 80, priceTo: 200,
    responseTime: '< 2h', deliveryTime: '48h',
    bio: 'Spécialisé niches business & coaching. Scripts percutants + montage dynamique. Clients récurrents depuis 2 ans.',
    tags: ['Business', 'Coaching', 'Motivation'],
  },
  {
    id: 'gw2', initials: 'CA', name: 'Chloé A.',
    specialty: 'Script seul', color: '#8B5CF6',
    rating: 4.7, missions: 21, priceFrom: 25, priceTo: 80,
    responseTime: '< 4h', deliveryTime: '24h',
    bio: 'Ex-journaliste reconvertie en ghostwriter TikTok. Storytelling et accroches redoutables. 100% satisfaction.',
    tags: ['Lifestyle', 'Développement perso', 'Finance'],
  },
  {
    id: 'gw3', initials: 'RB', name: 'Raphaël B.',
    specialty: 'Pack mensuel', color: '#10B981',
    rating: 5.0, missions: 12, priceFrom: 300, priceTo: 600,
    responseTime: '< 1h', deliveryTime: '5j',
    bio: 'Créateur de contenu depuis 3 ans. Livrables dans les délais, zéro mauvaise surprise. Spé formation & B2B.',
    tags: ['Formation', 'B2B', 'Productivité'],
  },
  {
    id: 'gw4', initials: 'SW', name: 'Sara W.',
    specialty: 'Script + Montage', color: '#3B82F6',
    rating: 4.8, missions: 27, priceFrom: 80, priceTo: 180,
    responseTime: '< 3h', deliveryTime: '72h',
    bio: 'Spécialisée bien-être, santé et développement personnel. Ton authentique garanti. Montage soigné.',
    tags: ['Bien-être', 'Santé', 'Méditation'],
  },
  {
    id: 'gw5', initials: 'TN', name: 'Thomas N.',
    specialty: 'Script seul', color: '#F59E0B',
    rating: 4.6, missions: 45, priceFrom: 30, priceTo: 90,
    responseTime: '< 2h', deliveryTime: '24h',
    bio: '5 ans de copywriting persuasif. Spécialiste accroche virale et hook TikTok. Plume adaptable à tous les secteurs.',
    tags: ['Marketing', 'Copywriting', 'Vente'],
  },
  {
    id: 'gw6', initials: 'EM', name: 'Emma M.',
    specialty: 'Pack mensuel', color: '#EC4899',
    rating: 4.9, missions: 19, priceFrom: 350, priceTo: 700,
    responseTime: '< 1h', deliveryTime: '3j',
    bio: 'Ghost-writer complète : stratégie éditoriale, scripts et montage. Mode, beauté, lifestyle. Clients fidèles.',
    tags: ['Mode', 'Beauté', 'Lifestyle'],
  },
  {
    id: 'gw7', initials: 'AD', name: 'Alexandre D.',
    specialty: 'Script + Montage', color: '#06B6D4',
    rating: 4.7, missions: 38, priceFrom: 90, priceTo: 220,
    responseTime: '< 2h', deliveryTime: '48h',
    bio: 'Expertise finance personnelle & investissement. Vulgarisation impeccable. Vidéos optimisées pour la viralité.',
    tags: ['Finance', 'Investissement', 'Crypto'],
  },
  {
    id: 'gw8', initials: 'ML', name: 'Marie L.',
    specialty: 'Script seul', color: '#84CC16',
    rating: 4.8, missions: 16, priceFrom: 25, priceTo: 70,
    responseTime: '< 3h', deliveryTime: '24h',
    bio: 'Ghostwriter spécialisée restauration et food. Textes qui donnent faim, accroches irrésistibles.',
    tags: ['Food', 'Restauration', 'Recettes'],
  },
];

const FILTERS = [
  { key: 'all',               label: 'Tous' },
  { key: 'Script seul',       label: 'Script seul' },
  { key: 'Script + Montage',  label: 'Script + Montage' },
  { key: 'Pack mensuel',      label: 'Pack mensuel' },
];

// ── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 11 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < full ? 'star' : (i === full && half ? 'star-half' : 'star-outline')}
          size={size}
          color="#F59E0B"
        />
      ))}
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B', marginLeft: 2 }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

// ── Modale "Choisir un brief" ─────────────────────────────────────────────────

function BriefPickerModal({ visible, ghostwriter, onClose, onPick }) {
  const { briefs } = useBriefs();
  const open = briefs.filter(b => b.status === 'open');

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Inviter {ghostwriter?.name}</Text>
          <Text style={pickerStyles.sub}>Sur quel brief souhaitez-vous inviter ce ghostwriter ?</Text>

          {open.length === 0 ? (
            <View style={pickerStyles.empty}>
              <Ionicons name="document-text-outline" size={28} color={COLORS.textMuted} />
              <Text style={pickerStyles.emptyText}>Aucun brief ouvert.{'\n'}Créez-en un d'abord.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              {open.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={pickerStyles.briefRow}
                  onPress={() => onPick(b)}
                  activeOpacity={0.75}
                >
                  <View style={[pickerStyles.briefDot, { backgroundColor: b.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={pickerStyles.briefTitle} numberOfLines={1}>{b.title}</Text>
                    <Text style={pickerStyles.briefMeta}>{b.type} · {b.budget}€ · {b.deadline}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:   { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 40, gap: 14 },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center' },
  title:   { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sub:     { fontSize: 13, color: COLORS.textMuted, marginTop: -6 },
  empty:   { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  briefRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  briefDot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  briefTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  briefMeta:  { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});

// ── Carte ghostwriter ─────────────────────────────────────────────────────────

function GhostwriterCard({ gw, onInvite }) {
  const tc = {
    'Script seul':      { color: '#8B5CF6', bg: '#8B5CF614', border: '#8B5CF630' },
    'Script + Montage': { color: '#EF4444', bg: '#EF444414', border: '#EF444430' },
    'Pack mensuel':     { color: '#10B981', bg: '#10B98114', border: '#10B98130' },
  }[gw.specialty] ?? { color: COLORS.primary, bg: COLORS.primary + '14', border: COLORS.primary + '30' };

  return (
    <View style={styles.card}>
      {/* ── Top row ── */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: gw.color + '28' }]}>
          <Text style={[styles.avatarInitials, { color: gw.color }]}>{gw.initials}</Text>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{gw.name}</Text>
            {gw.rating >= 4.9 && (
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>Top</Text>
              </View>
            )}
          </View>
          <View style={[styles.specialtyBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
            <Text style={[styles.specialtyText, { color: tc.color }]}>{gw.specialty}</Text>
          </View>
          <View style={styles.metaRow}>
            <Stars rating={gw.rating} />
            <Text style={styles.missionsText}>{gw.missions} missions</Text>
          </View>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>À partir de</Text>
          <Text style={styles.priceValue}>{gw.priceFrom}€</Text>
        </View>
      </View>

      {/* ── Bio ── */}
      <Text style={styles.bio} numberOfLines={2}>{gw.bio}</Text>

      {/* ── Tags ── */}
      <View style={styles.tags}>
        {gw.tags.map(t => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* ── Délais ── */}
      <View style={styles.delaisRow}>
        <View style={styles.delaiChip}>
          <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
          <Text style={styles.delaiText}>Répond {gw.responseTime}</Text>
        </View>
        <View style={styles.delaiChip}>
          <Ionicons name="alarm-outline" size={10} color={COLORS.textMuted} />
          <Text style={styles.delaiText}>Livraison {gw.deliveryTime}</Text>
        </View>
      </View>

      {/* ── CTA ── */}
      <TouchableOpacity
        style={[styles.inviteBtn, { borderColor: gw.color + '55', backgroundColor: gw.color + '0E' }]}
        onPress={() => onInvite(gw)}
        activeOpacity={0.8}
      >
        <Ionicons name="paper-plane-outline" size={15} color={gw.color} />
        <Text style={[styles.inviteBtnText, { color: gw.color }]}>Inviter sur un brief</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function GhostwritersScreen() {
  const navigation = useNavigation();
  const { addApplicant } = useBriefs();

  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [picker,  setPicker]  = useState(null); // ghostwriter en cours d'invitation

  const filtered = useMemo(() => {
    let list = MOCK_GHOSTWRITERS;
    if (filter !== 'all') list = list.filter(g => g.specialty === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.bio.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filter, search]);

  function handleInvite(gw) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPicker(gw);
  }

  function handlePick(brief) {
    const gw = picker;
    setPicker(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addApplicant(brief.id, {
      id:        gw.id,
      initials:  gw.initials,
      name:      gw.name,
      specialty: gw.specialty,
      rating:    gw.rating,
      missions:  gw.missions,
      bio:       gw.bio,
    });
    navigation.navigate('Applicants', { brief: { ...brief, applicants: [...(brief.applicants ?? []), { id: gw.id, initials: gw.initials, name: gw.name, specialty: gw.specialty, rating: gw.rating, missions: gw.missions, bio: gw.bio }] } });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Ghostwriters</Text>
            <Text style={styles.headerSub}>{filtered.length} profil{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par nom, spécialité, thématique…"
            placeholderTextColor={COLORS.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filtres ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
                i < FILTERS.length - 1 && { marginRight: 8 },
              ]}
              onPress={() => { setFilter(f.key); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Liste ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Aucun résultat pour cette recherche.</Text>
            </View>
          ) : (
            filtered.map(gw => (
              <GhostwriterCard key={gw.id} gw={gw} onInvite={handleInvite} />
            ))
          )}
        </ScrollView>

        {/* ── Modale choix brief ── */}
        <BriefPickerModal
          visible={!!picker}
          ghostwriter={picker}
          onClose={() => setPicker(null)}
          onPick={handlePick}
        />

      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon:  {},
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },

  // Filters
  filtersScroll: { flexGrow: 0, marginBottom: SPACING.sm },
  filtersRow:    { paddingHorizontal: SPACING.lg, alignItems: 'center' },
  filterChip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.card,
    flexShrink: 0,
  },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  filterText:       { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },

  // List
  scroll:        { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingTop: 4, gap: 14, paddingBottom: 40 },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md, gap: 10, ...SHADOW.sm,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar:     { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitials: { fontSize: 20, fontWeight: '900' },

  cardInfo:   { flex: 1, gap: 5 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name:       { fontSize: 16, fontWeight: '800', color: COLORS.text },
  topBadge:   { backgroundColor: '#F59E0B22', borderWidth: 1, borderColor: '#F59E0B44', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  topBadgeText: { fontSize: 9, fontWeight: '800', color: '#F59E0B' },
  specialtyBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  specialtyText:  { fontSize: 10, fontWeight: '700' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  missionsText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  priceBox:   { alignItems: 'flex-end', flexShrink: 0 },
  priceLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },
  priceValue: { fontSize: 18, fontWeight: '900', color: '#22C55E' },

  bio: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:     { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  delaisRow: { flexDirection: 'row', gap: 10 },
  delaiChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  delaiText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  inviteBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: RADIUS.lg, paddingVertical: 12 },
  inviteBtnText: { fontSize: 14, fontWeight: '700' },
});
