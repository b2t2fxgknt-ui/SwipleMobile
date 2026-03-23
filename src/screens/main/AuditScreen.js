import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,

  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import { useNavigation } from '@react-navigation/native';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { matchFreelancers, CATEGORY_ACCENT } from '../../data/freelancers';
import ShareScoreModal from '../../components/ui/ShareScoreModal';

// ── Constantes ────────────────────────────────────────────────────────────────

const ANALYSIS_STEPS = [
  { icon: 'eye-outline',              label: 'Analyse des premières secondes…'   },
  { icon: 'musical-notes-outline',    label: 'Scan de l\'audio & du rythme…'    },
  { icon: 'text-outline',             label: 'Lecture des textes & sous-titres…' },
  { icon: 'trending-up-outline',      label: 'Calcul du potentiel viral…'        },
  { icon: 'checkmark-circle-outline', label: 'Rapport personnalisé en cours…'   },
];

const STEP_DURATION = 900;

// Score par catégorie (sur 100) — enrichi avec problem + tip
const MOCK_CATEGORIES = [
  { key: 'hook',   label: 'Hook',   score: 42, icon: 'flash-outline',       problem: 'Accroche absente — les viewers quittent avant 3s',              tip: 'Commence par un résultat choc ou une question directe. Zéro intro.' },
  { key: 'son',    label: 'Son',    score: 58, icon: 'musical-note-outline', problem: 'Aucun son trending détecté — portée organique limitée',         tip: 'Choisis un son en courbe montante dans TikTok Studio → Sons → Trending.' },
  { key: 'texte',  label: 'Texte',  score: 35, icon: 'text-outline',        problem: 'Pas de sous-titres — 80% regardent sans son',                   tip: 'Active le sous-titrage auto dans CapCut en 5 min. Augmente la rétention +20%.' },
  { key: 'visuel', label: 'Visuel', score: 82, icon: 'image-outline',       problem: null,                                                            tip: 'Bonne qualité d\'image. Maintiens cet standard pour la crédibilité.' },
  { key: 'format', label: 'Format', score: 67, icon: 'crop-outline',        problem: 'Sujet cadré trop bas — masqué par les boutons TikTok',           tip: 'Zone dorée : place ton sujet entre 15% et 55% du haut de l\'écran.' },
];

// Issues style "Grammarly" : niveau + titre + explication + fix + freelance
const MOCK_ISSUES = [
  {
    level: 'critical', icon: 'timer-outline',
    title: 'Tu perds l\'attention dès les 2 premières secondes',
    stat:  '78 % des viewers quittent avant la 3ᵉ seconde',
    fix:   'Commence par une question choc ou un résultat surprenant — aucune intro, aucune présentation.',
    issueCategory: 'hook',
    freelanceType: 'Copywriter', freelanceLabel: 'Faire réécrire le hook',
  },
  {
    level: 'critical', icon: 'text-outline',
    title: '80 % de tes viewers regardent sans le son',
    stat:  'Sans sous-titres, tu perds la moitié de ton audience mobile',
    fix:   'Active l\'auto-sous-titrage dans CapCut ou TikTok Studio — 5 minutes suffisent.',
    issueCategory: 'subtitle',
    freelanceType: 'Monteur', freelanceLabel: 'Déléguer les sous-titres',
  },
  {
    level: 'warning', icon: 'volume-mute-outline',
    title: 'Ton audio ne donne pas envie de rester',
    stat:  'Aucun son trending détecté — la portée organique en souffre',
    fix:   'Ajoute un son en courbe montante depuis l\'onglet "Sons" TikTok.',
    issueCategory: 'sound',
    freelanceType: null, freelanceLabel: null,
  },
  {
    level: 'warning', icon: 'crop-outline',
    title: 'Ton sujet est masqué par l\'interface TikTok',
    stat:  'Le sujet cadré trop bas disparaît derrière les boutons d\'action',
    fix:   'Place le sujet dans le tiers supérieur de l\'écran — zone dorée 9:16.',
    issueCategory: 'framing',
    freelanceType: 'Monteur', freelanceLabel: 'Recadrer la vidéo',
  },
  {
    level: 'tip', icon: 'pricetag-outline',
    title: 'Ta vidéo n\'est pas distribuée à assez de comptes',
    stat:  '3 hashtags détectés — idéal : 5 à 8 hashtags ciblés',
    fix:   'Mixe 2 hashtags viraux (#fyp, #viral) + 3 hashtags de niche liés à ton sujet.',
    issueCategory: 'hashtags',
    freelanceType: null, freelanceLabel: null,
  },
];

// ── Diagnostic rapide ──────────────────────────────────────────────────────────
const MOCK_QUICK_DIAG = [
  { icon: 'close-circle',     type: 'critical', text: 'Hook trop lent — 78% quittent avant 3s'             },
  { icon: 'close-circle',     type: 'critical', text: 'Aucun sous-titre — 80% regardent sans son'           },
  { icon: 'alert-circle',     type: 'warning',  text: 'Audio non-trending — portée organique limitée'      },
  { icon: 'alert-circle',     type: 'warning',  text: 'Sujet masqué par les boutons TikTok'                },
  { icon: 'checkmark-circle', type: 'ok',       text: 'Qualité visuelle excellente · Format 9:16 respecté' },
];

// ── Actions concrètes numérotées ──────────────────────────────────────────────
const MOCK_ACTIONS = [
  {
    priority: 1, icon: 'flash-outline', color: '#EF4444',
    action: 'Réécris les 2 premières secondes',
    copy:   '"Personne ne t\'a dit ça sur [sujet]…"',
    impact: '+18 pts', time: '5 min',
    freelanceType: 'Copywriter',
  },
  {
    priority: 2, icon: 'text-outline', color: '#F59E0B',
    action: 'Active les sous-titres automatiques',
    copy:   'CapCut → Auto-captions → Exporter',
    impact: '+9 pts', time: '5 min',
    freelanceType: 'Monteur',
  },
  {
    priority: 3, icon: 'musical-note-outline', color: '#F59E0B',
    action: 'Remplace la musique par un son trending',
    copy:   'TikTok Studio → Sons → Trending → courbe montante',
    impact: '+7 pts', time: '2 min',
    freelanceType: null,
  },
  {
    priority: 4, icon: 'crop-outline', color: '#8B5CF6',
    action: 'Recadre ton sujet dans la zone dorée',
    copy:   'Tiers supérieur (15%–55%) — loin des boutons TikTok',
    impact: '+5 pts', time: '3 min',
    freelanceType: 'Monteur',
  },
];

// ── Rétention estimée (drop-off simulé) ───────────────────────────────────────
const RETENTION_CURVE = [
  { sec: '0s',   pct: 100, label: 'Début'            },
  { sec: '2s',   pct: 52,  label: '⚠️ Drop hook'      },
  { sec: '5s',   pct: 38,  label: ''                  },
  { sec: '10s',  pct: 28,  label: ''                  },
  { sec: '20s',  pct: 18,  label: ''                  },
  { sec: '30s',  pct: 11,  label: '↑ Moyenne : 22%'   },
  { sec: 'Fin',  pct: 7,   label: ''                  },
];

// ── Experts conversion (cartes dédiées) ──────────────────────────────────────
const CONVERSION_EXPERTS = [
  {
    id: 'cx1', name: 'Thomas G.', initials: 'TG',
    specialty: 'Hook & Script viral',
    tagline: 'Réécrit tes 3 premières secondes pour x3 la rétention',
    solves: 'Hook trop lent',
    rating: 4.9, reviews: 127, price: 29, deliveryTime: '24h',
    proof: '2.1M vues en moyenne', color: '#EF4444', icon: 'flash-outline', badge: 'Top Copywriter',
  },
  {
    id: 'cx2', name: 'Léa M.', initials: 'LM',
    specialty: 'Montage & Sous-titres TikTok',
    tagline: 'Sous-titres pro + rythme de coupe optimisé',
    solves: 'Sous-titres manquants',
    rating: 4.8, reviews: 89, price: 49, deliveryTime: '24h',
    proof: '1.4M vues en moyenne', color: '#F59E0B', icon: 'text-outline', badge: 'Livraison 24h',
  },
  {
    id: 'cx3', name: 'Noah P.', initials: 'NP',
    specialty: 'Optimisation TikTok complète',
    tagline: 'Prend en charge l\'intégralité de l\'optimisation',
    solves: 'Tous les points critiques',
    rating: 5.0, reviews: 56, price: 89, deliveryTime: '48h',
    proof: '3.2M vues en moyenne', color: '#8B5CF6', icon: 'sparkles-outline', badge: 'Expert Swiple',
  },
];

const PACK_ITEMS = [
  { icon: 'flash-outline',        label: 'Hook réécrit (0–3s)' },
  { icon: 'cut-outline',          label: 'Montage + rythme optimisé' },
  { icon: 'text-outline',         label: 'Sous-titres animés' },
  { icon: 'musical-note-outline', label: 'Son trending ajouté' },
];
const PACK_PRICE    = 60;
const PACK_ORIGINAL = 127;

