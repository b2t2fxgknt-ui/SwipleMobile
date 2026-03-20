import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, PanResponder,
  Animated, TouchableOpacity, StatusBar,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width } = Dimensions.get('window');
const CARD_W          = width - SPACING.lg * 2;
const SWIPE_THRESHOLD = width * 0.26;

// ── Catégories ────────────────────────────────────────────────────────────────
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
  ia_automatisation: 'IA & Auto',
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function isDirectVideo(url) {
  if (!url) return false;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return false;
  if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)) return true;
  if (url.includes('supabase.co/storage')) return true;
  return false;
}

// ── Cover (vidéo ou gradient) ─────────────────────────────────────────────────
function CoverZone({ uri, category }) {
  const accent    = CATEGORY_ACCENT[category] ?? COLORS.primary;
  const iconName  = CATEGORY_ICON[category]   ?? 'briefcase-outline';

  if (isDirectVideo(uri)) {
    return (
      <Video
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
    );
  }

  return (
    <LinearGradient
      colors={[accent + '55', accent + '22', '#13131908']}
      style={styles.coverGradient}
    >
      <View style={[styles.coverIconBox, { backgroundColor: accent + '25', borderColor: accent + '50' }]}>
        <Ionicons name={iconName} size={52} color={accent} />
      </View>
    </LinearGradient>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ service, onPress }) {
  const accent    = CATEGORY_ACCENT[service.category] ?? COLORS.primary;
  const label     = CATEGORY_LABELS[service.category] ?? service.category;
  const iconName  = CATEGORY_ICON[service.category]   ?? 'briefcase-outline';
  const initial   = service.freelancer?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.card}>

      {/* Cover */}
      <View style={styles.coverZone}>
        <CoverZone uri={service.example_video_url} category={service.category} />

        {/* Category badge */}
        <View style={[styles.catBadge, { borderColor: accent + '55', backgroundColor: COLORS.card + 'F0' }]}>
          <Ionicons name={iconName} size={12} color={accent} />
          <Text style={[styles.catBadgeText, { color: accent }]}>{label}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>

        <Text style={styles.serviceTitle} numberOfLines={2}>
          {service.title}
        </Text>

        <View style={styles.sep} />

        {/* Freelancer */}
        <View style={styles.freelancerRow}>
          {service.freelancer?.avatar_url ? (
            <Image source={{ uri: service.freelancer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: accent + '25' }]}>
              <Text style={[styles.avatarInitial, { color: accent }]}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.freelancerName}>{service.freelancer?.name ?? 'Freelance'}</Text>
            <Text style={styles.freelancerSub}>Freelance</Text>
          </View>
        </View>

        <View style={styles.sep} />

        {/* Prix + délai */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>À partir de</Text>
            <Text style={styles.priceValue}>
              {service.price}<Text style={styles.priceUnit}>€</Text>
            </Text>
          </View>
          <View style={styles.deliveryPill}>
            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.deliveryText}>{service.delivery_time}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.viewBtn, { borderColor: accent + '55', backgroundColor: accent + '14' }]}
          onPress={onPress}
          activeOpacity={0.78}
        >
          <Text style={[styles.viewBtnText, { color: accent }]}>Voir le service →</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SwipeScreen() {
  const navigation = useNavigation();

  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [toast,    setToast]    = useState(null);

  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => { fetchServices(); }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select(`
        id, title, description, price, delivery_time, category,
        example_video_url, is_active, created_at,
        freelancer:users!freelancer_id ( id, name, avatar_url )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setServices(data);
    setLoading(false);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function saveService(serviceId) {
    if (savedIds.has(serviceId)) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast('Connecte-toi pour sauvegarder 😊', false); return; }
    const { error } = await supabase
      .from('saved_services')
      .insert({ user_id: user.id, service_id: serviceId });
    if (!error) {
      setSavedIds(prev => new Set([...prev, serviceId]));
      showToast('Service sauvegardé ! ❤️', true);
    }
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  function showToast(msg, ok) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2200);
  }

  // ── Animated ────────────────────────────────────────────────────────────────
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const saveOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  // ── Swipe trigger ───────────────────────────────────────────────────────────
  const triggerSwipe = useRef(null);
  triggerSwipe.current = (direction) => {
    const toX = direction === 'right' ? width * 1.6 : -width * 1.6;

    if (direction === 'right') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (services[0]) saveService(services[0].id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.timing(position, {
      toValue: { x: toX, y: 20 },
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setServices(prev => prev.slice(1));
    });
  };

  // ── PanResponder ────────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => {
        position.setValue({ x: dx, y: dy * 0.2 });
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Tap → ouvrir détail
        if (dist < 8 && services[0]) {
          navigation.navigate('ServiceDetail', { service: services[0] });
          return;
        }
        if (dx > SWIPE_THRESHOLD)       triggerSwipe.current('right');
        else if (dx < -SWIPE_THRESHOLD) triggerSwipe.current('left');
        else Animated.spring(position, {
          toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des services…</Text>
      </View>
    );
  }

  // ── Empty ───────────────────────────────────────────────────────────────────
  if (services.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BubbleBackground variant="acheteur" />
        </View>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyIconBox}>
          <Ionicons name="sparkles-outline" size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>C'est tout pour l'instant !</Text>
        <Text style={styles.emptySub}>De nouveaux services rejoignent Swiple chaque jour.</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={fetchServices} activeOpacity={0.78}>
          <Text style={styles.resetBtnText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, {
          backgroundColor: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          borderColor:     toast.ok ? COLORS.success + '55'  : COLORS.error + '55',
        }]}>
          <Text style={[styles.toastText, { color: toast.ok ? COLORS.success : COLORS.error }]}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Swiple</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerCount}>{services.length}</Text>
            <Text style={styles.headerSub}> service{services.length > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Deck */}
      <View style={styles.deck}>
        {services.slice(0, 3).map((service, index) => {

          if (index === 0) {
            return (
              <Animated.View
                key={service.id}
                style={[styles.cardWrapper, {
                  zIndex: 30,
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate },
                  ],
                }]}
                {...panResponder.panHandlers}
              >
                <Animated.View style={[styles.saveStamp, { opacity: saveOpacity }]}>
                  <Text style={styles.saveStampText}>SAVE ❤️</Text>
                </Animated.View>
                <Animated.View style={[styles.skipStamp, { opacity: skipOpacity }]}>
                  <Text style={styles.skipStampText}>SKIP ✕</Text>
                </Animated.View>

                <ServiceCard
                  service={service}
                  onPress={() => navigation.navigate('ServiceDetail', { service })}
                />
              </Animated.View>
            );
          }

          if (index === 1) {
            return (
              <Animated.View
                key={service.id}
                style={[styles.cardWrapper, { zIndex: 20, transform: [{ scale: nextCardScale }] }]}
              >
                <ServiceCard service={service} onPress={() => {}} />
              </Animated.View>
            );
          }

          return (
            <Animated.View
              key={service.id}
              style={[styles.cardWrapper, { zIndex: 10, transform: [{ scale: 0.91 }] }]}
            >
              <ServiceCard service={service} onPress={() => {}} />
            </Animated.View>
          );
        })}
      </View>

      {/* Boutons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.passBtn]}
          onPress={() => triggerSwipe.current('left')}
          activeOpacity={0.72}
        >
          <Text style={styles.passBtnText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={() => triggerSwipe.current('right')}
          activeOpacity={0.72}
        >
          <Text style={styles.likeBtnText}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  center:         { alignItems: 'center', justifyContent: 'center' },
  loadingText:    { color: COLORS.textMuted, marginTop: 12, ...FONT.medium, fontSize: 14 },

  emptyContainer: { justifyContent: 'center', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle:     { fontSize: 22, color: COLORS.text, ...FONT.bold, textAlign: 'center' },
  emptySub:       { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  resetBtn:       { marginTop: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: 13, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  resetBtnText:   { fontSize: 14, color: '#fff', ...FONT.semibold },

  toast: {
    position: 'absolute', top: 100, alignSelf: 'center', zIndex: 9999,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  toastText: { fontSize: 14, ...FONT.semibold },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  wordmark:    { fontSize: 22, color: COLORS.text, ...FONT.extrabold, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'baseline' },
  headerCount: { fontSize: 15, color: COLORS.primary, ...FONT.bold },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, ...FONT.medium },

  deck:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrapper: { position: 'absolute', width: CARD_W },

  card: {
    width: CARD_W,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.md,
  },

  coverZone:     { height: 195, position: 'relative', overflow: 'hidden' },
  coverGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverIconBox:  {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  catBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  catBadgeText: { fontSize: 11, ...FONT.semibold },

  cardInfo: { padding: SPACING.md },
  serviceTitle: { fontSize: 17, color: COLORS.text, ...FONT.bold, lineHeight: 24 },
  sep:          { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },

  freelancerRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar:         { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 16, ...FONT.bold },
  freelancerName: { fontSize: 13, color: COLORS.text, ...FONT.semibold },
  freelancerSub:  { fontSize: 11, color: COLORS.textMuted },

  priceRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel:   { fontSize: 11, color: COLORS.textMuted, ...FONT.medium },
  priceValue:   { fontSize: 26, color: COLORS.text, ...FONT.bold },
  priceUnit:    { fontSize: 16, color: COLORS.textMuted },
  deliveryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.cardElevated, borderRadius: RADIUS.full,
  },
  deliveryText: { fontSize: 12, color: COLORS.textMuted, ...FONT.medium },

  viewBtn:     { marginTop: SPACING.sm, paddingVertical: 11, borderRadius: RADIUS.full, borderWidth: 1, alignItems: 'center' },
  viewBtnText: { fontSize: 13, ...FONT.semibold },

  saveStamp: {
    position: 'absolute', top: 22, left: 18, zIndex: 99,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.sm, borderWidth: 3, borderColor: COLORS.success,
    backgroundColor: 'rgba(34,197,94,0.15)',
    transform: [{ rotate: '-18deg' }],
  },
  saveStampText: { fontSize: 18, color: COLORS.success, ...FONT.extrabold, letterSpacing: 1.5 },

  skipStamp: {
    position: 'absolute', top: 22, right: 18, zIndex: 99,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.sm, borderWidth: 3, borderColor: COLORS.error,
    backgroundColor: 'rgba(239,68,68,0.15)',
    transform: [{ rotate: '18deg' }],
  },
  skipStampText: { fontSize: 18, color: COLORS.error, ...FONT.extrabold, letterSpacing: 1.5 },

  actions: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: SPACING.xl + 8, paddingBottom: 20, paddingTop: SPACING.sm,
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center' },
  passBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.error + '55',
  },
  passBtnText: { fontSize: 24, color: COLORS.error },
  likeBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary, ...SHADOW.md,
  },
  likeBtnText: { fontSize: 30, color: '#fff' },
});
