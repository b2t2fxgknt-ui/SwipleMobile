/**
 * InfluencerOnboardingScreen.js
 * Wizard de création de profil influenceur/créateur — 6 étapes.
 * 0 Identité → 1 Plateformes & Niche → 2 Audience & Stats
 *            → 3 Objectifs & Besoins → 4 Budget & Préférences → 5 Compte
 *
 * Cohérent avec :
 *  - AuditScreen         (plateforme, niche, objectifs → audit ciblé)
 *  - SwipeScreen         (catégories de besoins → matching freelancers)
 *  - ExpertsScreen       (budget, délai → commande directe)
 *  - ProfileScreen       (pseudo, handle, followers, niche → fiche client)
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

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',           icon: 'phone-portrait-outline', color: '#EE1D52' },
  { id: 'instagram', label: 'Instagram Reels',  icon: 'camera-outline',         color: '#E1306C' },
  { id: 'youtube',   label: 'YouTube Shorts',   icon: 'play-circle-outline',    color: '#FF0000' },
  { id: 'twitch',    label: 'Twitch',           icon: 'tv-outline',             color: '#9146FF' },
  { id: 'snapchat',  label: 'Snapchat',         icon: 'chatbubble-outline',     color: '#FFFC00' },
  { id: 'twitter',   label: 'X / Twitter',      icon: 'logo-twitter',           color: '#1DA1F2' },
  { id: 'linkedin',  label: 'LinkedIn',         icon: 'briefcase-outline',      color: '#0A66C2' },
  { id: 'pinterest', label: 'Pinterest',        icon: 'images-outline',         color: '#E60023' },
];

const NICHES = [
  { id: 'lifestyle',  label: 'Lifestyle',    icon: 'sunny-outline'          },
  { id: 'gaming',     label: 'Gaming',       icon: 'game-controller-outline' },
  { id: 'beauty',     label: 'Beauté',       icon: 'sparkles-outline'       },
  { id: 'food',       label: 'Food',         icon: 'restaurant-outline'     },
  { id: 'sport',      label: 'Sport & Fit',  icon: 'fitness-outline'        },
  { id: 'tech',       label: 'Tech',         icon: 'hardware-chip-outline'  },
  { id: 'comedy',     label: 'Humour',       icon: 'happy-outline'          },
  { id: 'music',      label: 'Musique',      icon: 'musical-notes-outline'  },
  { id: 'travel',     label: 'Voyage',       icon: 'airplane-outline'       },
  { id: 'finance',    label: 'Finance',      icon: 'trending-up-outline'    },
  { id: 'education',  label: 'Éducation',    icon: 'school-outline'         },
  { id: 'fashion',    label: 'Mode',         icon: 'shirt-outline'          },
  { id: 'business',   label: 'Business',     icon: 'rocket-outline'         },
  { id: 'art',        label: 'Art & DIY',    icon: 'brush-outline'          },
  { id: 'wellness',   label: 'Bien-être',    icon: 'leaf-outline'           },
  { id: 'animals',    label: 'Animaux',      icon: 'paw-outline'            },
];

const FOLLOWER_RANGES = [
  { id: 'nano',    label: '< 10K',       sub: 'Nano',    icon: 'person-outline',   color: '#6B7280' },
  { id: 'micro',   label: '10K – 50K',   sub: 'Micro',   icon: 'people-outline',   color: '#3B82F6' },
  { id: 'mid',     label: '50K – 200K',  sub: 'Mid',     icon: 'trending-up-outline', color: '#8B5CF6' },
  { id: 'macro',   label: '200K – 1M',   sub: 'Macro',   icon: 'star-outline',     color: '#F59E0B' },
  { id: 'mega',    label: '1M+',         sub: 'Mega',    icon: 'flash-outline',    color: '#EF4444' },
];

const VIEW_RANGES = [
  { id: 'v500',    label: '< 500',       },
  { id: 'v5k',     label: '500 – 5K',   },
  { id: 'v50k',    label: '5K – 50K',   },
  { id: 'v200k',   label: '50K – 200K', },
  { id: 'v1m',     label: '200K+',      },
];

const PUBLISH_FREQ = [
  { id: 'daily',   label: 'Tous les jours', icon: 'calendar-outline'        },
  { id: '3pw',     label: '3× / semaine',   icon: 'repeat-outline'          },
  { id: 'weekly',  label: '1× / semaine',   icon: 'time-outline'            },
  { id: 'monthly', label: 'Ponctuellement', icon: 'hourglass-outline'       },
];

const GOALS = [
  { id: 'followers',   label: 'Augmenter mes abonnés',      icon: 'person-add-outline'      },
  { id: 'engagement',  label: 'Booster l\'engagement',      icon: 'heart-outline'           },
  { id: 'viral',       label: 'Viraliser mes vidéos',        icon: 'flash-outline'           },
  { id: 'quality',     label: 'Améliorer la qualité',        icon: 'diamond-outline'         },
  { id: 'monetize',    label: 'Monétiser mon compte',        icon: 'cash-outline'            },
  { id: 'brand',       label: 'Décrocher des brand deals',   icon: 'briefcase-outline'       },
  { id: '100k',        label: 'Passer les 100K',             icon: 'trending-up-outline'     },
  { id: '1m',          label: 'Atteindre 1M d\'abonnés',    icon: 'star-outline'            },
  { id: 'consistency', label: 'Publier régulièrement',       icon: 'calendar-outline'        },
  { id: 'community',   label: 'Fédérer une communauté',      icon: 'people-outline'          },
];

// Mappage direct avec les freelancers.js categories
const NEEDS = [
  { id: 'hook',       label: 'Hook & Accroche',       icon: 'flash-outline',          category: 'hook'           },
  { id: 'montage',    label: 'Montage vidéo',          icon: 'film-outline',           category: 'video_montage'  },
  { id: 'captions',   label: 'Sous-titres animés',     icon: 'text-outline',           category: 'subtitle'       },
  { id: 'son',        label: 'Son & Musique',           icon: 'musical-notes-outline',  category: 'sound'          },
  { id: 'script',     label: 'Script & Copywriting',   icon: 'create-outline',         category: 'copywriting'    },
  { id: 'strategie',  label: 'Stratégie & Croissance', icon: 'trending-up-outline',    category: 'reseaux_sociaux'},
  { id: 'design',     label: 'Visuels & Miniatures',   icon: 'color-palette-outline',  category: 'design'         },
  { id: 'ugc',        label: 'UGC & Tournage',          icon: 'videocam-outline',       category: 'video_montage'  },
];

const BUDGET_RANGES = [
  { id: 'b30',   label: '< 30€',        sub: 'Mission rapide'    },
  { id: 'b60',   label: '30 – 60€',     sub: 'Standard'          },
  { id: 'b100',  label: '60 – 100€',    sub: 'Qualité'           },
  { id: 'b200',  label: '100 – 200€',   sub: 'Premium'           },
  { id: 'b200p', label: '200€+',        sub: 'Sur mesure'        },
];

const DELIVERY_PREFS = [
  { id: 'asap', label: 'Le plus vite possible' },
  { id: '24h',  label: 'Sous 24h'              },
  { id: '48h',  label: 'Sous 48h'              },
  { id: 'week', label: 'Dans la semaine'        },
  { id: 'flex', label: 'Flexible'              },
];

const MISSION_FREQ = [
  { id: 'once',    label: 'Ponctuellement',    sub: 'Au besoin'        },
  { id: 'monthly', label: '1× / mois',         sub: 'Récurrent léger'  },
  { id: 'bi',      label: '2–3× / mois',       sub: 'Régulier'         },
  { id: 'weekly',  label: 'Chaque semaine',     sub: 'Intensif'         },
];

const AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#EF4444', '#06B6D4', '#84CC16',
];

const STEP_LABELS = ['Identité', 'Plateformes', 'Audience', 'Objectifs', 'Budget', 'Compte'];

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

  // ── Step 1 — Plateformes & Niche
  const [platforms,    setPlatforms]    = useState([]);
  const [niches,       setNiches]       = useState([]);

  // ── Step 2 — Audience & Stats
  const [followerRange, setFollowerRange] = useState(null);
  const [viewRange,     setViewRange]     = useState(null);
  const [publishFreq,   setPublishFreq]   = useState(null);

  // ── Step 3 — Objectifs & Besoins
  const [goals,  setGoals]  = useState([]);
  const [needs,  setNeeds]  = useState([]); // IDs des besoins sélectionnés

  // ── Step 4 — Budget & Préférences
  const [budget,       setBudget]       = useState(null);
  const [deliveryPref, setDeliveryPref] = useState(null);
  const [missionFreq,  setMissionFreq]  = useState(null);

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
        if (platforms.length === 0) { Alert.alert('Plateforme requise', 'Sélectionne au moins une plateforme.'); return false; }
        if (niches.length === 0)    { Alert.alert('Niche requise', 'Choisis au moins une niche de contenu.'); return false; }
        return true;
      case 2:
        if (!followerRange) { Alert.alert('Abonnés requis', 'Sélectionne ta tranche d\'abonnés.'); return false; }
        return true;
      case 3:
        if (goals.length === 0) { Alert.alert('Objectifs requis', 'Sélectionne au moins un objectif.'); return false; }
        if (needs.length === 0) { Alert.alert('Besoins requis', 'Sélectionne ce dont tu as besoin.'); return false; }
        return true;
      case 4:
        if (!budget) { Alert.alert('Budget requis', 'Indique ton budget moyen par mission.'); return false; }
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

    // Catégories de besoins pour le moteur de matching freelancers
    const needCategories = needs.map(nid => NEEDS.find(n => n.id === nid)?.category).filter(Boolean);

    const meta = {
      role:          'acheteur',
      nom:           pseudo.trim(),
      handle:        handle.trim(),
      tagline:       tagline.trim(),
      avatarColor,
      platforms,
      niches,
      followerRange,
      viewRange,
      publishFreq,
      goals,
      needs,
      needCategories,   // utilisé par matchFreelancers() dans AuditScreen
      budget,
      deliveryPref,
      missionFreq,
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
        <Text style={s.stepSub}>Ces infos constituent ton profil créateur visible par les freelancers.</Text>

        {/* Avatar preview + color picker */}
        <View style={s.avatarRow}>
          <View style={[s.avatarCircle, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '66' }]}>
            <Text style={[s.avatarInitials, { color: avatarColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.avatarHint}>Couleur de ton avatar créateur</Text>
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

        <Field label="Pseudo / Nom de créateur" hint="Obligatoire">
          <StyledInput
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Ex : Marie Créa, TechParLeo…"
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

        <Field label="Ton pitch créateur" hint={`${tagline.length}/80`}>
          <StyledInput
            value={tagline}
            onChangeText={setTagline}
            placeholder="Ex : Je crée du contenu lifestyle & food pour GenZ"
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
        <Text style={s.stepTitle}>Tes plateformes</Text>
        <Text style={s.stepSub}>Où publies-tu ? Sélectionne tout ce que tu utilises.</Text>

        <View style={s.platformGrid}>
          {PLATFORMS.map(p => {
            const sel = platforms.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[s.platformCard, sel && { borderColor: p.color + '80', backgroundColor: p.color + '12' }]}
                onPress={() => toggle(platforms, setPlatforms, p.id)}
                activeOpacity={0.75}
              >
                <View style={[s.platformIconBox, { backgroundColor: p.color + (sel ? '25' : '12') }]}>
                  <Ionicons name={p.icon} size={22} color={sel ? p.color : COLORS.textMuted} />
                </View>
                <Text style={[s.platformLabel, sel && { color: p.color }]}>{p.label}</Text>
                {sel && (
                  <View style={[s.platformCheck, { backgroundColor: p.color }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <SLabel text="TA NICHE DE CONTENU" />
        <Text style={s.helperText}>Plusieurs choix possibles. Cela aide à te proposer les bons freelancers.</Text>
        <View style={s.chipGrid}>
          {NICHES.map(n => (
            <Chip
              key={n.id}
              label={n.label}
              icon={n.icon}
              selected={niches.includes(n.id)}
              onPress={() => toggle(niches, setNiches, n.id)}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  // ── 2 · Audience & Stats ────────────────────────────────────────────────────
  function Step2() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Ton audience</Text>
        <Text style={s.stepSub}>Ces infos permettent de t'adapter le bon niveau de freelance. Aucune vérification, sois honnête !</Text>

        <SLabel text="NOMBRE D'ABONNÉS (PLATEFORME PRINCIPALE)" />
        <View style={s.followerGrid}>
          {FOLLOWER_RANGES.map(r => {
            const sel = followerRange === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[s.followerCard, sel && { borderColor: r.color, backgroundColor: r.color + '12' }]}
                onPress={() => pick(setFollowerRange, r.id)}
                activeOpacity={0.75}
              >
                <Ionicons name={r.icon} size={20} color={sel ? r.color : COLORS.textMuted} />
                <Text style={[s.followerLabel, sel && { color: r.color }]}>{r.label}</Text>
                <Text style={s.followerSub}>{r.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SLabel text="VUES MOYENNES PAR VIDÉO" />
        <View style={s.chipGrid}>
          {VIEW_RANGES.map(r => (
            <Chip
              key={r.id}
              label={r.label}
              selected={viewRange === r.id}
              onPress={() => pick(setViewRange, r.id)}
            />
          ))}
        </View>

        <SLabel text="FRÉQUENCE DE PUBLICATION" />
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

  // ── 3 · Objectifs & Besoins ─────────────────────────────────────────────────
  function Step3() {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Tes objectifs</Text>
        <Text style={s.stepSub}>Qu'est-ce que tu veux accomplir ? Sélectionne tes priorités.</Text>

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

        <SLabel text="DE QUOI AS-TU BESOIN ?" />
        <Text style={s.helperText}>
          Ces choix alimentent directement le matching avec les bons freelancers et tes audits IA.
        </Text>
        <View style={s.needsGrid}>
          {NEEDS.map(n => {
            const sel = needs.includes(n.id);
            return (
              <TouchableOpacity
                key={n.id}
                style={[s.needCard, sel && { borderColor: ACCENT, backgroundColor: ACCENT + '12' }]}
                onPress={() => toggle(needs, setNeeds, n.id)}
                activeOpacity={0.75}
              >
                <View style={[s.needIconBox, { backgroundColor: sel ? ACCENT + '20' : COLORS.cardElevated }]}>
                  <Ionicons name={n.icon} size={20} color={sel ? ACCENT : COLORS.textMuted} />
                </View>
                <Text style={[s.needLabel, sel && { color: ACCENT }]}>{n.label}</Text>
                {sel && (
                  <View style={s.needCheck}>
                    <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ── 4 · Budget & Préférences ────────────────────────────────────────────────
  function Step4() {
    const selBudget = BUDGET_RANGES.find(b => b.id === budget);
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.stepTitle}>Budget & Préférences</Text>
        <Text style={s.stepSub}>Comment tu travailles avec les freelancers au quotidien.</Text>

        <SLabel text="BUDGET MOYEN PAR MISSION" />
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

        <SLabel text="DÉLAI DE LIVRAISON SOUHAITÉ" />
        <View style={s.chipGrid}>
          {DELIVERY_PREFS.map(d => (
            <Chip
              key={d.id}
              label={d.label}
              selected={deliveryPref === d.id}
              onPress={() => pick(setDeliveryPref, d.id)}
            />
          ))}
        </View>

        <SLabel text="FRÉQUENCE DES MISSIONS" />
        <View style={s.mfreqGrid}>
          {MISSION_FREQ.map(f => {
            const sel = missionFreq === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[s.mfreqCard, sel && { borderColor: ACCENT, backgroundColor: ACCENT + '12' }]}
                onPress={() => pick(setMissionFreq, f.id)}
                activeOpacity={0.75}
              >
                <Text style={[s.mfreqLabel, sel && { color: ACCENT }]}>{f.label}</Text>
                <Text style={s.mfreqSub}>{f.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview carte profil client */}
        {pseudo.trim() && (
          <View style={{ marginTop: SPACING.sm }}>
            <SLabel text="APERÇU DE TA CARTE CRÉATEUR" />
            <View style={s.previewCard}>
              <LinearGradient colors={[avatarColor + '14', 'transparent']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
              <View style={[s.previewAvatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '55' }]}>
                <Text style={[s.previewInitials, { color: avatarColor }]}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <Text style={s.previewName}>{pseudo}</Text>
                  {handle ? <Text style={s.previewHandle}>@{handle}</Text> : null}
                </View>
                <Text style={s.previewTagline} numberOfLines={1}>{tagline || 'Créateur de contenu'}</Text>
                <View style={s.previewPillsRow}>
                  {platforms.slice(0, 2).map(pid => {
                    const pl = PLATFORMS.find(p => p.id === pid);
                    return pl ? (
                      <View key={pid} style={[s.previewPlatformPill, { backgroundColor: pl.color + '15', borderColor: pl.color + '30' }]}>
                        <Ionicons name={pl.icon} size={10} color={pl.color} />
                        <Text style={[s.previewPlatformText, { color: pl.color }]}>{pl.label}</Text>
                      </View>
                    ) : null;
                  })}
                  {followerRange && (
                    <View style={s.previewFollowerPill}>
                      <Ionicons name="people-outline" size={10} color={ACCENT} />
                      <Text style={s.previewFollowerText}>{FOLLOWER_RANGES.find(r => r.id === followerRange)?.label}</Text>
                    </View>
                  )}
                </View>
                {selBudget && (
                  <Text style={s.previewBudget}>Budget moyen : {selBudget.label}</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── 5 · Compte ──────────────────────────────────────────────────────────────
  function Step5() {
    const selFollower = FOLLOWER_RANGES.find(r => r.id === followerRange);
    const selBudget   = BUDGET_RANGES.find(b => b.id === budget);

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Créer mon compte</Text>
          <Text style={s.stepSub}>Ton profil créateur sera actif immédiatement après inscription.</Text>

          {/* Récapitulatif créateur */}
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
              <Text style={s.recapTagline} numberOfLines={1}>{tagline || 'Créateur de contenu'}</Text>
              <View style={s.recapRow}>
                {platforms.slice(0, 3).map(pid => {
                  const pl = PLATFORMS.find(p => p.id === pid);
                  return pl ? (
                    <View key={pid} style={[s.recapPlatformBadge, { borderColor: pl.color + '40', backgroundColor: pl.color + '12' }]}>
                      <Ionicons name={pl.icon} size={9} color={pl.color} />
                      <Text style={[s.recapPlatformText, { color: pl.color }]}>{pl.label}</Text>
                    </View>
                  ) : null;
                })}
                {platforms.length > 3 && <Text style={s.recapMore}>+{platforms.length - 3}</Text>}
              </View>
            </View>
            <View style={s.recapRight}>
              {selFollower && (
                <>
                  <Text style={[s.recapFollowerVal, { color: avatarColor }]}>{selFollower.label}</Text>
                  <Text style={s.recapFollowerSub}>abonnés</Text>
                </>
              )}
              {selBudget && (
                <Text style={s.recapBudgetTxt}>{selBudget.label} / mission</Text>
              )}
            </View>
          </View>

          {/* Résumé objectifs */}
          {goals.length > 0 && (
            <View style={s.goalsSummary}>
              <Text style={s.goalsSummaryTitle}>Tes objectifs</Text>
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
                  <Text style={s.ctaTxt}>Créer mon profil créateur</Text>
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
