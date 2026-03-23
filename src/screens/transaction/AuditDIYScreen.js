/**
 * AuditDIYScreen.js
 * Plan d'action guidé "Le faire moi-même" — post-audit
 * Navigation params: { score, criticalCount }
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Clipboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';

// ── Données ───────────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    id: 'a1',
    icon: 'flash-outline',
    color: '#EF4444',
    title: 'Réécrire les 2 premières secondes',
    why: '78 % des viewers quittent avant la 3ᵉ seconde si le hook ne les accroche pas.',
    how: 'Commence par une question choc, un résultat surprenant ou un fait inattendu. Zéro intro, zéro présentation.',
    tool: 'CapCut · Texte d\'intro',
    time: '5 min',
    impact: '+18 pts',
    xp: 20,
  },
  {
    id: 'a2',
    icon: 'text-outline',
    color: '#F59E0B',
    title: 'Activer les sous-titres automatiques',
    why: '80 % de ton audience regarde sans le son — sans sous-titres tu perds la moitié.',
    how: 'Dans CapCut : Texte → Auto-captions → choisir la langue → Exporter. Prend 5 min.',
    tool: 'CapCut → Auto-captions',
    time: '5 min',
    impact: '+9 pts',
    xp: 15,
  },
  {
    id: 'a3',
    icon: 'musical-note-outline',
    color: '#8B5CF6',
    title: 'Remplacer la musique par un son trending',
    why: 'Un son en courbe montante booste la distribution par l\'algo TikTok.',
    how: 'TikTok Studio → Sons → Trending → filtrer "courbe montante" → ajouter à ta vidéo.',
    tool: 'TikTok Studio → Sons',
    time: '2 min',
    impact: '+7 pts',
    xp: 10,
  },
  {
    id: 'a4',
    icon: 'crop-outline',
    color: '#3B82F6',
    title: 'Recadrer le sujet dans la zone dorée',
    why: 'Le sujet cadré trop bas est masqué par les boutons d\'action TikTok.',
    how: 'Place ton sujet entre 15 % et 55 % du haut de l\'écran — c\'est la zone visible sans les overlays.',
    tool: 'CapCut · Recadrer',
    time: '3 min',
    impact: '+5 pts',
    xp: 8,
  },
  {
    id: 'a5',
    icon: 'pricetag-outline',
    color: '#10B981',
    title: 'Ajouter 5–8 hashtags ciblés',
    why: 'Seulement 3 hashtags détectés — l\'algo distribue moins ta vidéo.',
    how: 'Mixe 2 hashtags viraux (#fyp, #viral) + 3–4 hashtags de niche liés à ton contenu.',
    tool: 'TikTok · Légende',
    time: '2 min',
    impact: '+5 pts',
    xp: 7,
  },
];

const HOOK_TEMPLATES = [
  { template: '"Personne ne t\'a dit ça sur [sujet]…"',              score: 94, type: 'Curiosité'     },
  { template: '"J\'ai fait [résultat] en [durée]. Voici comment."',  score: 91, type: 'Preuve sociale' },
  { template: '"Arrête de faire [erreur] si tu veux [objectif]"',    score: 88, type: 'Douleur'        },
  { template: '"[Chiffre] choses que [cible] ignore encore"',        score: 85, type: 'Liste'          },
  { template: '"POV : tu découvres que [fait surprenant]"',          score: 82, type: 'Identification' },
];

const DIY_TOTAL_XP = ACTIONS.reduce((s, a) => s + a.xp, 0);

function getLevel(xp) {
  if (xp >= 60) return { label: 'Créateur Optimisé',   icon: 'trophy',          color: '#F59E0B' };
  if (xp >= 35) return { label: 'Créateur Confirmé',   icon: 'star',            color: '#8B5CF6' };
  if (xp >= 20) return { label: 'Créateur Progressif', icon: 'flame',           color: '#EF4444' };
  return               { label: 'Créateur Débutant',   icon: 'game-controller', color: '#3B82F6' };
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function AuditDIYScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const score        = route.params?.score        ?? 56;
  const criticalCount = route.params?.criticalCount ?? 2;

  const [checked, setChecked]     = useState(ACTIONS.map(() => false));
  const [expanded, setExpanded]   = useState(null);
  const [copied, setCopied]       = useState(null);
  const checkAnims                = useRef(ACTIONS.map(() => new Animated.Value(0))).current;

  const xpEarned = ACTIONS.reduce((s, a, i) => s + (checked[i] ? a.xp : 0), 0);
  const doneCount = checked.filter(Boolean).length;
  const level     = getLevel(xpEarned);
  const progress  = xpEarned / DIY_TOTAL_XP;

  function toggle(i) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    Animated.spring(checkAnims[i], {
      toValue: next[i] ? 1 : 0,
      useNativeDriver: true,
      tension: 180,
      friction: 10,
    }).start();
  }

  function toggleExpand(id) {
    setExpanded(prev => (prev === id ? null : id));
  }

  function copyHook(template, i) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Clipboard.setString(template);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  }

  function goToOffer() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AuditOffer', { score, criticalCount });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* ── TopBar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>Ton plan d'action</Text>
            <Text style={styles.topSub}>Score {score}/100 · {criticalCount} corrections prioritaires</Text>
          </View>
          {/* XP badge */}
          <View style={styles.xpBadge}>
            <Ionicons name={level.icon} size={12} color={level.color} />
            <Text style={[styles.xpBadgeText, { color: level.color }]}>{xpEarned} XP</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Progress bar ── */}
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressLabel}>{level.label}</Text>
                <Text style={styles.progressSub}>{doneCount}/{ACTIONS.length} corrections appliquées</Text>
              </View>
              <View style={styles.progressRight}>
                <Text style={styles.progressXp}>{xpEarned}<Text style={styles.progressXpTotal}> / {DIY_TOTAL_XP} XP</Text></Text>
              </View>
            </View>
            <View style={styles.progressBarTrack}>
              <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]}>
                <LinearGradient
                  colors={['#7C3AED', '#8B5CF6']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          </View>

          {/* ── Checklist ── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.sectionTitle}>CORRECTIONS À APPLIQUER</Text>
          </View>

          {ACTIONS.map((action, i) => {
            const done = checked[i];
            const isOpen = expanded === action.id;

            return (
              <View key={action.id} style={[styles.actionCard, done && styles.actionCardDone]}>

                {/* Row principale */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => toggleExpand(action.id)}
                  activeOpacity={0.85}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[styles.checkbox, done && { backgroundColor: action.color + '20', borderColor: action.color }]}
                    onPress={() => toggle(i)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {done && <Ionicons name="checkmark" size={13} color={action.color} />}
                  </TouchableOpacity>

                  {/* Icone + contenu */}
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                    <Ionicons name={action.icon} size={16} color={action.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, done && styles.actionTitleDone]}>{action.title}</Text>
                    <View style={styles.actionMeta}>
                      <View style={[styles.metaPill, { backgroundColor: action.color + '15' }]}>
                        <Text style={[styles.metaPillTxt, { color: action.color }]}>{action.impact}</Text>
                      </View>
                      <Text style={styles.metaTime}>{action.time}</Text>
                      <Text style={styles.metaSep}>·</Text>
                      <Text style={[styles.metaXp, { color: action.color }]}>+{action.xp} XP</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {/* Détail expandable */}
                {isOpen && (
                  <View style={styles.actionDetail}>
                    <View style={[styles.detailWhyRow, { borderLeftColor: action.color }]}>
                      <Text style={styles.detailWhyLabel}>POURQUOI</Text>
                      <Text style={styles.detailWhyText}>{action.why}</Text>
                    </View>
                    <View style={styles.detailHowRow}>
                      <Text style={styles.detailHowLabel}>COMMENT FAIRE</Text>
                      <Text style={styles.detailHowText}>{action.how}</Text>
                    </View>
                    <View style={styles.detailToolRow}>
                      <Ionicons name="construct-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.detailToolText}>{action.tool}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.doneBtn, { borderColor: action.color + '40', backgroundColor: done ? action.color + '15' : 'transparent' }]}
                      onPress={() => toggle(i)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={done ? 'checkmark-circle' : 'checkmark-circle-outline'} size={15} color={action.color} />
                      <Text style={[styles.doneBtnTxt, { color: action.color }]}>
                        {done ? 'Marqué comme fait' : 'Marquer comme fait'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* ── Hooks viraux ── */}
          <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
            <Ionicons name="flash-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.sectionTitle}>TEMPLATES DE HOOKS VIRAUX</Text>
          </View>
          <Text style={styles.hookIntro}>Copie et adapte l'un de ces hooks pour tes 2 premières secondes.</Text>

          {HOOK_TEMPLATES.map((h, i) => (
            <View key={i} style={styles.hookCard}>
              <View style={styles.hookLeft}>
                <View style={styles.hookScorePill}>
                  <Text style={styles.hookScoreTxt}>{h.score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hookTemplate}>{h.template}</Text>
                  <Text style={styles.hookType}>{h.type}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.hookCopyBtn, copied === i && styles.hookCopyBtnDone]}
                onPress={() => copyHook(h.template, i)}
                activeOpacity={0.7}
              >
                <Ionicons name={copied === i ? 'checkmark' : 'copy-outline'} size={14} color={copied === i ? '#22C55E' : COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {/* ── Nudge expert ── */}
          <View style={styles.nudgeCard}>
            <LinearGradient
              colors={['#7C3AED12', '#7C3AED05']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.xl}
            />
            <View style={styles.nudgeTop}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.nudgeTitle}>Tu bloques sur un point ?</Text>
            </View>
            <Text style={styles.nudgeSub}>
              Noah P. prend en charge l'intégralité des corrections en 48h — hook, montage, sous-titres et son.
            </Text>
            <TouchableOpacity style={styles.nudgeBtn} onPress={goToOffer} activeOpacity={0.85}>
              <Text style={styles.nudgeBtnTxt}>Déléguer</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  // TopBar
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  topTitle:   { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  topSub:     { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
  xpBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.card, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  xpBadgeText:{ fontSize: 12, fontWeight: '700' },

  // Progress card
  progressCard:     { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  progressTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  progressLabel:    { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  progressSub:      { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  progressRight:    { alignItems: 'flex-end' },
  progressXp:       { color: COLORS.text, fontWeight: '800', fontSize: 18 },
  progressXpTotal:  { color: COLORS.textMuted, fontWeight: '400', fontSize: 13 },
  progressBarTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressBarFill:  { height: '100%', borderRadius: 3, overflow: 'hidden' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  sectionTitle:  { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  // Action card
  actionCard:     { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  actionCardDone: { borderColor: COLORS.border, opacity: 0.8 },
  actionRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  checkbox:       { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  actionIcon:     { width: 34, height: 34, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  actionTitle:    { color: COLORS.text, fontWeight: '600', fontSize: 14, marginBottom: 4 },
  actionTitleDone:{ textDecorationLine: 'line-through', color: COLORS.textMuted },
  actionMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaPill:       { borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  metaPillTxt:    { fontSize: 11, fontWeight: '700' },
  metaTime:       { color: COLORS.textMuted, fontSize: 11 },
  metaSep:        { color: COLORS.textLight, fontSize: 11 },
  metaXp:         { fontSize: 11, fontWeight: '700' },

  // Action detail
  actionDetail:   { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.sm },
  detailWhyRow:   { borderLeftWidth: 2, paddingLeft: SPACING.sm, gap: 3 },
  detailWhyLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  detailWhyText:  { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
  detailHowRow:   { gap: 3 },
  detailHowLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  detailHowText:  { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  detailToolRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailToolText: { color: COLORS.textMuted, fontSize: 12 },
  doneBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 9, marginTop: 4 },
  doneBtnTxt:     { fontWeight: '600', fontSize: 13 },

  // Hook templates
  hookIntro:    { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.sm },
  hookCard:     { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  hookLeft:     { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  hookScorePill:{ backgroundColor: '#22C55E20', borderRadius: RADIUS.sm, paddingHorizontal: 7, paddingVertical: 3 },
  hookScoreTxt: { color: '#22C55E', fontWeight: '800', fontSize: 12 },
  hookTemplate: { color: COLORS.text, fontSize: 13, fontWeight: '500', lineHeight: 18, marginBottom: 3 },
  hookType:     { color: COLORS.textMuted, fontSize: 11 },
  hookCopyBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardElevated, alignItems: 'center', justifyContent: 'center' },
  hookCopyBtnDone: { backgroundColor: '#22C55E15' },

  // Nudge expert
  nudgeCard:  { overflow: 'hidden', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#7C3AED30', padding: SPACING.md, marginTop: SPACING.lg },
  nudgeTop:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  nudgeTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  nudgeSub:   { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, marginBottom: SPACING.md },
  nudgeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#7C3AED50', paddingVertical: 11 },
  nudgeBtnTxt:{ color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
