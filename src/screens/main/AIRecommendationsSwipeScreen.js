import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, PanResponder,
  Animated, TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useExpertSelection } from '../../lib/ExpertSelectionContext';
import FreelancerProfileSheet from '../../components/ui/FreelancerProfileSheet';
import { toSheetFromContextExpert } from '../../data/auditExperts';

const { width, height } = Dimensions.get('window');

const SWIPE_THRESHOLD = width * 0.28;
const CARD_W          = width - SPACING.lg * 2;

// ── Recommandations IA (données mock) ────────────────────────────────────────

const AI_RECS = [
  {
    id: '1',
    category: 'Hook',
    icon: 'timer-outline',
    color: '#EF4444',
    problem: 'Hook trop lent — action visible à 3.2 secondes',
    solution: 'Démarre par une question choc ou une stat surprenante dans les 1.5 premières secondes.',
    impact: '+28%',
    impactLabel: 'de rétention',
    difficulty: 'Facile',
    timeToApply: '10 min',
    example: '« 78 % des créateurs font cette erreur… » ou « Tu perds 500€/mois à cause de ça »',
  },
  {
    id: '2',
    category: 'Sous-titres',
    icon: 'text-outline',
    color: '#3B82F6',
    problem: 'Pas de sous-titres détectés dans ta vidéo',
    solution: 'Active l\'auto-sous-titrage dans CapCut ou TikTok Studio. Personnalise la couleur et la police.',
    impact: '+40%',
    impactLabel: 'de rétention',
    difficulty: 'Facile',
    timeToApply: '5 min',
    example: 'Les 80 % des vidéos virales ont des sous-titres animés visibles',
  },
  {
    id: '3',
    category: 'Son',
    icon: 'musical-notes-outline',
    color: '#8B5CF6',
    problem: 'Aucun son trending détecté dans ta vidéo',
    solution: 'Ajoute un son trending depuis l\'onglet « Sons » TikTok. Choisit un son en courbe montante.',
    impact: '+65%',
    impactLabel: 'de portée organique',
    difficulty: 'Facile',
    timeToApply: '2 min',
    example: 'Un son trending peut multiplier la portée ×3 à ×8',
  },
  {
    id: '4',
    category: 'Cadrage',
    icon: 'crop-outline',
    color: '#F59E0B',
    problem: 'Sujet cadré trop bas pour le format 9:16',
    solution: 'Place le sujet principal dans le tiers supérieur de l\'écran. Évite la zone UI TikTok (bas).',
    impact: '+18%',
    impactLabel: 'de watch time',
    difficulty: 'Moyen',
    timeToApply: '15 min',
    example: 'La zone [0-70%] de hauteur = zone dorée de visibilité TikTok',
  },
  {
    id: '5',
    category: 'Hashtags',
    icon: 'pricetag-outline',
    color: '#10B981',
    problem: '3 hashtags détectés — insuffisant pour la distribution',
    solution: 'Utilise 5 à 8 hashtags ciblés : 2 viraux (#viral, #fyp) + 3 de niche liés à ton sujet.',
    impact: '+22%',
    impactLabel: 'de distribution',
    difficulty: 'Facile',
    timeToApply: '3 min',
    example: '#fyp #viral + #montagevidéo #tiktokfrance #créateurcontenu',
  },
  {
    id: '6',
    category: 'Format',
    icon: 'phone-portrait-outline',
    color: '#EC4899',
    problem: 'Durée de 47 secondes — trop longue pour TikTok',
    solution: 'Recoupe à 25-35 secondes en gardant uniquement les moments à haute valeur.',
    impact: '+35%',
    impactLabel: 'de complétion',
    difficulty: 'Moyen',
    timeToApply: '20 min',
    example: 'Les vidéos TikTok les plus virales durent en moyenne 21 secondes',
  },
  {
    id: '7',
    category: 'CTA',
    icon: 'hand-left-outline',
    color: '#06B6D4',
    problem: 'Aucun appel à l\'action (CTA) détecté en fin de vidéo',
    solution: 'Ajoute une phrase CTA dans les 3 dernières secondes : « Suis pour la suite » ou « Enregistre ça ».',
    impact: '+42%',
    impactLabel: 'd\'abonnés',
    difficulty: 'Facile',
    timeToApply: '5 min',
    example: '« Partie 2 demain — suis pour ne pas rater » = +42% de follows',
  },
  {
    id: '8',
    category: 'Lumière',
    icon: 'sunny-outline',
    color: '#F97316',
    problem: 'Éclairage insuffisant — signal vidéo dégradé',
    solution: 'Filme face à une fenêtre ou utilise un ring-light. La lumière naturelle reste la meilleure source.',
    impact: '+15%',
    impactLabel: 'de qualité perçue',
    difficulty: 'Moyen',
    timeToApply: '0€ avec lumière naturelle',
    example: 'Une bonne lumière = vidéo perçue comme plus professionnelle et crédible',
  },
];

