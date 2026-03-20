import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../../lib/theme';

const SW = Dimensions.get('window').width;

// ─── Mock data ────────────────────────────────────────────────────────────────

const NOTIFS_CLIENT = [
  {
    id: 'n1', group: 'Aujourd\'hui', read: false, category: 'livraison',
    icon: 'cube-outline', color: '#7C3AED',
    title: 'Livraison disponible',
    body: 'Marc Dubois a livré votre Hook Instagram — vérifiez la livraison.',
    time: 'Il y a 14 min',
    action: 'Voir la livraison',
  },
  {
    id: 'n2', group: 'Aujourd\'hui', read: false, category: 'messages',
    icon: 'chatbubble-outline', color: '#3B82F6',
    title: 'Nouveau message',
    body: 'Sophie Laurent : "Bonjour ! J\'ai une question sur le brief..."',
    time: 'Il y a 1h',
    action: 'Répondre',
  },
  {
    id: 'n3', group: 'Aujourd\'hui', read: true, category: 'missions',
    icon: 'rocket-outline', color: '#F59E0B',
    title: 'Mission démarrée',
    body: 'Marc Dubois a accepté et commencé votre mission Copywriting.',
    time: 'Il y a 3h',
    action: null,
  },
  {
    id: 'n4', group: 'Hier', read: true, category: 'paiements',
    icon: 'checkmark-circle-outline', color: '#22C55E',
    title: 'Paiement libéré',
    body: '89€ libérés à Léa Petit pour la mission Montage Reels.',
    time: 'Hier 18:42',
    action: null,
  },
  {
    id: 'n5', group: 'Hier', read: true, category: 'missions',
    icon: 'refresh-outline', color: '#EF4444',
    title: 'Révision terminée',
    body: 'Sophie Laurent a retouché la livraison suite à votre demande.',
    time: 'Hier 14:10',
    action: 'Voir',
  },
  {
    id: 'n6', group: 'Hier', read: true, category: 'système',
    icon: 'trending-up-outline', color: '#8B5CF6',
    title: 'Score viral en hausse',
    body: 'Votre score viral a augmenté de +12 pts suite à vos 3 dernières missions.',
    time: 'Hier 09:00',
    action: null,
  },
  {
    id: 'n7', group: 'Cette semaine', read: true, category: 'paiements',
    icon: 'shield-checkmark-outline', color: '#22C55E',
    title: 'Fonds sécurisés',
    body: 'Votre paiement de 120€ est en escrow pour la mission Thumbnail Pro.',
    time: 'Lun. 11:20',
    action: null,
  },
  {
    id: 'n8', group: 'Cette semaine', read: true, category: 'système',
    icon: 'star-outline', color: '#F59E0B',
    title: 'Nouveau freelance disponible',
    body: 'Un expert en UGC vient de rejoindre Swiple — profil correspondant à vos missions.',
    time: 'Lun. 08:30',
    action: 'Voir le profil',
  },
];

