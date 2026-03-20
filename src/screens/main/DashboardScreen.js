import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
 StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

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

const STATUS_CONFIG = {
  pending:     { label: 'En attente', color: '#F59E0B' },
  in_progress: { label: 'En cours',   color: '#3B82F6' },
  completed:   { label: 'Terminé',    color: '#10B981' },
  cancelled:   { label: 'Annulé',     color: '#EF4444' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ iconName, num, label, color }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '35' }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={iconName} size={18} color={color} />
      </View>
      <Text style={[styles.statNum, { color }]}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OrderRow({ order, isLast }) {
  const cfg     = STATUS_CONFIG[order.status] ?? { label: order.status, color: COLORS.textMuted };
  const service = order.service ?? {};
  const client  = order.client  ?? {};

  return (
    <View style={[styles.orderRow, isLast && styles.orderRowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.orderTitle} numberOfLines={1}>{service.title ?? 'Service'}</Text>
        <Text style={styles.orderClient}>{client.name ?? 'Client'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.orderPrice}>{order.price}€</Text>
        <View style={[styles.statusBadge, {
          borderColor:     cfg.color + '40',
          backgroundColor: cfg.color + '12',
        }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const session = useSession();
  const userId  = session?.user?.id;

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats,      setStats]      = useState({ pending: 0, in_progress: 0, completed: 0, revenue: 0 });
  const [orders,     setOrders]     = useState([]);
  const [services,   setServices]   = useState([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      // Fetch recent orders received as freelancer
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, price, status, created_at,
          service:services!service_id ( id, title, category ),
          client:users!client_id ( id, name )
        `)
        .eq('freelancer_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const allOrders = ordersData ?? [];
      setOrders(allOrders);

      // Compute stats from orders
      const pending     = allOrders.filter(o => o.status === 'pending').length;
      const in_progress = allOrders.filter(o => o.status === 'in_progress').length;
      const completed   = allOrders.filter(o => o.status === 'completed').length;
      const revenue     = allOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.price ?? 0), 0);

      setStats({ pending, in_progress, completed, revenue });

      // Fetch published services
      const { data: svcData } = await supabase
        .from('services')
        .select('id, title, category, price, is_active')
        .eq('freelancer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setServices(svcData ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.prestataire} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
      </View>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Dashboard</Text>
          <Text style={styles.headerSub}>Vue freelance</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.prestataire}
          />
        }
      >

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatCard iconName="time-outline"             num={stats.pending}     label="En attente" color="#F59E0B" />
          <StatCard iconName="flash-outline"            num={stats.in_progress} label="En cours"   color="#3B82F6" />
          <StatCard iconName="checkmark-circle-outline" num={stats.completed}   label="Terminées"  color="#10B981" />
        </View>

        {/* ── Revenue card ── */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Revenus totaux</Text>
          <Text style={styles.revenueAmount}>{stats.revenue}€</Text>
          <Text style={styles.revenueHint}>
            sur {stats.completed} commande{stats.completed !== 1 ? 's' : ''} terminée{stats.completed !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* ── Recent orders ── */}
        <Text style={styles.sectionTitle}>Commandes récentes</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="mail-open-outline" size={32} color={COLORS.prestataire} />
            </View>
            <Text style={styles.emptyText}>Aucune commande pour l'instant</Text>
            <Text style={styles.emptyHint}>Publie un service pour en recevoir</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.slice(0, 10).map((o, idx) => (
              <OrderRow key={o.id} order={o} isLast={idx === Math.min(orders.length, 10) - 1} />
            ))}
          </View>
        )}

        {/* ── My services ── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>Mes services</Text>
          <TouchableOpacity
            style={styles.addServiceBtn}
            onPress={() => navigation.navigate('ServiceCreation')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={COLORS.prestataire} />
            <Text style={styles.addServiceText}>Nouvelle offre</Text>
          </TouchableOpacity>
        </View>
        {services.length > 0 && (
          <>
            <View style={styles.servicesList}>
              {services.map((s, idx) => (
                <View
                  key={s.id}
                  style={[styles.serviceRow, idx === services.length - 1 && styles.serviceRowLast]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.serviceCategory}>
                      {CATEGORY_LABELS[s.category] ?? s.category}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.servicePrice}>{s.price}€</Text>
                    <View style={[styles.activeBadge, {
                      backgroundColor: s.is_active ? '#10B98115' : '#EF444415',
                      borderColor:     s.is_active ? '#10B98140' : '#EF444440',
                    }]}>
                      <Text style={[styles.activeBadgeText, {
                        color: s.is_active ? '#10B981' : '#EF4444',
                      }]}>
                        {s.is_active ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  wordmark:  { fontSize: 22, color: COLORS.text, ...FONT.bold, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: COLORS.textMuted, ...FONT.medium },

  scroll: { padding: SPACING.lg },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg, borderWidth: 1,
    padding: SPACING.md, alignItems: 'center', gap: 4,
  },
  statIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  statNum:   { fontSize: 22, ...FONT.bold },
  statLabel: { fontSize: 10, color: COLORS.textMuted, ...FONT.medium, textAlign: 'center' },

  // Revenue
  revenueCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#10B98130',
    padding: SPACING.lg, alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  revenueLabel:  { fontSize: 13, color: COLORS.textMuted, ...FONT.medium, marginBottom: 4 },
  revenueAmount: { fontSize: 36, color: '#10B981', ...FONT.bold },
  revenueHint:   { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  sectionTitle: { fontSize: 16, color: COLORS.text, ...FONT.bold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  addServiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10B98115', borderWidth: 1, borderColor: '#10B98140',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  addServiceText: { fontSize: 12, ...FONT.semibold, color: COLORS.prestataire },

  // Empty
  emptyBlock: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyIconBox: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: COLORS.prestataire + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText:  { fontSize: 16, color: COLORS.text, ...FONT.semibold },
  emptyHint:  { fontSize: 13, color: COLORS.textMuted },

  // Orders list
  ordersList: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  orderRowLast: { borderBottomWidth: 0 },
  orderTitle:  { fontSize: 13, color: COLORS.text, ...FONT.semibold, marginBottom: 2 },
  orderClient: { fontSize: 11, color: COLORS.textMuted },
  orderPrice:  { fontSize: 14, color: COLORS.text, ...FONT.bold },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText:  { fontSize: 10, ...FONT.semibold },

  // Services list
  servicesList: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  serviceRowLast: { borderBottomWidth: 0 },
  serviceTitle:    { fontSize: 13, color: COLORS.text, ...FONT.semibold, marginBottom: 2 },
  serviceCategory: { fontSize: 11, color: COLORS.textMuted },
  servicePrice:    { fontSize: 14, color: COLORS.prestataire, ...FONT.bold },
  activeBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, borderWidth: 1 },
  activeBadgeText: { fontSize: 10, ...FONT.semibold },
});
