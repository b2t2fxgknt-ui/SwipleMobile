/**
 * BriefCreationScreen.js — Formulaire 3 étapes pour poster un brief.
 * Étape 1 : Type de contenu
 * Étape 2 : Projet (activité, audience, sujet, ton)
 * Étape 3 : Budget & délais
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW, FONT } from '../../lib/theme';
import { useBriefs } from '../../lib/BriefsContext';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 3;

// ── Données statiques ─────────────────────────────────────────────────────────

const TYPES = [
  {
    key: 'Script seul',
    icon: 'document-text-outline',
    color: '#8B5CF6',
    price: '25€ – 100€',
    desc: 'Vous recevez le script clé-en-main, vous filmez et montez vous-même.',
  },
  {
    key: 'Script + Montage',
    icon: 'videocam-outline',
    color: '#EF4444',
    price: '80€ – 200€',
    desc: 'Script + montage professionnel. Vous n\'avez plus qu\'à publier.',
  },
  {
    key: 'Pack mensuel',
    icon: 'calendar-outline',
    color: '#10B981',
    price: '300€ – 600€',
    desc: 'Collaboration mensuelle : scripts + montages livrés chaque semaine.',
  },
];

const TONES = ['Cash', 'Pédagogique', 'Inspirant', 'Humour', 'Percutant', 'Doux'];
const DEADLINES = ['24h', '48h', '72h', '5j', '1 sem'];
const POSTS_OPTIONS = [2, 4, 6, 8, 12];

// ── Indicateur de progression ─────────────────────────────────────────────────

function StepDots({ step }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]}
        />
      ))}
    </View>
  );
}

// ── Étape 1 : Type ────────────────────────────────────────────────────────────

function Step1({ form, setForm }) {
  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Quel type de contenu ?</Text>
      <Text style={styles.stepSub}>Choisissez le format qui correspond à votre besoin.</Text>

      <View style={styles.typeCards}>
        {TYPES.map(t => {
          const selected = form.type === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeCard, selected && { borderColor: t.color, backgroundColor: t.color + '10' }]}
              onPress={() => { setForm(f => ({ ...f, type: t.key })); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <View style={[styles.typeIconBox, { backgroundColor: t.color + '20', borderColor: t.color + '40' }]}>
                <Ionicons name={t.icon} size={24} color={t.color} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.typeCardName, selected && { color: t.color }]}>{t.key}</Text>
                <Text style={styles.typeCardPrice}>{t.price}</Text>
                <Text style={styles.typeCardDesc}>{t.desc}</Text>
              </View>
              {selected && (
                <View style={[styles.typeCheck, { backgroundColor: t.color }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Étape 2 : Projet ──────────────────────────────────────────────────────────

function Step2({ form, setForm }) {
  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Décrivez votre projet</Text>
      <Text style={styles.stepSub}>Ces infos permettent au ghostwriter de créer du contenu sur-mesure.</Text>

      <View style={styles.fields}>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Votre activité</Text>
          <TextInput
            style={styles.input}
            value={form.activity}
            onChangeText={v => setForm(f => ({ ...f, activity: v }))}
            placeholder="Ex : Coach business pour femmes entrepreneures"
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Audience cible</Text>
          <TextInput
            style={styles.input}
            value={form.audience}
            onChangeText={v => setForm(f => ({ ...f, audience: v }))}
            placeholder="Ex : Femmes 30-45 ans qui veulent quitter leur CDI"
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Sujet à traiter</Text>
          <TextInput
            style={styles.input}
            value={form.subject}
            onChangeText={v => setForm(f => ({ ...f, subject: v }))}
            placeholder="Ex : Comment se lancer sans quitter son job"
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ton de voix</Text>
          <View style={styles.toneChips}>
            {TONES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.toneChip, form.tone === t && styles.toneChipActive]}
                onPress={() => { setForm(f => ({ ...f, tone: t })); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.toneChipText, form.tone === t && styles.toneChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={form.tone && !TONES.includes(form.tone) ? form.tone : ''}
            onChangeText={v => setForm(f => ({ ...f, tone: v }))}
            placeholder="Ou décrivez le ton librement…"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

      </View>
    </ScrollView>
  );
}

// ── Étape 3 : Budget & délais ─────────────────────────────────────────────────

function Step3({ form, setForm }) {
  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Budget & délais</Text>
      <Text style={styles.stepSub}>Définissez votre enveloppe et le rythme de publication.</Text>

      <View style={styles.fields}>

        {/* Budget */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Budget (€)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.budget}
              onChangeText={v => setForm(f => ({ ...f, budget: v }))}
              placeholder="Ex : 150"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <View style={styles.inputSuffix}>
              <Text style={styles.inputSuffixText}>€</Text>
            </View>
          </View>
        </View>

        {/* Délai */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Délai de livraison</Text>
          <View style={styles.toneChips}>
            {DEADLINES.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.toneChip, form.deadline === d && styles.toneChipActive]}
                onPress={() => { setForm(f => ({ ...f, deadline: d })); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.toneChipText, form.deadline === d && styles.toneChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vidéos/mois */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Vidéos par mois</Text>
          <View style={styles.toneChips}>
            {POSTS_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.toneChip, form.postsPerMonth === n && styles.toneChipActive]}
                onPress={() => { setForm(f => ({ ...f, postsPerMonth: n })); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.toneChipText, form.postsPerMonth === n && styles.toneChipTextActive]}>{n}/mois</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plateforme */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Plateforme</Text>
          <View style={styles.toneChips}>
            {['TikTok', 'Instagram', 'TikTok + Instagram'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.toneChip, form.platform === p && styles.toneChipActive]}
                onPress={() => { setForm(f => ({ ...f, platform: p })); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.toneChipText, form.platform === p && styles.toneChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

const INITIAL_FORM = {
  type: '',
  activity: '', audience: '', subject: '', tone: '',
  budget: '', deadline: '', postsPerMonth: 4, platform: 'TikTok',
};

function isStepValid(step, form) {
  if (step === 1) return !!form.type;
  if (step === 2) return !!form.activity && !!form.audience && !!form.subject && !!form.tone;
  if (step === 3) return !!form.budget && !!form.deadline;
  return false;
}

export default function BriefCreationScreen() {
  const navigation = useNavigation();
  const { postBrief } = useBriefs();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const slideAnim = useRef(new Animated.Value(0)).current;

  function goNext() {
    if (!isStepValid(step, form)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < TOTAL_STEPS) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -width, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setStep(s => s + 1);
        slideAnim.setValue(width);
        Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }).start();
      });
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    if (step === 1) { navigation.goBack(); return; }
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: width, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s - 1);
      slideAnim.setValue(-width);
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }).start();
    });
  }

  function handleSubmit() {
    const brief = {
      ...form,
      title: `Brief ${form.type} — ${form.activity.slice(0, 40)}`,
      budget: Number(form.budget) || 0,
    };
    postBrief(brief);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  const valid = isStepValid(step, form);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Nouveau brief</Text>
            <StepDots step={step} />
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* ── Contenu animé ── */}
        <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideAnim }] }]}>
          {step === 1 && <Step1 form={form} setForm={setForm} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && <Step3 form={form} setForm={setForm} />}
        </Animated.View>

        {/* ── Bouton suivant / publier ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !valid && styles.nextBtnDisabled]}
            onPress={goNext}
            activeOpacity={valid ? 0.85 : 1}
          >
            <LinearGradient
              colors={valid ? [COLORS.primary, '#5B21B6'] : [COLORS.border, COLORS.border]}
              style={styles.nextBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.nextBtnText, !valid && { color: COLORS.textMuted }]}>
                {step < TOTAL_STEPS ? 'Continuer' : 'Publier mon brief'}
              </Text>
              <Ionicons
                name={step < TOTAL_STEPS ? 'arrow-forward' : 'checkmark'}
                size={18}
                color={valid ? '#fff' : COLORS.textMuted}
              />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.footerHint}>Étape {step} sur {TOTAL_STEPS}</Text>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },

  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  dotDone:   { backgroundColor: COLORS.primary + '60' },

  stepWrap:    { flex: 1 },
  stepScroll:  { flex: 1 },
  stepContent: { padding: SPACING.lg, paddingTop: SPACING.md, gap: 20, paddingBottom: 40 },

  stepTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  stepSub:   { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginTop: -8 },

  // Type cards
  typeCards: { gap: 12 },
  typeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md,
  },
  typeIconBox:  { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  typeCardName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  typeCardPrice:{ fontSize: 12, fontWeight: '700', color: '#22C55E' },
  typeCardDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginTop: 1 },
  typeCheck:    { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Fields
  fields: { gap: 18 },
  field:  { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, letterSpacing: 0.2 },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14, lineHeight: 20,
  },
  inputRow:      { flexDirection: 'row', gap: 0 },
  inputSuffix:   { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 0, borderTopRightRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  inputSuffixText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },

  // Tone chips
  toneChips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toneChip:         { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.card },
  toneChipActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  toneChipText:     { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  toneChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Footer
  footer:         { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, paddingTop: SPACING.sm, gap: 8 },
  nextBtn:        { borderRadius: RADIUS.lg, overflow: 'hidden' },
  nextBtnDisabled:{ opacity: 0.5 },
  nextBtnGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  nextBtnText:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  footerHint:     { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});