const NOTIFS_FREELANCER = [
  {
    id: 'f1', group: 'Aujourd\'hui', read: false, category: 'missions',
    icon: 'flash-outline', color: '#F59E0B',
    title: 'Nouvelle mission pour vous',
    body: 'Une mission Hook TikTok à 89€ correspond à votre profil — soyez le premier.',
    time: 'Il y a 8 min',
    action: 'Voir la mission',
  },
  {
    id: 'f2', group: 'Aujourd\'hui', read: false, category: 'messages',
    icon: 'chatbubble-outline', color: '#3B82F6',
    title: 'Message de Nicolas',
    body: 'Nicolas — CreatorPro : "Super travail ! Est-ce que vous pouvez..."',
    time: 'Il y a 45 min',
    action: 'Répondre',
  },
  {
    id: 'f3', group: 'Aujourd\'hui', read: true, category: 'paiements',
    icon: 'wallet-outline', color: '#22C55E',
    title: 'Paiement reçu',
    body: '89€ libérés sur votre solde pour la mission Copywriting Instagram.',
    time: 'Il y a 2h',
    action: null,
  },
  {
    id: 'f4', group: 'Hier', read: false, category: 'missions',
    icon: 'refresh-circle-outline', color: '#EF4444',
    title: 'Révision demandée',
    body: 'Julien B. demande une retouche sur le Montage Reels — 1 révision restante.',
    time: 'Hier 17:05',
    action: 'Voir la demande',
  },
  {
    id: 'f5', group: 'Hier', read: true, category: 'système',
    icon: 'star', color: '#F59E0B',
    title: 'Avis 5 étoiles reçu',
    body: '"Excellent travail, livraison rapide et très pro." — Emma L.',
    time: 'Hier 12:30',
    action: null,
  },
  {
    id: 'f6', group: 'Hier', read: true, category: 'système',
    icon: 'eye-outline', color: '#8B5CF6',
    title: 'Profil très consulté',
    body: 'Votre profil a été vu 48 fois aujourd\'hui — vous apparaissez en top résultats.',
    time: 'Hier 08:00',
    action: null,
  },
  {
    id: 'f7', group: 'Cette semaine', read: true, category: 'paiements',
    icon: 'card-outline', color: '#22C55E',
    title: 'Virement disponible',
    body: 'Votre solde de 247€ est disponible pour un retrait.',
    time: 'Ven. 18:00',
    action: 'Retirer',
  },
  {
    id: 'f8', group: 'Cette semaine', read: true, category: 'missions',
    icon: 'trophy-outline', color: '#F59E0B',
    title: 'Badge débloqué',
    body: 'Vous avez débloqué le badge "Hook Expert" — votre profil est mis en avant.',
    time: 'Jeu. 10:15',
    action: null,
  },
];

const CATEGORIES = [
  { key: 'tout',      label: 'Tout',      icon: 'apps-outline' },
  { key: 'missions',  label: 'Missions',  icon: 'rocket-outline' },
  { key: 'messages',  label: 'Messages',  icon: 'chatbubble-outline' },
  { key: 'paiements', label: 'Paiements', icon: 'wallet-outline' },
];

const GROUPS = ['Aujourd\'hui', 'Hier', 'Cette semaine'];

// ─── NotifItem ────────────────────────────────────────────────────────────────

