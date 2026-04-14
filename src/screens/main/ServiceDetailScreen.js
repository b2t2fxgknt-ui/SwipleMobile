/**
 * ServiceDetailScreen.js → GhostwriterProfileScreen
 * Profil complet d'un ghostwriter TikTok.
 * Params : { ghostwriter } ou { service } (compat legacy)
 * Accès  : GhostwritersScreen · SearchScreen (client) · MatchesScreen
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Platform, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import { useBriefs } from '../../lib/BriefsContext';

// ── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < full ? 'star' : (i === full && half ? 'star-half' : 'star-outline')}
          size={size} color="#F59E0B"
        />
      ))}
      <Text style={{ fontSize: size, fontWeight: '700', color: COLORS.text, marginLeft: 4 }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ icon, value, label, color }) {
  return (
    <View style={[styles.statPill, { borderColor: color + '30', backgroundColor: color + '0E' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <View>
        <Text style={[styles.statVal, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ── Modal invitation ──────────────────────────────────────────────────────────

function InviteModal({ visible, ghostwriter, onClose, onInvite }) {
  const { briefs } = useBriefs();
  const openBriefs = briefs.filter(b => b.status === 'open');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Inviter {ghostwriter?.name}</Text>
          <Text style={styles.modalSub}>Sélectionne le brief sur lequel tu veux l'inviter</Text>

          {openBriefs.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Ionicons name="document-text-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.modalEmptyText}>Aucun brief ouvert</Text>
              <Text style={styles.modalEmptySubText}>Crée un brief d'abord depuis l'onglet Briefs</Text>
            </View>
          ) : (
            <FlatList
              data={openBriefs}
              keyExtractor={b => b.id}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.briefRow}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onInvite(item); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.briefRowIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon ?? 'document-text-outline'} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.briefRowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.briefRowMeta}>{item.type} · {item.budget}€</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function ServiceDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const [inviteOpen, setInviteOpen] = useState(false);

  // Compatible ghostwriter (nouveau) et service (legacy)
  const gw = route.params?.ghostwriter ?? route.params?.service ?? {};

  const color       = gw.color ?? COLORS.primary;
  const specialty   = gw.specialty ?? gw.category ?? 'Ghostwriting TikTok';
  const name        = gw.name ?? gw.freelancerName ?? 'Ghostwriter';
  const initials    = gw.initials ?? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const bio         = gw.bio ?? gw.description ?? '';
  const rating      = Number(gw.rating ?? 5.0);
  const missions    = gw.missions ?? gw.reviewCount ?? 0;
  const priceFrom   = gw.priceFrom ?? gw.price ?? 0;
  const priceTo     = gw.priceTo ?? null;
  const responseTime= gw.responseTime ?? '< 4h';
  const deliveryTime= gw.deliveryTime ?? '48h';
  const tags        = gw.tags ?? [];

  const SPECIALTY_COLOR = {
    'Script seul':      '#8B5CF6',
    'Script + Montage': '#EF4444',
    'Pack mensuel':     '#10B981',
  };
  const SPECIALTY_ICON = {
    'Script seul':      'document-text-outline',
    'Script + Montage': 'videocam-outline',
    'Pack mensuel':     'calendar-outline',
  };
  const specialtyColor = SPECIALTY_COLOR[specialty] ?? color;
  const specialtyIcon  = SPECIALTY_ICON[specialty] ?? 'sparkles-outline';

  function handleInvite(brief) {
    setInviteOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Match', {
      brief,
      freelancer: { name, initials, color, specialty },
      isClient: true,
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <InviteModal
        visible={inviteOpen}
        ghostwriter={{ name, initials, color }}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      {/* ── HERO ── */}
      <SafeAreaView edges={['top']}>
        <View style={[styles.hero, { borderBottomColor: color + '25' }]}>
          <LinearGradient
            colors={[color + '18', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <View style={styles.heroTop}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            {/* Actions rapides */}
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: color + '18', borderColor: color + '35' }]}
                onPress={() => navigation.navigate('Messagerie', { ghostwriterId: gw.id, ghostwriterName: name })}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-outline" size={18} color={color} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.heroCenter}>
            <View style={[styles.avatar, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <Text style={[styles.avatarInitials, { color }]}>{initials}</Text>
            </View>
            <Text style={styles.heroName}>{name}</Text>
            <View style={[styles.specialtyBadge, { backgroundColor: specialtyColor + '18', borderColor: specialtyColor + '35' }]}>
              <Ionicons name={specialtyIcon} size={12} color={specialtyColor} />
              <Text style={[styles.specialtyText, { color: specialtyColor }]}>{specialty}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatPill icon="star"              value={rating.toFixed(1)}    label="Note"       color="#F59E0B" />
            <StatPill icon="briefcase-outline" value={`${missions}`}        label="Missions"   color={color}  />
            <StatPill icon="chatbubble-outline"value={responseTime}         label="Réponse"    color="#10B981"/>
            <StatPill icon="alarm-outline"     value={deliveryTime}         label="Livraison"  color="#3B82F6"/>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Bio */}
        {!!bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.bioText}>{bio}</Text>
          </View>
        )}

        {/* Niches / tags */}
        {tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niches de prédilection</Text>
            <View style={styles.tagsWrap}>
              {tags.map((t, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: color + '14', borderColor: color + '30' }]}>
                  <Text style={[styles.tagText, { color }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tarifs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarifs</Text>
          <View style={styles.priceCard}>
            <LinearGradient
              colors={[color + '0E', 'transparent']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.xl}
            />
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceFrom}>À partir de</Text>
                <Text style={[styles.priceVal, { color }]}>
                  {priceFrom}€{priceTo ? ` – ${priceTo}€` : ''}
                </Text>
                <Text style={styles.priceUnit}>par mission</Text>
              </View>
              <View style={styles.priceRight}>
                <View style={[styles.deliveryChip, { backgroundColor: '#3B82F614', borderColor: '#3B82F630' }]}>
                  <Ionicons name="alarm-outline" size={13} color="#3B82F6" />
                  <Text style={[styles.deliveryText, { color: '#3B82F6' }]}>Livraison {deliveryTime}</Text>
                </View>
                <View style={[styles.deliveryChip, { backgroundColor: '#10B98114', borderColor: '#10B98130', marginTop: 6 }]}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#10B981" />
                  <Text style={[styles.deliveryText, { color: '#10B981' }]}>Paiement sécurisé</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stars review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avis clients</Text>
          <View style={styles.reviewCard}>
            <Stars rating={rating} />
            <Text style={styles.reviewCount}>{missions} missions réalisées</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA sticky */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => navigation.navigate('Messagerie', { ghostwriterId: gw.id, ghostwriterName: name })}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.text} />
          <Text style={styles.ctaSecondaryText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setInviteOpen(true); }}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[color, color + 'CC']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Ionicons name="paper-plane-outline" size={18} color="#fff" />
            <Text style={styles.ctaPrimaryText}>Inviter sur un brief</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    borderBottomWidth: 1, paddingBottom: SPACING.lg, overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  heroActions:{ flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  heroCenter: { alignItems: 'center', gap: 10, paddingBottom: SPACING.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, ...SHADOW.md,
  },
  avatarInitials: { fontSize: 30, fontWeight: '900' },
  heroName:       { fontSize: 22, fontWeight: '900', color: COLORS.text },
  specialtyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  specialtyText: { fontSize: 13, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingHorizontal: SPACING.lg, flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.lg, borderWidth: 1,
  },
  statVal:   { fontSize: 14, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.lg },

  // Sections
  section:      { gap: SPACING.sm },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7 },
  bioText:      { fontSize: 14, color: COLORS.text, lineHeight: 22 },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  tagText:  { fontSize: 13, fontWeight: '600' },

  // Price card
  priceCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, overflow: 'hidden',
  },
  priceRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceFrom:   { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
  priceVal:    { fontSize: 28, fontWeight: '900' },
  priceUnit:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  priceRight:  { alignItems: 'flex-end' },
  deliveryChip:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  deliveryText:{ fontSize: 12, fontWeight: '700' },

  // Reviews
  reviewCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: 8,
  },
  reviewCount: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

  // CTA bar
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  ctaSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  ctaPrimary:  { flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  ctaGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  ctaPrimaryText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 44 : SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
  },
  modalHandle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.xs },
  modalTitle:        { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalSub:          { fontSize: 13, color: COLORS.textMuted },
  modalEmpty:        { alignItems: 'center', paddingVertical: SPACING.xl, gap: 10 },
  modalEmptyText:    { fontSize: 15, fontWeight: '700', color: COLORS.text },
  modalEmptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  briefRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  briefRowIcon:  { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  briefRowTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  briefRowMeta:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