// ── Experts issus des audits (toutes vidéos confondues) ──────────────────────
// Chaque entrée = 1 expert recommandé pendant un audit, pour une vidéo précise.

const AUDIT_EXPERT_RECS = [
  // ── Audit du 23 mars · "Mon setup bureau" ────────────────────────────────
  {
    id: 'ae1', type: 'expert',
    category: 'Hook', icon: 'flash-outline', color: '#EF4444',
    solution: 'Thomas G. réécrit tes premières secondes pour maximiser la rétention.',
    expertName: 'Thomas G.', expertInitials: 'TG',
    expertSpecialty: 'Hook & Script viral',
    expertBadge: 'Top Copywriter',
    expertRating: 4.9, expertReviews: 127,
    expertPrice: 29, expertDelivery: '24h',
    expertColor: '#EF4444', expertIcon: 'flash-outline',
    expertProof: '2.1M vues en moyenne',
    expertDesc: 'Réécrit tes 3 premières secondes pour arrêter le scroll et x3 la rétention.',
    problem: 'Hook trop lent — 78 % de tes viewers quittent avant la 3ᵉ seconde.',
    videoTitle: '"Mon setup bureau"',
    auditDate: '23 mars 2026',
    impact: '+28%', impactLabel: 'de rétention',
  },
  {
    id: 'ae2', type: 'expert',
    category: 'Sous-titres', icon: 'text-outline', color: '#F59E0B',
    solution: 'Léa M. ajoute des sous-titres pro et optimise le rythme de montage.',
    expertName: 'Léa M.', expertInitials: 'LM',
    expertSpecialty: 'Montage & Sous-titres TikTok',
    expertBadge: 'Livraison 24h',
    expertRating: 4.8, expertReviews: 89,
    expertPrice: 49, expertDelivery: '24h',
    expertColor: '#F59E0B', expertIcon: 'text-outline',
    expertProof: '1.4M vues en moyenne',
    expertDesc: 'Sous-titres animés pro + rythme de coupe optimisé pour TikTok.',
    problem: 'Pas de sous-titres — 80 % de ton audience regarde sans le son.',
    videoTitle: '"Mon setup bureau"',
    auditDate: '23 mars 2026',
    impact: '+40%', impactLabel: 'de rétention',
  },
  {
    id: 'ae3', type: 'expert',
    category: 'Optimisation', icon: 'sparkles-outline', color: '#8B5CF6',
    solution: 'Noah P. prend en charge l\'intégralité de l\'optimisation de ta vidéo.',
    expertName: 'Noah P.', expertInitials: 'NP',
    expertSpecialty: 'Optimisation TikTok complète',
    expertBadge: 'Expert Swiple',
    expertRating: 5.0, expertReviews: 56,
    expertPrice: 89, expertDelivery: '48h',
    expertColor: '#8B5CF6', expertIcon: 'sparkles-outline',
    expertProof: '3.2M vues en moyenne',
    expertDesc: 'Prend en charge l\'intégralité : hook, montage, sous-titres, son trending.',
    problem: 'Hook, sous-titres, son, cadrage — tous les points critiques détectés.',
    videoTitle: '"Mon setup bureau"',
    auditDate: '23 mars 2026',
    impact: '+65%', impactLabel: 'de performance globale',
  },
  // ── Audit du 20 mars · "Routine matinale" ────────────────────────────────
  {
    id: 'ae4', type: 'expert',
    category: 'Hook', icon: 'flash-outline', color: '#EF4444',
    solution: 'Thomas G. réécrit l\'accroche pour capter l\'attention en moins d\'une seconde.',
    expertName: 'Thomas G.', expertInitials: 'TG',
    expertSpecialty: 'Hook & Script viral',
    expertBadge: 'Top Copywriter',
    expertRating: 4.9, expertReviews: 127,
    expertPrice: 29, expertDelivery: '24h',
    expertColor: '#EF4444', expertIcon: 'flash-outline',
    expertProof: '2.1M vues en moyenne',
    expertDesc: 'Réécrit tes 3 premières secondes pour arrêter le scroll et x3 la rétention.',
    problem: 'Accroche absente — les viewers quittent sans comprendre le sujet.',
    videoTitle: '"Routine matinale"',
    auditDate: '20 mars 2026',
    impact: '+31%', impactLabel: 'de rétention',
  },
  {
    id: 'ae5', type: 'expert',
    category: 'Son', icon: 'musical-notes-outline', color: '#10B981',
    solution: 'Léa M. remplace le son par un trending et synchronise les coupes.',
    expertName: 'Léa M.', expertInitials: 'LM',
    expertSpecialty: 'Montage & Sous-titres TikTok',
    expertBadge: 'Livraison 24h',
    expertRating: 4.8, expertReviews: 89,
    expertPrice: 49, expertDelivery: '24h',
    expertColor: '#10B981', expertIcon: 'musical-notes-outline',
    expertProof: '1.4M vues en moyenne',
    expertDesc: 'Son trending + coupes synchronisées pour maximiser la portée organique.',
    problem: 'Aucun son trending — portée organique limitée à ton audience actuelle.',
    videoTitle: '"Routine matinale"',
    auditDate: '20 mars 2026',
    impact: '+55%', impactLabel: 'de portée organique',
  },
];

