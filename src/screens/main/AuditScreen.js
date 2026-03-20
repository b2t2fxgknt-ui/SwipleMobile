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
import { SafeAreaView } from 'react-native-safe-area-context';
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

// Score par catégorie (sur 100)
const MOCK_CATEGORIES = [
  { key: 'hook',     label: 'Hook',      score: 42, icon: 'flash-outline'          },
  { key: 'son',      label: 'Son',       score: 58, icon: 'musical-note-outline'   },
  { key: 'texte',    label: 'Texte',     score: 35, icon: 'text-outline'           },
  { key: 'visuel',   label: 'Visuel',    score: 82, icon: 'image-outline'          },
  { key: 'format',   label: 'Format',    score: 67, icon: 'crop-outline'           },
];

// Issues style "Grammarly" : niveau + titre + explication + fix
const MOCK_ISSUES = [
  {
    level: 'critical',
    icon:  'timer-outline',
    title: 'Tu perds l\'attention dès les 2 premières secondes',
    stat:  '78 % des viewers quittent avant la 3ᵉ seconde',
    fix:   'Commence par une question choc ou un résultat surprenant — aucune intro, aucune présentation.',
    issueCategory: 'hook',
  },
  {
    level: 'critical',
    icon:  'text-outline',
    title: '80 % de tes viewers regardent sans le son',
    stat:  'Sans sous-titres, tu perds la moitié de ton audience mobile',
    fix:   'Active l\'auto-sous-titrage dans CapCut ou TikTok Studio — 5 minutes suffisent.',
    issueCategory: 'subtitle',
  },
  {
    level: 'warning',
    icon:  'volume-mute-outline',
    title: 'Ton audio ne donne pas envie de rester',
    stat:  'Aucun son trending détecté — la portée organique en souffre',
    fix:   'Ajoute un son en courbe montante depuis l\'onglet "Sons" TikTok.',
    issueCategory: 'sound',
  },
  {
    level: 'warning',
    icon:  'crop-outline',
    title: 'Ton sujet est masqué par l\'interface TikTok',
    stat:  'Le sujet cadré trop bas disparaît derrière les boutons d\'action',
    fix:   'Place le sujet dans le tiers supérieur de l\'écran — zone dorée 9:16.',
    issueCategory: 'framing',
  },
  {
    level: 'tip',
    icon:  'pricetag-outline',
    title: 'Ta vidéo n\'est pas distribuée à assez de comptes',
    stat:  '3 hashtags détectés — idéal : 5 à 8 hashtags ciblés',
    fix:   'Mixe 2 hashtags viraux (#fyp, #viral) + 3 hashtags de niche liés à ton sujet.',
    issueCategory: 'hashtags',
  },
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

  const [phase, setPhase]               = useState('idle');
  const [mockFile, setMockFile]         = useState(null);
  const [link, setLink]                 = useState('');
  const [stepIdx, setStepIdx]           = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedIdx, setExpandedIdx]   = useState(null);

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
    progressAnim.setValue(0);
    scoreAnim.setValue(0);
    simulAnim.setValue(0);
    optAnim.setValue(0);
    glowAnim.setValue(0);
    deltaAnim.setValue(0);
    catAnims.forEach(a => a.setValue(0));
  }, [progressAnim, scoreAnim, catAnims]);

  const toggleIssue = useCallback((i) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIdx(prev => (prev === i ? null : i));
  }, []);

  const goToExperts = useCallback(() => navigation.navigate('Experts'), [navigation]);

  const accentColor = globalColor(GLOBAL_SCORE);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
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

              {/* ── Détail par critère ────────────────────────────────── */}
              <View style={styles.block}>
                <Text style={styles.blockTitle}>
                  <Ionicons name="bar-chart-outline" size={14} color={COLORS.textMuted} />
                  {'  Détail par critère'}
                </Text>

                {MOCK_CATEGORIES.map((cat, i) => {
                  const c = categoryColor(cat.score);
                  return (
                    <View key={cat.key} style={styles.catRow}>
                      <Ionicons name={cat.icon} size={14} color={c} style={{ width: 20 }} />
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      <View style={styles.catTrack}>
                        <Animated.View style={[styles.catFill, {
                          width: catAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                          backgroundColor: c,
                        }]} />
                      </View>
                      <Text style={[styles.catScore, { color: c }]}>{cat.score}</Text>
                    </View>
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
                      <View style={[styles.issueFix, { borderColor: lv.border }]}>
                        <Ionicons name="sparkles-outline" size={13} color={lv.color} />
                        <Text style={[styles.issueFixText, { color: lv.color }]}>{issue.fix}</Text>
                      </View>
                    )}

                    <View style={styles.issueExpandRow}>
                      <Text style={[styles.issueExpandHint, { color: lv.color }]}>
                        {expanded ? 'Masquer la correction ▲' : 'Voir la correction ▼'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* ── Experts recommandés ──────────────────────────────── */}
              <View style={styles.matchSection}>
                <Text style={styles.matchSectionTitle}>
                  <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
                  {'  Experts recommandés'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.matchScrollContent}
                >
                  {MATCHED_FREELANCERS.map(f => {
                    const accent = CATEGORY_ACCENT[f.category] ?? COLORS.primary;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={styles.matchCard}
                        activeOpacity={0.85}
                        onPress={goToExperts}
                      >
                        <LinearGradient
                          colors={[accent + '20', accent + '08']}
                          style={StyleSheet.absoluteFill}
                          borderRadius={RADIUS.lg}
                        />
                        <View style={[styles.matchAvatar, { backgroundColor: accent + '25', borderColor: accent + '50' }]}>
                          <Text style={[styles.matchAvatarText, { color: accent }]}>{f.initials}</Text>
                        </View>
                        <Text style={styles.matchName} numberOfLines={1}>{f.name}</Text>
                        <Text style={styles.matchReason} numberOfLines={2}>{f.matchReason}</Text>
                        <View style={styles.matchBottom}>
                          <Text style={[styles.matchPrice, { color: accent }]}>{f.price}€</Text>
                          <View style={styles.matchRatingRow}>
                            <Ionicons name="star" size={10} color="#F59E0B" />
                            <Text style={styles.matchRatingText}>{f.rating}</Text>
                          </View>
                        </View>
                        <View style={[styles.matchBtn, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
                          <Text style={[styles.matchBtnText, { color: accent }]}>Voir →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── CTA experts ── */}
              <TouchableOpacity onPress={goToExperts} activeOpacity={0.85} style={{ marginTop: 8 }}>
                <LinearGradient
                  colors={['#7C3AED', '#8B5CF6']}
                  style={styles.ctaBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="people" size={17} color="#fff" />
                  <Text style={styles.ctaText}>Voir mes experts recommandés</Text>
                </LinearGradient>
              </TouchableOpacity>

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
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 48 },

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

  // Reset
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.md, paddingVertical: 10,
  },
  resetText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
});