function NotifItem({ notif, onRead, onAction }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(notif.read ? 0.6 : 1)).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    if (!notif.read) {
      Animated.timing(opacity, { toValue: 0.6, duration: 300, useNativeDriver: true }).start();
      onRead(notif.id);
    }
  }, [notif, onRead]);

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }]}>
      <TouchableOpacity
        style={[styles.notifCard, notif.read && styles.notifCardRead]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Unread dot */}
        {!notif.read && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View style={[styles.notifIconBox, { backgroundColor: notif.color + '18' }]}>
          <Ionicons name={notif.icon} size={20} color={notif.color} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifTopRow}>
            <Text style={[styles.notifTitle, notif.read && styles.notifTitleRead]} numberOfLines={1}>
              {notif.title}
            </Text>
            <Text style={styles.notifTime}>{notif.time}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
          {notif.action && (
            <TouchableOpacity
              style={styles.notifActionBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAction?.(notif); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.notifActionText}>{notif.action}</Text>
              <Ionicons name="chevron-forward" size={11} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation, route }) {
  const isFreelancer = route?.params?.isFreelancer ?? false;
  const rawNotifs = isFreelancer ? NOTIFS_FREELANCER : NOTIFS_CLIENT;

  const [notifs, setNotifs] = useState(rawNotifs);
  const [activeCategory, setActiveCategory] = useState('tout');
  const headerAnim = useRef(new Animated.Value(0)).current;

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = activeCategory === 'tout'
    ? notifs
    : notifs.filter(n => n.category === activeCategory);

  const markRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleScroll = useCallback(({ nativeEvent }) => {
    const y = nativeEvent.contentOffset.y;
    headerAnim.setValue(Math.min(y / 60, 1));
  }, []);

  const headerBorder = headerAnim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', COLORS.border] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View style={[styles.header, { borderBottomColor: headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </Animated.View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.key;
          const catUnread = cat.key === 'tout'
            ? unreadCount
            : notifs.filter(n => n.category === cat.key && !n.read).length;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(cat.key);
              }}
            >
              {active ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Ionicons name={cat.icon} size={13} color={active ? '#fff' : COLORS.textMuted} />
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {cat.label}
              </Text>
              {catUnread > 0 && (
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                    {catUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filtered.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          GROUPS.map(group => {
            const items = filtered.filter(n => n.group === group);
            if (items.length === 0) return null;
            return (
              <View key={group} style={styles.group}>
                <Text style={styles.groupLabel}>{group}</Text>
                {items.map(notif => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onRead={markRead}
                    onAction={() => {}}
                  />
                ))}
              </View>
            );
          })
        )}

        {/* All-read state */}
        {unreadCount === 0 && filtered.length > 0 && (
          <View style={styles.allReadBanner}>
            <Ionicons name="checkmark-done-outline" size={16} color={COLORS.success} />
            <Text style={styles.allReadText}>Tout est lu</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ category }) {
  const msgs = {
    tout:      { icon: 'notifications-off-outline', title: 'Aucune notification', sub: 'Vous êtes à jour !' },
    missions:  { icon: 'rocket-outline',            title: 'Aucune mission',      sub: 'Vos alertes missions apparaîtront ici.' },
    messages:  { icon: 'chatbubble-outline',        title: 'Aucun message',       sub: 'Vos conversations apparaîtront ici.' },
    paiements: { icon: 'wallet-outline',            title: 'Aucun paiement',      sub: 'Vos transactions apparaîtront ici.' },
  };
  const { icon, title, sub } = msgs[category] ?? msgs.tout;
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBox}>
        <Ionicons name={icon} size={32} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, ...FONT.semibold, color: COLORS.text },
  headerBadge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: { fontSize: 11, ...FONT.bold, color: '#fff' },
  markAllBtn: { width: 60, alignItems: 'flex-end' },
  markAllText: { fontSize: 13, ...FONT.medium, color: COLORS.primary },

  // Filter
  filterRow: { maxHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, overflow: 'hidden',
    position: 'relative',
  },
  filterChipActive: { borderColor: 'transparent' },
  filterLabel: { fontSize: 12, ...FONT.medium, color: COLORS.textMuted },
  filterLabelActive: { color: '#fff' },
  filterBadge: {
    backgroundColor: COLORS.border, borderRadius: RADIUS.full,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 10, ...FONT.bold, color: COLORS.textMuted },
  filterBadgeTextActive: { color: '#fff' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: SPACING.sm },

  // Group
  group: { marginBottom: SPACING.sm },
  groupLabel: {
    fontSize: 11, ...FONT.semibold, color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },

  // Notif card
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md, marginBottom: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    position: 'relative',
  },
  notifCardRead: { backgroundColor: COLORS.bg, borderColor: COLORS.border + '60' },
  unreadDot: {
    position: 'absolute', top: 14, right: 14,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notifIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  notifTitle: { fontSize: 14, ...FONT.semibold, color: COLORS.text, flex: 1 },
  notifTitleRead: { ...FONT.medium, color: COLORS.textMuted },
  notifTime: { fontSize: 11, color: COLORS.textLight, flexShrink: 0 },
  notifBody: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  notifActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 8, alignSelf: 'flex-start',
  },
  notifActionText: { fontSize: 12, ...FONT.semibold, color: COLORS.primary },

  // All read
  allReadBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: SPACING.md, marginTop: SPACING.sm,
  },
  allReadText: { fontSize: 13, color: COLORS.success, ...FONT.medium },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyIconBox: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 16, ...FONT.semibold, color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