const DIY_CHECKLIST = [
  { text: 'Réécrire les 2 premières secondes avec un hook choc', xp: 20, badge: 'Hook Master',     icon: 'flash-outline',        color: '#EF4444' },
  { text: 'Activer les sous-titres auto dans CapCut (5 min)',    xp: 15, badge: 'Caption King',     icon: 'text-outline',         color: '#F59E0B' },
  { text: 'Remplacer la musique par un son trending',            xp: 10, badge: 'Sound Selector',   icon: 'musical-note-outline', color: '#8B5CF6' },
  { text: 'Recadrer le sujet dans la zone dorée (15%–55%)',      xp: 8,  badge: 'Frame Pro',        icon: 'crop-outline',         color: '#3B82F6' },
  { text: 'Ajouter 5–8 hashtags ciblés',                         xp: 7,  badge: 'Reach Booster',   icon: 'pricetag-outline',     color: '#10B981' },
];
const DIY_TOTAL_XP = DIY_CHECKLIST.reduce((s, i) => s + i.xp, 0); // 60

function diyGetLevel(xp) {
  if (xp >= 60) return { n: 4, label: 'Créateur Optimisé',   icon: 'trophy',          iconColor: '#F59E0B', next: null };
  if (xp >= 35) return { n: 3, label: 'Créateur Confirmé',   icon: 'star',            iconColor: '#8B5CF6', next: 60  };
  if (xp >= 20) return { n: 2, label: 'Créateur Progressif', icon: 'flame',           iconColor: '#EF4444', next: 35  };
  return               { n: 1, label: 'Créateur Débutant',   icon: 'game-controller',  iconColor: '#3B82F6', next: 20  };
}

// ── Templates de hooks viraux ─────────────────────────────────────────────────
const MOCK_HOOKS = [
  { template: '"Personne ne t\'a dit ça sur [sujet]…"',              score: 94, type: 'Curiosité'      },
  { template: '"J\'ai fait [résultat] en [durée]. Voici comment."',  score: 91, type: 'Preuve sociale'  },
  { template: '"Arrête de faire [erreur] si tu veux [objectif]"',    score: 88, type: 'Douleur'         },
  { template: '"[Chiffre] choses que [cible] ignore encore"',        score: 85, type: 'Liste'           },
  { template: '"POV : tu découvres que [fait surprenant]"',          score: 82, type: 'Identification'  },
];

