import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, StatusBar,
  SafeAreaView, Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

const CATEGORY_ACCENT = {
  video_montage:     '#7C3AED',
  design:            '#EC4899',
  copywriting:       '#3B82F6',
  reseaux_sociaux:   '#F59E0B',
  ia_automatisation: '#10B981',
  site_web:          '#06B6D4',
  legal_admin:       '#8B5CF6',
  comptabilite:      '#F97316',
};
const CATEGORY_LABELS = {
  video_montage:     'Vidéo & Montage',
  design:            'Design & Branding',
  copywriting:       'Copywriting',
  reseaux_sociaux:   'Réseaux sociaux',
  ia_automatisation: 'IA & Automatisation',
  site_web:          'Site web',
  legal_admin:       'Légal & Admin',
  comptabilite:      'Comptabilité',
};
const CATEGORY_EMOJI = {
  video_montage:     '🎬',
  design:            '🎨',
  copywriting:       '✍️',
  reseaux_sociaux:   '📱',
  ia_automatisation: '🤖',
  site_web:          '🌐',
  legal_admin:       '📋',
  comptabilite:      '🧾',
};

function isDirectVideo(url) {
  if (!url) return false;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return false;
  if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)) return true;
  if (url.includes('supabase.co/storage')) return true;
  return false;
}

export default function ServiceDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { service } = route.params ?? {};
  if (!service) return null;

  // Supabase format + legacy mock format
  const accent         = CATEGORY_ACCENT[service.category] ?? COLORS.primary;
  const categoryLabel  = CATEGORY_LABELS[service.category] ?? service.categoryLabel ?? service.category;
  const categoryEmoji  = CATEGORY_EMOJI[service.category] ?? '💼';
  const deliveryTime   = service.delivery_time ?? service.deliveryTime ?? '—';
  const freelancerName = service.freelancer?.name ?? service.freelancerName ?? 'Freelance';
  const avatarUrl      = service.freelancer?.avatar_url ?? null;
  const avatarInitial  = freelancerName[0]?.toUpperCase() ?? '?';
  const videoUrl       = service.example_video_url ?? null;
  const hasVideo       = isDirectVideo(videoUrl);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces>

        {/* ── Cover ────────────────────────────────────────────────────── */}
        <View style={styles.cover}>
          {hasVideo ? (
            <Video
              source={{ uri: videoUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay isLooping isMuted
            />
          ) : (
            <LinearGradient
              colors={[accent + '50', accent + '20', '#13131908']}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.22)' }]} />

          {/* Back */}
          <SafeAreaView style={styles.backArea}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Center content (no video) */}
          <View style={styles.coverContent}>
            {!hasVideo && <Text style={styles.coverEmoji}>{categoryEmoji}</Text>}
            <View style={[styles.categoryBadge, { borderColor: accent + '55', backgroundColor: COLORS.card + 'EE' }]}>
              <Text style={[styles.categoryBadgeText, { color: accent }]}>
                {categoryEmoji} {categoryLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <View style={styles.content}>

          <Text style={styles.serviceTitle}>{service.title}</Text>

          {/* Freelancer */}
          <View style={styles.freelancerCard}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.freelancerAvatar} />
            ) : (
              <View style={[styles.freelancerAvatar, styles.avatarFallback, { backgroundColor: accent + '20' }]}>
                <Text style={{ fontSize: 24, ...FONT.bold, color: accent }}>{avatarInitial}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.freelancerName}>{freelancerName}</Text>
              <Text style={styles.freelancerRole}>Freelance</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>À propos du service</Text>
          <Text style={styles.description}>{service.description ?? 'Aucune description disponible.'}</Text>

          <View style={styles.divider} />

          {/* Tarif */}
          <Text style={styles.sectionTitle}>Tarif & livraison</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Prix de base</Text>
              <Text style={[styles.pricingValue, { color: accent }]}>{service.price}€</Text>
            </View>
            <View style={styles.pricingDivider} />
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Délai de livraison</Text>
              <Text style={styles.pricingValue}>{deliveryTime}</Text>
            </View>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <View style={styles.ctaBar}>
        <View>
          <Text style={styles.ctaPrice}>{service.price}€</Text>
          <Text style={styles.ctaDelivery}>Livraison {deliveryTime}</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: accent }]}
          onPress={() => navigation.navigate('Order', { service })}
          activeOpacity={0.82}
        >
          <Text style={styles.ctaBtnText}>Commander</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingBottom: 0 },

  cover:        { height: 240, position: 'relative', justifyContent: 'flex-end' },
  backArea:     { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn:      { margin: SPACING.md, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card + 'CC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  coverContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, alignItems: 'center', gap: 8 },
  coverEmoji:   { fontSize: 64 },
  categoryBadge:     { paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  categoryBadgeText: { fontSize: 12, ...FONT.semibold },

  content:      { padding: SPACING.lg },
  serviceTitle: { fontSize: 22, color: COLORS.text, ...FONT.bold, lineHeight: 30, marginBottom: SPACING.lg },

  freelancerCard:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.lg },
  freelancerAvatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback:   { alignItems: 'center', justifyContent: 'center' },
  freelancerName:   { fontSize: 16, color: COLORS.text, ...FONT.semibold },
  freelancerRole:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  divider:      { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  sectionTitle: { fontSize: 16, color: COLORS.text, ...FONT.bold, marginBottom: SPACING.sm },
  description:  { fontSize: 14, color: COLORS.textMuted, lineHeight: 23 },

  pricingCard:    { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  pricingRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  pricingDivider: { height: 1, backgroundColor: COLORS.border },
  pricingLabel:   { fontSize: 14, color: COLORS.textMuted, ...FONT.medium },
  pricingValue:   { fontSize: 15, color: COLORS.text, ...FONT.bold },

  ctaBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 34, gap: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 16 },
  ctaPrice:   { fontSize: 24, color: COLORS.text, ...FONT.bold },
  ctaDelivery:{ fontSize: 12, color: COLORS.textMuted, ...FONT.medium, marginTop: 2 },
  ctaBtn:     { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: 'center', ...SHADOW.md },
  ctaBtnText: { fontSize: 15, color: '#fff', ...FONT.semibold },
});
