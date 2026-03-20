import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  StatusBar, SafeAreaView, Animated, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width } = Dimensions.get('window');

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

const CATEGORY_ICON = {
  video_montage:     'videocam-outline',
  design:            'color-palette-outline',
  copywriting:       'create-outline',
  reseaux_sociaux:   'phone-portrait-outline',
  ia_automatisation: 'hardware-chip-outline',
  site_web:          'globe-outline',
  legal_admin:       'document-text-outline',
  comptabilite:      'calculator-outline',
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OrderScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const session    = useSession();
  const { service } = route.params ?? {};

  const [step,     setStep]     = useState('summary'); // 'summary' | 'success'
  const [isPaying, setIsPaying] = useState(false);

  const successAnim  = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.5)).current;
  const checkScale   = useRef(new Animated.Value(0)).current;

  if (!service) return null;

  // ── Data normalization — v2 Supabase format OR legacy mock format ──
  const accent         = CATEGORY_ACCENT[service.category] ?? COLORS.primary;
  const categoryLabel  = CATEGORY_LABELS[service.category] ?? service.categoryLabel ?? service.category;
  const categoryIcon   = CATEGORY_ICON[service.category]   ?? 'briefcase-outline';
  const deliveryTime   = service.delivery_time ?? service.deliveryTime ?? '—';
  const freelancerName = service.freelancer?.name ?? service.freelancerName ?? 'Freelance';
  const freelancerId   = service.freelancer?.id ?? service.freelancer_id ?? null;

  const fee   = Math.round(service.price * 0.08);
  const total = service.price + fee;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handlePay() {
    setIsPaying(true);

    // Persist order to Supabase if authenticated
    if (session?.user?.id) {
      try {
        await supabase.from('orders').insert({
          service_id:    service.id,
          client_id:     session.user.id,
          freelancer_id: freelancerId,
          price:         total,
          status:        'pending',
        });
      } catch (e) {
        console.warn('[OrderScreen] insert failed:', e);
      }
    }

    // Short delay for UX feel
    setTimeout(() => {
      setIsPaying(false);
      setStep('success');

      Animated.sequence([
        Animated.parallel([
          Animated.timing(successAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(successScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        ]),
        Animated.delay(200),
        Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]).start();
    }, 1000);
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BubbleBackground variant="acheteur" />
        </View>
        <StatusBar barStyle="light-content" />

        <Animated.View style={[styles.successContainer, { opacity: successAnim }]}>
          <Animated.View style={[
            styles.successCircle,
            { borderColor: accent, transform: [{ scale: successScale }] },
          ]}>
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <Text style={[styles.successCheck, { color: accent }]}>✓</Text>
            </Animated.View>
          </Animated.View>

          <Text style={styles.successTitle}>Commande confirmée !</Text>
          <Text style={styles.successSub}>
            {freelancerName} a reçu ta commande et commencera sous peu.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Service</Text>
              <Text style={styles.successVal} numberOfLines={1}>{service.title}</Text>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Freelancer</Text>
              <Text style={styles.successVal}>{freelancerName}</Text>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Livraison prévue</Text>
              <Text style={[styles.successVal, { color: accent }]}>dans {deliveryTime}</Text>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Total payé</Text>
              <Text style={[styles.successVal, { color: accent }]}>{total}€</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.successBtn, { backgroundColor: accent }]}
            onPress={() => {
              const trackMission = {
                id:        `order_${service.id ?? Date.now()}`,
                title:     service.title,
                type:      categoryLabel,
                budget:    total,
                deadline:  deliveryTime,
                revisions: 2,
                status:    'en_cours',
                color:     accent,
                icon:      categoryIcon,
              };
              const trackFreelancer = {
                name:     freelancerName,
                initials: freelancerName.charAt(0).toUpperCase(),
              };
              navigation.navigate('MissionTracking', { mission: trackMission, freelancer: trackFreelancer });
            }}
            activeOpacity={0.82}
          >
            <Ionicons name="radar-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.successBtnText}>Suivre ma commande</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Main', { screen: 'Commandes' })}
            activeOpacity={0.7}
          >
            <Text style={styles.successLink}>Voir toutes mes commandes</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Summary screen ────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Passer commande</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Service summary ── */}
        <View style={styles.serviceCard}>
          <View style={[styles.serviceEmojiBox, { backgroundColor: accent + '18' }]}>
            <Ionicons name={categoryIcon} size={32} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={[styles.categoryChip, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
              <Text style={[styles.categoryChipText, { color: accent }]}>{categoryLabel}</Text>
            </View>
            <Text style={styles.serviceTitle} numberOfLines={2}>{service.title}</Text>
            <Text style={styles.serviceFreelancer}>par {freelancerName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Delivery time ── */}
        <View style={styles.deliveryBox}>
          <Ionicons name="time-outline" size={20} color={accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryLabel}>Délai de livraison estimé</Text>
            <Text style={[styles.deliveryValue, { color: accent }]}>{deliveryTime}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Price breakdown ── */}
        <Text style={styles.sectionTitle}>Récapitulatif</Text>
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service de base</Text>
            <Text style={styles.priceVal}>{service.price}€</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Frais de service (8%)</Text>
            <Text style={styles.priceVal}>{fee}€</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: COLORS.text, ...FONT.bold }]}>Total</Text>
            <Text style={[styles.priceVal, { fontSize: 20, color: accent }]}>{total}€</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Security badges ── */}
        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.secureText}>Paiement 100% sécurisé via Stripe</Text>
        </View>
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.secureText}>Remboursement garanti si délai non respecté</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── CTA ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: accent }, isPaying && styles.payBtnLoading]}
          onPress={handlePay}
          disabled={isPaying}
          activeOpacity={0.82}
        >
          {isPaying ? (
            <Text style={styles.payBtnText}>Traitement en cours…</Text>
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>Payer {total}€</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  safeTop: { backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, color: COLORS.text, ...FONT.bold },

  scroll: { padding: SPACING.lg },

  // Service card
  serviceCard: {
    flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start',
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  serviceEmojiBox: {
    width: 68, height: 68, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full, borderWidth: 1, marginBottom: 6,
  },
  categoryChipText:  { fontSize: 10, ...FONT.semibold },
  serviceTitle:      { fontSize: 14, color: COLORS.text, ...FONT.semibold, lineHeight: 20, marginBottom: 4 },
  serviceFreelancer: { fontSize: 12, color: COLORS.textMuted },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  // Delivery
  deliveryBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md,
  },
  deliveryLabel: { fontSize: 12, color: COLORS.textMuted, ...FONT.medium },
  deliveryValue: { fontSize: 16, ...FONT.bold, marginTop: 2 },

  sectionTitle: { fontSize: 16, color: COLORS.text, ...FONT.bold, marginBottom: SPACING.sm },

  // Price
  priceCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md,
  },
  priceDivider: { height: 1, backgroundColor: COLORS.border },
  priceLabel:   { fontSize: 14, color: COLORS.textMuted, ...FONT.medium },
  priceVal:     { fontSize: 16, color: COLORS.text, ...FONT.bold },

  // Secure
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  secureText: { fontSize: 13, color: COLORS.textLight, ...FONT.medium },

  // CTA
  ctaBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    padding: SPACING.lg, paddingBottom: 34,
  },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: RADIUS.full,
    ...SHADOW.md,
  },
  payBtnLoading: { opacity: 0.7 },
  payBtnText:    { fontSize: 16, color: '#fff', ...FONT.semibold },

  // Success
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.md,
  },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  successCheck: { fontSize: 46, fontWeight: '700' },
  successTitle: { fontSize: 26, color: COLORS.text, ...FONT.bold, textAlign: 'center' },
  successSub:   {
    fontSize: 14, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 22, marginBottom: SPACING.sm,
  },
  successCard: {
    width: '100%', backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', marginBottom: SPACING.sm,
  },
  successRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, gap: SPACING.md,
  },
  successDivider: { height: 1, backgroundColor: COLORS.border },
  successLabel:   { fontSize: 13, color: COLORS.textMuted, ...FONT.medium },
  successVal:     { fontSize: 14, color: COLORS.text, ...FONT.semibold, flex: 1, textAlign: 'right' },

  successBtn: {
    width: '100%', paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm, ...SHADOW.md,
  },
  successBtnText: { fontSize: 16, color: '#fff', ...FONT.semibold },
  successLink:    { fontSize: 14, color: COLORS.textMuted, ...FONT.medium, marginTop: SPACING.xs },
});