// Deck = uniquement les experts recommandés durant les audits
const FULL_DECK = AUDIT_EXPERT_RECS;

// ── Composant carte IA ────────────────────────────────────────────────────────

function AICard({ rec, impactAnim }) {
  const impactWidth = impactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const impactNum = parseInt(rec.impact, 10);
  const barWidth = Math.min(impactNum, 100);

  return (
    <View style={styles.card}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[rec.color + '20', rec.color + '06']}
        style={styles.cardHeader}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: rec.color + '20', borderColor: rec.color + '40' }]}>
            <Ionicons name={rec.icon} size={26} color={rec.color} />
          </View>
          <View>
            <Text style={styles.categoryLabel}>CATÉGORIE</Text>
            <Text style={[styles.categoryName, { color: rec.color }]}>{rec.category}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.diffBadge, {
            backgroundColor: rec.difficulty === 'Facile' ? '#22C55E18' : '#F59E0B18',
            borderColor:     rec.difficulty === 'Facile' ? '#22C55E40' : '#F59E0B40',
          }]}>
            <Text style={[styles.diffText, {
              color: rec.difficulty === 'Facile' ? '#22C55E' : '#F59E0B',
            }]}>{rec.difficulty}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
            <Text style={styles.timeText}>{rec.timeToApply}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Corps ───────────────────────────────────────────────────────── */}
      <View style={styles.cardBody}>

        {/* Impact */}
        <View style={[styles.impactBox, { borderColor: rec.color + '30', backgroundColor: rec.color + '08' }]}>
          <Text style={styles.impactLabel}>IMPACT ESTIMÉ</Text>
          <Text style={[styles.impactNum, { color: rec.color }]}>{rec.impact}</Text>
          <Text style={styles.impactMetric}>{rec.impactLabel}</Text>
          <View style={styles.impactBarTrack}>
            <Animated.View style={[styles.impactBarFill, {
              width: impactAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${barWidth}%`],
              }),
              backgroundColor: rec.color,
            }]} />
          </View>
        </View>

        {/* Problème */}
        <View style={[styles.problemBox, { borderLeftColor: '#EF4444' }]}>
          <View style={styles.boxHeader}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
            <Text style={[styles.boxTitle, { color: '#EF4444' }]}>Problème détecté</Text>
          </View>
          <Text style={styles.boxText}>{rec.problem}</Text>
        </View>

        {/* Solution */}
        <View style={[styles.solutionBox, { borderLeftColor: '#22C55E' }]}>
          <View style={styles.boxHeader}>
            <Ionicons name="bulb-outline" size={14} color="#22C55E" />
            <Text style={[styles.boxTitle, { color: '#22C55E' }]}>Solution recommandée</Text>
          </View>
          <Text style={styles.boxText}>{rec.solution}</Text>
        </View>

        {/* Exemple */}
        <View style={styles.exampleBox}>
          <Ionicons name="sparkles-outline" size={12} color={rec.color} />
          <Text style={styles.exampleText}>{rec.example}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Composant carte Expert (depuis audit) ─────────────────────────────────────

function ExpertCard({ rec, onViewProfile }) {
  const c = rec.expertColor;
  return (
    <View style={styles.card}>

      {/* ── Hero profil ──────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[c + '30', c + '10', COLORS.card]}
        style={styles.expertHero}
      >
        {/* Badge certifié en haut */}
        <View style={styles.expertCertBadge}>
          <Ionicons name="shield-checkmark" size={11} color={c} />
          <Text style={[styles.expertCertTxt, { color: c }]}>Expert Swiple certifié</Text>
        </View>

        {/* Avatar centré grand — tappable */}
        <TouchableOpacity
          onPress={() => onViewProfile?.(rec)}
          activeOpacity={0.85}
          style={[styles.expertAvatarXl, { backgroundColor: c + '25', borderColor: c }]}
        >
          <Text style={[styles.expertInitialsXl, { color: c }]}>{rec.expertInitials}</Text>
        </TouchableOpacity>

        {/* Nom + spécialité — tappable */}
        <TouchableOpacity onPress={() => onViewProfile?.(rec)} activeOpacity={0.85}>
          <Text style={styles.expertHeroName}>{rec.expertName}</Text>
        </TouchableOpacity>
        <Text style={[styles.expertHeroSpecialty, { color: c }]}>{rec.expertSpecialty}</Text>

        {/* Note + avis + badge inline */}
        <View style={styles.expertHeroMeta}>
          <View style={styles.expertStarsRow}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name="star" size={12}
                color={i <= Math.round(rec.expertRating) ? '#F59E0B' : COLORS.border} />
            ))}
            <Text style={styles.expertRatingTxt}>{rec.expertRating}</Text>
            <Text style={styles.expertReviewsTxt}>({rec.expertReviews} avis)</Text>
          </View>
          <View style={[styles.expertBadgePill, { backgroundColor: c + '18', borderColor: c + '40' }]}>
            <Text style={[styles.expertBadgeTxt, { color: c }]}>{rec.expertBadge}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Corps ────────────────────────────────────────────────────────── */}
      <View style={styles.cardBody}>

        {/* Vidéo source — bien visible */}
        <View style={[styles.videoSourceBox, { borderColor: COLORS.primary + '35', backgroundColor: COLORS.primary + '0C' }]}>
          <View style={styles.videoSourceLeft}>
            <Ionicons name="videocam" size={15} color={COLORS.primary} />
            <View>
              <Text style={styles.videoSourceLabel}>VIDÉO AUDITÉE</Text>
              <Text style={styles.videoSourceTitle}>{rec.videoTitle}</Text>
            </View>
          </View>
          <View style={styles.videoSourceDate}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.videoSourceDateTxt}>{rec.auditDate}</Text>
          </View>
        </View>

        {/* Problème détecté */}
        <View style={[styles.problemBox, { borderLeftColor: '#EF4444' }]}>
          <View style={styles.boxHeader}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
            <Text style={[styles.boxTitle, { color: '#EF4444' }]}>Problème détecté</Text>
          </View>
          <Text style={styles.boxText}>{rec.problem}</Text>
        </View>

        {/* Ce que fait l'expert */}
        <View style={[styles.solutionBox, { borderLeftColor: c }]}>
          <View style={styles.boxHeader}>
            <Ionicons name={rec.expertIcon} size={14} color={c} />
            <Text style={[styles.boxTitle, { color: c }]}>Ce que fait {rec.expertName.split(' ')[0]}</Text>
          </View>
          <Text style={styles.boxText}>{rec.expertDesc}</Text>
        </View>

        {/* Stats : impact + tarif + délai */}
        <View style={styles.expertFooterRow}>
          <View style={[styles.expertFooterStat, { backgroundColor: c + '10', borderColor: c + '30' }]}>
            <Text style={[styles.expertFooterNum, { color: c }]}>{rec.impact}</Text>
            <Text style={styles.expertFooterLbl}>{rec.impactLabel}</Text>
          </View>
          <View style={[styles.expertFooterStat, { backgroundColor: '#22C55E10', borderColor: '#22C55E30' }]}>
            <Text style={[styles.expertFooterNum, { color: '#22C55E' }]}>{rec.expertPrice}€</Text>
            <Text style={styles.expertFooterLbl}>tarif fixe</Text>
          </View>
          <View style={[styles.expertFooterStat, { backgroundColor: COLORS.bg, borderColor: COLORS.border }]}>
            <Text style={[styles.expertFooterNum, { color: COLORS.text }]}>{rec.expertDelivery}</Text>
            <Text style={styles.expertFooterLbl}>livraison</Text>
          </View>
        </View>

      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function AIRecommendationsSwipeScreen() {
  const navigation = useNavigation();
  const { addExpert } = useExpertSelection();
  const [deck,       setDeck]       = useState(FULL_DECK);
  const [sheetExpert, setSheetExpert] = useState(null);
  const [accepted, setAccepted] = useState([]);
  const [history,  setHistory]  = useState([]);        // pour le undo
  const [phase,    setPhase]    = useState('swiping'); // 'swiping' | 'done'

  const position  = useRef(new Animated.ValueXY()).current;
  const impactAnim = useRef(new Animated.Value(0)).current;

  // Animate impact bar when deck changes
  useEffect(() => {
    impactAnim.setValue(0);
    Animated.timing(impactAnim, {
      toValue: 1,
      duration: 900,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [deck.length]);

  // ── Interpolations ─────────────────────────────────────────────────────
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
  const ignoreOpacity = position.x.interpolate({
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
    const toX    = direction === 'right' ? width * 1.5 : -width * 1.5;
    const topRec = deck[0];

    if (direction === 'right' && topRec) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAccepted(prev => [...prev, topRec]);
      addExpert({ ...topRec, source: 'optimisation' });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (topRec) setHistory(prev => [...prev, { card: topRec, direction }]);

    Animated.timing(position, {
      toValue: { x: toX, y: 20 },
      duration: 270,
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
        position.setValue({ x: dx, y: dy * 0.12 });
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

  // ── Undo last swipe ────────────────────────────────────────────────────
  const undoLast = useCallback(() => {
    if (history.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setDeck(prev => [last.card, ...prev]);
    if (last.direction === 'right') {
      setAccepted(prev => prev.filter(r => r.id !== last.card.id));
    }
    position.setValue({ x: 0, y: 0 });
    if (phase === 'done') setPhase('swiping');
  }, [history, position, phase]);

  // ── Progress ───────────────────────────────────────────────────────────
  const total    = FULL_DECK.length;
  const done     = total - deck.length;
  const progress = done / total;

  // ── Phase "done" ───────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BubbleBackground variant="acheteur" />
        </View>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.doneWrap}>

            {/* Score */}
            <View style={styles.doneScoreCard}>
              <LinearGradient
                colors={['#7C3AED20', '#7C3AED06']}
                style={StyleSheet.absoluteFill}
                borderRadius={RADIUS.xl}
              />
              <View style={styles.doneIconBox}>
                <Text style={{ fontSize: 38 }}>🚀</Text>
              </View>
              <Text style={styles.doneTitle}>
                {accepted.length >= 3
                  ? 'Experts sélectionnés !'
                  : accepted.length >= 1
                  ? `${accepted.length} expert${accepted.length > 1 ? 's' : ''} sélectionné${accepted.length > 1 ? 's' : ''}`
                  : 'Tous les experts traités'}
              </Text>
              <Text style={styles.doneSub}>
                {accepted.length >= 1
                  ? 'Délègue maintenant — tes experts prennent en charge tes vidéos sous 24–48h.'
                  : 'Tu peux relancer la sélection pour revoir les experts recommandés.'}
              </Text>

              {/* Impact global estimé */}
              {accepted.length > 0 && (
                <View style={styles.globalImpactBox}>
                  <Text style={styles.globalImpactLabel}>Impact cumulé estimé</Text>
                  <Text style={styles.globalImpactNum}>
                    +{accepted.reduce((sum, r) => sum + parseInt(r.impact, 10), 0)}%
                  </Text>
                  <Text style={styles.globalImpactSub}>de performance globale</Text>
                </View>
              )}
            </View>

            {/* Experts acceptés */}
            {accepted.length > 0 && (
              <View style={styles.acceptedList}>
                <Text style={styles.acceptedTitle}>Experts sélectionnés</Text>
                {accepted.map((rec) => (
                  <View key={rec.id} style={[styles.acceptedItem, { borderColor: rec.expertColor + '30' }]}>
                    <View style={[styles.acceptedIcon, { backgroundColor: rec.expertColor + '20', borderColor: rec.expertColor + '40', borderWidth: 1 }]}>
                      <Text style={[styles.acceptedInitials, { color: rec.expertColor }]}>{rec.expertInitials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.acceptedCategory}>{rec.expertName}</Text>
                      <Text style={styles.acceptedSolution} numberOfLines={1}>{rec.videoTitle} · {rec.auditDate}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={[styles.acceptedImpact, { color: rec.expertColor }]}>{rec.impact}</Text>
                      <Text style={[styles.acceptedSolution, { color: '#22C55E' }]}>{rec.expertPrice}€</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* CTA déléguer */}
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate('Experts')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="rocket" size={16} color="#fff" />
                <Text style={styles.ctaText}>
                  {accepted.length > 0 ? `Déléguer à ${accepted.length} expert${accepted.length > 1 ? 's' : ''}` : 'Voir les experts'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restartBtn}
              onPress={() => {
                position.setValue({ x: 0, y: 0 });
                setDeck(FULL_DECK);
                setAccepted([]);
                setHistory([]);
                setPhase('swiping');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.restartText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Phase "swiping" ────────────────────────────────────────────────────
  const visible = deck.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Experts</Text>
            <Text style={styles.headerSub}>
              {done > 0 ? `${done} sur ${total} experts traités` : `${total} experts recommandés par l'IA`}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Undo — visible dès qu'il y a un historique */}
            {history.length > 0 && (
              <TouchableOpacity
                style={styles.undoBtn}
                onPress={undoLast}
                activeOpacity={0.75}
              >
                <Ionicons name="arrow-undo" size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.auditBtn}
              onPress={() => navigation.navigate('Audit')}
              activeOpacity={0.8}
            >
              <Ionicons name="analytics-outline" size={14} color={COLORS.primary} />
              <Text style={styles.auditBtnText}>Auditer</Text>
            </TouchableOpacity>
            <View style={styles.acceptedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
              <Text style={styles.acceptedCount}>{accepted.length}</Text>
            </View>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]}>
            <LinearGradient
              colors={['#7C3AED', '#8B5CF6']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Deck de cartes */}
      <View style={styles.deck}>
        {visible.map((rec, i) => {
          const isTop    = i === 0;
          const isSecond = i === 1;

          if (isTop) {
            return (
              <Animated.View
                key={rec.id}
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
                <Animated.View style={[styles.acceptStamp, { opacity: acceptOpacity }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  <Text style={styles.acceptStampText}>ACCEPTÉ</Text>
                </Animated.View>

                {/* Stamp IGNORÉ */}
                <Animated.View style={[styles.ignoreStamp, { opacity: ignoreOpacity }]}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                  <Text style={styles.ignoreStampText}>IGNORÉ</Text>
                </Animated.View>

                <ExpertCard rec={rec} onViewProfile={e => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSheetExpert(toSheetFromContextExpert(e)); }} />
              </Animated.View>
            );
          }

          if (isSecond) {
            return (
              <Animated.View
                key={rec.id}
                style={[styles.cardWrapper, { zIndex: 20, transform: [{ scale: nextCardScale }] }]}
              >
                <ExpertCard rec={rec} onViewProfile={e => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSheetExpert(toSheetFromContextExpert(e)); }} />
              </Animated.View>
            );
          }

          return (
            <View key={rec.id} style={[styles.cardWrapper, { zIndex: 10, transform: [{ scale: 0.88 }] }]}>
              <ExpertCard rec={rec} />
            </View>
          );
        })}
      </View>

      {/* Fiche profil expert */}
      <FreelancerProfileSheet
        visible={!!sheetExpert}
        freelancer={sheetExpert}
        onClose={() => setSheetExpert(null)}
        onOrder={null}
      />

      {/* Boutons d'action */}
      <SafeAreaView edges={['left', 'right']}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: '#EF444440' }]}
            onPress={() => triggerRef.current('left')}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
            <Text style={[styles.actionBtnLabel, { color: '#EF4444' }]}>Ignorer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnFilled}
            onPress={() => triggerRef.current('right')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.actionBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionBtnFilledLabel}>Accepter</Text>
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
  headerTitle: { fontSize: 22, ...FONT.extrabold, color: COLORS.text },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  undoBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  auditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '15', borderWidth: 1, borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  auditBtnText: { fontSize: 11, ...FONT.bold, color: COLORS.primary },
  acceptedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#22C55E15', borderWidth: 1, borderColor: '#22C55E30',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  acceptedCount: { fontSize: 14, ...FONT.bold, color: '#22C55E' },

  // Progress bar
  progressTrack: {
    height: 3, backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg, borderRadius: 2,
    overflow: 'hidden', marginBottom: SPACING.xs,
  },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },

  // Deck
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: SPACING.xl },
  cardWrapper: { position: 'absolute', width: CARD_W },

  // Card
  card: {
    width: CARD_W,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.md,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, paddingBottom: SPACING.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { alignItems: 'flex-end', gap: 5 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryLabel: { fontSize: 9, ...FONT.bold, color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  categoryName:  { fontSize: 17, ...FONT.extrabold },
  diffBadge: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  diffText: { fontSize: 10, ...FONT.bold },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3,
  },
  timeText: { fontSize: 10, color: COLORS.textMuted, ...FONT.medium },

  // Card body
  cardBody: { padding: SPACING.md, gap: 10 },

  // Impact box
  impactBox: {
    alignItems: 'center', borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  impactLabel:  { fontSize: 9, ...FONT.bold, letterSpacing: 0.8, color: COLORS.textMuted, marginBottom: 4 },
  impactNum:    { fontSize: 42, ...FONT.extrabold, lineHeight: 48 },
  impactMetric: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  impactBarTrack: {
    width: '100%', height: 5, backgroundColor: COLORS.border,
    borderRadius: 3, overflow: 'hidden',
  },
  impactBarFill: { height: '100%', borderRadius: 3 },

  // Problem / Solution boxes
  problemBox: {
    borderLeftWidth: 3, paddingLeft: 10, gap: 4,
  },
  solutionBox: {
    borderLeftWidth: 3, paddingLeft: 10, gap: 4,
  },
  boxHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  boxTitle:  { fontSize: 11, ...FONT.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  boxText:   { fontSize: 13, color: COLORS.text, lineHeight: 19 },

  // Example
  exampleBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.sm,
  },
  exampleText: { flex: 1, fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 16 },

  // Stamps
  acceptStamp: {
    position: 'absolute', top: 22, left: 16, zIndex: 99,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.md, borderWidth: 3, borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.12)',
    transform: [{ rotate: '-12deg' }],
  },
  acceptStampText: { fontSize: 15, ...FONT.extrabold, color: '#22C55E', letterSpacing: 1.2 },
  ignoreStamp: {
    position: 'absolute', top: 22, right: 16, zIndex: 99,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.md, borderWidth: 3, borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.12)',
    transform: [{ rotate: '12deg' }],
  },
  ignoreStampText: { fontSize: 15, ...FONT.extrabold, color: '#EF4444', letterSpacing: 1.2 },

  // Actions
  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.lg,
    marginBottom: 6,
  },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14,
    borderWidth: 1.5, borderRadius: RADIUS.lg,
    backgroundColor: '#EF444410',
  },
  actionBtnLabel: { fontSize: 15, ...FONT.bold },
  actionBtnFilled: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden' },
  actionBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14,
  },
  actionBtnFilledLabel: { fontSize: 15, ...FONT.bold, color: '#fff' },

  // Hint
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm,
  },
  hintText: { fontSize: 11, color: COLORS.textMuted },

  // Done screen
  doneWrap: {
    flex: 1, padding: SPACING.lg, gap: SPACING.md, justifyContent: 'center',
  },
  doneScoreCard: {
    overflow: 'hidden',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
  },
  doneIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#22C55E15',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  doneTitle: { fontSize: 20, ...FONT.extrabold, color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  doneSub:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  globalImpactBox: {
    marginTop: SPACING.md, padding: SPACING.md, width: '100%',
    backgroundColor: '#22C55E10', borderWidth: 1, borderColor: '#22C55E30',
    borderRadius: RADIUS.lg, alignItems: 'center',
  },
  globalImpactLabel: { fontSize: 9, ...FONT.bold, color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  globalImpactNum:   { fontSize: 36, ...FONT.extrabold, color: '#22C55E' },
  globalImpactSub:   { fontSize: 12, color: COLORS.textMuted },

  // Accepted list
  acceptedList: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md, gap: 8,
  },
  acceptedTitle: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, marginBottom: 2 },
  acceptedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: RADIUS.md, padding: 8,
  },
  acceptedIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptedCategory: { fontSize: 12, ...FONT.bold, color: COLORS.text },
  acceptedSolution: { fontSize: 11, color: COLORS.textMuted },
  acceptedImpact:   { fontSize: 14, ...FONT.extrabold },

  // CTA
  ctaBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  ctaText: { fontSize: 15, ...FONT.extrabold, color: '#fff' },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  restartText: { fontSize: 13, color: COLORS.textMuted, ...FONT.medium },

  // Match section (done screen)
  matchSection: { gap: 10 },
  matchSectionTitle: {
    fontSize: 12, ...FONT.bold, color: COLORS.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  matchScrollContent: { gap: 10, paddingBottom: 4 },
  matchCard: {
    width: 155, borderRadius: RADIUS.lg, overflow: 'hidden',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md,
  },
  matchAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  matchAvatarText: { fontSize: 15, ...FONT.extrabold },
  matchName:   { fontSize: 13, ...FONT.bold, color: COLORS.text, marginBottom: 3 },
  matchReason: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15, marginBottom: 8 },
  matchBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  matchPrice:  { fontSize: 13, ...FONT.extrabold },
  matchRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  matchRatingText: { fontSize: 11, ...FONT.bold, color: '#F59E0B' },
  matchBtn: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingVertical: 6, alignItems: 'center',
  },
  matchBtnText: { fontSize: 11, ...FONT.bold },

  // Expert card — hero profil
  expertHero: {
    alignItems: 'center', paddingTop: SPACING.lg, paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  expertCertBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  expertCertTxt: { fontSize: 10, ...FONT.bold, letterSpacing: 0.4 },
  expertAvatarXl: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  expertInitialsXl: { fontSize: 28, ...FONT.extrabold },
  expertHeroName: { fontSize: 22, ...FONT.extrabold, color: COLORS.text, marginBottom: 2 },
  expertHeroSpecialty: { fontSize: 13, ...FONT.medium, marginBottom: SPACING.sm },
  expertHeroMeta: { alignItems: 'center', gap: 7 },
  expertStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  expertRatingTxt: { fontSize: 12, ...FONT.bold, color: '#F59E0B', marginLeft: 4 },
  expertReviewsTxt: { fontSize: 11, color: COLORS.textMuted },
  expertBadgePill: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  expertBadgeTxt: { fontSize: 10, ...FONT.bold },

  // Vidéo source
  videoSourceBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: RADIUS.md, padding: 10,
  },
  videoSourceLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  videoSourceLabel: { fontSize: 9, ...FONT.bold, color: COLORS.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  videoSourceTitle: { fontSize: 13, ...FONT.bold, color: COLORS.text },
  videoSourceDate: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  videoSourceDateTxt: { fontSize: 10, color: COLORS.textMuted },

  // Footer stats 3 colonnes
  expertFooterRow: { flexDirection: 'row', gap: 6 },
  expertFooterStat: {
    flex: 1, alignItems: 'center',
    borderWidth: 1, borderRadius: RADIUS.md, paddingVertical: 8,
  },
  expertFooterNum: { fontSize: 17, ...FONT.extrabold },
  expertFooterLbl: { fontSize: 9, color: COLORS.textMuted, ...FONT.medium, marginTop: 1 },

  // Accepted list — initials
  acceptedInitials: { fontSize: 13, ...FONT.extrabold },
});
