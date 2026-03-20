/**
 * ShareScoreModal.js — Carte partageable "Score Viral"
 * Optimisée TikTok / Instagram (format carré)
 * Props : visible, score, potentialScore, onClose
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Share, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';

// ── Helpers score ──────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#F59E0B';
  return '#EF4444';
}
function scoreEmoji(s) {
  if (s >= 80) return '🔥';
  if (s >= 60) return '⚡';
  return '🎯';
}
function scoreVerdict(s) {
  if (s >= 80) return 'Potentiel viral élevé';
  if (s >= 60) return 'Bon potentiel';
  return 'En cours d\'optimisation';
}

// ── Barre de score animée ──────────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, delay, useNativeDriver: false }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', borderRadius: 3 },
});

// ── Composant principal ────────────────────────────────────────────────────────
export default function ShareScoreModal({ visible, score, potentialScore, categories, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
      // Pulse glow on high score
      if (score >= 70) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 1,   duration: 1200, useNativeDriver: true }),
          ])
        ).start();
      }
    } else {
      scaleAnim.setValue(0.88);
      glowAnim.setValue(0);
    }
  }, [visible]);

  const color = scoreColor(score);

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `🎯 Mon score viral sur Swiple : ${score}/100 ${scoreEmoji(score)}\n\nPotentiel après optimisation : ${potentialScore}/100 🚀\n\nAnalyse ta vidéo gratuitement → swiple.app`,
        title: `Score Viral ${score}/100 — Swiple`,
      });
    } catch (_) {
      Alert.alert('Partage', 'Impossible de partager pour l\'instant.');
    }
  }

  function handleCopyLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('✓ Copié !', 'Le lien a été copié dans le presse-papier.');
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>

            {/* ── CARTE SCORE (visuellement shareable) ── */}
            <LinearGradient
              colors={['#131319', '#1D1D2B', '#131319']}
              style={styles.card}
            >
              {/* Glow de fond */}
              <Animated.View style={[
                styles.glowBg,
                { opacity: glowAnim, backgroundColor: color + '18' },
              ]} />

              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.swipleBadge]}>
                  <Ionicons name="analytics" size={11} color={COLORS.primary} />
                  <Text style={styles.swipleBadgeText}>SWIPLE · AUDIT IA</Text>
                </View>
                <Text style={styles.cardDate}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
              </View>

              {/* Score central */}
              <View style={styles.scoreArea}>
                <Animated.View style={[styles.scoreGlow, { opacity: glowAnim, backgroundColor: color + '25' }]} />
                <View style={[styles.scoreRing, { borderColor: color + '50' }]}>
                  <View style={[styles.scoreRingInner, { borderColor: color }]}>
                    <Text style={[styles.scoreNum, { color }]}>{score}</Text>
                    <Text style={styles.scoreSlash}>/100</Text>
                  </View>
                </View>
                <Text style={styles.scoreEmoji}>{scoreEmoji(score)}</Text>
                <Text style={[styles.scoreVerdict, { color }]}>{scoreVerdict(score)}</Text>
              </View>

              {/* Détail catégories */}
              {categories && (
                <View style={styles.categoriesBlock}>
                  {categories.slice(0, 3).map((cat, i) => (
                    <View key={cat.key} style={styles.catLine}>
                      <Ionicons name={cat.icon} size={11} color={scoreColor(cat.score)} />
                      <Text style={styles.catLineLabel}>{cat.label}</Text>
                      <AnimBar pct={cat.score / 100} color={scoreColor(cat.score)} delay={i * 120} />
                      <Text style={[styles.catLineScore, { color: scoreColor(cat.score) }]}>{cat.score}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Potentiel après optimisation */}
              <View style={styles.potentialRow}>
                <View style={[styles.potentialBadge, { borderColor: '#22C55E30', backgroundColor: '#22C55E10' }]}>
                  <Ionicons name="trending-up" size={11} color="#22C55E" />
                  <Text style={styles.potentialText}>
                    Potentiel → <Text style={{ color: '#22C55E', fontWeight: '900' }}>{potentialScore}/100</Text> après optimisation
                  </Text>
                </View>
              </View>

              {/* Challenge line */}
              <View style={styles.challengeLine}>
                <Text style={styles.challengeText}>Tu peux battre ça ? 🎯</Text>
                <Text style={styles.challengeSub}>swiple.app</Text>
              </View>
            </LinearGradient>

            {/* ── Actions de partage ── */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
                <LinearGradient
                  colors={[COLORS.primary, '#4F46E5']}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="share-social" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Partager le score</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionSmall, { borderColor: COLORS.primary + '40' }]} onPress={handleCopyLink} activeOpacity={0.8}>
                  <Ionicons name="link-outline" size={14} color={COLORS.primary} />
                  <Text style={[styles.actionSmallText, { color: COLORS.primary }]}>Copier le lien</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionSmall, { borderColor: COLORS.border }]} onPress={onClose} activeOpacity={0.8}>
                  <Ionicons name="close-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.actionSmallText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>

          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  container: { width: '100%', gap: SPACING.md },

  // Carte
  card: {
    borderRadius: RADIUS.xl, padding: SPACING.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: SPACING.md,
  },
  glowBg: { ...StyleSheet.absoluteFillObject, borderRadius: RADIUS.xl },

  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swipleBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4 },
  swipleBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  cardDate:   { fontSize: 11, color: COLORS.textLight },

  // Score
  scoreArea:     { alignItems: 'center', gap: 8, paddingVertical: SPACING.sm, position: 'relative' },
  scoreGlow:     { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  scoreRing:     { width: 110, height: 110, borderRadius: 55, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  scoreRingInner:{ width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreNum:      { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  scoreSlash:    { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  scoreEmoji:    { fontSize: 22, marginTop: -4 },
  scoreVerdict:  { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // Categories
  categoriesBlock: { gap: 8 },
  catLine:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLineLabel:    { fontSize: 11, color: COLORS.textMuted, width: 38, fontWeight: '600' },
  catLineScore:    { fontSize: 11, fontWeight: '900', width: 22, textAlign: 'right' },

  // Potentiel
  potentialRow:   { alignItems: 'center' },
  potentialBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  potentialText:  { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  // Challenge
  challengeLine: { alignItems: 'center', paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 3 },
  challengeText: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  challengeSub:  { fontSize: 10, color: COLORS.textLight, letterSpacing: 0.5 },

  // Actions
  actions:   { gap: SPACING.sm },
  actionBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  actionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 14 },
  actionBtnText:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  actionRow:  { flexDirection: 'row', gap: SPACING.sm },
  actionSmall:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: RADIUS.xl, paddingVertical: 11, backgroundColor: COLORS.card },
  actionSmallText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
});
