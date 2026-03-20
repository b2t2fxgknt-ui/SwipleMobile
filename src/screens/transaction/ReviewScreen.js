/**
 * ReviewScreen.js — Laisser un avis au freelance après validation
 * Params : { mission, freelancer }
 * Flow : ValidationScreen → ReviewScreen → Main
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, StatusBar, ScrollView, Keyboard,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

const QUICK_TAGS = [
  { id: 'ponctuel',   label: '⏰ Ponctuel',       cat: 'positive' },
  { id: 'creatif',    label: '✨ Créatif',          cat: 'positive' },
  { id: 'pro',        label: '💼 Professionnel',    cat: 'positive' },
  { id: 'reactif',    label: '⚡ Réactif',          cat: 'positive' },
  { id: 'qualite',    label: '🎯 Qualité top',      cat: 'positive' },
  { id: 'recommande', label: '👍 Je recommande',    cat: 'positive' },
];

const STAR_LABELS = ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent'];

// ─── StarRow ──────────────────────────────────────────────────────────────────
function StarRow({ rating, onChange }) {
  const anims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;

  const tap = useCallback((idx) => {
    const next = idx + 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(next);
    Animated.sequence([
      Animated.timing(anims[idx], { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.spring(anims[idx], { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [anims, onChange]);

  return (
    <View style={styles.starRow}>
      {[0, 1, 2, 3, 4].map(i => (
        <TouchableOpacity key={i} onPress={() => tap(i)} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: anims[i] }] }}>
            <Ionicons
              name={i < rating ? 'star' : 'star-outline'}
              size={44}
              color={i < rating ? '#F59E0B' : COLORS.border}
            />
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mission, freelancer } = route.params ?? {};

  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [selectedTags, setTags]     = useState([]);
  const [submitted, setSubmitted]   = useState(false);
  const [skipPressed, setSkip]      = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleTag = useCallback((id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }, []);

  const canSubmit = rating > 0;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    Animated.spring(successAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    setTimeout(() => navigation.navigate('Main'), 2200);
  }, [canSubmit, successAnim, navigation]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main');
  }, [navigation]);

  const freelancerName = freelancer?.name ?? 'le freelance';
  const freelancerInitials = freelancer?.initials ?? (freelancerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2));
  const freelancerColor = freelancer?.color ?? COLORS.primary;

  // ── Success state
  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0B1A0E', COLORS.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[styles.successState, { transform: [{ scale: successAnim }], opacity: successAnim }]}>
            <View style={styles.successIconWrap}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.successIcon}>
                <Ionicons name="star" size={38} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Merci pour votre avis !</Text>
            <Text style={styles.successSub}>
              Votre retour aide {freelancerName} et la communauté Swiple.
            </Text>
            <View style={styles.successStars}>
              {[0,1,2,3,4].map(i => (
                <Ionicons key={i} name={i < rating ? 'star' : 'star-outline'} size={24} color={i < rating ? '#F59E0B' : COLORS.border} />
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#1A1508', COLORS.bg, COLORS.bg]} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.skipText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Freelancer avatar */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarRing, { borderColor: freelancerColor + '50' }]}>
                <View style={[styles.avatarCircle, { backgroundColor: freelancerColor + '25' }]}>
                  <Text style={[styles.avatarInitials, { color: freelancerColor }]}>{freelancerInitials}</Text>
                </View>
              </View>
              <Text style={styles.avatarName}>{freelancerName}</Text>
              <Text style={styles.avatarSpecialty}>{freelancer?.specialty ?? 'Freelance créatif'}</Text>
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.titleMain}>Comment s'est passée</Text>
              <Text style={styles.titleMain}>la collaboration ?</Text>
              <Text style={styles.titleSub}>
                Mission : {mission?.title ?? 'Hook Instagram'} · {mission?.type ?? 'Vidéo'}
              </Text>
            </View>

            {/* Stars */}
            <StarRow rating={rating} onChange={setRating} />

            {rating > 0 && (
              <Animated.Text style={styles.starLabel}>
                {STAR_LABELS[rating]}
              </Animated.Text>
            )}

            {/* Quick tags */}
            {rating >= 4 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagsTitle}>Ce qui vous a marqué :</Text>
                <View style={styles.tagsWrap}>
                  {QUICK_TAGS.map(tag => {
                    const active = selectedTags.includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.tagChip, active && styles.tagChipActive]}
                        onPress={() => toggleTag(tag.id)}
                        activeOpacity={0.8}
                      >
                        {active && (
                          <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>{tag.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Comment */}
            {rating > 0 && (
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  Commentaire <Text style={styles.commentOptional}>(optionnel)</Text>
                </Text>
                <View style={styles.commentBox}>
                  <TextInput
                    style={styles.commentInput}
                    value={comment}
                    onChangeText={setComment}
                    placeholder={
                      rating >= 4
                        ? 'Partagez votre expérience positive...'
                        : rating === 3
                        ? 'Qu\'est-ce qui aurait pu être mieux ?'
                        : 'Expliquez ce qui n\'a pas fonctionné...'
                    }
                    placeholderTextColor={COLORS.textLight}
                    multiline
                    maxLength={300}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{comment.length}/300</Text>
                </View>
              </View>
            )}

            {/* Anonymity note */}
            {rating > 0 && (
              <View style={styles.anonNote}>
                <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.textLight} />
                <Text style={styles.anonText}>Votre avis sera publié avec votre prénom uniquement</Text>
              </View>
            )}

            <View style={{ height: 120 }} />
          </Animated.View>
        </ScrollView>

        {/* CTA sticky */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={canSubmit ? 0.88 : 1}
          >
            {canSubmit ? (
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitGrad}
              >
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.submitText}>Publier mon avis</Text>
              </LinearGradient>
            ) : (
              <View style={styles.submitGrad}>
                <Ionicons name="star-outline" size={16} color={COLORS.textLight} />
                <Text style={[styles.submitText, { color: COLORS.textLight }]}>Sélectionnez une note</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 4 : 16,
    paddingBottom: SPACING.sm,
  },
  skipText: { fontSize: 14, ...FONT.medium, color: COLORS.textMuted },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 26, ...FONT.bold },
  avatarName: { fontSize: 18, ...FONT.bold, color: COLORS.text, marginBottom: 4 },
  avatarSpecialty: { fontSize: 12, color: COLORS.textMuted },

  // Title
  titleSection: { alignItems: 'center', marginBottom: SPACING.lg },
  titleMain: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', lineHeight: 30 },
  titleSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },

  // Stars
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.sm },
  starLabel: { textAlign: 'center', fontSize: 16, ...FONT.semibold, color: '#F59E0B', marginBottom: SPACING.lg },

  // Tags
  tagsSection: { marginBottom: SPACING.lg },
  tagsTitle: { fontSize: 13, ...FONT.semibold, color: COLORS.textMuted, marginBottom: SPACING.sm },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.card, overflow: 'hidden', position: 'relative',
  },
  tagChipActive: { borderColor: 'transparent' },
  tagLabel: { fontSize: 13, ...FONT.medium, color: COLORS.textMuted },
  tagLabelActive: { color: '#fff' },

  // Comment
  commentSection: { marginBottom: SPACING.sm },
  commentLabel: { fontSize: 13, ...FONT.semibold, color: COLORS.textMuted, marginBottom: SPACING.sm },
  commentOptional: { ...FONT.regular, color: COLORS.textLight },
  commentBox: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  commentInput: {
    color: COLORS.text, fontSize: 14, minHeight: 90, lineHeight: 20,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: COLORS.textLight, marginTop: 4 },

  // Anon note
  anonNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: SPACING.md, paddingHorizontal: 2,
  },
  anonText: { fontSize: 11, color: COLORS.textLight },

  // CTA
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
  },
  submitBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  submitBtnDisabled: { opacity: 0.5 },
  submitGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
    backgroundColor: COLORS.card,
  },
  submitText: { fontSize: 15, ...FONT.bold, color: '#fff' },

  // Success
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  successIconWrap: { ...SHADOW.md, marginBottom: SPACING.md },
  successIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  successSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  successStars: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
});
