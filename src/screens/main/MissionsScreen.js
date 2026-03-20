/**
 * MissionsScreen.js — Swipe de missions IA (style Tinder) pour freelances.
 * Swipe droite = accepter → va instantanément dans Projets
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

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD   = width * 0.30;
const CARD_W            = width - SPACING.lg * 2;
const CARD_H            = height * 0.66;

// ── Données mock ──────────────────────────────────────────────────────────────

const MOCK_MISSIONS = [
  {
    id: 'm1', type: 'Hook', icon: 'timer-outline', color: '#EF4444',
    title: 'Refaire le hook d\'une vidéo TikTok lifestyle',
    problem: 'L\'attention est perdue dès la 2ᵉ seconde',
    description: 'Vidéo lifestyle 45s sur la routine matinale. Hook trop classique, besoin d\'un démarrage percutant qui retient dès la première image.',
    tags: ['Hook', 'TikTok', 'Lifestyle'],
    duration: '45 sec', budget: 45, difficulty: 'Facile', deadline: '48h',
    compatibility: 94, isRecommended: true,
    clientInitials: 'LM', clientName: 'Léa M.', viralScore: 42,
    dos: ['Commencer par une question provocante', 'Montrer le résultat avant le process', 'Transitions rapides'],
    donts: ['Intro musicale longue', 'Texte statique sans mouvement', 'Commencer par "Bonjour"'],
    objective: 'Hook de 2–3 secondes qui génère de la curiosité immédiate et incite à regarder la suite.',
    creator: {
      name: 'Léa Marchand', username: '@leamarchand', initials: 'LM',
      platform: 'TikTok',
      followers: '48K', avgViews: '12K', engagement: '6.2%', postFreq: '5/sem',
      niche: 'Lifestyle & Routine', style: 'Authentique, lumineux, chill',
      tags: ['Lifestyle', 'Routine', 'Bien-être'],
      objective: 'Atteindre 100K abonnés en 3 mois via du contenu quotidien engageant sur sa routine morning.',
      dos: ['Tonalité bienveillante', 'Plans rapprochés naturels', 'Musique chill ou trending'],
      donts: ['Trop de texte à l\'écran', 'Intro longue', 'Voix off'],
      collab: 0,
    },
  },
  {
    id: 'm2', type: 'Montage', icon: 'cut-outline', color: '#8B5CF6',
    title: 'Montage complet YouTube Shorts fitness',
    problem: 'Durée 78s — trop longue, rythme plat',
    description: 'Vidéo fitness à recouper à 55s. Transitions à dynamiser, rythme à fluidifier, accroches visuelles à ajouter.',
    tags: ['Montage', 'YouTube', 'Fitness'],
    duration: '78 sec', budget: 120, difficulty: 'Moyen', deadline: '72h',
    compatibility: 88, isRecommended: true,
    clientInitials: 'TR', clientName: 'Tom R.', viralScore: 58,
    dos: ['Rythme rapide et dynamique', 'Plans d\'ensemble + zoom effort', 'Chiffres/résultats visuels'],
    donts: ['Trop de parole', 'Intro musicale longue', 'Montage mou'],
    objective: 'Recouper à 55s max, dynamiser les transitions et ajouter des accroches visuelles fortes.',
    creator: {
      name: 'Tom Rousseau', username: '@tomrfit', initials: 'TR',
      platform: 'YouTube',
      followers: '92K', avgViews: '28K', engagement: '4.8%', postFreq: '3/sem',
      niche: 'Fitness & Performance', style: 'Motivant, énergique, pédago',
      tags: ['Fitness', 'Musculation', 'Nutrition'],
      objective: 'Booster l\'engagement sur les Shorts pour amener du trafic vers les longues vidéos.',
      dos: ['Rythme rapide', 'Plans d\'ensemble + zoom effort', 'Chiffres/résultats visuels'],
      donts: ['Trop de parole', 'Intro musicale longue', 'Montage mou'],
      collab: 1,
    },
  },
  {
    id: 'm3', type: 'Sous-titres', icon: 'text-outline', color: '#3B82F6',
    title: 'Sous-titres animés pour un Reel mode',
    problem: '80 % de l\'audience regarde sans son',
    description: 'Reel mode 30s, sous-titres absents. Style à créer : couleur, police, animation, synchronisation parfaite.',
    tags: ['Sous-titres', 'Instagram', 'Mode'],
    duration: '30 sec', budget: 30, difficulty: 'Facile', deadline: '24h',
    compatibility: 98, isRecommended: false,
    clientInitials: 'SK', clientName: 'Sarah K.', viralScore: 71,
    dos: ['Esthétique cohérente avec la charte', 'Sous-titres stylisés lisibles', 'Synchronisation parfaite'],
    donts: ['Couleurs trop saturées', 'Texte générique sans style', 'Son mal calé'],
    objective: 'Créer des sous-titres animés au style "mode" qui captent l\'attention même sans le son.',
    creator: {
      name: 'Sarah Khoury', username: '@sarahkstyle', initials: 'SK',
      platform: 'Reels',
      followers: '134K', avgViews: '41K', engagement: '7.4%', postFreq: '7/sem',
      niche: 'Mode & Style', style: 'Élégant, épuré, aspirationnel',
      tags: ['Mode', 'OOTD', 'Fashion'],
      objective: 'Maximiser la portée via des Reels viraux pour lancer une collab brand en septembre.',
      dos: ['Esthétique cohérente', 'Sous-titres stylisés', 'Transitions fluides'],
      donts: ['Couleurs trop saturées', 'Texte générique', 'Son mal calé'],
      collab: 2,
    },
  },
  {
    id: 'm4', type: 'Script', icon: 'document-text-outline', color: '#10B981',
    title: 'Script viral TikTok Tech — hook + narration + CTA',
    problem: 'Aucun CTA détecté — 0 % de conversion',
    description: 'Contenu tech 60s. Manque de structure narrative, hook faible, aucun appel à l\'action en fin de vidéo.',
    tags: ['Script', 'TikTok', 'Tech'],
    duration: '60 sec', budget: 80, difficulty: 'Moyen', deadline: '48h',
    compatibility: 76, isRecommended: false,
    clientInitials: 'AP', clientName: 'Alex P.', viralScore: 55,
    dos: ['Structure claire (problème → solution)', 'Hook chiffré accrocheur', 'CTA explicite en fin'],
    donts: ['Jargon technique lourd', 'Vidéo sans structure narrative', 'Pas d\'appel à l\'action'],
    objective: 'Écrire un script de 60s structuré avec hook fort, narration fluide et CTA qui convertit.',
    creator: {
      name: 'Alex Petit', username: '@alexpttech', initials: 'AP',
      platform: 'TikTok',
      followers: '21K', avgViews: '8K', engagement: '3.1%', postFreq: '4/sem',
      niche: 'Tech & Productivité', style: 'Pédagogique, structuré, efficace',
      tags: ['Tech', 'IA', 'Productivité'],
      objective: 'Passer à 50K et monétiser via des formations grâce à des vidéos avec un fort CTA.',
      dos: ['Structure claire (problème → solution)', 'Hook chiffré', 'CTA explicite'],
      donts: ['Jargon technique lourd', 'Vidéo sans structure', 'Pas d\'appel à l\'action'],
      collab: 0,
    },
  },
  {
    id: 'm5', type: 'Effets', icon: 'sparkles-outline', color: '#F59E0B',
    title: 'Effets & transitions Reels tutoriel beauté',
    problem: 'Transitions brusques — qualité perçue faible',
    description: 'Tutoriel maquillage 40s. Montage basique, aucun effet, transitions brusques. Potentiel élevé avec le bon montage.',
    tags: ['Effets', 'Instagram', 'Beauté'],
    duration: '40 sec', budget: 65, difficulty: 'Moyen', deadline: '96h',
    compatibility: 82, isRecommended: false,
    clientInitials: 'MD', clientName: 'Marie D.', viralScore: 49,
    dos: ['Étapes claires et courtes', 'Avant/après percutant', 'Ambiance lumineuse douce'],
    donts: ['Transitions brusques', 'Trop de texte à l\'écran', 'Qualité vidéo médiocre'],
    objective: 'Ajouter des effets et transitions fluides qui subliment le tutoriel et augmentent le taux de sauvegarde.',
    creator: {
      name: 'Marie Dupont', username: '@mariedbeauty', initials: 'MD',
      platform: 'Reels',
      followers: '67K', avgViews: '19K', engagement: '5.5%', postFreq: '5/sem',
      niche: 'Beauté & Maquillage', style: 'Tutoriel step-by-step, chaleureux',
      tags: ['Beauté', 'Makeup', 'Skincare'],
      objective: 'Augmenter le taux de sauvegarde des Reels tutos pour être recommandée par l\'algo Instagram.',
      dos: ['Étapes claires et courtes', 'Avant/après', 'Ambiance lumineuse'],
      donts: ['Transitions brusques', 'Trop de texte', 'Qualité vidéo médiocre'],
      collab: 3,
    },
  },
  {
    id: 'm6', type: 'Son', icon: 'musical-notes-outline', color: '#EC4899',
    title: 'Intégration son trending — vidéo voyage',
    problem: 'Aucun son trending — portée ÷3',
    description: 'Vlog voyage 50s avec son original non trending. Sélectionner et synchroniser un son viral en courbe montante.',
    tags: ['Son', 'TikTok', 'Voyage'],
    duration: '50 sec', budget: 25, difficulty: 'Facile', deadline: '24h',
    compatibility: 91, isRecommended: false,
    clientInitials: 'JB', clientName: 'Jules B.', viralScore: 63,
    dos: ['Son trending synchronisé au cut', 'Plans larges + détails immersifs', 'Émotion en cut final'],
    donts: ['Son original plat', 'Trop de texte à l\'écran', 'Cuts brusques sur la musique'],
    objective: 'Sélectionner et synchroniser un son viral en courbe montante pour décupler la portée organique.',
    creator: {
      name: 'Jules Bernard', username: '@julesbtravels', initials: 'JB',
      platform: 'TikTok',
      followers: '38K', avgViews: '15K', engagement: '8.3%', postFreq: '3/sem',
      niche: 'Voyage & Aventure', style: 'Immersif, émotionnel, authentique',
      tags: ['Voyage', 'Aventure', 'Découverte'],
      objective: 'Monétiser via des partenariats tourisme en atteignant 75K avec des vidéos à fort impact émotionnel.',
      dos: ['Son trending synchronisé', 'Plans larges + détails', 'Émotion en cut final'],
      donts: ['Son original plat', 'Trop de texte à l\'écran', 'Cuts brusques'],
      collab: 0,
    },
  },
];

const DIFF_COLOR = {
  Facile: { color: '#22C55E', bg: '#22C55E14', border: '#22C55E30' },
  Moyen:  { color: '#F59E0B', bg: '#F59E0B14', border: '#F59E0B30' },
  Expert: { color: '#EF4444', bg: '#EF444414', border: '#EF444430' },
};

// ── Carte mission ─────────────────────────────────────────────────────────────

function MissionCard({ mission }) {
  const diff = DIFF_COLOR[mission.difficulty] ?? DIFF_COLOR.Moyen;
  const compatHigh = mission.compatibility >= 90;

  return (
    <View style={styles.card}>

      {/* ── Header gradient ── */}
      <LinearGradient
        colors={[mission.color + '28', mission.color + '06']}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Type + titre + compat */}
        <View style={styles.hTop}>
          <View style={[styles.typeIconBox, { backgroundColor: mission.color + '22', borderColor: mission.color + '45' }]}>
            <Ionicons name={mission.icon} size={20} color={mission.color} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.typeLabel, { color: mission.color }]}>{mission.type.toUpperCase()}</Text>
            <Text style={styles.missionTitle} numberOfLines={1}>{mission.title}</Text>
          </View>
          <View style={styles.hBadges}>
            <View style={[styles.compatBadge, {
              backgroundColor: compatHigh ? '#22C55E18' : '#F59E0B18',
              borderColor:     compatHigh ? '#22C55E45' : '#F59E0B45',
            }]}>
              <Ionicons name="sparkles" size={9} color={compatHigh ? '#22C55E' : '#F59E0B'} />
              <Text style={[styles.compatText, { color: compatHigh ? '#22C55E' : '#F59E0B' }]}>
                {mission.compatibility}%
              </Text>
            </View>
            {mission.isRecommended && (
              <View style={styles.recoBadge}>
                <Ionicons name="ribbon" size={9} color={COLORS.prestataire} />
                <Text style={styles.recoText}>Pour toi</Text>
              </View>
            )}
          </View>
        </View>

        {/* Client + viral score */}
        <View style={styles.clientRow}>
          <View style={[styles.clientAvatar, { backgroundColor: mission.color + '28' }]}>
            <Text style={[styles.clientInitials, { color: mission.color }]}>{mission.clientInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{mission.clientName}</Text>
          </View>
          <View style={styles.viralPill}>
            <Ionicons name="analytics-outline" size={10} color={COLORS.textMuted} />
            <Text style={styles.viralText}>Score viral {mission.viralScore}/100</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Corps ── */}
      <View style={styles.cardBody}>

        {/* Méta : budget · difficulté · deadline · durée */}
        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { borderColor: '#22C55E35', backgroundColor: '#22C55E0A' }]}>
            <Ionicons name="cash-outline" size={11} color="#22C55E" />
            <Text style={[styles.metaText, { color: '#22C55E', fontWeight: '800' }]}>{mission.budget}€</Text>
          </View>
          <View style={[styles.metaChip, { borderColor: diff.border, backgroundColor: diff.bg }]}>
            <Ionicons name="bar-chart-outline" size={11} color={diff.color} />
            <Text style={[styles.metaText, { color: diff.color }]}>{mission.difficulty}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="alarm-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{mission.deadline}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="videocam-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{mission.duration}</Text>
          </View>
        </View>

        {/* Problème détecté */}
        <View style={[styles.problemBox, { borderColor: '#EF444430', backgroundColor: '#EF44440A' }]}>
          <View style={styles.problemHeader}>
            <Ionicons name="alert-circle-outline" size={11} color="#EF4444" />
            <Text style={styles.problemLabel}>PROBLÈME DÉTECTÉ PAR L'IA</Text>
          </View>
          <Text style={styles.problemText}>{mission.problem}</Text>
        </View>

        {/* Objectif */}
        <View style={[styles.objectiveBox, { borderColor: COLORS.prestataire + '30', backgroundColor: COLORS.prestataire + '08' }]}>
          <Ionicons name="trophy-outline" size={11} color={COLORS.prestataire} style={{ marginTop: 1 }} />
          <Text style={styles.objectiveText} numberOfLines={2}>{mission.objective}</Text>
        </View>

        {/* À faire / À éviter */}
        <View style={styles.dosRow}>
          <View style={styles.dosCol}>
            <View style={styles.dosColHeader}>
              <Ionicons name="checkmark-circle" size={11} color="#22C55E" />
              <Text style={styles.dosTitle}>À faire</Text>
            </View>
            {mission.dos.slice(0, 2).map((d, i) => (
              <Text key={i} style={styles.dosItem} numberOfLines={1}>· {d}</Text>
            ))}
          </View>
          <View style={styles.dosColDivider} />
          <View style={styles.dosCol}>
            <View style={styles.dosColHeader}>
              <Ionicons name="close-circle" size={11} color="#EF4444" />
              <Text style={styles.dontsTitle}>À éviter</Text>
            </View>
            {mission.donts.slice(0, 2).map((d, i) => (
              <Text key={i} style={styles.dontItem} numberOfLines={1}>· {d}</Text>
            ))}
          </View>
        </View>

      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function MissionsScreen() {
  const { acceptMission } = useMissions();
  const [deck,    setDeck]    = useState(MOCK_MISSIONS);
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

  const total    = MOCK_MISSIONS.length;
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
                ? `Tu as accepté ${accepted} mission${accepted > 1 ? 's' : ''}.\nVa dans Projets pour suivre ton travail.`
                : 'Tu as passé toutes les missions.\nNouvelles missions disponibles bientôt.'}
            </Text>

            {accepted > 0 && (
              <View style={styles.doneAcceptedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <Text style={styles.doneAcceptedText}>
                  {accepted} mission{accepted > 1 ? 's' : ''} en attente dans Projets
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => { setDeck(MOCK_MISSIONS); setPassed([]); setPhase('swiping'); }}
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
            <Text style={styles.headerTitle}>Missions IA</Text>
            <Text style={styles.headerSub}>
              {done > 0 ? `${done} sur ${total} traitées` : `${total} missions disponibles`}
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
                  <Text style={[styles.stampText, { color: '#22C55E' }]}>ACCEPTÉ</Text>
                </Animated.View>

                {/* Stamp PASSÉ */}
                <Animated.View style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}>
                  <Text style={[styles.stampText, { color: '#EF4444' }]}>PASSÉ</Text>
                </Animated.View>

                <MissionCard mission={mission} />
              </Animated.View>
            );
          }
          if (i === 1) {
            return (
              <Animated.View
                key={mission.id}
                style={[styles.cardWrapper, { zIndex: 20, transform: [{ scale: nextScale }] }]}
              >
                <MissionCard mission={mission} />
              </Animated.View>
            );
          }
          return (
            <View key={mission.id} style={[styles.cardWrapper, { zIndex: 10, transform: [{ scale: 0.87 }] }]}>
              <MissionCard mission={mission} />
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
              <Text style={styles.acceptBtnLabel}>Accepter</Text>
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