// Config niveaux
const LEVELS = {
  critical: { label: 'Critique',      color: '#EF4444', bg: '#EF444415', border: '#EF444430' },
  warning:  { label: 'Amélioration',  color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B30' },
  tip:      { label: 'Conseil',       color: '#8B5CF6', bg: '#8B5CF615', border: '#8B5CF630' },
};

function categoryColor(score) {
  if (score >= 70) return '#22C55E';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function globalColor(score) {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function globalLabel(score) {
  if (score >= 80) return 'Excellent potentiel';
  if (score >= 60) return 'Bon potentiel';
  return 'À améliorer';
}

function globalInsight(score) {
  if (score >= 80) return 'Ta vidéo a les bases pour performer — optimise le hook pour viser le Top.';
  if (score >= 60) return '2 problèmes critiques limitent ta portée. Corrections rapides disponibles.';
  if (score >= 40) return 'Hook et sous-titres coûtent 27 points — corrigibles en moins d\'1h.';
  return '3 corrections simples = +25 pts estimés. Commence par le hook.';
}

const GLOBAL_SCORE = Math.round(
  MOCK_CATEGORIES.reduce((s, c) => s + c.score, 0) / MOCK_CATEGORIES.length
);

// Simulation : score potentiel après application de toutes les corrections
const POTENTIAL_SCORE = Math.min(95, GLOBAL_SCORE + 25);

// Niveau d'optimisation actuel (% du potentiel déjà atteint)
const OPT_PCT = Math.round((GLOBAL_SCORE / POTENTIAL_SCORE) * 100);

// Badges calculés depuis les données du rapport
const AUDIT_BADGES = (() => {
  const badges = [];
  const visuel = MOCK_CATEGORIES.find(c => c.key === 'visuel');
  const format = MOCK_CATEGORIES.find(c => c.key === 'format');
  if (visuel?.score >= 75)   badges.push({ icon: 'image',         color: '#8B5CF6', label: 'Visual Master'       });
  if (format?.score >= 65)   badges.push({ icon: 'phone-portrait', color: '#EC4899', label: 'Format Pro'          });
  if (GLOBAL_SCORE >= 75)    badges.push({ icon: 'flame',          color: '#F97316', label: 'Viral Potential High' });
  else if (GLOBAL_SCORE >= 55) badges.push({ icon: 'trending-up',  color: '#F59E0B', label: 'En progression'      });
  return badges;
})();

const MATCHED_FREELANCERS = matchFreelancers(
  MOCK_ISSUES.filter(i => i.level !== 'tip').map(i => i.issueCategory),
  3,
);

// ── Composant principal ───────────────────────────────────────────────────────

export default function AuditScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [phase, setPhase]               = useState('idle');
  const [mockFile, setMockFile]         = useState(null);
  const [link, setLink]                 = useState('');
  const [stepIdx, setStepIdx]           = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedIdx,    setExpandedIdx]    = useState(null);
  const [expandedCatIdx, setExpandedCatIdx] = useState(null);
  const [showHooks,      setShowHooks]      = useState(false);
  const [showDiy,        setShowDiy]        = useState(false);
  const [diyChecked,     setDiyChecked]     = useState(DIY_CHECKLIST.map(() => false));

  // ── Rétention & viralité ─────────────────────────────────────────────────
  const [previousScore,  setPreviousScore]  = useState(null); // score avant re-test
  const [showShareModal, setShowShareModal] = useState(false);
  const [analysisCount,  setAnalysisCount]  = useState(12847); // social proof

  const progressAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim       = useRef(new Animated.Value(0)).current;
  const scoreAnim      = useRef(new Animated.Value(0)).current;
  const simulAnim      = useRef(new Animated.Value(0)).current;
  const optAnim        = useRef(new Animated.Value(0)).current;
  const catAnims       = useRef(MOCK_CATEGORIES.map(() => new Animated.Value(0))).current;
  const glowAnim       = useRef(new Animated.Value(0)).current;  // glow on high score
  const deltaAnim      = useRef(new Animated.Value(0)).current;  // banner delta re-test
  const retentionAnim  = useRef(new Animated.Value(0)).current;  // drop-off curve

  // ── Simulated file pick ───────────────────────────────────────────────────
  const handlePickFile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMockFile({ name: 'video_' + Date.now().toString(36) + '.mp4', size: '12.4 MB' });
    setLink('');
  }, []);

  const canAnalyze = mockFile || link.trim().length > 5;

  // ── Start analysis ────────────────────────────────────────────────────────
  const startAnalysis = useCallback(async () => {
    if (!canAnalyze) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('analyzing');
    setStepIdx(0);
    progressAnim.setValue(0);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: ANALYSIS_STEPS.length * STEP_DURATION + 300,
      useNativeDriver: false,
    }).start();

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, STEP_DURATION));
      setStepIdx(i + 1);
    }
    await new Promise(r => setTimeout(r, 400));
    setPhase('results');
  }, [canAnalyze, progressAnim, fadeAnim]);

  // ── Results animations ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results') return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Score count-up
    let cur = 0;
    const step = Math.ceil(GLOBAL_SCORE / 40);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, GLOBAL_SCORE);
      setDisplayScore(cur);
      if (cur >= GLOBAL_SCORE) clearInterval(iv);
    }, 30);

    // Score ring bar
    Animated.timing(scoreAnim, {
      toValue: GLOBAL_SCORE / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Simulation & optimisation bars (décalées)
    simulAnim.setValue(0);
    optAnim.setValue(0);
    Animated.timing(simulAnim, {
      toValue: 1, duration: 1000, delay: 600, useNativeDriver: false,
    }).start();
    Animated.timing(optAnim, {
      toValue: OPT_PCT / 100, duration: 900, delay: 500, useNativeDriver: false,
    }).start();

    // Category bars staggered
    catAnims.forEach((anim, i) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: MOCK_CATEGORIES[i].score / 100,
        duration: 900,
        delay: 200 + i * 100,
        useNativeDriver: false,
      }).start();
    });

    // Glow si score élevé (>= 70)
    if (GLOBAL_SCORE >= 70) {
      glowAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, delay: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Rétention drop-off curve
    retentionAnim.setValue(0);
    Animated.timing(retentionAnim, { toValue: 1, duration: 1100, delay: 400, useNativeDriver: false }).start();

    // Delta banner si re-test
    if (previousScore !== null) {
      deltaAnim.setValue(0);
      Animated.spring(deltaAnim, { toValue: 1, friction: 7, delay: 500, useNativeDriver: true }).start();
    }

    // Incrémenter le compteur social proof
    setAnalysisCount(c => c + 1);

    return () => clearInterval(iv);
  }, [phase]);

  // ── Reset (re-test : conserve le score précédent) ─────────────────────────
  const reset = useCallback((keepPrev = false) => {
    if (keepPrev) setPreviousScore(GLOBAL_SCORE);
    else          setPreviousScore(null);
    setPhase('idle');
    setMockFile(null);
    setLink('');
    setStepIdx(0);
    setDisplayScore(0);
    setExpandedIdx(null);
    setExpandedCatIdx(null);
    setShowDiy(false);
    setDiyChecked(DIY_CHECKLIST.map(() => false));
    progressAnim.setValue(0);
    scoreAnim.setValue(0);
    simulAnim.setValue(0);
    optAnim.setValue(0);
    glowAnim.setValue(0);
    deltaAnim.setValue(0);
    retentionAnim.setValue(0);
    catAnims.forEach(a => a.setValue(0));
  }, [progressAnim, scoreAnim, catAnims]);

  const toggleIssue = useCallback((i) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIdx(prev => (prev === i ? null : i));
  }, []);

  const goToExperts = useCallback(() => navigation.navigate('Experts'), [navigation]);
  const goToOffer   = useCallback(() => navigation.navigate('AuditOffer', {
    score: GLOBAL_SCORE,
    criticalCount: MOCK_ISSUES.filter(x => x.level === 'critical').length,
  }), [navigation]);

  const accentColor = globalColor(GLOBAL_SCORE);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <View style={styles.header}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            <View style={styles.headerBadge}>
              <Ionicons name="analytics" size={13} color={COLORS.primary} />
              <Text style={styles.headerBadgeText}>Grammarly for Videos</Text>
            </View>
            <Text style={styles.headerTitle}>
              {'Audit Viral IA\n'}
              <Text style={{ color: COLORS.primary }}>instantané</Text>
            </Text>
            <Text style={styles.headerSub}>
              Score · Problèmes détectés · Corrections précises
            </Text>

            {/* ── Social proof ── */}
            <View style={styles.socialProofRow}>
              <View style={styles.socialChip}>
                <Ionicons name="people" size={11} color="#22C55E" />
                <Text style={styles.socialChipText}>
                  +{analysisCount.toLocaleString('fr-FR')} vidéos analysées
                </Text>
              </View>
              <View style={styles.socialChip}>
                <Ionicons name="trending-up" size={11} color="#F59E0B" />
                <Text style={styles.socialChipText}>+67% d'amélioration moy.</Text>
              </View>
            </View>
          </View>

          {/* ══════════════ PHASE IDLE ══════════════════════════════════ */}
          {phase === 'idle' && (
            <View style={styles.section}>

              {/* Upload zone */}
              <TouchableOpacity
                style={[styles.uploadZone, mockFile && styles.uploadZoneActive]}
                onPress={handlePickFile}
                activeOpacity={0.75}
              >
                {mockFile ? (
                  <View style={styles.fileRow}>
                    <View style={styles.fileIcon}>
                      <Ionicons name="videocam" size={22} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{mockFile.name}</Text>
                      <Text style={styles.fileSize}>{mockFile.size}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setMockFile(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <LinearGradient
                      colors={['#7C3AED18', '#7C3AED05']}
                      style={StyleSheet.absoluteFill}
                      borderRadius={RADIUS.xl}
                    />
                    <View style={styles.uploadIcon}>
                      <Ionicons name="cloud-upload-outline" size={30} color={COLORS.primary} />
                    </View>
                    <Text style={styles.uploadTitle}>Déposer une vidéo</Text>
                    <Text style={styles.uploadSub}>MP4 · MOV · jusqu'à 500 MB</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerOu}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Link input */}
              <View style={styles.inputWrap}>
                <Ionicons name="link-outline" size={17} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Lien TikTok / Instagram / YouTube…"
                  placeholderTextColor={COLORS.textMuted}
                  value={link}
                  onChangeText={t => { setLink(t); setMockFile(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {link.length > 0 && (
                  <TouchableOpacity onPress={() => setLink('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Platforms */}
              <View style={styles.platforms}>
                {[
                  { name: 'logo-tiktok',    label: 'TikTok'   },
                  { name: 'logo-instagram', label: 'Instagram' },
                  { name: 'logo-youtube',   label: 'YouTube'   },
                ].map(p => (
                  <View key={p.label} style={styles.platformChip}>
                    <Ionicons name={p.name} size={13} color={COLORS.textMuted} />
                    <Text style={styles.platformLabel}>{p.label}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <TouchableOpacity onPress={startAnalysis} disabled={!canAnalyze} activeOpacity={0.85}>
                <LinearGradient
                  colors={canAnalyze ? ['#7C3AED', '#8B5CF6'] : ['#252534', '#252534']}
                  style={styles.ctaBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons
                    name="sparkles"
                    size={17}
                    color={canAnalyze ? '#fff' : COLORS.textMuted}
                  />
                  <Text style={[styles.ctaText, !canAnalyze && { color: COLORS.textMuted }]}>
                    Analyser ma vidéo
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {!canAnalyze && (
                <Text style={styles.ctaHint}>Upload une vidéo ou colle un lien</Text>
              )}

              {/* ── Quick Win card ── */}
              <View style={styles.quickWinCard}>
                <LinearGradient colors={['#EF444412', '#EF44440A']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                <View style={styles.quickWinTop}>
                  <View style={[styles.quickWinIcon, { backgroundColor: '#EF444418' }]}>
                    <Ionicons name="flash" size={14} color="#EF4444" />
                  </View>
                  <Text style={styles.quickWinLabel}>LE SAVIEZ-VOUS ?</Text>
                </View>
                <Text style={styles.quickWinText}>
                  <Text style={{ color: COLORS.text, fontWeight: '800' }}>78% des créateurs</Text>{' '}
                  perdent leur audience dans les 2 premières secondes.{'\n'}
                  L'IA détecte ton problème en 30 secondes.
                </Text>
                <View style={styles.quickWinStats}>
                  {[
                    { val: '+67%',     label: 'rétention moy.' },
                    { val: '30 sec',   label: 'pour analyser' },
                    { val: '97%',      label: 'de précision IA' },
                  ].map((s, i) => (
                    <View key={i} style={styles.quickWinStat}>
                      <Text style={[styles.quickWinStatVal, { color: COLORS.primary }]}>{s.val}</Text>
                      <Text style={styles.quickWinStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

            </View>
          )}

          {/* ══════════════ PHASE ANALYZING ═════════════════════════════ */}
          {phase === 'analyzing' && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.analyzingCard}>

                <LinearGradient
                  colors={['#7C3AED', '#8B5CF6']}
                  style={styles.analyzingIcon}
                >
                  <Ionicons name="analytics" size={28} color="#fff" />
                </LinearGradient>

                <Text style={styles.analyzingTitle}>Lecture en cours…</Text>
                <View style={styles.analyzingSourceRow}>
                  <Ionicons
                    name={mockFile ? 'videocam-outline' : 'link-outline'}
                    size={13}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.analyzingSource} numberOfLines={1}>
                    {mockFile ? mockFile.name : link}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, {
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]}>
                    <LinearGradient
                      colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  </Animated.View>
                </View>

                <View style={styles.stepsList}>
                  {ANALYSIS_STEPS.map((s, i) => {
                    const done   = i < stepIdx;
                    const active = i === stepIdx;
                    return (
                      <View key={i} style={styles.stepRow}>
                        <View style={[
                          styles.stepDot,
                          done   && styles.stepDotDone,
                          active && styles.stepDotActive,
                        ]}>
                          {done
                            ? <Ionicons name="checkmark" size={10} color="#fff" />
                            : <Ionicons name={s.icon} size={10} color={active ? COLORS.primary : COLORS.textMuted} />
                          }
                        </View>
                        <Text style={[
                          styles.stepText,
                          done   && { color: COLORS.text },
                          active && { color: COLORS.primary, fontWeight: '600' },
                        ]}>
                          {s.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ══════════════ PHASE RESULTS ════════════════════════════════ */}
          {phase === 'results' && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>

              {/* ── Banner re-test / delta score ── */}
              {previousScore !== null && (
                <Animated.View style={[
                  styles.deltaBanner,
                  { transform: [{ translateY: deltaAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }], opacity: deltaAnim },
                  GLOBAL_SCORE > previousScore
                    ? { borderColor: '#22C55E30', backgroundColor: '#22C55E0C' }
                    : { borderColor: '#F59E0B30', backgroundColor: '#F59E0B0A' },
                ]}>
                  <Ionicons
                    name={GLOBAL_SCORE > previousScore ? 'trending-up' : 'remove'}
                    size={18}
                    color={GLOBAL_SCORE > previousScore ? '#22C55E' : '#F59E0B'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deltaTitle, { color: GLOBAL_SCORE > previousScore ? '#22C55E' : '#F59E0B' }]}>
                      {GLOBAL_SCORE > previousScore
                        ? `+${GLOBAL_SCORE - previousScore} pts · Ta vidéo s'est améliorée !`
                        : `Score stable · Continue d'optimiser`}
                    </Text>
                    <Text style={styles.deltaSub}>
                      {previousScore} → <Text style={{ fontWeight: '900', color: COLORS.text }}>{GLOBAL_SCORE}</Text> / 100
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* ── WOW screen si score >= 75 ── */}
              {GLOBAL_SCORE >= 75 && (
                <View style={styles.wowBanner}>
                  <LinearGradient colors={['#22C55E18', '#22C55E06']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                  <View style={styles.wowIconBox}>
                    <Ionicons name="trending-up" size={18} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wowTitle}>Ta vidéo peut exploser !</Text>
                    <Text style={styles.wowSub}>Score élevé · Applique les corrections pour viser le top</Text>
                  </View>
                </View>
              )}

              {/* ── Score global ──────────────────────────────────────── */}
              <View style={styles.scoreCard}>
                <LinearGradient
                  colors={[accentColor + '20', accentColor + '05']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.xl}
                />
                {/* Glow haute performance */}
                {GLOBAL_SCORE >= 70 && (
                  <Animated.View style={[
                    styles.scoreGlow,
                    { backgroundColor: accentColor + '20', opacity: glowAnim },
                  ]} />
                )}

                {/* Ring (simulé avec bordures) */}
                <View style={[styles.scoreRing, { borderColor: accentColor + '30' }]}>
                  <View style={[styles.scoreRingInner, { borderColor: accentColor }]}>
                    <Text style={[styles.scoreNum, { color: accentColor }]}>{displayScore}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                  </View>
                </View>

                <Text style={[styles.scoreLabel, { color: accentColor }]}>
                  {globalLabel(GLOBAL_SCORE)}
                </Text>

                {/* Insight phrase */}
                <View style={styles.scoreInsightRow}>
                  <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.scoreInsightText}>{globalInsight(GLOBAL_SCORE)}</Text>
                </View>

                {/* Bar sous le ring */}
                <View style={styles.scoreBarTrack}>
                  <Animated.View style={[styles.scoreBarFill, {
                    width: scoreAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: accentColor,
                  }]} />
                </View>
                <View style={styles.scoreBarLegend}>
                  <Text style={styles.legendTxt}>Faible</Text>
                  <Text style={styles.legendTxt}>Viral</Text>
                </View>
              </View>

              {/* ── Badges ────────────────────────────────────────────── */}
              {AUDIT_BADGES.length > 0 && (
                <View style={styles.badgeRow}>
                  {AUDIT_BADGES.map((b, i) => (
                    <View key={i} style={[styles.badge, { backgroundColor: b.color + '15', borderColor: b.color + '35' }]}>
                      <Ionicons name={b.icon} size={12} color={b.color} />
                      <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Diagnostic rapide ─────────────────────────────────── */}
              <View style={styles.diagCard}>
                <View style={styles.diagHeader}>
                  <Ionicons name="scan-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.diagHeaderText}>DIAGNOSTIC RAPIDE</Text>
                </View>
                {MOCK_QUICK_DIAG.map((d, i) => {
                  const color = d.type === 'critical' ? '#EF4444' : d.type === 'warning' ? '#F59E0B' : '#22C55E';
                  return (
                    <View key={i} style={[styles.diagRow, { borderLeftColor: color }]}>
                      <Ionicons name={d.icon} size={14} color={color} />
                      <Text style={styles.diagText}>{d.text}</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Simulation de viralité ────────────────────────────── */}
              <View style={styles.simulCard}>
                <LinearGradient
                  colors={['#7C3AED18', '#7C3AED05']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.xl}
                />
                <View style={styles.simulHeader}>
                  <View style={styles.simulBadge}>
                    <Ionicons name="sparkles" size={11} color={COLORS.primary} />
                    <Text style={styles.simulBadgeText}>Simulation de viralité</Text>
                  </View>
                  <Text style={styles.simulTitle}>Et si tu appliquais tout ?</Text>
                </View>
                <View style={styles.simulRow}>
                  {/* Score actuel */}
                  <View style={styles.simulSide}>
                    <Text style={styles.simulSideLabel}>MAINTENANT</Text>
                    <Text style={[styles.simulScore, { color: globalColor(GLOBAL_SCORE) }]}>
                      {GLOBAL_SCORE}
                    </Text>
                    <View style={styles.simulBarTrack}>
                      <View style={[styles.simulBarFill, {
                        width: `${GLOBAL_SCORE}%`,
                        backgroundColor: globalColor(GLOBAL_SCORE),
                      }]} />
                    </View>
                  </View>

                  <View style={styles.simulArrow}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} />
                  </View>

                  {/* Score potentiel */}
                  <View style={styles.simulSide}>
                    <Text style={styles.simulSideLabel}>POTENTIEL</Text>
                    <Text style={[styles.simulScore, { color: '#22C55E' }]}>
                      {POTENTIAL_SCORE}
                    </Text>
                    <View style={styles.simulBarTrack}>
                      <Animated.View style={[styles.simulBarFill, {
                        width: simulAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${POTENTIAL_SCORE}%`],
                        }),
                        backgroundColor: '#22C55E',
                      }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.simulGain}>
                  <Ionicons name="trending-up" size={13} color="#22C55E" />
                  <Text style={styles.simulGainText}>
                    +{POTENTIAL_SCORE - GLOBAL_SCORE} points en appliquant les {MOCK_ISSUES.filter(i => i.level !== 'tip').length} corrections critiques
                  </Text>
                </View>
              </View>

              {/* ── Barre d'optimisation ──────────────────────────────── */}
              <View style={styles.optCard}>
                <View style={styles.optRow}>
                  <Ionicons name="stats-chart-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.optLabel}>Niveau d'optimisation</Text>
                  <Text style={[styles.optPct, { color: COLORS.primary }]}>{OPT_PCT}%</Text>
                </View>
                <View style={styles.optBarTrack}>
                  <Animated.View style={[styles.optBarFill, {
                    width: optAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]}>
                    <LinearGradient
                      colors={['#7C3AED', '#8B5CF6']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  </Animated.View>
                </View>
                <Text style={styles.optSub}>Applique les corrections pour atteindre 100 %</Text>
              </View>

              {/* ── Rétention estimée ─────────────────────────────────── */}
              <View style={styles.retentionCard}>
                <View style={styles.retentionHeader}>
                  <View style={styles.retentionBadge}>
                    <Ionicons name="trending-down-outline" size={11} color="#EF4444" />
                    <Text style={styles.retentionBadgeText}>Rétention estimée</Text>
                  </View>
                  <Text style={styles.retentionSub}>Simulation basée sur ton score de hook</Text>
                </View>

                {/* Courbe drop-off */}
                <View style={styles.retentionBars}>
                  {RETENTION_CURVE.map((pt, i) => (
                    <View key={i} style={styles.retentionBarCol}>
                      <View style={styles.retentionBarTrack}>
                        <Animated.View style={[
                          styles.retentionBarFill,
                          {
                            height: retentionAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', `${pt.pct}%`],
                            }),
                            backgroundColor: pt.pct >= 50 ? '#22C55E' : pt.pct >= 25 ? '#F59E0B' : '#EF4444',
                          },
                        ]} />
                      </View>
                      <Text style={styles.retentionPct}>{pt.pct}%</Text>
                      <Text style={styles.retentionSec}>{pt.sec}</Text>
                    </View>
                  ))}
                </View>

                {/* Annotation */}
                <View style={styles.retentionAlert}>
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.retentionAlertText}>
                    <Text style={{ fontWeight: '800', color: '#EF4444' }}>48% de drop</Text> à 2s · La moyenne des top créateurs est &lt;15%
                  </Text>
                </View>
              </View>

              {/* ── Détail par critère ────────────────────────────────── */}
              <View style={styles.block}>
                <Text style={styles.blockTitle}>
                  <Ionicons name="bar-chart-outline" size={14} color={COLORS.textMuted} />
                  {'  Détail par critère'}
                </Text>

                {MOCK_CATEGORIES.map((cat, i) => {
                  const c = categoryColor(cat.score);
                  const isExpanded = expandedCatIdx === i;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpandedCatIdx(prev => prev === i ? null : i); }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.catRow}>
                        <Ionicons name={cat.icon} size={14} color={c} style={{ width: 20 }} />
                        <Text style={styles.catLabel}>{cat.label}</Text>
                        <View style={styles.catTrack}>
                          <Animated.View style={[styles.catFill, {
                            width: catAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                            backgroundColor: c,
                          }]} />
                        </View>
                        <Text style={[styles.catScore, { color: c }]}>{cat.score}</Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={COLORS.textMuted} />
                      </View>
                      {isExpanded && (
                        <View style={[styles.catDetail, { borderLeftColor: c }]}>
                          {cat.problem && (
                            <View style={styles.catDetailRow}>
                              <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
                              <Text style={styles.catDetailProblem}>{cat.problem}</Text>
                            </View>
                          )}
                          <View style={styles.catDetailRow}>
                            <Ionicons name="sparkles-outline" size={12} color={c} />
                            <Text style={[styles.catDetailTip, { color: c }]}>{cat.tip}</Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Problèmes (style Grammarly) ───────────────────────── */}
              <View style={styles.issuesHeader}>
                <Text style={styles.blockTitle}>
                  <Ionicons name="warning-outline" size={14} color={COLORS.textMuted} />
                  {'  Problèmes détectés'}
                </Text>
                <View style={styles.issueCount}>
                  <Text style={styles.issueCountTxt}>
                    {MOCK_ISSUES.filter(x => x.level === 'critical').length} critiques
                  </Text>
                </View>
              </View>

              {MOCK_ISSUES.map((issue, i) => {
                const lv       = LEVELS[issue.level];
                const expanded = expandedIdx === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.issueCard, { borderColor: lv.border, backgroundColor: lv.bg }]}
                    onPress={() => toggleIssue(i)}
                    activeOpacity={0.8}
                  >
                    {/* Ligne principale */}
                    <View style={styles.issueTop}>
                      <View style={[styles.issueLevelBadge, { backgroundColor: lv.color + '20', borderColor: lv.border }]}>
                        <Text style={[styles.issueLevelText, { color: lv.color }]}>{lv.label}</Text>
                      </View>
                      <Ionicons name={issue.icon} size={15} color={lv.color} style={{ marginLeft: 'auto' }} />
                    </View>

                    <Text style={styles.issueTitle}>{issue.title}</Text>

                    {/* Stat highlight */}
                    <View style={[styles.issueStat, { borderLeftColor: lv.color }]}>
                      <Text style={styles.issueStatText}>"{issue.stat}"</Text>
                    </View>

                    {/* Fix — visible si expanded */}
                    {expanded && (
                      <>
                        <View style={[styles.issueFix, { borderColor: lv.border }]}>
                          <Ionicons name="sparkles-outline" size={13} color={lv.color} />
                          <Text style={[styles.issueFixText, { color: lv.color }]}>{issue.fix}</Text>
                        </View>
                        {issue.freelanceType && (
                          <TouchableOpacity
                            style={[styles.issueFixBtn, { backgroundColor: lv.color + '15', borderColor: lv.border }]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goToExperts(); }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="person-circle-outline" size={14} color={lv.color} />
                            <Text style={[styles.issueFixBtnText, { color: lv.color }]}>
                              {issue.freelanceLabel} · {issue.freelanceType}
                            </Text>
                            <Ionicons name="chevron-forward" size={12} color={lv.color} style={{ marginLeft: 'auto' }} />
                          </TouchableOpacity>
                        )}
                      </>
                    )}

                    <View style={styles.issueExpandRow}>
                      <Text style={[styles.issueExpandHint, { color: lv.color }]}>
                        {expanded ? 'Masquer la correction ▲' : 'Voir la correction ▼'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* ── À faire maintenant ────────────────────────────────── */}
              <View style={styles.actionsCard}>
                <View style={styles.actionsHeader}>
                  <View style={styles.actionsBadge}>
                    <Ionicons name="rocket-outline" size={11} color={COLORS.primary} />
                    <Text style={styles.actionsBadgeText}>À FAIRE MAINTENANT</Text>
                  </View>
                  <Text style={styles.actionsSubtitle}>Actions classées par impact</Text>
                </View>

                {MOCK_ACTIONS.map((a, i) => (
                  <View key={i} style={[styles.actionRow, { borderLeftColor: a.color }]}>
                    <View style={[styles.actionNum, { backgroundColor: a.color + '18', borderColor: a.color + '30' }]}>
                      <Text style={[styles.actionNumText, { color: a.color }]}>{a.priority}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.actionTitle}>{a.action}</Text>
                      <View style={styles.actionCopyRow}>
                        <Ionicons name="copy-outline" size={11} color={COLORS.textMuted} />
                        <Text style={styles.actionCopy} numberOfLines={1}>{a.copy}</Text>
                      </View>
                    </View>
                    <View style={styles.actionMeta}>
                      <View style={[styles.actionImpact, { backgroundColor: '#22C55E14' }]}>
                        <Text style={styles.actionImpactText}>{a.impact}</Text>
                      </View>
                      <Text style={styles.actionTime}>{a.time}</Text>
                    </View>
                    {a.freelanceType && (
                      <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goToExperts(); }}
                        style={styles.actionFreelanceBtn}
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="person-outline" size={13} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <View style={styles.actionsFooter}>
                  <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.actionsFooterText}>Temps total estimé : ~15 min pour +39 pts</Text>
                </View>
              </View>

              {/* ── Hooks viraux templates ─────────────────────────────── */}
              <View style={styles.hooksCard}>
                <TouchableOpacity
                  style={styles.hooksToggle}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowHooks(h => !h); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={styles.hooksBadge}>
                      <Ionicons name="flash" size={11} color="#F59E0B" />
                      <Text style={styles.hooksBadgeText}>HOOKS VIRAUX</Text>
                    </View>
                    <Text style={styles.hooksTitle}>5 templates prêts à copier</Text>
                  </View>
                  <View style={styles.hooksChevron}>
                    <Ionicons name={showHooks ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>

                {showHooks && (
                  <View style={styles.hooksList}>
                    {MOCK_HOOKS.map((h, i) => (
                      <View key={i} style={styles.hookRow}>
                        <View style={styles.hookScoreBadge}>
                          <Text style={styles.hookScoreText}>{h.score}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.hookTemplate}>{h.template}</Text>
                          <Text style={styles.hookType}>{h.type}</Text>
                        </View>
                      </View>
                    ))}
                    <Text style={styles.hooksNote}>
                      Remplace les [crochets] par ton contenu. Score estimé basé sur 1M+ de vidéos.
                    </Text>
                  </View>
                )}
              </View>

              {/* ════ SECTION CONVERSION ════════════════════════════════ */}

              {/* ── Transition psychologique ──────────────────────────── */}
              <View style={styles.transitionBlock}>
                <LinearGradient
                  colors={['#EF444418', '#7C3AED10']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={16}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <View style={styles.transitionTop}>
                  <View style={styles.transitionIconBox}>
                    <Ionicons name="warning" size={20} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transitionTitle}>Ne laisse pas cette vidéo flop.</Text>
                    <Text style={styles.transitionSub}>
                      {MOCK_ISSUES.filter(i => i.level === 'critical').length} problèmes critiques limitent ta portée. Ils se corrigent en 24h.
                    </Text>
                  </View>
                </View>
                <View style={styles.transitionStats}>
                  {[
                    { val: `−${100 - GLOBAL_SCORE} pts`, label: 'de potentiel perdu', color: '#EF4444' },
                    { val: `+${POTENTIAL_SCORE - GLOBAL_SCORE} pts`, label: 'récupérables', color: '#22C55E' },
                    { val: '24h', label: 'pour corriger', color: COLORS.primary },
                  ].map((s, i) => (
                    <View key={i} style={styles.transitionStat}>
                      <Text style={[styles.transitionStatVal, { color: s.color }]}>{s.val}</Text>
                      <Text style={styles.transitionStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── A. Experts recommandés (conversion) ───────────────── */}
              <View style={styles.convHeader}>
                <View style={styles.convBadge}>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text style={styles.convBadgeText}>OPTION RECOMMANDÉE</Text>
                </View>
                <Text style={styles.convTitle}>On s'en occupe pour toi</Text>
                <Text style={styles.convSub}>Chaque expert résout un problème précis détecté dans ta vidéo</Text>
              </View>

              {CONVERSION_EXPERTS.map((expert, i) => (
                <View key={expert.id} style={[styles.convCard, i === 0 && styles.convCardTop]}>
                  {i === 0 && (
                    <LinearGradient
                      colors={[expert.color + '14', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      borderRadius={RADIUS.xl}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
                    />
                  )}

                  {/* Badge */}
                  {i === 0 && (
                    <View style={[styles.convCardBadge, { backgroundColor: expert.color + '20', borderColor: expert.color + '40' }]}>
                      <Ionicons name="flame" size={10} color={expert.color} />
                      <Text style={[styles.convCardBadgeText, { color: expert.color }]}>Correction prioritaire</Text>
                    </View>
                  )}

                  <View style={styles.convExpertRow}>
                    {/* Avatar */}
                    <View style={[styles.convAvatar, { backgroundColor: expert.color + '20', borderColor: expert.color + '50' }]}>
                      <Text style={[styles.convAvatarText, { color: expert.color }]}>{expert.initials}</Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <View style={styles.convNameRow}>
                        <Text style={styles.convName}>{expert.name}</Text>
                        <View style={[styles.convExpertBadge, { backgroundColor: expert.color + '15', borderColor: expert.color + '30' }]}>
                          <Text style={[styles.convExpertBadgeText, { color: expert.color }]}>{expert.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.convSpecialty}>{expert.specialty}</Text>
                      <View style={styles.convRatingRow}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={styles.convRating}>{expert.rating}</Text>
                        <Text style={styles.convReviews}>({expert.reviews} avis)</Text>
                        <View style={styles.convDot} />
                        <Text style={styles.convProof}>{expert.proof}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Tagline */}
                  <View style={[styles.convTaglineRow, { borderLeftColor: expert.color }]}>
                    <Ionicons name={expert.icon} size={13} color={expert.color} />
                    <Text style={styles.convTagline}>{expert.tagline}</Text>
                  </View>

                  {/* Résout / Prix / Délai */}
                  <View style={styles.convMetaRow}>
                    <View style={styles.convSolvesRow}>
                      <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                      <Text style={styles.convSolves}>Résout : {expert.solves}</Text>
                    </View>
                    <View style={styles.convPricePill}>
                      <Text style={[styles.convPrice, { color: expert.color }]}>{expert.price}€</Text>
                      <Text style={styles.convDelivery}> · {expert.deliveryTime}</Text>
                    </View>
                  </View>

                  {/* CTA */}
                  <TouchableOpacity
                    style={styles.convCtaWrap}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); goToOffer(); }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={i === 0 ? ['#7C3AED', '#8B5CF6'] : [expert.color + 'CC', expert.color]}
                      style={[styles.convCta, i === 0 && styles.convCtaPrimary]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                    <View style={styles.convCtaInner}>
                      <Text style={styles.convCtaText}>
                        {i === 0 ? 'Corriger ma vidéo avec cet expert' : 'Choisir cet expert'}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Preuve sociale */}
              <View style={styles.socialProofConv}>
                <Ionicons name="people" size={13} color="#22C55E" />
                <Text style={styles.socialProofConvText}>
                  <Text style={{ fontWeight: '800', color: COLORS.text }}>+2 400 créateurs</Text> ont amélioré leurs vues grâce à ces experts ce mois-ci
                </Text>
              </View>

              {/* ── Pack Optimisation Viralité ─────────────────────────── */}
              <View style={styles.packCard}>
                <LinearGradient
                  colors={['#7C3AED22', '#7C3AED08']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.xl}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />

                {/* Header */}
                <View style={styles.packHeader}>
                  <View style={styles.packBadge}>
                    <Ionicons name="sparkles" size={10} color={COLORS.primary} />
                    <Text style={styles.packBadgeText}>PACK COMPLET</Text>
                  </View>
                  <View style={styles.packPriceRow}>
                    <Text style={styles.packOriginal}>{PACK_ORIGINAL}€</Text>
                    <Text style={styles.packPrice}>{PACK_PRICE}€</Text>
                    <View style={styles.packDiscount}>
                      <Text style={styles.packDiscountText}>-{Math.round((1 - PACK_PRICE/PACK_ORIGINAL)*100)}%</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.packTitle}>Pack Optimisation Viralité</Text>
                <Text style={styles.packSub}>Tout ce qu'il faut pour que ta vidéo performe · Livraison 24–48h</Text>

                {/* Items */}
                <View style={styles.packItems}>
                  {PACK_ITEMS.map((item, i) => (
                    <View key={i} style={styles.packItem}>
                      <View style={styles.packItemCheck}>
                        <Ionicons name="checkmark" size={11} color="#22C55E" />
                      </View>
                      <Ionicons name={item.icon} size={13} color={COLORS.primary} />
                      <Text style={styles.packItemLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA pack */}
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); goToOffer(); }}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#8B5CF6']}
                    style={styles.packCta}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="rocket" size={16} color="#fff" />
                    <Text style={styles.packCtaText}>Optimiser ma vidéo maintenant</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.packNote}>Paiement sécurisé · Fonds libérés après validation · Satisfait ou révision gratuite</Text>
              </View>

              {/* ── B. Je préfère avancer seul — GAMIFIÉ ─────────────── */}
              {(() => {
                const diyXp    = DIY_CHECKLIST.reduce((s, item, i) => s + (diyChecked[i] ? item.xp : 0), 0);
                const diyLevel = diyGetLevel(diyXp);
                const diyXpPct = Math.round((diyXp / DIY_TOTAL_XP) * 100);
                const unlockedBadges = DIY_CHECKLIST.filter((_, i) => diyChecked[i]);
                const isMaxLevel = diyXp >= DIY_TOTAL_XP;
                return (
                  <View style={styles.diyCard}>

                    {/* ── Header gamifié ─── */}
                    <View style={styles.diyGameHeader}>
                      <LinearGradient
                        colors={['#1A0A2E', '#1E1040']}
                        style={StyleSheet.absoluteFill}
                        borderRadius={RADIUS.lg}
                      />
                      {/* Niveau + XP */}
                      <View style={styles.diyLevelRow}>
                        <View style={styles.diyLevelBadge}>
                          <Text style={styles.diyLevelN}>NV.{diyLevel.n}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name={diyLevel.icon} size={13} color={diyLevel.iconColor} />
                          <Text style={styles.diyLevelLabel}>{diyLevel.label}</Text>
                        </View>
                        <View style={styles.diyXpBadge}>
                          <Ionicons name="star" size={10} color="#F59E0B" />
                          <Text style={styles.diyXpBadgeTxt}>{diyXp} XP</Text>
                        </View>
                      </View>

                      {/* Barre XP */}
                      <View style={styles.diyXpTrack}>
                        <View style={[styles.diyXpFill, { width: `${diyXpPct}%` }]}>
                          <LinearGradient
                            colors={['#F59E0B', '#EF4444']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          />
                        </View>
                      </View>
                      <View style={styles.diyXpLegend}>
                        <Text style={styles.diyXpLegendTxt}>{diyXp} / {DIY_TOTAL_XP} XP</Text>
                        {!isMaxLevel && diyLevel.next !== null && (
                          <Text style={styles.diyXpNextTxt}>Prochain niveau à {diyLevel.next} XP</Text>
                        )}
                        {isMaxLevel && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons name="trophy" size={12} color="#F59E0B" />
                            <Text style={[styles.diyXpNextTxt, { color: '#F59E0B' }]}>Niveau MAX atteint !</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Missions ─── */}
                    <View style={styles.diyMissionsHeader}>
                      <Ionicons name="list-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.diyMissionsTitle}>MISSIONS DU JOUR</Text>
                      <View style={styles.diyMissionsDoneBadge}>
                        <Text style={styles.diyMissionsDoneTxt}>
                          {diyChecked.filter(Boolean).length}/{DIY_CHECKLIST.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.diyList}>
                      {DIY_CHECKLIST.map((item, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[styles.diyMissionRow, diyChecked[i] && { backgroundColor: item.color + '10', borderColor: item.color + '25' }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setDiyChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
                          }}
                          activeOpacity={0.78}
                        >
                          <View style={[styles.diyMissionCheck, diyChecked[i] && { backgroundColor: item.color, borderColor: item.color }]}>
                            {diyChecked[i] && <Ionicons name="checkmark" size={12} color="#fff" />}
                          </View>
                          <Ionicons name={item.icon} size={14} color={diyChecked[i] ? item.color : COLORS.textMuted} />
                          <Text style={[styles.diyMissionText, diyChecked[i] && styles.diyMissionTextDone]}
                            numberOfLines={2}>{item.text}</Text>
                          <View style={styles.diyMissionRight}>
                            <View style={[styles.diyXpPill, { backgroundColor: item.color + '18', borderColor: item.color + '35' }]}>
                              <Text style={[styles.diyXpPillTxt, { color: item.color }]}>+{item.xp} XP</Text>
                            </View>
                            {diyChecked[i] && (
                              <Ionicons name="ribbon" size={14} color={item.color} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* ── Badges débloqués ─── */}
                    {unlockedBadges.length > 0 && (
                      <View style={styles.diyBadgesSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="trophy" size={12} color="#F59E0B" />
                          <Text style={styles.diyBadgesSectionTitle}>BADGES DÉBLOQUÉS</Text>
                        </View>
                        <View style={styles.diyBadgesList}>
                          {unlockedBadges.map((item, i) => (
                            <View key={i} style={[styles.diyBadgeChip, { backgroundColor: item.color + '18', borderColor: item.color + '35' }]}>
                              <Ionicons name="ribbon" size={11} color={item.color} />
                              <Text style={[styles.diyBadgeChipTxt, { color: item.color }]}>{item.badge}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* ── Niveau max → célébration ─── */}
                    {isMaxLevel && (
                      <View style={styles.diyComplete}>
                        <Ionicons name="trophy" size={28} color="#F59E0B" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.diyCompleteTitle}>Toutes les missions complétées !</Text>
                          <Text style={styles.diyCompleteText}>Re-teste ta vidéo pour mesurer l'impact de tes corrections.</Text>
                        </View>
                      </View>
                    )}

                    {/* ── CTA re-tester ─── */}
                    <TouchableOpacity
                      style={styles.diyCtaBtn}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); reset(true); }}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="refresh-outline" size={15} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.diyCtaBtnText}>Re-tester ma vidéo</Text>
                        <Text style={styles.diyCtaBtnSub}>
                          {isMaxLevel ? 'Tu as tout optimisé — mesure l\'impact !' : 'Une fois tes corrections appliquées'}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* ── Actions secondaires : Partager + Re-tester ── */}
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowShareModal(true); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.shareBtnText}>Partager mon score</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retestBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reset(true); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={15} color={COLORS.textMuted} />
                  <Text style={styles.retestBtnText}>Re-tester une vidéo</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          )}

          {/* ── Share modal ── */}
          <ShareScoreModal
            visible={showShareModal}
            score={GLOBAL_SCORE}
            potentialScore={POTENTIAL_SCORE}
            categories={MOCK_CATEGORIES}
            onClose={() => setShowShareModal(false)}
          />

        </ScrollView>

      </KeyboardAvoidingView>

      {/* ── Sticky CTA ── */}
      {phase === 'results' && (
        <View style={[styles.stickyCtaWrap, { paddingBottom: insets.bottom || 0 }]}>
          <LinearGradient
            colors={['#7C3AED', '#8B5CF6']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <TouchableOpacity
            style={styles.stickyCta}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('AuditOffer', { score: GLOBAL_SCORE, criticalCount: MOCK_ISSUES.filter(x => x.level === 'critical').length }); }}
            activeOpacity={0.9}
          >
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.stickyCtaText}>Corriger ma vidéo maintenant</Text>
            <View style={styles.stickyCtaArrow}>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },

  // Header
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '30',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, lineHeight: 34, marginBottom: 6 },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.sm },

  // Social proof
  socialProofRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: SPACING.sm },
  socialChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  socialChipText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  // Quick win card
  quickWinCard: {
    marginTop: SPACING.md, borderWidth: 1, borderColor: '#EF444428',
    borderRadius: RADIUS.lg, padding: SPACING.md, overflow: 'hidden', gap: 10,
  },
  quickWinTop:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickWinIcon:     { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quickWinLabel:    { fontSize: 9, fontWeight: '800', color: '#EF4444', letterSpacing: 0.8 },
  quickWinText:     { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  quickWinStats:    { flexDirection: 'row', gap: SPACING.md },
  quickWinStat:     { alignItems: 'center', gap: 2 },
  quickWinStatVal:  { fontSize: 16, fontWeight: '900' },
  quickWinStatLabel:{ fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },

  // Delta re-test banner
  deltaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  deltaTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  deltaSub:   { fontSize: 11, color: COLORS.textMuted },

  // WOW banner
  wowBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#22C55E30', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, overflow: 'hidden',
  },
  wowIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#22C55E18', borderWidth: 1, borderColor: '#22C55E30', alignItems: 'center', justifyContent: 'center' },
  wowTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  wowSub:   { fontSize: 11, color: COLORS.textMuted },

  // Score glow
  scoreGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, alignSelf: 'center', top: 20 },

  // Secondary actions
  secondaryActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.primary + '40',
    borderRadius: RADIUS.lg, paddingVertical: 12,
  },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  retestBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingVertical: 12,
  },
  retestBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },

  // Section
  section: { padding: SPACING.lg, paddingTop: SPACING.md },

  // Upload
  uploadZone: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    padding: SPACING.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  uploadZoneActive: {
    borderStyle: 'solid',
    borderColor: COLORS.primary + '50',
    minHeight: 0,
    padding: SPACING.md,
  },
  uploadIcon: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  uploadSub: { fontSize: 12, color: COLORS.textMuted },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  fileIcon: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  fileName: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  fileSize: { fontSize: 11, color: COLORS.textMuted },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerOu: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    marginBottom: SPACING.md,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.text, padding: 0 },

  // Platforms
  platforms: { flexDirection: 'row', gap: 8, marginBottom: SPACING.xl },
  platformChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  platformLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: RADIUS.lg, paddingVertical: 15,
    ...SHADOW.md,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  ctaHint: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 10 },

  // Analyzing
  analyzingCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
  },
  analyzingIcon: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  analyzingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  analyzingSourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: SPACING.lg, maxWidth: '90%',
  },
  analyzingSource: { fontSize: 12, color: COLORS.textMuted, flex: 1 },
  progressTrack: {
    width: '100%', height: 5, backgroundColor: COLORS.border,
    borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.lg,
  },
  progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  stepsList: { width: '100%', gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  stepText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },

  // Score card
  scoreCard: {
    overflow: 'hidden', backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.md,
  },
  scoreRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 8, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  scoreRingInner: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  scoreMax: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  scoreLabel: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.md },
  scoreBarTrack: {
    width: '100%', height: 7, backgroundColor: COLORS.border,
    borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreBarLegend: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  legendTxt: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  // Badges
  badgeRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Simulation de viralité
  simulCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    overflow: 'hidden', marginBottom: SPACING.md, gap: 14,
  },
  simulHeader: { gap: 6 },
  simulBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
  },
  simulBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3 },
  simulTitle:     { fontSize: 15, fontWeight: '700', color: COLORS.text },
  simulRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  simulSide:      { flex: 1, gap: 6 },
  simulSideLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  simulScore:     { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  simulBarTrack:  { width: '100%', height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  simulBarFill:   { height: '100%', borderRadius: 3 },
  simulArrow:     { alignItems: 'center', justifyContent: 'center' },
  simulGain: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#22C55E12', borderRadius: RADIUS.md, padding: 9,
  },
  simulGainText: { fontSize: 12, fontWeight: '600', color: '#22C55E', flex: 1 },

  // Barre d'optimisation
  optCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, gap: 8,
  },
  optRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optLabel:    { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  optPct:      { fontSize: 14, fontWeight: '800' },
  optBarTrack: { width: '100%', height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  optBarFill:  { height: '100%', borderRadius: 3, overflow: 'hidden' },
  optSub:      { fontSize: 11, color: COLORS.textMuted },

  // Catégories
  block: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md,
  },
  blockTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catLabel: { fontSize: 13, color: COLORS.text, width: 52, fontWeight: '600' },
  catTrack: {
    flex: 1, height: 6, backgroundColor: COLORS.border,
    borderRadius: 3, overflow: 'hidden',
  },
  catFill: { height: '100%', borderRadius: 3 },
  catScore: { fontSize: 12, fontWeight: '800', width: 28, textAlign: 'right' },

  // Issues header
  issuesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  issueCount: {
    backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  issueCountTxt: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

  // Issue cards
  issueCard: {
    borderWidth: 1, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: 10,
  },
  issueTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  issueLevelBadge: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  issueLevelText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  issueTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  issueStat: {
    borderLeftWidth: 3, paddingLeft: 10,
    marginBottom: 8,
  },
  issueStatText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 18 },
  issueFix: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderTopWidth: 1, paddingTop: 10, marginBottom: 8,
  },
  issueFixText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  issueExpandRow: { alignItems: 'flex-end' },
  issueExpandHint: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Close button (modal)
  closeBtn: {
    position: 'absolute', top: SPACING.md, right: SPACING.lg, zIndex: 1,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Match section
  matchSection: { marginBottom: SPACING.md },
  matchSectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12,
  },
  matchScrollContent: { gap: 10, paddingBottom: 4 },
  matchCard: {
    width: 160, borderRadius: RADIUS.lg, overflow: 'hidden',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, ...SHADOW.sm,
  },
  matchAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  matchAvatarText: { fontSize: 15, fontWeight: '800' },
  matchName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  matchReason: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15, marginBottom: 8, flex: 0 },
  matchBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  matchPrice: { fontSize: 13, fontWeight: '800' },
  matchRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  matchRatingText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  matchBtn: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingVertical: 6, alignItems: 'center',
  },
  matchBtnText: { fontSize: 11, fontWeight: '700' },

  // ── Score insight ──────────────────────────────────────────────────────────
  scoreInsightRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, paddingVertical: 8,
    marginTop: 12, width: '100%',
  },
  scoreInsightText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  // ── Diagnostic rapide ──────────────────────────────────────────────────────
  diagCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, gap: 8,
  },
  diagHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  diagHeaderText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8 },
  diagRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderLeftWidth: 3, paddingLeft: 10,
    paddingVertical: 5,
  },
  diagEmoji: { fontSize: 14 },
  diagText:  { fontSize: 13, color: COLORS.text, flex: 1, fontWeight: '500', lineHeight: 18 },

  // ── Rétention estimée ──────────────────────────────────────────────────────
  retentionCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, gap: 14,
  },
  retentionHeader: { gap: 4 },
  retentionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EF444414', borderWidth: 1, borderColor: '#EF444430',
    borderRadius: RADIUS.full, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
  },
  retentionBadgeText: { fontSize: 10, fontWeight: '700', color: '#EF4444', letterSpacing: 0.3 },
  retentionSub: { fontSize: 12, color: COLORS.textMuted },
  retentionBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 90 },
  retentionBarCol: { flex: 1, alignItems: 'center', gap: 3 },
  retentionBarTrack: { width: '100%', height: 70, justifyContent: 'flex-end', backgroundColor: COLORS.bg, borderRadius: 4, overflow: 'hidden' },
  retentionBarFill: { width: '100%', borderRadius: 4 },
  retentionPct: { fontSize: 9, fontWeight: '700', color: COLORS.text },
  retentionSec: { fontSize: 8, color: COLORS.textMuted, fontWeight: '600' },
  retentionAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: '#EF444410', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#EF444428', padding: 9,
  },
  retentionAlertText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  // ── Critère expandable ─────────────────────────────────────────────────────
  catDetail: {
    borderLeftWidth: 3, paddingLeft: 10, marginTop: 4, marginBottom: 8, gap: 6,
  },
  catDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  catDetailProblem: { flex: 1, fontSize: 12, color: '#EF4444', lineHeight: 16 },
  catDetailTip:     { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '600' },

  // ── Bouton "Corriger ce point" ─────────────────────────────────────────────
  issueFixBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: 10, paddingVertical: 9,
    marginBottom: 4,
  },
  issueFixBtnText: { fontSize: 12, fontWeight: '700', flex: 1 },

  // ── À faire maintenant ─────────────────────────────────────────────────────
  actionsCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, gap: 10,
  },
  actionsHeader: { gap: 5, marginBottom: 4 },
  actionsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
  },
  actionsBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  actionsSubtitle:  { fontSize: 12, color: COLORS.textMuted },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 4,
  },
  actionNum: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionNumText:   { fontSize: 12, fontWeight: '900' },
  actionTitle:     { fontSize: 13, fontWeight: '700', color: COLORS.text },
  actionCopyRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCopy:      { fontSize: 11, color: COLORS.textMuted, flex: 1, fontStyle: 'italic' },
  actionMeta:      { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  actionImpact: {
    borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  actionImpactText: { fontSize: 10, fontWeight: '800', color: '#22C55E' },
  actionTime:       { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  actionFreelanceBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary + '14', borderWidth: 1, borderColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionsFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 4,
  },
  actionsFooterText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  // ── Hooks viraux ───────────────────────────────────────────────────────────
  hooksCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md,
  },
  hooksToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hooksChevron: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  hooksBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F59E0B15', borderColor: '#F59E0B30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
  },
  hooksBadgeText: { fontSize: 10, fontWeight: '800', color: '#F59E0B', letterSpacing: 0.5 },
  hooksTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  hooksList:  { marginTop: 14, gap: 10 },
  hookRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hookScoreBadge: {
    backgroundColor: COLORS.primary + '15', borderWidth: 1, borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.full, minWidth: 34, height: 34,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  hookScoreText:  { fontSize: 11, fontWeight: '900', color: COLORS.primary },
  hookTemplate:   { fontSize: 13, fontWeight: '600', color: COLORS.text, lineHeight: 18, marginBottom: 2 },
  hookType:       { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  hooksNote: {
    fontSize: 11, color: COLORS.textMuted, lineHeight: 16, fontStyle: 'italic',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 4,
  },

  // ── Transition psychologique ───────────────────────────────────────────────
  transitionBlock: {
    borderRadius: 16, padding: SPACING.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EF444428', marginBottom: SPACING.md, gap: 14,
  },
  transitionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  transitionIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EF444418', borderWidth: 1, borderColor: '#EF444330',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  transitionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  transitionSub:   { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  transitionStats: { flexDirection: 'row', gap: 0 },
  transitionStat: {
    flex: 1, alignItems: 'center', gap: 2,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  transitionStatVal:   { fontSize: 17, fontWeight: '900' },
  transitionStatLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },

  // ── Conversion section header ──────────────────────────────────────────────
  convHeader: { marginBottom: SPACING.sm, gap: 4 },
  convBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F59E0B14', borderColor: '#F59E0B30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
  },
  convBadgeText:   { fontSize: 10, fontWeight: '800', color: '#F59E0B', letterSpacing: 0.6 },
  convTitle:       { fontSize: 20, fontWeight: '900', color: COLORS.text },
  convSub:         { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  // ── Expert conversion card ──────────────────────────────────────────────────
  convCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: 10, gap: 10, overflow: 'hidden',
  },
  convCardTop: {
    borderWidth: 2, borderColor: COLORS.primary + '50',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  convCardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3,
  },
  convCardBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  convExpertRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  convAvatar: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  convAvatarText: { fontSize: 17, fontWeight: '900' },
  convNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  convName:       { fontSize: 15, fontWeight: '800', color: COLORS.text },
  convExpertBadge: {
    borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  convExpertBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  convSpecialty:   { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  convRatingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  convRating:      { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
  convReviews:     { fontSize: 11, color: COLORS.textMuted },
  convDot:         { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.border },
  convProof:       { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  convTaglineRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderLeftWidth: 3, paddingLeft: 10,
  },
  convTagline: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text, lineHeight: 18 },
  convMetaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  convSolvesRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  convSolves:    { fontSize: 12, color: COLORS.textMuted },
  convPricePill: { flexDirection: 'row', alignItems: 'baseline' },
  convPrice:     { fontSize: 18, fontWeight: '900' },
  convDelivery:  { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  convCtaWrap:   { borderRadius: RADIUS.lg, overflow: 'hidden' },
  convCta: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: RADIUS.lg,
  },
  convCtaPrimary: {},
  convCtaInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13,
  },
  convCtaText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Preuve sociale
  socialProofConv: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#22C55E0C', borderWidth: 1, borderColor: '#22C55E28',
    borderRadius: RADIUS.lg, padding: 12, marginBottom: SPACING.md,
  },
  socialProofConvText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  // ── Pack Optimisation ──────────────────────────────────────────────────────
  packCard: {
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.primary + '50',
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md,
    overflow: 'hidden', gap: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
  },
  packHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '30', borderWidth: 1,
    borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4,
  },
  packBadgeText:   { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  packPriceRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  packOriginal:    { fontSize: 14, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  packPrice:       { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  packDiscount: {
    backgroundColor: '#22C55E15', borderWidth: 1, borderColor: '#22C55E35',
    borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2,
  },
  packDiscountText: { fontSize: 10, fontWeight: '900', color: '#22C55E' },
  packTitle:  { fontSize: 18, fontWeight: '900', color: COLORS.text },
  packSub:    { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  packItems:  { gap: 8 },
  packItem:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  packItemCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#22C55E20', borderWidth: 1, borderColor: '#22C55E40',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  packItemLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  packCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: RADIUS.lg, paddingVertical: 15, overflow: 'hidden',
  },
  packCtaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  packNote: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', lineHeight: 15 },

  // ── DIY section gamifiée ───────────────────────────────────────────────────
  diyCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, gap: 14,
    overflow: 'hidden',
  },

  // Header sombre type "jeu"
  diyGameHeader: {
    borderRadius: RADIUS.lg, overflow: 'hidden', padding: SPACING.md, gap: 10,
    borderWidth: 1, borderColor: '#3D1A6E',
  },
  diyLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diyLevelBadge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  diyLevelN:     { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  diyLevelLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#E2D9F3' },
  diyXpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F59E0B20', borderWidth: 1, borderColor: '#F59E0B40',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  diyXpBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#F59E0B' },

  // Barre XP
  diyXpTrack: {
    height: 8, backgroundColor: '#ffffff18', borderRadius: 4, overflow: 'hidden',
  },
  diyXpFill: { height: '100%', borderRadius: 4, overflow: 'hidden', minWidth: 4 },
  diyXpLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  diyXpLegendTxt: { fontSize: 10, color: '#A78BFA', fontWeight: '700' },
  diyXpNextTxt:   { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  // Missions header
  diyMissionsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  diyMissionsTitle: { flex: 1, fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  diyMissionsDoneBadge: {
    backgroundColor: COLORS.primary + '15', borderWidth: 1, borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  diyMissionsDoneTxt: { fontSize: 11, fontWeight: '900', color: COLORS.primary },

  // Mission rows
  diyList:    { gap: 7 },
  diyMissionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
  },
  diyMissionCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, borderColor: COLORS.textMuted,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  diyMissionText:     { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 17, fontWeight: '500' },
  diyMissionTextDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  diyMissionRight:    { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  diyXpPill: {
    borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  diyXpPillTxt:      { fontSize: 10, fontWeight: '900' },
  diyBadgeUnlocked:  { fontSize: 14 },

  // Badges débloqués
  diyBadgesSection: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 10, gap: 8,
  },
  diyBadgesSectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8 },
  diyBadgesList:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  diyBadgeChip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4,
  },
  diyBadgeChipTxt: { fontSize: 11, fontWeight: '700' },

  diyComplete: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B30',
    borderRadius: RADIUS.lg, padding: 12,
  },
  diyCompleteTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  diyCompleteText:  { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  diyCtaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#7C3AED14', borderWidth: 1.5, borderColor: '#7C3AED40',
    borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: SPACING.md,
  },
  diyCtaBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  diyCtaBtnSub:  { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  // ── Sticky CTA ─────────────────────────────────────────────────────────────
  stickyCtaWrap: {
    overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 12,
  },
  stickyCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 7, paddingHorizontal: SPACING.lg,
  },
  stickyCtaText: { fontSize: 13, fontWeight: '800', color: '#fff', flex: 1 },
  stickyCtaArrow: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Reset
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.md, paddingVertical: 10,
  },
  resetText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
});
