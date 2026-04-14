/**
 * InfluencerOnboardingScreen.js — rebrandé en Client Onboarding
 * Wizard de création de profil client (entrepreneur / coach) — 6 étapes.
 * 0 Identité → 1 Ton activité → 2 Ton audience
 *            → 3 Tes objectifs TikTok → 4 Budget & volume → 5 Compte
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Platform, KeyboardAvoidingView,
  StatusBar, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width } = Dimensions.get('window');
const ACCENT      = COLORS.acheteur; // #3B82F6
const TOTAL_STEPS = 6;

// ── Data ───────────────────────────────────────────────────────────────────────

// Types d'activité / business
const ACTIVITY_TYPES = [
  { id: 'coach_business',  label: 'Coach business',       icon: 'briefcase-outline'       },
  { id: 'formateur',       label: 'Formateur / E-learning',icon: 'school-outline'          },
  { id: 'therapeute',      label: 'Thérapeute / Bien-être',icon: 'leaf-outline'            },
  { id: 'avocat',          label: 'Avocat / Juriste',      icon: 'shield-outline'          },
  { id: 'nutritionniste',  label: 'Nutritionniste',        icon: 'fitness-outline'         },
  { id: 'consultant',      label: 'Consultant / Expert',   icon: 'analytics-outline'       },
  { id: 'finance',         label: 'Finance / Investissement',icon: 'trending-up-outline'   },
  { id: 'immobilier',      label: 'Immobilier',            icon: 'home-outline'            },
  { id: 'ecommerce',       label: 'E-commerce / Marque',   icon: 'storefront-outline'      },
  { id: 'artisan',         label: 'Artisan / Créateur',    icon: 'hammer-outline'          },
  { id: 'food',            label: 'Food / Restaurant',     icon: 'restaurant-outline'      },
  { id: 'autre',           label: 'Autre activité',        icon: 'ellipsis-horizontal-outline' },
];

// Audiences cibles
const AUDIENCES = [
  { id: 'entrepreneurs',  label: 'Entrepreneurs',          icon: 'rocket-outline'          },
  { id: 'salaries',       label: 'Salariés / Cadres',      icon: 'person-outline'          },
  { id: 'femmes',         label: 'Femmes',                 icon: 'heart-outline'           },
  { id: 'jeunes',         label: 'Jeunes 18–30 ans',       icon: 'school-outline'          },
  { id: 'parents',        label: 'Parents',                icon: 'people-outline'          },
  { id: 'sportifs',       label: 'Sportifs',               icon: 'fitness-outline'         },
  { id: 'investisseurs',  label: 'Investisseurs',          icon: 'cash-outline'            },
  { id: 'professions',    label: 'Professions libérales',  icon: 'briefcase-outline'       },
  { id: 'etudiants',      label: 'Étudiants',              icon: 'book-outline'            },
  { id: 'seniors',        label: 'Seniors 50+',            icon: 'star-outline'            },
];

// Phase TikTok du client
const TIKTOK_STAGES = [
  { id: 'none',    label: 'Pas encore de compte',  sub: 'Je démarre',     icon: 'add-circle-outline', color: '#6B7280' },
  { id: 'new',     label: '< 1 000 abonnés',       sub: 'Tout début',     icon: 'leaf-outline',       color: '#22C55E' },
  { id: 'growing', label: '1K – 10K abonnés',      sub: 'En croissance',  icon: 'trending-up-outline',color: '#3B82F6' },
  { id: 'active',  label: '10K – 100K abonnés',    sub: 'Actif',          icon: 'star-outline',       color: '#8B5CF6' },
  { id: 'big',     label: '100K+ abonnés',         sub: 'Établi',         icon: 'flash-outline',      color: '#F59E0B' },
];

// Objectifs TikTok
const GOALS = [
  { id: 'notoriete',   label: 'Développer ma notoriété',     icon: 'megaphone-outline'       },
  { id: 'leads',       label: 'Générer des leads',            icon: 'funnel-outline'          },
  { id: 'ventes',      label: 'Vendre mes offres',            icon: 'cash-outline'            },
  { id: 'recrutement', label: 'Recruter des clients',         icon: 'person-add-outline'      },
  { id: 'communaute',  label: 'Fédérer une communauté',       icon: 'people-outline'          },
  { id: 'consistance', label: 'Publier régulièrement',        icon: 'calendar-outline'        },
  { id: 'expert',      label: 'Me positionner en expert',     icon: 'diamond-outline'         },
  { id: 'viral',       label: 'Viraliser mon contenu',        icon: 'flash-outline'           },
];

// Budget mensuel pour le ghostwriting
const BUDGET_RANGES = [
  { id: 'b50',    label: '< 50€ / mois',      sub: 'Script ponctuel'   },
  { id: 'b100',   label: '50 – 150€ / mois',  sub: 'Script régulier'   },
  { id: 'b300',   label: '150 – 300€ / mois', sub: 'Script + montage'  },
  { id: 'b500',   label: '300 – 500€ / mois', sub: 'Pack mensuel'      },
  { id: 'b500p',  label: '500€+ / mois',       sub: 'Collaboration pro' },
];

// Fréquence de publication souhaitée
const PUBLISH_FREQ = [
  { id: '1pw',   label: '1 vidéo / semaine',  icon: 'calendar-outline'  },
  { id: '2pw',   label: '2–3 / semaine',      icon: 'repeat-outline'    },
  { id: 'daily', label: 'Tous les jours',     icon: 'flash-outline'     },
  { id: 'month', label: 'Quelques / mois',    icon: 'hourglass-outline' },
];

const AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#EF4444', '#06B6D4', '#84CC16',
];

const STEP_LABELS = ['Identité', 'Activité', 'Audience', 'Objectifs', 'Budget', 'Compte'];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepProgress({ current }) {
  return (
    <View style={pg.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            pg.seg,
            i < current   && { backgroundColor: ACCENT },
            i === current && { backgroundColor: ACCENT + '80', height: 4 },
            i > current   && { backgroundColor: COLORS.border },
          ]}
        />
      ))}
    </View>
  );
}
const pg = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  seg: { flex: 1, height: 3, borderRadius: 2 },
});

function Chip({ label, selected, onPress, color = ACCENT, icon, sub }) {
  return (
    <TouchableOpacity
      style={[ch.base, selected && { borderColor: color, backgroundColor: color + '18' }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {icon && <Ionicons name={icon} size={12} color={selected ? color : COLORS.textMuted} />}
      <Text style={[ch.label, selected && { color }]}>{label}</Text>
      {sub && <Text style={[ch.sub, selected && { color: color + 'AA' }]}>{sub}</Text>}
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  base:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: COLORS.card },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  sub:   { fontSize: 10, color: COLORS.textLight },
});

function Field({ label, hint, children }) {
  return (
    <View style={fl.group}>
      <View style={fl.row}>
        <Text style={fl.label}>{label}</Text>
        {hint ? <Text style={fl.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
const fl = StyleSheet.create({
  group: { marginBottom: SPACING.md },
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  hint:  { fontSize: 11, color: COLORS.textLight },
});

function StyledInput({ focused, style, ...rest }) {
  return (
    <TextInput
      style={[ii.base, focused && ii.focused, style]}
      placeholderTextColor={COLORS.textLight}
      selectionColor={ACCENT}
      {...rest}
    />
  );
}
const ii = StyleSheet.create({
  base:   { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text },
  focused:{ borderColor: ACCENT },
});

function SLabel({ text }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 10, marginTop: 6 }}>
      {text}
    </Text>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function InfluencerOnboardingScreen() {
  const navigation = useNavigation();
  const panelX     = useRef(new Animated.Value(0)).current;

  const [step,    setStep]    = useState(0);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Step 0 — Identité
  const [pseudo,       setPseudo]       = useState('');
  const [handle,       setHandle]       = useState(''); // @moncreateur
  const [tagline,      setTagline]      = useState('');
  const [avatarColor,  setAvatarColor]  = useState(AVATAR_COLORS[0]);

  // ── Step 1 — Activité
  const [activityType,  setActivityType]  = useState(null);
  const [activityDesc,  setActivityDesc]  = useState('');

  // ── Step 2 — Audience
  const [audiences,    setAudiences]    = useState([]);
  const [tiktokStage,  setTiktokStage]  = useState(null);

  // ── Step 3 — Objectifs
  const [goals,        setGoals]        = useState([]);
  const [publishFreq,  setPublishFreq]  = useState(null);

  // ── Step 4 — Budget & Volume
  const [budget,       setBudget]       = useState(null);
  const [postsPerMonth, setPostsPerMonth] = useState(null);

  // ── Step 5 — Compte
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [agreed,   setAgreed]   = useState(false);

  // Initiales
  const initials = pseudo.trim()
    ? pseudo.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // ── Navigation ──────────────────────────────────────────────────────────────
  function slide(target, dir = 'forward') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const outX = dir === 'forward' ? -width : width;
    const inX  = dir === 'forward' ?  width * 0.55 : -width * 0.55;
    Animated.timing(panelX, { toValue: outX, duration: 210, useNativeDriver: true }).start(() => {
      setStep(target);
      panelX.setValue(inX);
      Animated.timing(panelX, { toValue: 0, duration: 270, useNativeDriver: true }).start();
    });
  }

  function goBack() {
    if (step === 0) { navigation.goBack(); return; }
    slide(step - 1, 'backward');
  }

  function goNext() {
    if (!validate()) return;
    if (step < TOTAL_STEPS - 1) slide(step + 1);
    else handleRegister();
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    switch (step) {
      case 0:
        if (!pseudo.trim()) { Alert.alert('Pseudo requis', 'Entre ton nom ou pseudo créateur.'); return false; }
        return true;
      case 1:
        if (!activityType) { Alert.alert('Activité requise', 'Sélectionne ton type d\'activité.'); return false; }
        return true;
      case 2:
        if (audiences.length === 0) { Alert.alert('Audience requise', 'Sélectionne au moins une audience cible.'); return false; }
        return true;
      case 3:
        if (goals.length === 0) { Alert.alert('Objectifs requis', 'Sélectionne au moins un objectif TikTok.'); return false; }
        return true;
      case 4:
        if (!budget) { Alert.alert('Budget requis', 'Indique ton budget mensuel.'); return false; }
        return true;
      case 5:
        if (!email.trim()) { Alert.alert('Email requis'); return false; }
        if (!password || password.length < 6) { Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.'); return false; }
        if (!agreed) { Alert.alert('CGU requises', 'Accepte les conditions pour créer ton compte.'); return false; }
        return true;
    }
    return true;
  }

  // ── Inscription ─────────────────────────────────────────────────────────────
  async function handleRegister() {
    setLoading(true);

    const meta = {
      role:          'acheteur',
      nom:           pseudo.trim(),
      handle:        handle.trim(),
      tagline:       tagline.trim(),
      avatarColor,
      activityType,
      activityDesc:  activityDesc.trim(),
      audiences,
      tiktokStage,
      goals,
      publishFreq,
      budget,
      postsPerMonth,
      initials,
    };

    const { error: upErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: meta },
    });

    if (upErr) {
      setLoading(false);
      Alert.alert('Erreur inscription', upErr.message);
      return;
    }

    const { error: inErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (inErr) {
      Alert.alert(
        'Confirme ton email ✉️',
        `Un lien d'activation a été envoyé à ${email.trim()}. Clique dessus pour accéder à ton compte.`,
        [{ text: 'OK' }]
      );
    }
    // onAuthStateChange → navigate automatiquement
  }

  // ── Toggle helpers ───────────────────────────────────────────────────────────
  function toggle(arr, setArr, id) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setArr(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function pick(setter, id) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(id);
  }
  function foc(key) {
    return { focused: focused === key, onFocus: () => setFocused(key), onBlur: () => setFocused(null) };
  }

  // ── Steps ────────────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 0: return <Step0 />;
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      case 5: return <Step5 />;
    }
  }

  // ── 0 · Identité ────────────────────────────────────────────────────────────
  function Step0() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Qui es-tu ?</Text>
        <Text style={s.stepSub}>Ces infos constituent ton profil client visible par les ghostwriters.</Text>

        {/* Avatar preview + color picker */}
        <View style={s.avatarRow}>
          <View style={[s.avatarCircle, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '66' }]}>
            <Text style={[s.avatarInitials, { color: avatarColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.avatarHint}>Couleur de ton avatar client</Text>
            <View style={s.colorRow}>
              {AVATAR_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.colorSwatch, { backgroundColor: c }, avatarColor === c && s.colorSwatchSel]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAvatarColor(c); }}
                />
              ))}
            </View>
          </View>
        </View>

        <Field label="Ton prénom / nom de marque" hint="Obligatoire">
          <StyledInput
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Ex : Sophie Coach, Marc Consultant…"
            autoCapitalize="words"
            {...foc('ps')}
          />
        </Field>

        <Field label="Handle (compte principal)" hint="Optionnel">
          <View style={s.handleRow}>
            <View style={s.handleAt}><Text style={s.handleAtText}>@</Text></View>
            <StyledInput
              value={handle}
              onChangeText={setHandle}
              placeholder="moncompte"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              {...foc('hd')}
            />
          </View>
        </Field>

        <Field label="Ta phrase d'accroche" hint={`${tagline.length}/80`}>
          <StyledInput
            value={tagline}
            onChangeText={setTagline}
            placeholder="Ex : Coach business · Je veux des scripts TikTok qui convertissent"
            maxLength={80}
            {...foc('tl')}
          />
        </Field>
      </ScrollView>
    );
  }

  // ── 1 · Plateformes & Niche ─────────────────────────────────────────────────
  function Step1() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Ton activité</Text>
        <Text style={s.stepSub}>Quel type de business tu représentes ? Le ghostwriter va adapter son écriture à ta niche.</Text>

        <View style={s.platformGrid}>
          {ACTIVITY_TYPES.map(a => {
            const sel = activityType === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                style={[s.platformCard, sel && { borderColor: ACCENT + '80', backgroundColor: ACCENT + '12' }]}
                onPress={() => pick(setActivityType, a.id)}
                activeOpacity={0.75}
              >
                <View style={[s.platformIconBox, { backgroundColor: sel ? ACCENT + '25' : COLORS.cardElevated }]}>
                  <Ionicons name={a.icon} size={20} color={sel ? ACCENT : COLORS.textMuted} />
                </View>
                <Text style={[s.platformLabel, sel && { color: ACCENT }]}>{a.label}</Text>
                {sel && (
                  <View style={[s.platformCheck, { backgroundColor: ACCENT }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <SLabel text="PRÉCISE TON ACTIVITÉ (optionnel)" />
        <TextInput
          style={s.textInput}
          value={activityDesc}
          onChangeText={setActivityDesc}
          placeholder="Ex : Coach business pour femmes entrepreneures qui veulent quitter leur CDI"
          placeholderTextColor={COLORS.textLight}
          multiline
        />
      </ScrollView>
    );
  }

  // ── 2 · Audience ────────────────────────────────────────────────────────────
  function Step2() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Ton audience</Text>
        <Text style={s.stepSub}>Qui tu vises avec tes vidéos TikTok ? Plusieurs choix possibles.</Text>

        <View style={s.chipGrid}>
          {AUDIENCES.map(a => (
            <Chip
              key={a.id}
              label={a.label}
              icon={a.icon}
              selected={audiences.includes(a.id)}
              onPress={() => toggle(audiences, setAudiences, a.id)}
            />
          ))}
        </View>

        <SLabel text="OÙ EN ES-TU SUR TIKTOK ?" />
        <View style={s.followerGrid}>
          {TIKTOK_STAGES.map(r => {
            const sel = tiktokStage === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[s.followerCard, sel && { borderColor: r.color, backgroundColor: r.color + '12' }]}
                onPress={() => pick(setTiktokStage, r.id)}
                activeOpacity={0.75}
              >
                <Ionicons name={r.icon} size={20} color={sel ? r.color : COLORS.textMuted} />
                <Text style={[s.followerLabel, sel && { color: r.color }]}>{r.label}</Text>
                <Text style={s.followerSub}>{r.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ── 3 · Objectifs TikTok ────────────────────────────────────────────────────
  function Step3() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Tes objectifs TikTok</Text>
        <Text style={s.stepSub}>Qu'attends-tu de ton contenu TikTok ? Sélectionne tes priorités.</Text>

        <View style={s.chipGrid}>
          {GOALS.map(g => (
            <Chip
              key={g.id}
              label={g.label}
              icon={g.icon}
              selected={goals.includes(g.id)}
              onPress={() => toggle(goals, setGoals, g.id)}
            />
          ))}
        </View>

        <SLabel text="FRÉQUENCE DE PUBLICATION SOUHAITÉE" />
        <View style={s.freqRow}>
          {PUBLISH_FREQ.map(f => {
            const sel = publishFreq === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[s.freqCard, sel && { borderColor: ACCENT, backgroundColor: ACCENT + '12' }]}
                onPress={() => pick(setPublishFreq, f.id)}
                activeOpacity={0.75}
              >
                <Ionicons name={f.icon} size={18} color={sel ? ACCENT : COLORS.textMuted} />
                <Text style={[s.freqLabel, sel && { color: ACCENT }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ── 4 · Budget & Volume ─────────────────────────────────────────────────────
  function Step4() {
    const selBudget = BUDGET_RANGES.find(b => b.id === budget);
    const POSTS_OPTIONS = [2, 4, 6, 8, 12];
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Budget & volume</Text>
        <Text style={s.stepSub}>Ces infos permettent aux ghostwriters de te proposer l'offre adaptée.</Text>

        <SLabel text="BUDGET MENSUEL POUR LE GHOSTWRITING" />
        <View style={s.budgetGrid}>
          {BUDGET_RANGES.map(b => {
            const sel = budget === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[s.budgetCard, sel && { borderColor: ACCENT, backgroundColor: ACCENT + '14' }]}
                onPress={() => pick(setBudget, b.id)}
                activeOpacity={0.75}
              >
                <Text style={[s.budgetLabel, sel && { color: ACCENT }]}>{b.label}</Text>
                <Text style={s.budgetSub}>{b.sub}</Text>
                {sel && <Ionicons name="checkmark-circle" size={16} color={ACCENT} style={s.budgetCheck} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <SLabel text="NOMBRE DE VIDÉOS PAR MOIS" />
        <View style={s.chipGrid}>
          {POSTS_OPTIONS.map(n => (
            <Chip
              key={n}
              label={`${n} vidéos/mois`}
              selected={postsPerMonth === n}
              onPress={() => pick(setPostsPerMonth, n)}
            />
          ))}
        </View>

        {/* Preview carte profil client */}
        {pseudo.trim() && (
          <View style={{ marginTop: SPACING.sm }}>
            <SLabel text="APERÇU DE TON PROFIL CLIENT" />
            <View style={s.previewCard}>
              <LinearGradient colors={[avatarColor + '14', 'transparent']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
              <View style={[s.previewAvatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '55' }]}>
                <Text style={[s.previewInitials, { color: avatarColor }]}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{pseudo}</Text>
                <Text style={s.previewTagline} numberOfLines={1}>
                  {ACTIVITY_TYPES.find(a => a.id === activityType)?.label ?? 'Entrepreneur · Client'}
                </Text>
                <View style={s.previewPillsRow}>
                  {selBudget && (
                    <View style={s.previewFollowerPill}>
                      <Ionicons name="cash-outline" size={10} color={ACCENT} />
                      <Text style={s.previewFollowerText}>{selBudget.label}</Text>
                    </View>
                  )}
                  {postsPerMonth && (
                    <View style={[s.previewFollowerPill, { marginLeft: 4 }]}>
                      <Ionicons name="film-outline" size={10} color={ACCENT} />
                      <Text style={s.previewFollowerText}>{postsPerMonth} vidéos/mois</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── 5 · Compte ──────────────────────────────────────────────────────────────
  function Step5() {
    const selBudget   = BUDGET_RANGES.find(b => b.id === budget);
    const selActivity = ACTIVITY_TYPES.find(a => a.id === activityType);

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Créer mon compte</Text>
          <Text style={s.stepSub}>Ton profil client sera actif immédiatement après inscription.</Text>

          {/* Récapitulatif client */}
          <View style={s.recapCard}>
            <LinearGradient colors={[avatarColor + '14', 'transparent']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
            <View style={[s.recapAvatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '55' }]}>
              <Text style={[s.recapInitials, { color: avatarColor }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text style={s.recapName}>{pseudo}</Text>
                {handle ? <Text style={s.recapHandle}>@{handle}</Text> : null}
              </View>
              <Text style={s.recapTagline} numberOfLines={1}>
                {tagline || (selActivity?.label ?? 'Entrepreneur · Client')}
              </Text>
              <View style={s.recapRow}>
                {selActivity && (
                  <View style={[s.recapPlatformBadge, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '12' }]}>
                    <Ionicons name={selActivity.icon} size={9} color={ACCENT} />
                    <Text style={[s.recapPlatformText, { color: ACCENT }]}>{selActivity.label}</Text>
                  </View>
                )}
                {selBudget && (
                  <View style={[s.recapPlatformBadge, { borderColor: '#22C55E40', backgroundColor: '#22C55E12', marginLeft: 4 }]}>
                    <Ionicons name="cash-outline" size={9} color="#22C55E" />
                    <Text style={[s.recapPlatformText, { color: '#22C55E' }]}>{selBudget.label}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Résumé objectifs */}
          {goals.length > 0 && (
            <View style={s.goalsSummary}>
              <Text style={s.goalsSummaryTitle}>Tes objectifs TikTok</Text>
              <View style={s.goalsSummaryRow}>
                {goals.slice(0, 4).map(gid => {
                  const g = GOALS.find(x => x.id === gid);
                  return g ? (
                    <View key={gid} style={s.goalChip}>
                      <Ionicons name={g.icon} size={10} color={ACCENT} />
                      <Text style={s.goalChipText}>{g.label}</Text>
                    </View>
                  ) : null;
                })}
                {goals.length > 4 && <Text style={s.recapMore}>+{goals.length - 4}</Text>}
              </View>
            </View>
          )}

          <Field label="Adresse email">
            <StyledInput
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              {...foc('em')}
            />
          </Field>

          <Field label="Mot de passe" hint="Min. 6 caractères">
            <StyledInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              {...foc('pw')}
            />
          </Field>

          {/* CGU */}
          <TouchableOpacity
            style={s.agreeRow}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgreed(a => !a); }}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, agreed && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
              {agreed && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={s.agreeText}>
              J'accepte les{' '}
              <Text style={{ color: ACCENT, fontWeight: '700' }}>conditions générales</Text>
              {' '}et la{' '}
              <Text style={{ color: ACCENT, fontWeight: '700' }}>politique de confidentialité</Text>
              {' '}de Swiple
            </Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────────

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <BubbleBackground variant="acheteur" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={goBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.topLabel}>{STEP_LABELS[step]}</Text>
            <Text style={s.topCount}>{step + 1} / {TOTAL_STEPS}</Text>
          </View>
          {step > 0 && pseudo.trim() && (
            <View style={[s.topMini, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '55' }]}>
              <Text style={[s.topMiniText, { color: avatarColor }]}>{initials}</Text>
            </View>
          )}
        </View>

        {/* ── Progress ── */}
        <StepProgress current={step} />

        {/* ── Content ── */}
        <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: panelX }] }]}>
          {renderStep()}
        </Animated.View>

        {/* ── CTA ── */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.ctaBtn, loading && { opacity: 0.6 }]}
            onPress={goNext}
            activeOpacity={0.88}
            disabled={loading}
          >
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              style={s.ctaGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={s.ctaTxt}>Création en cours…</Text>
              ) : isLast ? (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#fff" />
                  <Text style={s.ctaTxt}>Créer mon compte client</Text>
                </>
              ) : (
                <>
                  <Text style={s.ctaTxt}>Continuer</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {step === 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 12 }}>
              <Text style={s.loginTxt}>
                Déjà un compte ?{'  '}
                <Text style={{ color: ACCENT, fontWeight: '700' }}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Top bar
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: SPACING.sm },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topLabel:   { fontSize: 15, fontWeight: '700', color: COLORS.text },
  topCount:   { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  topMini:    { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  topMiniText:{ fontSize: 13, fontWeight: '800' },

  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 28 },

  stepTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3, marginBottom: 6, marginTop: SPACING.xs },
  stepSub:   { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: SPACING.lg },

  // Step 0 — identité
  avatarRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  avatarCircle:   { width: 68, height: 68, borderRadius: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '900' },
  avatarHint:     { fontSize: 11, color: COLORS.textLight, marginBottom: 10 },
  colorRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch:    { width: 24, height: 24, borderRadius: 12 },
  colorSwatchSel: { borderWidth: 2.5, borderColor: '#fff' },

  handleRow:   { flexDirection: 'row', alignItems: 'center' },
  handleAt:    { backgroundColor: COLORS.cardElevated, borderWidth: 1.5, borderColor: COLORS.border, borderTopLeftRadius: RADIUS.lg, borderBottomLeftRadius: RADIUS.lg, borderRightWidth: 0, paddingHorizontal: 14, paddingVertical: 14 },
  handleAtText:{ fontSize: 16, fontWeight: '700', color: COLORS.textMuted },

  // Step 1 — plateformes
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  platformCard: {
    width: (width - SPACING.lg * 2 - 10) / 2,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 12, position: 'relative',
  },
  platformIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  platformLabel:   { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, flex: 1 },
  platformCheck:   { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  helperText: { fontSize: 12, color: COLORS.textLight, lineHeight: 18, marginBottom: SPACING.sm },

  // Step 2 — audience
  followerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  followerCard: {
    width: (width - SPACING.lg * 2 - 8) / 2 - 4,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 5,
  },
  followerLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  followerSub:   { fontSize: 10, color: COLORS.textLight },

  freqRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  freqCard:  { flex: 1, minWidth: (width - SPACING.lg * 2 - 8) / 2 - 4, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12 },
  freqLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, flex: 1 },

  // Step 3 — besoins
  needsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  needCard:  {
    width: (width - SPACING.lg * 2 - 10) / 2,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 7, position: 'relative',
  },
  needIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  needLabel:   { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  needCheck:   { position: 'absolute', top: 7, right: 7 },

  // Step 4 — budget
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  budgetCard: {
    width: (width - SPACING.lg * 2 - 8) / 2 - 4,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 4, position: 'relative',
  },
  budgetLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  budgetSub:   { fontSize: 10, color: COLORS.textLight },
  budgetCheck: { position: 'absolute', top: 8, right: 8 },

  mfreqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  mfreqCard: {
    width: (width - SPACING.lg * 2 - 8) / 2 - 4,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 4,
  },
  mfreqLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  mfreqSub:   { fontSize: 10, color: COLORS.textLight },

  // Preview carte profil
  previewCard:     { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md, flexDirection: 'row', gap: 12, overflow: 'hidden', marginBottom: SPACING.sm },
  previewAvatar:   { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  previewInitials: { fontSize: 18, fontWeight: '900' },
  previewName:     { fontSize: 14, fontWeight: '700', color: COLORS.text },
  previewHandle:   { fontSize: 11, color: COLORS.textLight },
  previewTagline:  { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  previewPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  previewPlatformPill:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  previewPlatformText:  { fontSize: 9, fontWeight: '700' },
  previewFollowerPill:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: ACCENT + '15', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  previewFollowerText:  { fontSize: 9, fontWeight: '700', color: ACCENT },
  previewBudget:   { fontSize: 10, color: COLORS.textLight, marginTop: 2 },

  // Step 5 — recap
  recapCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: ACCENT + '35', borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, overflow: 'hidden' },
  recapAvatar:     { width: 54, height: 54, borderRadius: 27, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  recapInitials:   { fontSize: 20, fontWeight: '900' },
  recapName:       { fontSize: 15, fontWeight: '800', color: COLORS.text },
  recapHandle:     { fontSize: 11, color: COLORS.textLight },
  recapTagline:    { fontSize: 11, color: COLORS.textMuted, marginBottom: 5 },
  recapRow:        { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  recapPlatformBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 },
  recapPlatformText:   { fontSize: 9, fontWeight: '700' },
  recapMore:       { fontSize: 10, color: COLORS.textLight },
  recapRight:      { alignItems: 'center', paddingLeft: 4 },
  recapFollowerVal:{ fontSize: 14, fontWeight: '900' },
  recapFollowerSub:{ fontSize: 9, color: COLORS.textLight },
  recapBudgetTxt:  { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  goalsSummary:     { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12, marginBottom: SPACING.md },
  goalsSummaryTitle:{ fontSize: 11, fontWeight: '700', color: COLORS.textLight, marginBottom: 8 },
  goalsSummaryRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  goalChip:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ACCENT + '14', borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4 },
  goalChipText:     { fontSize: 10, fontWeight: '600', color: ACCENT },

  // CGU
  agreeRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  checkbox:  { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  agreeText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  // Bottom bar
  bottomBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg + 'F0' },
  ctaBtn:    { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  ctaGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  ctaTxt:    { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  loginTxt:  { textAlign: 'center', fontSize: 13, color: COLORS.textLight },
});
