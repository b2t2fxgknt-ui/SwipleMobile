/**
 * MissionsScreen.js — Swipe de briefs ghostwriting TikTok (style Tinder) pour freelances.
 * Swipe droite = candidater → va instantanément dans Projets
 * Swipe gauche = passer
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, PanResponder,
  Animated, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useMissions } from '../../lib/MissionsContext';
import { useBriefs } from '../../lib/BriefsContext';
import { useContext } from 'react';
import { SessionContext } from '../../lib/SessionContext';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD   = width * 0.30;
const CARD_W            = width - SPACING.lg * 2;
const CARD_H            = height * 0.66;

// ── Briefs ghostwriting TikTok ────────────────────────────────────────────────

const MOCK_BRIEFS = [
  {
    id: 'b1', type: 'Script + Montage', icon: 'videocam-outline', color: '#EF4444',
    title: 'Ghostwriter pour coach business féminin',
    activity: 'Coach business pour femmes entrepreneures',
    audience: 'Femmes 30-45 ans qui veulent quitter leur CDI',
    subject: 'Comment se lancer sans quitter son job',
    tone: 'Cash et bienveillant',
    platform: 'TikTok', postsPerMonth: 4,
    budget: 150, deadline: '48h',
    clientInitials: 'SC', clientName: 'Sophie C.',
  },
  {
    id: 'b2', type: 'Script seul', icon: 'document-text-outline', color: '#8B5CF6',
    title: 'Scripts TikTok pour consultant SEO',
    activity: 'Consultant SEO freelance',
    audience: 'Entrepreneurs et PME qui veulent plus de visibilité Google',
    subject: 'Les erreurs SEO qui tuent ton trafic',
    tone: 'Pédagogique et direct',
    platform: 'TikTok', postsPerMonth: 8,
    budget: 80, deadline: '24h',
    clientInitials: 'MR', clientName: 'Marc R.',
  },
  {
    id: 'b3', type: 'Script + Montage', icon: 'videocam-outline', color: '#3B82F6',
    title: 'Contenu TikTok pour thérapeute holistique',
    activity: 'Thérapeute holistique et coach bien-être',
    audience: 'Personnes 25-40 ans stressées cherchant équilibre',
    subject: 'Techniques de gestion du stress en 60 secondes',
    tone: 'Doux, apaisant, inspirant',
    platform: 'TikTok', postsPerMonth: 4,
    budget: 120, deadline: '72h',
    clientInitials: 'AL', clientName: 'Amina L.',
  },
  {
    id: 'b4', type: 'Pack mensuel', icon: 'calendar-outline', color: '#10B981',
    title: 'Pack 8 vidéos/mois pour formateur Excel',
    activity: 'Formateur Excel et productivité pour salariés',
    audience: 'Salariés 25-45 ans qui veulent progresser rapidement',
    subject: 'Raccourcis Excel que personne ne connaît',
    tone: 'Pratique, concis, surprenant',
    platform: 'TikTok + Instagram', postsPerMonth: 8,
    budget: 400, deadline: '5j',
    clientInitials: 'JT', clientName: 'Julie T.',
  },
  {
    id: 'b5', type: 'Script seul', icon: 'document-text-outline', color: '#F59E0B',
    title: 'Scripts pour avocat en droit du travail',
    activity: 'Avocat spécialisé droit du travail',
    audience: 'Salariés et cadres face à des problèmes avec leur employeur',
    subject: 'Tes droits que ton employeur espère que tu ignores',
    tone: 'Percutant et accessible',
    platform: 'TikTok', postsPerMonth: 6,
    budget: 90, deadline: '48h',
    clientInitials: 'PB', clientName: 'Pierre B.',
  },
  {
    id: 'b6', type: 'Script + Montage', icon: 'videocam-outline', color: '#EC4899',
    title: 'Ghostwriter pour nutritionniste sportive',
    activity: 'Nutritionniste diplômée spécialisée sport',
    audience: 'Sportifs amateurs 20-35 ans qui veulent optimiser leur alimentation',
    subject: 'Les aliments que tu manges qui sabotent ta récupération',
    tone: 'Énergique, scientifique mais accessible',
    platform: 'TikTok', postsPerMonth: 4,
    budget: 140, deadline: '48h',
    clientInitials: 'CR', clientName: 'Célia R.',
  },
];

const TYPE_COLOR = {
  'Script seul':      { color: '#8B5CF6', bg: '#8B5CF614', border: '#8B5CF630' },
  'Script + Montage': { color: '#EF4444', bg: '#EF444414', border: '#EF444430' },
  'Pack mensuel':     { color: '#10B981', bg: '#10B98114', border: '#10B98130' },
};

// ── Carte brief ───────────────────────────────────────────────────────────────

function BriefCard({ brief }) {
  const typeStyle = TYPE_COLOR[brief.type] ?? TYPE_COLOR['Script seul'];

  return (
    <View style={styles.card}>

      {/* ── Header gradient ── */}
      <LinearGradient
        colors={[brief.color + '28', brief.color + '06']}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Icône + titre */}
        <View style={styles.hTop}>
          <View style={[styles.typeIconBox, { backgroundColor: brief.color + '22', borderColor: brief.color + '45' }]}>
            <Ionicons name={brief.icon} size={20} color={brief.color} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.typeLabel, { color: brief.color }]}>{brief.type.toUpperCase()}</Text>
            <Text style={styles.missionTitle} numberOfLines={2}>{brief.title}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
            <Text style={[styles.typeBadgeText, { color: typeStyle.color }]}>{brief.postsPerMonth} vidéos/mois</Text>
          </View>
        </View>

        {/* Client + plateforme */}
        <View style={styles.clientRow}>
          <View style={[styles.clientAvatar, { backgroundColor: brief.color + '28' }]}>
            <Text style={[styles.clientInitials, { color: brief.color }]}>{brief.clientInitials}</Text>
          </View>
          <Text style={styles.clientName}>{brief.clientName}</Text>
          <View style={styles.platformPill}>
            <Ionicons name="logo-tiktok" size={10} color={COLORS.textMuted} />
            <Text style={styles.platformText}>{brief.platform}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Corps ── */}
      <View style={styles.cardBody}>

        {/* Budget + deadline */}
        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { borderColor: '#22C55E35', backgroundColor: '#22C55E0A' }]}>
            <Ionicons name="cash-outline" size={11} color="#22C55E" />
            <Text style={[styles.metaText, { color: '#22C55E', fontWeight: '800' }]}>{brief.budget}€</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="alarm-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{brief.deadline}</Text>
          </View>
          <View style={[styles.metaChip, { borderColor: '#F59E0B30', backgroundColor: '#F59E0B0A' }]}>
            <Ionicons name="mic-outline" size={11} color="#F59E0B" />
            <Text style={[styles.metaText, { color: '#F59E0B' }]}>{brief.tone}</Text>
          </View>
        </View>

        {/* Activité */}
        <View style={[styles.sectionBox, { borderColor: brief.color + '30', backgroundColor: brief.color + '08' }]}>
          <View style={styles.sectionBoxHeader}>
            <Ionicons name="briefcase-outline" size={11} color={brief.color} />
            <Text style={[styles.sectionBoxLabel, { color: brief.color }]}>ACTIVITÉ DU CLIENT</Text>
          </View>
          <Text style={styles.sectionBoxText}>{brief.activity}</Text>
        </View>

        {/* Audience */}
        <View style={[styles.sectionBox, { borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '08' }]}>
          <View style={styles.sectionBoxHeader}>
            <Ionicons name="people-outline" size={11} color={COLORS.primary} />
            <Text style={[styles.sectionBoxLabel, { color: COLORS.primary }]}>AUDIENCE CIBLE</Text>
          </View>
          <Text style={styles.sectionBoxText}>{brief.audience}</Text>
        </View>

        {/* Sujet */}
        <View style={[styles.sectionBox, { borderColor: COLORS.prestataire + '30', backgroundColor: COLORS.prestataire + '08' }]}>
          <View style={styles.sectionBoxHeader}>
            <Ionicons name="bulb-outline" size={11} color={COLORS.prestataire} />
            <Text style={[styles.sectionBoxLabel, { color: COLORS.prestataire }]}>SUJET À TRAITER</Text>
          </View>
          <Text style={styles.sectionBoxText} numberOfLines={2}>"{brief.subject}"</Text>
        </View>

      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function MissionsScreen() {
  const { acceptMission } = useMissions();
  const { addApplicant }  = useBriefs();
  const session           = useContext(SessionContext);
  const [deck,    setDeck]    = useState(MOCK_BRIEFS);
  const [passed,  setPassed]  = useState([]);
  const [phase,   setPhase]   = useState('swiping'); // 'swiping' | 'done'

  const position = useRef(new Animated.ValueXY()).current;

  // ── Interpolations ────────────────────────────────────────────────────
  const rotation = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });
  const acceptOpacity = position.x.interpolate({
    inputRange: [10, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -10],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nextScale = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [1, 0.93, 1],
    extrapolate: 'clamp',
  });

  // ── Swipe trigger ─────────────────────────────────────────────────────
  const triggerRef = useRef(null);
  triggerRef.current = useCallback((direction) => {
    const toX    = direction === 'right' ? width * 1.6 : -width * 1.6;
    const top    = deck[0];

    if (direction === 'right' && top) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      acceptMission(top); // → ProjetsScreen instantanément

      // Enregistrer la candidature côté client
      const meta = session?.user?.user_metadata ?? {};
      const fullName = meta.full_name ?? meta.name ?? 'Ghostwriter';
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'GW';
      addApplicant(top.id, {
        id:        session?.user?.id ?? `local_${Date.now()}`,
        initials,
        name:      fullName,
        specialty: top.type ?? 'Ghostwriting TikTok',
        rating:    5.0,
        missions:  0,
        bio:       '',
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (top) setPassed(prev => [...prev, top]);
    }

    Animated.timing(position, {
      toValue: { x: toX, y: 30 },
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setDeck(prev => {
        const next = prev.slice(1);
        if (next.length === 0) setPhase('done');
        return next;
      });
    });
  }, [deck, position, acceptMission]);

  // ── PanResponder ──────────────────────────────────────────────────────
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, { dx, dy }) => {
      position.setValue({ x: dx, y: dy * 0.1 });
    },
    onPanResponderRelease: (_, { dx }) => {
      if      (dx >  SWIPE_THRESHOLD) triggerRef.current('right');
      else if (dx < -SWIPE_THRESHOLD) triggerRef.current('left');
      else Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 6, tension: 80,
        useNativeDriver: true,
      }).start();
    },
  })).current;

  const total    = MOCK_BRIEFS.length;
  const done     = total - deck.length;
  const progress = done / total;

  // ── Écran "tout traité" ───────────────────────────────────────────────
  if (phase === 'done') {
    const accepted = total - passed.length;
    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BubbleBackground variant="prestataire" />
        </View>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.doneSafe}>
          <View style={styles.doneWrap}>
            <View style={styles.doneIconBox}>
              <Ionicons name="checkmark-done-circle-outline" size={44} color={COLORS.prestataire} />
            </View>
            <Text style={styles.doneTitle}>Feed traité !</Text>
            <Text style={styles.doneSub}>
              {accepted > 0
                ? `Tu as candidaté à ${accepted} brief${accepted > 1 ? 's' : ''}.\nVa dans Projets pour suivre tes candidatures.`
                : 'Tu as passé tous les briefs.\nNouveaux briefs disponibles bientôt.'}
            </Text>

            {accepted > 0 && (
              <View style={styles.doneAcceptedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <Text style={styles.doneAcceptedText}>
                  {accepted} candidature{accepted > 1 ? 's' : ''} en attente dans Projets
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => { setDeck(MOCK_BRIEFS); setPassed([]); setPhase('swiping'); }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.prestataire, COLORS.prestataire + 'CC']}
                style={styles.refreshBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="refresh-outline" size={16} color="#fff" />
                <Text style={styles.refreshBtnText}>Actualiser le feed</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Phase swipe ───────────────────────────────────────────────────────
  const visible = deck.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
      </View>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Briefs</Text>
            <Text style={styles.headerSub}>
              {done > 0 ? `${done} sur ${total} traités` : `${total} briefs disponibles`}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.budgetBadge}>
              <Ionicons name="cash-outline" size={12} color="#22C55E" />
              <Text style={styles.budgetText}>
                {deck.reduce((s, m) => s + m.budget, 0)}€ pot.
              </Text>
            </View>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]}>
            <LinearGradient
              colors={[COLORS.prestataire, COLORS.prestataire + 'AA']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Deck de cartes */}
      <View style={styles.deckArea}>
        {visible.map((mission, i) => {
          if (i === 0) {
            return (
              <Animated.View
                key={mission.id}
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
                {/* Stamp ACCEPTÉ */}
                <Animated.View style={[styles.stamp, styles.stampAccept, { opacity: acceptOpacity }]}>
                  <Text style={[styles.stampText, { color: '#22C55E' }]}>CANDIDATÉ</Text>
                </Animated.View>

                {/* Stamp PASSÉ */}
                <Animated.View style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}>
                  <Text style={[styles.stampText, { color: '#EF4444' }]}>PASSÉ</Text>
                </Animated.View>

                <BriefCard brief={mission} />
              </Animated.View>
            );
          }
          if (i === 1) {
            return (
              <Animated.View
                key={mission.id}
                style={[styles.cardWrapper, { zIndex: 20, transform: [{ scale: nextScale }] }]}
              >
                <BriefCard brief={mission} />
              </Animated.View>
            );
          }
          return (
            <View key={mission.id} style={[styles.cardWrapper, { zIndex: 10, transform: [{ scale: 0.87 }] }]}>
              <BriefCard brief={mission} />
            </View>
          );
        })}
      </View>

      {/* Boutons d'action */}
      <SafeAreaView>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.passBtn}
            onPress={() => triggerRef.current('left')}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={22} color="#EF4444" />
            <Text style={styles.passBtnLabel}>Passer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => triggerRef.current('right')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.acceptBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.acceptBtnLabel}>Candidater</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#22C55E12', borderWidth: 1, borderColor: '#22C55E30',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  budgetText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },

  // Progress
  progressTrack: { height: 3, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2, overflow: 'hidden' },

  // Deck
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrapper: {
    position: 'absolute',
    width: CARD_W, height: CARD_H,
  },

  // Card
  card: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, overflow: 'hidden',
    ...SHADOW.md,
  },
  cardHeader: { padding: SPACING.md, paddingBottom: 10, gap: 10 },

  // Header top row
  hTop:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIconBox:{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  typeLabel:  { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  missionTitle:{ fontSize: 14, fontWeight: '800', color: COLORS.text },
  hBadges:    { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  compatBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  compatText: { fontSize: 10, fontWeight: '800' },
  recoBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.prestataire + '18', borderWidth: 1, borderColor: COLORS.prestataire + '40', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  recoText:   { fontSize: 9, fontWeight: '800', color: COLORS.prestataire },

  // Client row
  clientRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  clientAvatar:  { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  clientInitials:{ fontSize: 10, fontWeight: '800' },
  clientName:    { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  viralPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  viralText:     { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Card body
  cardBody:     { flex: 1, padding: SPACING.md, paddingTop: 10, gap: 8 },
  metaRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  metaText:     { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  problemBox:   { borderWidth: 1, borderRadius: RADIUS.md, padding: 9, gap: 4 },
  problemHeader:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  problemLabel: { fontSize: 8, fontWeight: '800', color: '#EF4444', letterSpacing: 0.6 },
  problemText:  { fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 16 },

  objectiveBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderWidth: 1, borderRadius: RADIUS.md, padding: 9 },
  objectiveText:{ flex: 1, fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },

  dosRow:       { flexDirection: 'row', gap: 0 },
  dosColDivider:{ width: 1, backgroundColor: COLORS.border, marginVertical: 2, marginHorizontal: 8 },
  dosCol:       { flex: 1, gap: 4 },
  dosColHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  dosTitle:     { fontSize: 10, fontWeight: '800', color: '#22C55E' },
  dontsTitle:   { fontSize: 10, fontWeight: '800', color: '#EF4444' },
  dosItem:      { fontSize: 10, color: '#22C55E99', lineHeight: 14 },
  dontItem:     { fontSize: 10, color: '#EF444499', lineHeight: 14 },

  // Stamps
  stamp:        { position: 'absolute', top: 30, zIndex: 100, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 3, borderRadius: RADIUS.md },
  stampAccept:  { left: 20, borderColor: '#22C55E', transform: [{ rotate: '-15deg' }] },
  stampPass:    { right: 20, borderColor: '#EF4444', transform: [{ rotate: '15deg' }] },
  stampText:    { fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  // Actions
  actions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 4,
  },
  passBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1.5, borderColor: '#EF444445', borderRadius: RADIUS.lg, paddingVertical: 14,
    backgroundColor: '#EF44440A',
  },
  passBtnLabel:   { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  acceptBtn:      { flex: 2, borderRadius: RADIUS.lg },
  acceptBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg, overflow: 'hidden' },
  acceptBtnLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  hintRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm, paddingTop: 2 },
  hintText:       { fontSize: 11, color: COLORS.textMuted, marginHorizontal: 6 },

  // Done screen
  doneSafe: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doneWrap: { alignItems: 'center', paddingHorizontal: SPACING.xl, gap: 16 },
  doneIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  doneTitle:   { fontSize: 24, fontWeight: '900', color: COLORS.text },
  doneSub:     { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  doneAcceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#22C55E12', borderWidth: 1, borderColor: '#22C55E30', borderRadius: RADIUS.lg, padding: 12, alignSelf: 'stretch', justifyContent: 'center' },
  doneAcceptedText:   { fontSize: 13, fontWeight: '600', color: '#22C55E' },
  refreshBtn:         { alignSelf: 'stretch', borderRadius: RADIUS.lg, overflow: 'hidden' },
  refreshBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  refreshBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
});
