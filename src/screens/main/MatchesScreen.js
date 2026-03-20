import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

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

const STATUS_CONFIG = {
  pending:     { label: 'En attente', color: '#F59E0B' },
  in_progress: { label: 'En cours',   color: '#3B82F6' },
  completed:   { label: 'Terminé',    color: '#10B981' },
  cancelled:   { label: 'Annulé',     color: '#EF4444' },
};

// ── Saved service card (clients) ──────────────────────────────────────────────

function SavedServiceCard({ item, onPress, onOrder }) {
  const service      = item.service ?? item;
  const accent       = CATEGORY_ACCENT[service.category] ?? COLORS.primary;
  const freelancer   = service.freelancer ?? {};
  const name         = freelancer.name ?? 'Freelance';
  const initial      = name[0]?.toUpperCase() ?? '?';
  const deliveryTime = service.delivery_time ?? service.deliveryTime ?? '—';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.avatarBox, { backgroundColor: accent + '18' }]}>
        {freelancer.avatar_url ? (
          <Image source={{ uri: freelancer.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Text style={[styles.avatarInitial, { color: accent }]}>{initial}</Text>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={[styles.catChip, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
          <Text style={[styles.catChipText, { color: accent }]}>
            {CATEGORY_LABELS[service.category] ?? service.category}
          </Text>
        </View>
        <Text style={styles.cardName} numberOfLines={2}>{service.title}</Text>
        <Text style={styles.cardSub}>par {name}</Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.priceVal, { color: accent }]}>{service.price}€</Text>
        <Text style={styles.priceUnit}>{deliveryTime}</Text>
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: accent }]}
          onPress={onOrder}
          activeOpacity={0.78}
        >
          <Text style={styles.orderBtnText}>Commander</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Order card (freelancers) ──────────────────────────────────────────────────

function OrderCard({ order }) {
  const cfg     = STATUS_CONFIG[order.status] ?? { label: order.status, color: COLORS.textMuted };
  const service = order.service ?? {};
  const client  = order.client  ?? {};
  const accent  = CATEGORY_ACCENT[service.category] ?? COLORS.prestataire;

  return (
    <View style={styles.card}>
      <View style={[styles.avatarBox, { backgroundColor: accent + '18' }]}>
        <Ionicons name="cube-outline" size={22} color={accent} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{service.title ?? 'Service'}</Text>
        <Text style={styles.cardSub}>{client.name ?? 'Client'}</Text>
        {order.created_at && (
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.priceVal, { color: accent }]}>{order.price}€</Text>
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

export default function MatchesScreen({ role: roleProp }) {
  const navigation = useNavigation();
  const session    = useSession();
  const userId     = session?.user?.id;

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // roleProp is 'acheteur' | 'prestataire' (v1 strings from MainTabs)
  // Also supports 'client' | 'freelancer' (v2 strings) for forward compat
  const isFreelancer = roleProp === 'prestataire' || roleProp === 'freelancer';
  const accentColor  = isFreelancer ? COLORS.prestataire : COLORS.primary;
  const title        = isFreelancer ? 'Mes commandes' : 'Services sauvegardés';

  const loadItems = useCallback(async () => {
    if (!userId) return;
    try {
      if (isFreelancer) {
        // Orders received as freelancer
        const { data } = await supabase
          .from('orders')
          .select(`
            id, price, status, created_at,
            service:services!service_id ( id, title, category ),
            client:users!client_id ( id, name, avatar_url )
          `)
          .eq('freelancer_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        setItems(data ?? []);
      } else {
        // Saved (liked) services for client
        const { data } = await supabase
          .from('saved_services')
          .select(`
            id, created_at,
            service:services!service_id (
              id, title, description, price, delivery_time, category, freelancer_id,
              freelancer:users!freelancer_id ( id, name, avatar_url )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        setItems(data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, isFreelancer]);

  useEffect(() => { loadItems(); }, [loadItems]);

  function onRefresh() {
    setRefreshing(true);
    loadItems();
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant={isFreelancer ? 'prestataire' : 'acheteur'} />
      </View>
      <StatusBar barStyle="light-content" />
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {items.length > 0 && (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeNum}>{items.length}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconBox}>
            <Ionicons
              name={isFreelancer ? 'mail-open-outline' : 'bookmark-outline'}
              size={32}
              color={accentColor}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {isFreelancer ? 'Aucune commande reçue' : 'Aucun service sauvegardé'}
          </Text>
          <Text style={styles.emptySub}>
            {isFreelancer
              ? 'Publie un service pour recevoir des commandes !'
              : 'Like des services pour les retrouver ici 💜'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
        >
          {/* Hint bar */}
          <View style={[styles.hintBar, {
            borderColor:     accentColor + '30',
            backgroundColor: accentColor + '0A',
          }]}>
            <Text style={[styles.hintText, { color: accentColor }]}>
              {isFreelancer
                ? `${items.length} commande${items.length > 1 ? 's' : ''} reçue${items.length > 1 ? 's' : ''}`
                : `${items.length} service${items.length > 1 ? 's' : ''} sauvegardé${items.length > 1 ? 's' : ''} ♥`}
            </Text>
          </View>

          {isFreelancer
            ? items.map(o => <OrderCard key={o.id} order={o} />)
            : items.map(item => {
                const service = item.service ?? item;
                return (
                  <SavedServiceCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('ServiceDetail', { service })}
                    onOrder={() => navigation.navigate('Order', { service })}
                  />
                );
              })
          }
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  title:    { fontSize: 26, color: COLORS.text, ...FONT.bold },
  badge:    { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeNum: { fontSize: 13, color: '#fff', ...FONT.bold },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, padding: SPACING.xl,
  },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 22, color: COLORS.text, ...FONT.bold, textAlign: 'center' },
  emptySub:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  list: { padding: SPACING.lg, gap: SPACING.sm },
  hintBar: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10, marginBottom: SPACING.xs,
  },
  hintText: { fontSize: 13, ...FONT.medium },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
  },
  avatarBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg:     { width: 52, height: 52, borderRadius: RADIUS.md },
  avatarInitial: { fontSize: 22, ...FONT.bold },

  cardBody: { flex: 1 },
  cardName: { fontSize: 13, color: COLORS.text, ...FONT.semibold, marginBottom: 2, lineHeight: 18 },
  cardSub:  { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  orderDate:{ fontSize: 10, color: COLORS.textLight },

  catChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: RADIUS.full, borderWidth: 1, marginBottom: 4,
  },
  catChipText: { fontSize: 10, ...FONT.medium },

  cardRight: { alignItems: 'flex-end', gap: 4 },
  priceVal:  { fontSize: 16, ...FONT.bold },
  priceUnit: { fontSize: 10, color: COLORS.textMuted },

  orderBtn:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, marginTop: 2 },
  orderBtnText: { fontSize: 11, color: '#fff', ...FONT.semibold },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText:  { fontSize: 10, ...FONT.semibold },
});
