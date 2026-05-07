/**
 * OrdersScreen.js — Suivi des commandes client (onglet "Commandes")
 * Sources combinées : MissionsContext (commandes via ExpertsScreen) + Supabase
 * Tabs : Toutes · En cours · Terminées
 * Tap sur une carte → MissionTracking
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Animated, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScrollProgressIndicator from '../../components/ui/ScrollProgressIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { useMissions }          from '../../lib/MissionsContext';
import FreelancerProfileSheet   from '../../components/ui/FreelancerProfileSheet';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Config statuts unifiés ─────────────────────────────────────────────────────
const STATUS_CFG = {
  en_cours:    { label: 'En cours',   color: '#3B82F6', icon: 'reload-outline',           group: 'active' },
  revision:    { label: 'Révision',   color: '#F59E0B', icon: 'refresh-circle-outline',   group: 'active' },
  livre:       { label: 'Livré',      color: '#8B5CF6', icon: 'cloud-done-outline',        group: 'active' },
  valide:      { label: 'Terminé ✓',  color: '#10B981', icon: 'checkmark-circle-outline',  group: 'done'   },
  // Supabase statuses
  paid:        { label: 'Payé',       color: '#22C55E', icon: 'checkmark-circle-outline',  group: 'active' },
  pending:     { label: 'En attente', color: '#F59E0B', icon: 'time-outline',              group: 'active' },
  in_progress: { label: 'En cours',   color: '#3B82F6', icon: 'reload-outline',            group: 'active' },
  delivered:   { label: 'Livré',      color: '#8B5CF6', icon: 'archive-outline',           group: 'active' },
  completed:   { label: 'Terminé ✓',  color: '#10B981', icon: 'trophy-outline',            group: 'done'   },
  cancelled:   { label: 'Annulé',     color: '#EF4444', icon: 'close-circle-outline',      group: 'done'   },
};

const TYPE_COLOR = {
  'Script seul':      '#10B981',
  'Script + Montage': '#8B5CF6',
  'Pack mensuel':     '#3B82F6',
  'Livraison':        '#F59E0B',
  'Script':           '#10B981',
  'Montage':          '#8B5CF6',
};

const TABS = [
  { key: 'all',    label: 'Toutes',    icon: 'layers-outline'         },
  { key: 'active', label: 'En cours',  icon: 'flash-outline'          },
  { key: 'done',   label: 'Terminées', icon: 'checkmark-done-outline' },
];

// ── Commandes simulées pour les tests ─────────────────────────────────────────
const MOCK_ORDERS = [
  {
    id: 'mock_livre_1',
    title: '4 scripts TikTok — Coach business féminin',
    type: 'Script seul',
    freelancerName: 'Lucas M.',
    status: 'livre',
    amount: 120,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    color: '#10B981',
    icon: 'document-text-outline',
    source: 'mock',
    deliveryUrl: 'https://example.com/scripts-delivered',
    deliveryMessage: 'Voici vos 4 scripts TikTok livrés. Chaque script contient un hook d\'accroche fort en 3 secondes, une structure en 3 parties et un CTA adapté à votre offre de coaching.',
    freelancerData: {
      name: 'Lucas Morel', initials: 'LM',
      specialty: 'Script + Montage',
      skills: ['Scripts TikTok', 'Hook viral', 'Ton business'],
      price: 120, rating: 4.9, reviewCount: 34, level: 'Expert',
      color: '#10B981', icon: 'document-text-outline',
      bio: 'Spécialisé niches business & coaching. Scripts percutants + montage dynamique.',
      deliveryTime: '48h', responseTime: '< 2h',
      before: { metric: '800 vues', views: '12 abonnés/semaine' },
      after:  { metric: '45K vues', views: '380 abonnés/semaine' },
    },
  },
  {
    id: 'mock_livre_2',
    title: 'Script + Montage — Consultant SEO × 3 vidéos',
    type: 'Script + Montage',
    freelancerName: 'Chloé A.',
    status: 'livre',
    amount: 180,
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    color: '#8B5CF6',
    icon: 'videocam-outline',
    source: 'mock',
    deliveryUrl: 'https://example.com/montage-delivered',
    deliveryMessage: '3 vidéos livrées avec script et montage. Les hooks sont optimisés pour les 2 premières secondes sur TikTok. Sous-titres inclus.',
    freelancerData: {
      name: 'Chloé Arnaud', initials: 'CA',
      specialty: 'Script seul', price: 180, rating: 4.7, reviewCount: 21, level: 'Pro',
      color: '#8B5CF6', icon: 'videocam-outline',
      bio: 'Ex-journaliste reconvertie en ghostwriter TikTok. Storytelling et accroches redoutables.',
      deliveryTime: '24h', responseTime: '< 4h',
      before: { metric: '1.1K vues', views: '30 abonnés/mois' },
      after:  { metric: '28K vues', views: '410 abonnés/mois' },
      skills: ['Hook storytelling', 'Montage dynamique', 'Sous-titres'],
    },
  },
  {
    id: 'mock_livre_3',
    title: 'Pack mensuel 8 scripts — Thérapeute bien-être',
    type: 'Pack mensuel',
    freelancerName: 'Raphaël B.',
    status: 'livre',
    amount: 350,
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    color: '#3B82F6',
    icon: 'calendar-outline',
    source: 'mock',
    deliveryUrl: 'https://example.com/pack-delivered',
    deliveryMessage: '8 scripts livrés pour le mois. Chaque script respecte votre ton apaisant et inclut des techniques de bien-être intégrées naturellement dans l\'accroche.',
    freelancerData: {
      name: 'Raphaël Berger', initials: 'RB',
      specialty: 'Pack mensuel', price: 350, rating: 5.0, reviewCount: 12, level: 'Top vendeur',
      color: '#3B82F6', icon: 'calendar-outline',
      bio: 'Créateur de contenu depuis 3 ans. Livrables dans les délais, zéro mauvaise surprise.',
      deliveryTime: '5j', responseTime: '< 1h',
      before: { metric: '500 vues', views: '8 abonnés/semaine' },
      after:  { metric: '22K vues', views: '200 abonnés/semaine' },
      skills: ['Pack mensuel', 'Bien-être', 'Consistance éditoriale'],
    },
  },
  {
    id: 'mock_valide_1',
    title: '6 scripts TikTok — Avocat droit du travail',
    type: 'Script seul',
    freelancerName: 'Thomas N.',
    status: 'valide',
    amount: 90,
    date: new Date(Date.now() - 9 * 86400000).toISOString(),
    color: '#F59E0B',
    icon: 'document-text-outline',
    source: 'mock',
    freelancerData: {
      name: 'Thomas Noir', initials: 'TN',
      specialty: 'Script seul',
      skills: ['Copywriting persuasif', 'Hook viral', 'Accroche juridique'],
      price: 90, rating: 4.6, reviewCount: 45, level: 'Expert',
      color: '#F59E0B', icon: 'document-text-outline',
      bio: '5 ans de copywriting persuasif. Spécialiste accroche virale et hook TikTok.',
      deliveryTime: '24h', responseTime: '< 2h',
      before: { metric: '600 vues', views: '10 abonnés/semaine' },
      after:  { metric: '31K vues', views: '280 abonnés/semaine' },
    },
  },
  {
    id: 'mock_encours_1',
    title: 'Script + Montage — Nutritionniste sportive × 2',
    type: 'Script + Montage',
    freelancerName: 'Sara W.',
    status: 'en_cours',
    amount: 160,
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    color: '#EC4899',
    icon: 'videocam-outline',
    source: 'mock',
    freelancerData: {
      name: 'Sara Weber', initials: 'SW',
      specialty: 'Script + Montage',
      skills: ['Bien-être', 'Scripts santé', 'Montage soigné'],
      price: 160, rating: 4.8, reviewCount: 27, level: 'Pro',
      color: '#EC4899', icon: 'videocam-outline',
      bio: 'Spécialisée bien-être, santé et développement personnel. Ton authentique garanti.',
      deliveryTime: '72h', responseTime: '< 3h',
      before: { metric: '1.5K vues', views: '20 abonnés/semaine' },
      after:  { metric: '67K vues', views: '520 abonnés/semaine' },
    },
  },
];

// ── Convertit une mission du contexte en ordre unifié ─────────────────────────
function missionToOrder(m) {
  return {
    id:            m.id,
    title:         m.title ?? m.type ?? 'Mission',
    type:          m.type  ?? 'Mission',
    freelancerName:m.clientName !== 'Moi (client)' ? (m.freelancerName ?? 'Freelance') : 'Expert Swiple',
    status:        m.status ?? 'en_cours',
    amount:        m.budget ?? 0,
    date:          m.acceptedAt ?? new Date().toISOString(),
    color:         m.color ?? TYPE_COLOR[m.type] ?? COLORS.primary,
    icon:          m.icon  ?? 'sparkles-outline',
    source:        'context',
    rawMission:    m,
  };
}

// ── Convertit un ordre Supabase en ordre unifié ────────────────────────────────
function supabaseToOrder(o) {
  return {
    id:              o.id,
    title:           o.title           ?? 'Mission',
    type:            o.type            ?? 'Mission',
    freelancerName:  o.freelancer_name ?? 'Freelance',
    status:          o.status          ?? 'pending',
    amount:          o.price           ?? o.budget ?? 0,
    date:            o.created_at,
    color:           o.color           ?? COLORS.primary,
    icon:            o.icon            ?? 'briefcase-outline',
    source:          'supabase',
    deliveryUrl:     o.delivery_url,
    deliveryMessage: o.delivery_message,
    deadline:        o.deadline,
    rawOrder:        o,
  };
}

// ── Carte commande ─────────────────────────────────────────────────────────────
function OrderCard({ order, onPress, onViewFreelancer, index }) {
  const cfg      = STATUS_CFG[order.status] ?? { label: order.status, color: COLORS.textMuted, icon: 'help-outline', group: 'active' };
  const isActive = cfg.group === 'active';

  // Petit délai d'entrée staggeré
  const slideAnim = React.useRef(new Animated.Value(24)).current;
  const fadeAnim  = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Gradient teinté */}
        <LinearGradient
          colors={[order.color + '0C', 'transparent']}
          style={StyleSheet.absoluteFill}
          borderRadius={RADIUS.xl}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.7 }}
        />

        {/* ── En-tête ── */}
        <View style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: order.color + '1A', borderColor: order.color + '35' }]}>
            <Ionicons name={order.icon} size={18} color={order.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardType, { color: order.color }]}>{order.type.toUpperCase()}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>{order.title}</Text>
          </View>
          {/* Flèche suivi */}
          <View style={styles.trackBtn}>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </View>

        {/* ── Freelance + statut ── */}
        <View style={styles.cardMid}>
          <TouchableOpacity
            style={styles.freelancerRow}
            onPress={() => onViewFreelancer?.(order.freelancerData)}
            activeOpacity={0.75}
            disabled={!order.freelancerData}
          >
            <View style={[styles.freelancerAvatar, { backgroundColor: order.color + '20' }]}>
              <Text style={[styles.freelancerInitial, { color: order.color }]}>
                {order.freelancerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.freelancerName}>{order.freelancerName}</Text>
            {order.freelancerData && (
              <Ionicons name="chevron-forward" size={10} color={COLORS.textLight} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
          <View style={[styles.statusPill, { backgroundColor: cfg.color + '14', borderColor: cfg.color + '35' }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Bannière livraison à valider ── */}
        {(order.status === 'livre' || order.status === 'delivered') && (
          <View style={styles.deliveryBanner}>
            <View style={styles.deliveryBannerLeft}>
              <Ionicons name="cloud-download-outline" size={14} color="#8B5CF6" />
              <Text style={styles.deliveryBannerText}>Livraison reçue — en attente de validation</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#8B5CF6" />
          </View>
        )}

        {/* ── Barre du bas ── */}
        <View style={styles.cardFoot}>
          <View style={styles.footMeta}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.footMetaText}>{formatDate(order.date)}</Text>
          </View>
          <View style={styles.footMeta}>
            <Ionicons name="shield-checkmark-outline" size={11} color="#22C55E" />
            <Text style={[styles.footMetaText, { color: '#22C55E' }]}>Sécurisé</Text>
          </View>
          <View style={styles.footRight}>
            <Text style={[styles.footAmount, { color: isActive ? COLORS.primary : '#10B981' }]}>
              {order.amount}€
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const navigation                        = useNavigation();
  const [profileFreelancer, setProfileFreelancer] = useState(null);
  const route      = useRoute();
  const session    = useSession();
  const userId     = session?.user?.id;
  const { acceptedMissions } = useMissions();

  const [supabaseOrders, setSupabaseOrders] = useState([]);
  const [refreshing,     setRefreshing]     = useState(false);
  const [activeTab,      setActiveTab]      = useState('all');
  const scrollIndicatorY = useRef(new Animated.Value(0)).current;
  const [scrollContentH,   setScrollContentH]   = useState(0);
  const [scrollContainerH, setScrollContainerH] = useState(0);

  // ── Fetch Supabase orders (silencieux si table vide) ─────────────────────
  const fetchSupabase = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, title, type, budget, price, status, color, deadline,
          delivery_url, delivery_message, freelancer_name, freelancer_initials, created_at`)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });
      if (error) console.warn('[OrdersScreen] fetchSupabase error:', error.message);
      setSupabaseOrders(data ?? []);
    } catch (err) {
      console.warn('[OrdersScreen] fetchSupabase error:', err?.message ?? err);
    }
    finally { setRefreshing(false); }
  }, [userId]);

  useFocusEffect(useCallback(() => { fetchSupabase(); }, [fetchSupabase]));

  // Auto-tab depuis navigation params
  useEffect(() => {
    const tab = route.params?.initialTab;
    if (tab && TABS.some(t => t.key === tab)) setActiveTab(tab);
  }, [route.params?.initialTab]);

  // ── Fusionner sources ─────────────────────────────────────────────────────
  const contextOrders  = acceptedMissions.map(missionToOrder);
  const dbOrders       = supabaseOrders.map(supabaseToOrder);
  const seenIds = new Set(contextOrders.map(o => o.id));
  const mergedOrders = [
    ...contextOrders,
    ...MOCK_ORDERS.filter(o => !seenIds.has(o.id)),
    ...dbOrders.filter(o => !seenIds.has(o.id)),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── Livraisons en attente de validation ──────────────────────────────────
  const pendingValidation = mergedOrders.filter(
    o => o.status === 'livre' || o.status === 'delivered'
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalCount  = mergedOrders.length;
  const activeCount = mergedOrders.filter(o => STATUS_CFG[o.status]?.group === 'active').length;
  const doneCount   = mergedOrders.filter(o => STATUS_CFG[o.status]?.group === 'done').length;
  const totalSpent  = mergedOrders.filter(o => STATUS_CFG[o.status]?.group === 'done')
                        .reduce((s, o) => s + o.amount, 0);

  // ── Filtre actif ──────────────────────────────────────────────────────────
  const filteredOrders = mergedOrders.filter(o => {
    if (activeTab === 'active') return STATUS_CFG[o.status]?.group === 'active';
    if (activeTab === 'done')   return STATUS_CFG[o.status]?.group === 'done';
    return true;
  });

  // ── Navigation vers suivi ─────────────────────────────────────────────────
  function handleOpenOrder(order) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const mission = order.source === 'context' && order.rawMission
      ? order.rawMission
      : {
          id:              order.id,
          title:           order.title,
          type:            order.type,
          budget:          order.amount,
          status:          order.status,
          color:           order.color,
          icon:            order.icon,
          deadline:        order.deadline ?? '—',
          revisions:       2,
          deliveryUrl:     order.deliveryUrl,
          deliveryMessage: order.deliveryMessage,
          freelancerName:  order.freelancerName,
        };

    const freelancer = {
      name:     order.freelancerName,
      initials: order.freelancerName?.charAt(0)?.toUpperCase() ?? '?',
    };

    navigation.navigate('MissionTracking', { mission, freelancer });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FreelancerProfileSheet
        visible={!!profileFreelancer}
        freelancer={profileFreelancer}
        onClose={() => setProfileFreelancer(null)}
        onOrder={null}
      />
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerBadge}>
            <Ionicons name="receipt-outline" size={10} color={COLORS.primary} />
            <Text style={styles.headerBadgeText}>CLIENT</Text>
          </View>
          <Text style={styles.headerTitle}>Mes commandes</Text>
        </View>
        <TouchableOpacity
          style={styles.chatHeaderBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Messagerie'); }}
          activeOpacity={0.75}
        >
          <Ionicons name="chatbubble" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── STATS ROW ── */}
      <View style={styles.statsRow}>
        <StatPill value={totalCount}          label="Total"       color={COLORS.primary} icon="cube-outline" />
        <View style={styles.statDivider} />
        <StatPill value={activeCount}         label="En cours"    color="#3B82F6"         icon="flash-outline" />
        <View style={styles.statDivider} />
        <StatPill value={doneCount}           label="Terminées"   color="#10B981"         icon="checkmark-circle-outline" />
        {totalSpent > 0 && <>
          <View style={styles.statDivider} />
          <StatPill value={`${totalSpent}€`}  label="Dépensé"     color="#F59E0B"         icon="cash-outline" />
        </>}
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabsBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const cnt    = tab.key === 'all' ? totalCount : tab.key === 'active' ? activeCount : doneCount;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
              activeOpacity={0.75}
            >
              {active && (
                <LinearGradient
                  colors={[COLORS.primary + '20', COLORS.primary + '08']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.lg}
                />
              )}
              <Ionicons
                name={tab.icon}
                size={13}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              {cnt > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && { color: '#fff' }]}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── LISTE ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollIndicatorY } } }],
          { useNativeDriver: false }
        )}
        onContentSizeChange={(_, h) => setScrollContentH(h)}
        onLayout={(e) => setScrollContainerH(e.nativeEvent.layout.height)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSupabase(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Banner urgent livraison à valider ── */}
        {pendingValidation.length > 0 && (
          <PulsingBanner
            count={pendingValidation.length}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('PendingValidations', { orders: pendingValidation });
            }}
          />
        )}

        {filteredOrders.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          filteredOrders.map((order, i) => {
            const needsValidation = order.status === 'livre' || order.status === 'delivered';
            return (
              <View key={order.id} style={needsValidation ? styles.urgentCardWrapper : null}>
                <OrderCard
                  order={order}
                  index={i}
                  onPress={() => handleOpenOrder(order)}
                  onViewFreelancer={(fd) => fd && setProfileFreelancer(fd)}
                />
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Indicateur de scroll ── */}
      <ScrollProgressIndicator
        scrollY={scrollIndicatorY}
        contentHeight={scrollContentH}
        containerHeight={scrollContainerH}
      />
    </SafeAreaView>
  );
}

// ── PulsingBanner — livraison à valider ────────────────────────────────────────
function PulsingBanner({ count, onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ marginBottom: 12 }}>
      <Animated.View style={[styles.urgentBanner, { transform: [{ scale: pulse }] }]}>
        <LinearGradient
          colors={['#6D28D9', '#8B5CF6', '#A78BFA']}
          style={StyleSheet.absoluteFill}
          borderRadius={18}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        {/* Halo pulsant */}
        <Animated.View style={[styles.urgentGlow, { opacity: glow }]} />

        {/* Icône alerte */}
        <View style={styles.urgentIconBox}>
          <Ionicons name="alert-circle" size={22} color="#fff" />
        </View>

        {/* Texte */}
        <View style={{ flex: 1 }}>
          <Text style={styles.urgentTitle}>Action requise !</Text>
          <Text style={styles.urgentSub}>
            {count} livraison{count > 1 ? 's' : ''} en attente de ta validation
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.urgentCta}>
          <Text style={styles.urgentCtaText}>Valider</Text>
          <Ionicons name="chevron-forward" size={14} color="#fff" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function StatPill({ value, label, color, icon }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.statPillNum, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ tab }) {
  const msgs = {
    all:    { icon: 'receipt-outline',        color: COLORS.primary,   title: 'Aucune commande',          sub: 'Commande un expert depuis\nl\'onglet Experts pour commencer.' },
    active: { icon: 'flash-outline',          color: '#3B82F6',        title: 'Aucune commande en cours',  sub: 'Tes commandes actives\napparaîtront ici.' },
    done:   { icon: 'checkmark-circle-outline', color: '#10B981',      title: 'Aucune commande terminée', sub: 'Tes commandes finalisées\nseront affichées ici.' },
  };
  const m = msgs[tab] ?? msgs.all;
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconBox, { borderColor: m.color + '30', backgroundColor: m.color + '10' }]}>
        <Ionicons name={m.icon} size={34} color={m.color} />
      </View>
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptySub}>{m.sub}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000)       return 'Il y a moins d\'1h';
  if (diff < 86400000)      return `Il y a ${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000)     return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatHeaderBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '16', borderColor: COLORS.primary + '30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3, marginBottom: 6,
  },
  headerBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: COLORS.text },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  statPill: { flex: 1, alignItems: 'center', gap: 2 },
  statPillNum:   { fontSize: 18, fontWeight: '900' },
  statPillLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider:   { width: 1, height: 32, backgroundColor: COLORS.border },

  // Tabs
  tabsBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, overflow: 'hidden',
  },
  tabActive:       { borderColor: COLORS.primary + '50' },
  tabText:         { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive:   { color: COLORS.primary, fontWeight: '800' },
  tabBadge:        { backgroundColor: COLORS.bg, borderRadius: RADIUS.full, paddingHorizontal: 5, minWidth: 18, alignItems: 'center' },
  tabBadgeActive:  { backgroundColor: COLORS.primary },
  tabBadgeText:    { fontSize: 9, fontWeight: '800', color: COLORS.textMuted },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  cardIcon: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardType:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 18 },
  trackBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary + '14', borderWidth: 1, borderColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },

  // Mid row
  cardMid: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  freelancerRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  freelancerAvatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  freelancerInitial:{ fontSize: 10, fontWeight: '800' },
  freelancerName:   { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4,
  },
  statusDot:  { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '800' },

  // Delivery banner
  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#8B5CF614', borderWidth: 1, borderColor: '#8B5CF630',
    borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 7,
    marginBottom: 8,
  },
  deliveryBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  deliveryBannerText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', flex: 1 },

  // Foot
  cardFoot: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 9,
  },
  footMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footMetaText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  footRight:    { marginLeft: 'auto', alignItems: 'flex-end', gap: 3 },
  footAmount:   { fontSize: 16, fontWeight: '900' },
  trackCta: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  trackCtaText: { fontSize: 9, fontWeight: '800', color: COLORS.primary },

  // ── Urgent banner ──────────────────────────────────────────────────────────
  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 14, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  urgentGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
  },
  urgentIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  urgentTitle: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  urgentSub:   { fontSize: 11, color: 'rgba(255,255,255,0.82)', marginTop: 1 },
  urgentCta: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  urgentCtaText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // ── Halo carte urgente ──────────────────────────────────────────────────────
  urgentCardWrapper: {
    borderRadius: RADIUS.xl + 3,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 2,
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: SPACING.xl, gap: 12 },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  emptySub:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
