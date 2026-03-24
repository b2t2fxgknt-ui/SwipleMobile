import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, PanResponder,
  Animated, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width, height } = Dimensions.get('window');

const SWIPE_THRESHOLD = width * 0.30;
const CARD_W          = width - SPACING.lg * 2;
const CARD_H          = height * 0.56;

import { FREELANCERS, CATEGORY_ACCENT, CATEGORY_ICON } from '../../data/freelancers';
import FreelancerProfileSheet from '../../components/ui/FreelancerProfileSheet';

// ── Composant carte ───────────────────────────────────────────────────────────

function FreelancerCard({ freelancer }) {
  const accent   = CATEGORY_ACCENT[freelancer.category] ?? COLORS.primary;
  const iconName = CATEGORY_ICON[freelancer.category]   ?? 'briefcase';

  return (
    <View style={styles.card}>

      {/* ── Cover zone ──────────────────────────────────────────────────── */}
      <View style={styles.coverZone}>
        <LinearGradient
          colors={[accent + 'EE', accent + '88', COLORS.card + 'DD']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
        />

        {/* Cercles décoratifs */}
        <View style={[styles.deco, { width: 180, height: 180, top: -50, right: -50 }]} />
        <View style={[styles.deco, { width: 100, height: 100, top: 20, left: -30 }]} />

        {/* Badges en-tête */}
        <View style={styles.coverBadges}>
          <View style={styles.levelBadge}>
            <Ionicons name="ribbon" size={10} color="#fff" />
            <Text style={styles.levelText}>{freelancer.level}</Text>
          </View>
          <View style={[styles.deliveryBadge, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
            <Ionicons name="time-outline" size={10} color={accent} />
            <Text style={[styles.deliveryText, { color: accent }]}>{freelancer.deliveryTime}</Text>
          </View>
        </View>

        {/* Avatar initiales */}
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }]}>
          <Ionicons name={iconName} size={30} color="rgba(255,255,255,0.6)" style={styles.avatarIcon} />
          <Text style={styles.avatarInitials}>{freelancer.initials}</Text>
        </View>

        {/* Aperçu avant / après */}
        <View style={styles.previewRow}>
          <View style={[styles.previewPanel, styles.previewBefore]}>
            <Text style={styles.previewLabel}>AVANT</Text>
            <Text style={styles.previewMetric}>{freelancer.before.metric}</Text>
            <Text style={styles.previewSub}>{freelancer.before.views}</Text>
          </View>
          <View style={styles.previewArrow}>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={[styles.previewPanel, styles.previewAfter, { borderColor: '#22C55E55' }]}>
            <Text style={[styles.previewLabel, { color: '#22C55E' }]}>APRÈS</Text>
            <Text style={[styles.previewMetric, { color: '#22C55E' }]}>{freelancer.after.metric}</Text>
            <Text style={styles.previewSub}>{freelancer.after.views}</Text>
          </View>
        </View>
      </View>

      {/* ── Info zone ───────────────────────────────────────────────────── */}
      <View style={styles.infoZone}>

        {/* Nom + note */}
        <View style={styles.nameRow}>
          <Text style={styles.freelancerName}>{freelancer.name}</Text>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingNum}>{freelancer.rating}</Text>
            <Text style={styles.ratingCount}>({freelancer.reviewCount})</Text>
          </View>
        </View>

        <Text style={styles.specialtyText}>{freelancer.specialty}</Text>

        {/* Compétences */}
        <View style={styles.skillsRow}>
          {freelancer.skills.slice(0, 3).map((s, i) => (
            <View key={i} style={[styles.skillChip, { borderColor: accent + '55', backgroundColor: accent + '12' }]}>
              <Text style={[styles.skillText, { color: accent }]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        <Text style={styles.bioText} numberOfLines={2}>{freelancer.bio}</Text>

        {/* Prix */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>À partir de</Text>
          <View style={[styles.priceBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
            <Text style={[styles.priceValue, { color: accent }]}>{freelancer.price}€</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function FreelanceSwipeScreen() {
  const navigation = useNavigation();
  const [deck,              setDeck]             = useState(FREELANCERS);
  const [likedIds,          setLikedIds]         = useState([]);
  const [phase,             setPhase]            = useState('swiping'); // 'swiping' | 'done'
  const [profileFreelancer, setProfileFreelancer] = useState(null);

  const position = useRef(new Animated.ValueXY()).current;

  // ── Interpolations ─────────────────────────────────────────────────────
  const rotation = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [10, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -10],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  // ── Swipe trigger ──────────────────────────────────────────────────────
  const triggerRef = useRef(null);
  triggerRef.current = useCallback((direction) => {
    const toX = direction === 'right' ? width * 1.5 : -width * 1.5;
    const topCard = deck[0];

    if (direction === 'right' && topCard) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLikedIds(prev => [...prev, topCard]);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.timing(position, {
      toValue: { x: toX, y: 30 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setDeck(prev => {
        const next = prev.slice(1);
        if (next.length === 0) setPhase('done');
        return next;
      });
    });
  }, [deck, position]);

  // ── PanResponder ───────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => {
        position.setValue({ x: dx, y: dy * 0.15 });
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD)       triggerRef.current('right');
        else if (dx < -SWIPE_THRESHOLD) triggerRef.current('left');
        else Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 6, tension: 80,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // ── Restart ────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    position.setValue({ x: 0, y: 0 });
    setDeck(FREELANCERS);
    setLikedIds([]);
    setPhase('swiping');
  }, [position]);

  // ── Phase "done" ───────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BubbleBackground variant="acheteur" />
        </View>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.doneSafe}>
          <View style={styles.doneCard}>
            <LinearGradient
              colors={['#7C3AED20', '#7C3AED05']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.xl}
            />
            <View style={styles.doneIconBox}>
              <Ionicons name="heart" size={36} color="#EF4444" />
            </View>
            <Text style={styles.doneTitle}>
              {likedIds.length > 0
                ? `${likedIds.length} talent${likedIds.length > 1 ? 's' : ''} sélectionné${likedIds.length > 1 ? 's' : ''} !`
                : 'Aucune sélection'}
            </Text>
            <Text style={styles.doneSub}>
              {likedIds.length > 0
                ? 'Retrouve tes talents favoris dans l\'onglet Explorer pour passer commande.'
                : 'Swipe droite sur les freelances qui t\'intéressent pour les sauvegarder.'}
            </Text>

            {/* Talents liked */}
            {likedIds.length > 0 && (
              <View style={styles.likedList}>
                {likedIds.map((f, i) => {
                  const accent = CATEGORY_ACCENT[f.category] ?? COLORS.primary;
                  return (
                    <View key={f.id} style={[styles.likedItem, { borderColor: accent + '35' }]}>
                      <View style={[styles.likedAvatar, { backgroundColor: accent + '20' }]}>
                        <Text style={[styles.likedInitials, { color: accent }]}>{f.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.likedName}>{f.name}</Text>
                        <Text style={styles.likedSpec}>{f.specialty}</Text>
                      </View>
                      <Text style={[styles.likedPrice, { color: accent }]}>{f.price}€</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.restartBtn} onPress={restart} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
              <Text style={styles.restartText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Phase "swiping" ────────────────────────────────────────────────────
  const visible = deck.slice(0, 3);

  return (
    <View style={styles.container}>
      <FreelancerProfileSheet
        visible={!!profileFreelancer}
        freelancer={profileFreelancer}
        onClose={() => setProfileFreelancer(null)}
        onOrder={null}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Talents</Text>
            <Text style={styles.headerSub}>{deck.length} freelances disponibles</Text>
          </View>
          {likedIds.length > 0 && (
            <View style={styles.likeCountBadge}>
              <Ionicons name="heart" size={13} color="#EF4444" />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Deck de cartes */}
      <View style={styles.deck}>
        {visible.map((freelancer, i) => {
          const isTop    = i === 0;
          const isSecond = i === 1;
          const isThird  = i === 2;

          if (isTop) {
            return (
              <Animated.View
                key={freelancer.id}
                style={[styles.cardWrapper, {
                  zIndex: 30,
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate: rotation },
                  ],
                }]}
                {...panResponder.panHandlers}
              >
                {/* Stamp INTÉRESSÉ */}
                <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
                  <Ionicons name="heart" size={18} color="#22C55E" />
                  <Text style={styles.likeStampText}>INTÉRESSÉ</Text>
                </Animated.View>

                {/* Stamp PASSER */}
                <Animated.View style={[styles.skipStamp, { opacity: skipOpacity }]}>
                  <Ionicons name="close" size={18} color="#EF4444" />
                  <Text style={styles.skipStampText}>PASSER</Text>
                </Animated.View>

                <FreelancerCard freelancer={freelancer} />
              </Animated.View>
            );
          }

          if (isSecond) {
            return (
              <Animated.View
                key={freelancer.id}
                style={[styles.cardWrapper, { zIndex: 20, transform: [{ scale: nextCardScale }] }]}
              >
                <FreelancerCard freelancer={freelancer} />
              </Animated.View>
            );
          }

          if (isThird) {
            return (
              <View key={freelancer.id} style={[styles.cardWrapper, { zIndex: 10, transform: [{ scale: 0.88 }] }]}>
                <FreelancerCard freelancer={freelancer} />
              </View>
            );
          }

          return null;
        })}
      </View>

      {/* Boutons d'action */}
      <SafeAreaView>
        <View style={styles.actions}>
          {/* Skip */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={() => triggerRef.current('left')}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={28} color="#EF4444" />
          </TouchableOpacity>

          {/* Voir profil */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => {
              if (deck[0]) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setProfileFreelancer(deck[0]);
              }
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="eye-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.viewBtnLabel}>Profil</Text>
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => triggerRef.current('right')}
            activeOpacity={0.75}
          >
            <Ionicons name="heart" size={28} color="#22C55E" />
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={styles.hintRow}>
          <Ionicons name="arrow-back" size={12} color={COLORS.textMuted} />
          <Text style={styles.hintText}>Passer</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.hintText}>Intéressé</Text>
          <Ionicons name="arrow-forward" size={12} color={COLORS.textMuted} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  headerTitle: { fontSize: 22, ...FONT.extrabold, color: COLORS.text },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  likeCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  likeCount: { fontSize: 14, ...FONT.bold, color: '#EF4444' },

  // Deck
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardWrapper: { position: 'absolute', width: CARD_W },

  // Card
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.md,
  },

  // Cover zone
  coverZone:   { height: CARD_H * 0.46, position: 'relative', overflow: 'hidden', alignItems: 'center' },
  deco: {
    position: 'absolute', borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  coverBadges: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: SPACING.md, paddingTop: SPACING.md,
    position: 'absolute', top: 0, zIndex: 2,
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.40)', borderRadius: RADIUS.full,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  levelText:    { fontSize: 10, color: '#fff', ...FONT.bold },
  deliveryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: COLORS.card,
  },
  deliveryText: { fontSize: 10, ...FONT.bold },

  // Avatar
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 48, marginBottom: 10,
    position: 'relative',
  },
  avatarIcon:     { position: 'absolute', opacity: 0.6 },
  avatarInitials: { fontSize: 22, ...FONT.extrabold, color: '#fff', letterSpacing: 1 },

  // Before/After preview
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.md,
  },
  previewPanel: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.30)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md, padding: 7, alignItems: 'center',
  },
  previewBefore: {},
  previewAfter:  { borderColor: '#22C55E55' },
  previewLabel:  { fontSize: 8, ...FONT.bold, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8, marginBottom: 2 },
  previewMetric: { fontSize: 13, ...FONT.extrabold, color: '#fff' },
  previewSub:    { fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  previewArrow:  { opacity: 0.7 },

  // Info zone
  infoZone: {
    flex: 1, padding: SPACING.md, justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 2,
  },
  freelancerName: { fontSize: 17, ...FONT.extrabold, color: COLORS.text },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingNum:  { fontSize: 12, ...FONT.bold, color: COLORS.text },
  ratingCount:{ fontSize: 11, color: COLORS.textMuted },
  specialtyText: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },

  // Skills
  skillsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 8 },
  skillChip: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  skillText: { fontSize: 10, ...FONT.semibold },

  // Bio
  bioText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginBottom: 8 },

  // Price
  priceRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel:{ fontSize: 11, color: COLORS.textMuted },
  priceBadge: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  priceValue: { fontSize: 16, ...FONT.extrabold },

  // Stamps
  likeStamp: {
    position: 'absolute', top: 28, left: 18, zIndex: 99,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.md, borderWidth: 3, borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.12)',
    transform: [{ rotate: '-14deg' }],
  },
  likeStampText: { fontSize: 16, ...FONT.extrabold, color: '#22C55E', letterSpacing: 1.5 },
  skipStamp: {
    position: 'absolute', top: 28, right: 18, zIndex: 99,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.md, borderWidth: 3, borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.12)',
    transform: [{ rotate: '14deg' }],
  },
  skipStampText: { fontSize: 16, ...FONT.extrabold, color: '#EF4444', letterSpacing: 1.5 },

  // Actions
  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  actionBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  skipBtn: {
    width: 58, height: 58,
    backgroundColor: '#EF444415',
    borderWidth: 2, borderColor: '#EF444430',
  },
  likeBtn: {
    width: 58, height: 58,
    backgroundColor: '#22C55E15',
    borderWidth: 2, borderColor: '#22C55E30',
  },
  viewBtn: {
    width: 50, height: 50,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    gap: 2,
  },
  viewBtnLabel: { fontSize: 8, color: COLORS.textMuted, ...FONT.semibold },

  // Hint bar
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm,
  },
  hintText: { fontSize: 11, color: COLORS.textMuted },

  // Done screen
  doneSafe: {
    flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg,
  },
  doneCard: {
    overflow: 'hidden',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
  },
  doneIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EF444415',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  doneTitle: { fontSize: 22, ...FONT.extrabold, color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  doneSub:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: SPACING.lg },

  likedList: { width: '100%', gap: 8, marginBottom: SPACING.lg },
  likedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.sm,
  },
  likedAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  likedInitials: { fontSize: 14, ...FONT.bold },
  likedName:     { fontSize: 13, ...FONT.semibold, color: COLORS.text },
  likedSpec:     { fontSize: 11, color: COLORS.textMuted },
  likedPrice:    { fontSize: 14, ...FONT.extrabold },

  restartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.primary + '55',
    borderRadius: RADIUS.full, backgroundColor: COLORS.primary + '12',
  },
  restartText: { fontSize: 14, ...FONT.semibold, color: COLORS.primary },
});
