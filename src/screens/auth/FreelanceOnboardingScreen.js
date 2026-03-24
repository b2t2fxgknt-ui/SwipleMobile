/**
 * FreelanceOnboardingScreen.js
 * Wizard de création de profil freelance — 6 étapes.
 * 0 Identité → 1 Domaines → 2 Compétences & Tarifs → 3 Présentation → 4 Portfolio → 5 Compte
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
const ACCENT       = COLORS.prestataire; // #10B981
const TOTAL_STEPS  = 6;

// ── Data ───────────────────────────────────────────────────────────────────────

const DOMAINS = [
  { id: 'tiktok',   label: 'TikTok / Reels',  icon: 'phone-portrait-outline' },
  { id: 'video',    label: 'Vidéo & Montage',  icon: 'film-outline'           },
  { id: 'hook',     label: 'Hook & Script',    icon: 'flash-outline'          },
  { id: 'caption',  label: 'Sous-titres',      icon: 'text-outline'           },
  { id: 'voice',    label: 'Voix & VO',        icon: 'mic-outline'            },
  { id: 'motion',   label: 'Motion Design',    icon: 'layers-outline'         },
  { id: 'design',   label: 'Design & UI/UX',   icon: 'brush-outline'          },
  { id: 'copy',     label: 'Copywriting',      icon: 'create-outline'         },
  { id: 'social',   label: 'Social Media',     icon: 'share-social-outline'   },
  { id: 'photo',    label: 'Photo & Visuel',   icon: 'camera-outline'         },
  { id: 'audio',    label: 'Audio & Podcast',  icon: 'musical-notes-outline'  },
  { id: 'data',     label: 'Data & Analytics', icon: 'bar-chart-outline'      },
];

const LEVELS = [
  { id: 'junior',   label: 'Junior',    sub: '0–2 ans', icon: 'leaf-outline',         color: '#22C55E' },
  { id: 'confirme', label: 'Confirmé',  sub: '3–5 ans', icon: 'trending-up-outline',  color: '#3B82F6' },
  { id: 'expert',   label: 'Expert',    sub: '6+ ans',  icon: 'diamond-outline',      color: '#8B5CF6' },
];

const SKILLS_POOL = [
  'Hook 0–3s', 'Script viral', 'Montage TikTok', 'CapCut Pro', 'Premiere Pro',
  'After Effects', 'Sous-titres animés', 'Son trending', 'Color grading',
  'Rétention', 'Watch time', 'Accroche TikTok', 'Distribution', 'Miniatures',
  'Voix off', 'Storytelling', 'Format court', 'Podcast', 'Pub vidéo',
  'UGC Content', 'Reels Instagram', 'YouTube Shorts', 'Transitions créatives',
];

const AVATAR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

const DELIVERY_OPTIONS = ['12h', '24h', '48h', '72h', '1 semaine'];
const RESPONSE_OPTIONS  = ['< 1h', '2h', '4h', '12h', '24h'];
const PROJECT_EMOJIS    = ['🎬', '🎯', '📱', '✏️', '🎵', '📊', '🚀', '⚡', '🌟', '💡'];

const STEP_LABELS = ['Identité', 'Domaines', 'Compétences', 'Présentation', 'Portfolio', 'Compte'];

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Barre de progression segmentée */
function StepProgress({ current }) {
  return (
    <View style={pg.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            pg.seg,
            i < current  && { backgroundColor: ACCENT },
            i === current && { backgroundColor: ACCENT + '80', height: 4 },
            i > current  && { backgroundColor: COLORS.border },
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

/** Chip sélectionnable */
function Chip({ label, selected, onPress, color = ACCENT, icon }) {
  return (
    <TouchableOpacity
      style={[ch.base, selected && { borderColor: color, backgroundColor: color + '18' }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {icon && <Ionicons name={icon} size={12} color={selected ? color : COLORS.textMuted} />}
      <Text style={[ch.label, selected && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  base:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: COLORS.card },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
});

/** Groupe champ label + input */
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

/** Input stylisé */
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

/** Label de section */
function SLabel({ text }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 10, marginTop: 6 }}>
      {text}
    </Text>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function FreelanceOnboardingScreen() {
  const navigation = useNavigation();
  const panelX     = useRef(new Animated.Value(0)).current;

  const [step,    setStep]    = useState(0);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Step 0 — Identité
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [specialty,   setSpecialty]   = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[2]);

  // ── Step 1 — Domaines & Niveau
  const [domains, setDomains] = useState([]);
  const [level,   setLevel]   = useState(null);

  // ── Step 2 — Compétences & Tarifs
  const [skills,       setSkills]       = useState([]);
  const [price,        setPrice]        = useState('');
  const [deliveryTime, setDeliveryTime] = useState('24h');
  const [responseTime, setResponseTime] = useState('< 1h');

  // ── Step 3 — Présentation
  const [bio,          setBio]          = useState('');
  const [problem,      setProblem]      = useState('');
  const [beforeMetric, setBeforeMetric] = useState('');
  const [beforeLabel,  setBeforeLabel]  = useState('');
  const [afterMetric,  setAfterMetric]  = useState('');
  const [afterLabel,   setAfterLabel]   = useState('');

  // ── Step 4 — Portfolio
  const [projects, setProjects] = useState([
    { id: 1, title: '', result: '', emoji: '🎬' },
  ]);

  // ── Step 5 — Compte
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [agreed,   setAgreed]   = useState(false);

  // Initiales générées
  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';

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
        if (!firstName.trim()) { Alert.alert('Prénom requis', 'Entre ton prénom pour continuer.'); return false; }
        if (!specialty.trim()) { Alert.alert('Spécialité requise', 'Ex : "Hook & Script viral TikTok"'); return false; }
        return true;
      case 1:
        if (domains.length === 0) { Alert.alert('Domaine requis', 'Sélectionne au moins un domaine.'); return false; }
        if (!level) { Alert.alert('Niveau requis', 'Indique ton niveau d\'expérience.'); return false; }
        return true;
      case 2:
        if (skills.length === 0) { Alert.alert('Compétences requises', 'Sélectionne au moins une compétence.'); return false; }
        if (!price.trim()) { Alert.alert('Tarif requis', 'Indique ton tarif par mission.'); return false; }
        return true;
      case 3:
        if (!bio.trim() || bio.trim().length < 20) { Alert.alert('Bio trop courte', 'Écris au moins 20 caractères.'); return false; }
        if (!problem.trim()) { Alert.alert('Problème manquant', 'Indique quel problème tu résous pour tes clients.'); return false; }
        return true;
      case 4:
        return true; // optionnel
      case 5:
        if (!email.trim()) { Alert.alert('Email requis'); return false; }
        if (!password || password.length < 6) { Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.'); return false; }
        if (!agreed) { Alert.alert('CGU requises', 'Accepte les conditions pour créer ton compte.'); return false; }
        return true;
    }
    return true;
  }

  // ── Création compte ─────────────────────────────────────────────────────────
  async function handleRegister() {
    setLoading(true);
    const meta = {
      role:         'prestataire',
      nom:          firstName.trim() + (lastName.trim() ? ' ' + lastName.trim() : ''),
      specialty:    specialty.trim(),
      domains,
      level,
      skills,
      price:        parseInt(price, 10) || 0,
      deliveryTime,
      responseTime,
      bio:          bio.trim(),
      problem:      problem.trim(),
      before:       beforeMetric ? { metric: beforeMetric, views: beforeLabel } : null,
      after:        afterMetric  ? { metric: afterMetric,  views: afterLabel  } : null,
      projects:     projects.filter(p => p.title.trim()),
      avatarColor,
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toggleDomain(id) {
    setDomains(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleSkill(s) {
    setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }
  function updateProj(id, field, val) {
    setProjects(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));
  }
  function addProj() {
    if (projects.length >= 3) return;
    setProjects(p => [...p, { id: Date.now(), title: '', result: '', emoji: '🚀' }]);
  }
  function removeProj(id) {
    setProjects(p => p.filter(x => x.id !== id));
  }
  function foc(key) { return { focused: focused === key, onFocus: () => setFocused(key), onBlur: () => setFocused(null) }; }

  // ── Steps ───────────────────────────────────────────────────────────────────

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
        <Text style={s.stepSub}>Ces infos apparaissent sur ta carte profil vue par les clients.</Text>

        {/* Avatar preview + color picker */}
        <View style={s.avatarRow}>
          <View style={[s.avatarCircle, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '66' }]}>
            <Text style={[s.avatarInitials, { color: avatarColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.avatarHint}>Couleur de ton avatar</Text>
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

        <Field label="Prénom" hint="Obligatoire">
          <StyledInput value={firstName} onChangeText={setFirstName} placeholder="Ex : Thomas" autoCapitalize="words" {...foc('fn')} />
        </Field>

        <Field label="Nom ou pseudo" hint="Optionnel">
          <StyledInput value={lastName} onChangeText={setLastName} placeholder="Ex : G. ou @tonpseudo" autoCapitalize="words" {...foc('ln')} />
        </Field>

        <Field label="Ta spécialité principale" hint={`${specialty.length}/50`}>
          <StyledInput value={specialty} onChangeText={setSpecialty} placeholder="Ex : Hook & Script viral TikTok" maxLength={50} {...foc('sp')} />
        </Field>
      </ScrollView>
    );
  }

  // ── 1 · Domaines & Niveau ───────────────────────────────────────────────────
  function Step1() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Tes domaines</Text>
        <Text style={s.stepSub}>Dans quoi est-ce que tu excelles ? Plusieurs choix possibles.</Text>

        <View style={s.chipGrid}>
          {DOMAINS.map(d => (
            <Chip key={d.id} label={d.label} icon={d.icon} selected={domains.includes(d.id)} onPress={() => toggleDomain(d.id)} />
          ))}
        </View>

        <SLabel text="TON NIVEAU D'EXPÉRIENCE" />
        <View style={s.levelRow}>
          {LEVELS.map(lv => {
            const sel = level === lv.id;
            return (
              <TouchableOpacity
                key={lv.id}
                style={[s.levelCard, sel && { borderColor: lv.color, backgroundColor: lv.color + '12' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLevel(lv.id); }}
                activeOpacity={0.75}
              >
                <Ionicons name={lv.icon} size={22} color={sel ? lv.color : COLORS.textMuted} />
                <Text style={[s.levelName, sel && { color: lv.color }]}>{lv.label}</Text>
                <Text style={s.levelSub}>{lv.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ── 2 · Compétences & Tarifs ────────────────────────────────────────────────
  function Step2() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Compétences & tarifs</Text>
        <Text style={s.stepSub}>Ce que tu sais faire et ce que tu factures.</Text>

        <SLabel text="TES COMPÉTENCES" />
        <View style={s.chipGrid}>
          {SKILLS_POOL.map(sk => (
            <Chip key={sk} label={sk} selected={skills.includes(sk)} onPress={() => toggleSkill(sk)} />
          ))}
        </View>

        <SLabel text="TARIF PAR MISSION" />
        <Field label="Prix" hint="Affiché sur ta fiche profil">
          <View style={s.priceRow}>
            <StyledInput
              value={price}
              onChangeText={setPrice}
              placeholder="Ex : 49"
              keyboardType="numeric"
              style={{ flex: 1 }}
              {...foc('pr')}
            />
            <View style={s.priceSuffix}>
              <Text style={s.priceSuffixText}>€ / mission</Text>
            </View>
          </View>
        </Field>

        <SLabel text="DÉLAI DE LIVRAISON" />
        <View style={s.optRow}>
          {DELIVERY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.optPill, deliveryTime === opt && { borderColor: ACCENT, backgroundColor: ACCENT + '18' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDeliveryTime(opt); }}
            >
              <Text style={[s.optPillText, deliveryTime === opt && { color: ACCENT }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SLabel text="TEMPS DE RÉPONSE" />
        <View style={s.optRow}>
          {RESPONSE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.optPill, responseTime === opt && { borderColor: ACCENT, backgroundColor: ACCENT + '18' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setResponseTime(opt); }}
            >
              <Text style={[s.optPillText, responseTime === opt && { color: ACCENT }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ── 3 · Présentation ────────────────────────────────────────────────────────
  function Step3() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Ta présentation</Text>
        <Text style={s.stepSub}>Ce que les clients lisent avant de te commander.</Text>

        <Field label="Ta bio" hint={`${bio.length}/250`}>
          <StyledInput
            value={bio}
            onChangeText={setBio}
            placeholder="Décris ton expertise, ton style, ce qui te différencie des autres freelances…"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={250}
            style={{ minHeight: 110, paddingTop: 14 }}
            {...foc('bio')}
          />
        </Field>

        <Field label="Quel problème tu résous ?" hint={`${problem.length}/60`}>
          <StyledInput
            value={problem}
            onChangeText={setProblem}
            placeholder="Ex : Hook trop lent → audience qui zappe dès 2 sec"
            maxLength={60}
            {...foc('pb')}
          />
        </Field>

        {/* Before / After */}
        <SLabel text="RÉSULTATS AVANT / APRÈS" />
        <Text style={s.helperText}>
          Ces chiffres s'affichent sur ta fiche profil pour prouver ton impact. (Optionnel)
        </Text>
        <View style={s.baRow}>
          <View style={[s.baCard, { borderColor: COLORS.error + '35', backgroundColor: COLORS.error + '0A' }]}>
            <Text style={[s.baTitle, { color: COLORS.error }]}>AVANT</Text>
            <StyledInput value={beforeMetric} onChangeText={setBeforeMetric} placeholder="Ex : 12%" style={s.baInput} {...foc('bm')} />
            <StyledInput value={beforeLabel}  onChangeText={setBeforeLabel}  placeholder="rétention moyenne" style={[s.baInput, { marginTop: 7 }]} {...foc('bl')} />
          </View>
          <View style={s.baArrow}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textLight} />
          </View>
          <View style={[s.baCard, { borderColor: COLORS.success + '35', backgroundColor: COLORS.success + '0A' }]}>
            <Text style={[s.baTitle, { color: COLORS.success }]}>APRÈS</Text>
            <StyledInput value={afterMetric} onChangeText={setAfterMetric} placeholder="Ex : 38%" style={s.baInput} {...foc('am')} />
            <StyledInput value={afterLabel}  onChangeText={setAfterLabel}  placeholder="après réécriture" style={[s.baInput, { marginTop: 7 }]} {...foc('al')} />
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── 4 · Portfolio ────────────────────────────────────────────────────────────
  function Step4() {
    const hasPreview = firstName.trim() || specialty.trim();
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Tes projets</Text>
        <Text style={s.stepSub}>Montre des exemples concrets de ton travail. 3 projets maximum, tous optionnels.</Text>

        {projects.map((proj, idx) => (
          <View key={proj.id} style={s.projCard}>
            <View style={s.projTop}>
              {/* Emoji picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.emojiScroll}>
                {PROJECT_EMOJIS.map(em => (
                  <TouchableOpacity
                    key={em}
                    style={[s.emojiBtn, proj.emoji === em && s.emojiBtnSel]}
                    onPress={() => updateProj(proj.id, 'emoji', em)}
                  >
                    <Text style={s.emojiText}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {projects.length > 1 && (
                <TouchableOpacity style={s.projDel} onPress={() => removeProj(proj.id)}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
            <StyledInput
              value={proj.title}
              onChangeText={(v) => updateProj(proj.id, 'title', v)}
              placeholder={`Projet ${idx + 1} — Ex : Réécriture hook viral pour @creator`}
              style={{ marginBottom: 8 }}
              {...foc(`pt${proj.id}`)}
            />
            <StyledInput
              value={proj.result}
              onChangeText={(v) => updateProj(proj.id, 'result', v)}
              placeholder="Résultat clé — Ex : +2.1M vues obtenues en 48h"
              {...foc(`pr${proj.id}`)}
            />
          </View>
        ))}

        {projects.length < 3 && (
          <TouchableOpacity style={s.addProjBtn} onPress={addProj} activeOpacity={0.75}>
            <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
            <Text style={s.addProjTxt}>Ajouter un projet</Text>
          </TouchableOpacity>
        )}

        {/* Aperçu profil */}
        {hasPreview && (
          <View style={s.previewWrap}>
            <SLabel text="APERÇU DE TA CARTE PROFIL" />
            <View style={s.previewCard}>
              <LinearGradient
                colors={[avatarColor + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
                borderRadius={RADIUS.xl}
              />
              <View style={[s.previewAvatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '55' }]}>
                <Text style={[s.previewInitials, { color: avatarColor }]}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <Text style={s.previewName}>{firstName} {lastName}</Text>
                  {level && (
                    <View style={[s.previewBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
                      <Text style={[s.previewBadgeText, { color: ACCENT }]}>{LEVELS.find(l => l.id === level)?.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.previewSpecialty}>{specialty}</Text>
                <View style={s.previewSkillsRow}>
                  {skills.slice(0, 3).map(sk => (
                    <View key={sk} style={s.previewSkill}>
                      <Text style={s.previewSkillText}>{sk}</Text>
                    </View>
                  ))}
                </View>
                {price ? (
                  <View style={s.previewPriceRow}>
                    <Ionicons name="flash-outline" size={11} color={ACCENT} />
                    <Text style={s.previewPrice}>{price}€ · {deliveryTime}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── 5 · Compte ──────────────────────────────────────────────────────────────
  function Step5() {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Créer mon compte</Text>
          <Text style={s.stepSub}>Ton profil sera en ligne immédiatement après inscription.</Text>

          {/* Récapitulatif */}
          <View style={s.recapCard}>
            <LinearGradient colors={[avatarColor + '14', 'transparent']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
            <View style={[s.recapAvatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '55' }]}>
              <Text style={[s.recapInitials, { color: avatarColor }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.recapName}>{firstName} {lastName}</Text>
              <Text style={s.recapSpecialty}>{specialty}</Text>
              <View style={s.recapRow}>
                {level && (
                  <View style={[s.recapBadge, { borderColor: ACCENT + '35', backgroundColor: ACCENT + '14' }]}>
                    <Text style={[s.recapBadgeText, { color: ACCENT }]}>{LEVELS.find(l => l.id === level)?.label}</Text>
                  </View>
                )}
                {domains.slice(0, 2).map(d => (
                  <View key={d} style={s.recapDomain}>
                    <Text style={s.recapDomainText}>{DOMAINS.find(x => x.id === d)?.label}</Text>
                  </View>
                ))}
                {domains.length > 2 && <Text style={s.recapMore}>+{domains.length - 2}</Text>}
              </View>
            </View>
            {price ? (
              <View style={s.recapPrice}>
                <Text style={s.recapPriceVal}>{price}€</Text>
                <Text style={s.recapPriceSub}>/ mission</Text>
              </View>
            ) : null}
          </View>

          <Field label="Adresse email">
            <StyledInput value={email} onChangeText={setEmail} placeholder="ton@email.com" keyboardType="email-address" autoCapitalize="none" {...foc('em')} />
          </Field>

          <Field label="Mot de passe" hint="Min. 6 caractères">
            <StyledInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry {...foc('pw')} />
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

  // ── Render ───────────────────────────────────────────────────────────────────

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <BubbleBackground variant="prestataire" />

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
          {step > 0 && (
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
            style={[s.ctaBtn, (loading) && { opacity: 0.6 }]}
            onPress={goNext}
            activeOpacity={0.88}
            disabled={loading}
          >
            <LinearGradient
              colors={['#059669', '#10B981']}
              style={s.ctaGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={s.ctaTxt}>Création en cours…</Text>
              ) : isLast ? (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#fff" />
                  <Text style={s.ctaTxt}>Créer mon profil</Text>
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

  // Step 0 — avatar
  avatarRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  avatarCircle:   { width: 68, height: 68, borderRadius: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '900' },
  avatarHint:     { fontSize: 11, color: COLORS.textLight, marginBottom: 10 },
  colorRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch:    { width: 24, height: 24, borderRadius: 12 },
  colorSwatchSel: { borderWidth: 2.5, borderColor: '#fff' },

  // Step 1 — domains + levels
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  levelRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  levelCard:{ flex: 1, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', gap: 6 },
  levelName:{ fontSize: 13, fontWeight: '700', color: COLORS.text },
  levelSub: { fontSize: 10, color: COLORS.textLight },

  // Step 2 — price + options
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceSuffix:   { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 14 },
  priceSuffixText:{ fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  optRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  optPill:       { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.card },
  optPillText:   { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  // Step 3 — bio + before/after
  helperText: { fontSize: 12, color: COLORS.textLight, lineHeight: 18, marginBottom: SPACING.sm },
  baRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
  baCard:     { flex: 1, borderWidth: 1, borderRadius: RADIUS.lg, padding: 12 },
  baArrow:    { alignItems: 'center' },
  baTitle:    { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  baInput:    { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.text },

  // Step 4 — portfolio
  projCard:  { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  projTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  emojiScroll:{ flexGrow: 0 },
  emojiBtn:  { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, marginRight: 6 },
  emojiBtnSel:{ borderColor: ACCENT, backgroundColor: ACCENT + '15' },
  emojiText: { fontSize: 16 },
  projDel:   { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.error + '12', alignItems: 'center', justifyContent: 'center' },
  addProjBtn:{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: ACCENT + '50', borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: ACCENT + '08', marginBottom: SPACING.lg },
  addProjTxt:{ fontSize: 14, fontWeight: '600', color: ACCENT },

  // Preview card
  previewWrap:      { marginTop: 4 },
  previewCard:      { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md, flexDirection: 'row', gap: 12, overflow: 'hidden' },
  previewAvatar:    { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  previewInitials:  { fontSize: 18, fontWeight: '900' },
  previewName:      { fontSize: 14, fontWeight: '700', color: COLORS.text },
  previewBadge:     { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  previewBadgeText: { fontSize: 9, fontWeight: '800' },
  previewSpecialty: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  previewSkillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  previewSkill:     { backgroundColor: ACCENT + '15', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  previewSkillText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  previewPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewPrice:     { fontSize: 11, fontWeight: '700', color: ACCENT },

  // Step 5 — recap card
  recapCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: ACCENT + '35', borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.lg, overflow: 'hidden' },
  recapAvatar:    { width: 54, height: 54, borderRadius: 27, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  recapInitials:  { fontSize: 20, fontWeight: '900' },
  recapName:      { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  recapSpecialty: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  recapRow:       { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  recapBadge:     { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  recapBadgeText: { fontSize: 9, fontWeight: '700' },
  recapDomain:    { backgroundColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  recapDomainText:{ fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  recapMore:      { fontSize: 10, color: COLORS.textLight },
  recapPrice:     { alignItems: 'center', paddingLeft: 8 },
  recapPriceVal:  { fontSize: 18, fontWeight: '900', color: ACCENT },
  recapPriceSub:  { fontSize: 9, color: COLORS.textLight },

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
