/**
 * PendingValidationsScreen.js
 * Liste de toutes les missions en attente de validation par l'acheteur.
 * Navigué depuis le PulsingBanner dans OrdersScreen.
 * Params : { orders: Order[] }
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Carte mission en attente ───────────────────────────────────────────────────
function ValidationCard({ order, index, onValidate }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const color = order.color ?? COLORS.primary;

  return (
    <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.card}>
        <LinearGradient
          colors={[color + '0C', 'transparent']}
          style={StyleSheet.absoluteFill}
          borderRadius={RADIUS.xl}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }}
        />

        {/* ── En-tête ── */}
        <View style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: color + '18', borderColor: color + '35' }]}>
            <Ionicons name={order.icon ?? 'sparkles-outline'} size={18} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardType, { color }]}>{String(order.type).toUpperCase()}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>{order.title}</Text>
          </View>
          <Text style={[styles.cardAmount, { color }]}>{order.amount}€</Text>
        </View>

        {/* ── Freelance ── */}
        <View style={styles.freelancerRow}>
          <View style={[styles.freelancerAvatar, { backgroundColor: color + '20' }]}>
            <Text style={[styles.freelancerInitial, { color }]}>
              {order.freelancerName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.freelancerName}>{order.freelancerName}</Text>
          <View style={styles.livreBadge}>
            <Ionicons name="cloud-download-outline" size={10} color="#8B5CF6" />
            <Text style={styles.livreBadgeText}>Livraison reçue</Text>
          </View>
        </View>

        {/* ── Message livraison ── */}
        {!!order.deliveryMessage && (
          <View style={styles.msgPreview}>
            <Ionicons name="chatbubble-ellipses-outline" size={11} color={COLORS.textMuted} style={{ marginTop: 1, flexShrink: 0 }} />
            <Text style={styles.msgPreviewText} numberOfLines={2}>{order.deliveryMessage}</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => onValidate(order)}
            activeOpacity={0.78}
          >
            <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
            <Text style={styles.trackBtnText}>Voir la livraison</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.validateBtn}
            onPress={() => onValidate(order)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.lg}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Ionicons name="checkmark-circle" size={15} color="#fff" />
            <Text style={styles.validateBtnText}>Valider</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────────
export default function PendingValidationsScreen() {
  const navigation = useNavigation();
  const route      = useRoute();

  const orders = route.params?.orders ?? [];
  const total  = orders.reduce((s, o) => s + (o.amount ?? 0), 0);

  function handleValidate(order) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mission = {
      id:              order.id,
      title:           order.title,
      type:            order.type,
      budget:          order.amount,
      status:          order.status,
      color:           order.color,
      icon:            order.icon,
      deadline:        order.deadline ?? '24h',
      deliveryUrl:     order.deliveryUrl,
      deliveryMessage: order.deliveryMessage,
      revisionCount:   0,
    };
    const freelancer = {
      name:     order.freelancerName,
      initials: order.freelancerName?.charAt(0)?.toUpperCase() ?? '?',
    };
    navigation.navigate('MissionTracking', { mission, freelancer });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>

        {/* ── TopBar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle}>Actions requises</Text>
            <Text style={styles.topBarSub}>Ces missions attendent ta validation</Text>
          </View>
          {/* Badge count */}
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{orders.length}</Text>
          </View>
        </View>

        {/* ── Banner résumé ── */}
        <View style={styles.summaryBanner}>
          <LinearGradient
            colors={['#6D28D9', '#8B5CF6']}
            style={StyleSheet.absoluteFill}
            borderRadius={16}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.summaryLeft}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="alert-circle" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.summaryTitle}>
                {orders.length} livraison{orders.length > 1 ? 's' : ''} à valider
              </Text>
              <Text style={styles.summarySub}>
                {total}€ sécurisés · en attente de libération
              </Text>
            </View>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#fff" />
            <Text style={styles.summaryPillText}>Fonds sécurisés</Text>
          </View>
        </View>

        {/* ── Explication ── */}
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            Valide chaque livraison pour libérer le paiement au freelance. Tu peux aussi demander une retouche gratuite.
          </Text>
        </View>

        {/* ── Liste des missions ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order, i) => (
            <ValidationCard
              key={order.id}
              order={order}
              index={i}
              onValidate={handleValidate}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // TopBar
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  topBarSub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  countBadge: {
    minWidth: 32, height: 32, borderRadius: 16,
    backgroundColor: '#8B5CF620', borderWidth: 1.5, borderColor: '#8B5CF650',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  countBadgeText: { fontSize: 15, fontWeight: '900', color: '#8B5CF6' },

  // Banner résumé
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: SPACING.md, marginTop: SPACING.md,
    borderRadius: 16, padding: 14, overflow: 'hidden',
    shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  summaryIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: { fontSize: 14, fontWeight: '900', color: '#fff' },
  summarySub:   { fontSize: 11, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  summaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  summaryPillText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Info
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    marginHorizontal: SPACING.lg, marginTop: SPACING.sm, marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },

  // Card
  cardWrap: { marginBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, overflow: 'hidden', ...SHADOW.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  cardIcon: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardType:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  cardTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 18 },
  cardAmount: { fontSize: 20, fontWeight: '900', alignSelf: 'center', flexShrink: 0 },

  // Freelancer
  freelancerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  freelancerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  freelancerInitial: { fontSize: 11, fontWeight: '800' },
  freelancerName:    { fontSize: 12, fontWeight: '600', color: COLORS.text, flex: 1 },
  livreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#8B5CF614', borderWidth: 1, borderColor: '#8B5CF630',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  livreBadgeText: { fontSize: 10, fontWeight: '700', color: '#8B5CF6' },

  // Message preview
  msgPreview: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, paddingVertical: 9, marginBottom: 10,
  },
  msgPreviewText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17, fontStyle: 'italic' },

  // Actions
  actions: { flexDirection: 'row', gap: 8 },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1, borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.lg, justifyContent: 'center',
  },
  trackBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  validateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: RADIUS.lg, overflow: 'hidden',
  },
  validateBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
