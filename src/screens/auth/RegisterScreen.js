import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, StatusBar, Animated, Easing, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width } = Dimensions.get('window');

const ROLE_META = {
  acheteur:    { label: 'Client',      color: COLORS.acheteur,    bg: COLORS.acheteurBg,    desc: 'Tu veux du contenu TikTok pour ton business' },
  prestataire: { label: 'Ghostwriter', color: COLORS.prestataire, bg: COLORS.prestataireBg, desc: 'Tu écris des scripts TikTok pour des clients' },
};

// Niches business — mêmes options pour client (sa niche) et ghostwriter (ses spécialités)
const DOMAINS = [
  { id: 'business',   label: 'Business & Coaching',    sub: 'Coach, consultant, mentor'      },
  { id: 'formation',  label: 'Formation & Éducation',  sub: 'Formateur, e-learning'           },
  { id: 'sante',      label: 'Santé & Bien-être',      sub: 'Thérapeute, naturopathe'         },
  { id: 'finance',    label: 'Finance & Investissement',sub: 'Crypto, bourse, épargne'        },
  { id: 'marketing',  label: 'Marketing & Vente',      sub: 'Growth, personal branding'       },
  { id: 'droit',      label: 'Droit & Juridique',      sub: 'Avocat, notaire, RH'             },
  { id: 'mode',       label: 'Mode & Beauté',          sub: 'Fashion, cosmétiques, lifestyle' },
  { id: 'food',       label: 'Food & Restauration',    sub: 'Chef, recettes, nutrition'       },
  { id: 'sport',      label: 'Sport & Fitness',        sub: 'Coach sportif, nutrition'        },
  { id: 'tech',       label: 'Tech & Digital',         sub: 'SaaS, apps, IA'                 },
  { id: 'immo',       label: 'Immobilier',             sub: 'Agent, investisseur, promoteur'  },
  { id: 'devperso',   label: 'Développement perso',    sub: 'Mindset, productivité, confiance'},
];

const LEVELS = [
  { id: 'debutant',  label: 'Débutant',   sub: '< 5 clients' },
  { id: 'confirme',  label: 'Confirmé',   sub: '5 – 20 clients' },
  { id: 'expert',    label: 'Expert',     sub: '20+ clients' },
];

const CARD_W = (width - SPACING.lg * 2 - SPACING.sm) / 2;

// ── Formulaire Step 2 ────────────────────────────────────────────────────────
// React.memo + TextInputs non-contrôlés (defaultValue + refs, pas de value={state})
// → aucun re-render pendant la frappe → clavier reste ouvert
const StepTwoForm = React.memo(function StepTwoForm({
  accentColor, onRegister, loading, selectedDomains, selectedLevel,
  isAcheteur, navigation, role, otherRole,
}) {
  // Valeurs lues via refs — pas de state, pas de re-render sur frappe
  const nomVal      = useRef('');
  const emailVal    = useRef('');
  const passwordVal = useRef('');

  const emailInputRef    = useRef(null);
  const passwordInputRef = useRef(null);

  const summaryText = selectedDomains
    .slice(0, 3)
    .map(id => DOMAINS.find(x => x.id === id)?.label)
    .join(' · ')
    + (selectedDomains.length > 3 ? ` +${selectedDomains.length - 3}` : '')
    + (!isAcheteur && selectedLevel ? '  ·  ' + LEVELS.find(x => x.id === selectedLevel)?.label : '');

  function submit() {
    onRegister(nomVal.current, emailVal.current, passwordVal.current);
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
    >
      {/* Résumé des choix step 1 */}
      <Text style={styles.summaryLine} numberOfLines={1}>{summaryText}</Text>

      {/* Champs non contrôlés — pas de value= */}
      <View style={styles.fields}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Prénom</Text>
          <TextInput
            style={styles.input}
            placeholder="Ton prénom"
            placeholderTextColor={COLORS.textLight}
            defaultValue=""
            onChangeText={t => { nomVal.current = t; }}
            autoCapitalize="words"
            keyboardType="default"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailInputRef.current?.focus()}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="ton@email.com"
            placeholderTextColor={COLORS.textLight}
            defaultValue=""
            onChangeText={t => { emailVal.current = t; }}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mot de passe</Text>
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textLight}
            defaultValue=""
            onChangeText={t => { passwordVal.current = t; }}
            secureTextEntry
            autoCapitalize="none"
            keyboardType="default"
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={submit}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: accentColor }, loading && styles.btnLoading]}
        onPress={submit}
        disabled={loading}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>
          {loading ? 'Création en cours…' : 'Créer mon compte'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.replace('Register', { role: otherRole })}
        style={styles.switchBtn}
      >
        <Text style={styles.switchText}>
          Je suis {role === 'acheteur' ? 'un ghostwriter' : 'un client'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
});

// ── Écran inscription ──────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation, route }) {
  const role       = route.params?.role ?? 'acheteur';
  const meta       = ROLE_META[role];
  const otherRole  = role === 'acheteur' ? 'prestataire' : 'acheteur';
  const isAcheteur = role === 'acheteur';

  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedLevel,   setSelectedLevel]   = useState(null); // prestataire only

  // Loading partagé avec StepTwoForm
  const [loading, setLoading] = useState(false);

  // Step 1 : entrée initiale + slide-out
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(28)).current;
  const panelX      = useRef(new Animated.Value(0)).current;
  // Step 2 : fade-in séparé — PAS dans le même Animated.View que panelX
  const step2Fade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  }, []);

  function toggleDomain(id) {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  }

  function slideToStep(target, dir = 'forward') {
    if (dir === 'forward') {
      // Slide step 1 vers la gauche → step 2 fade in (hors Animated.View)
      Animated.timing(panelX, {
        toValue: -width, duration: 250, useNativeDriver: false, easing: Easing.in(Easing.quad),
      }).start(() => {
        step2Fade.setValue(0);
        setStep(target);
        Animated.timing(step2Fade, {
          toValue: 1, duration: 300, useNativeDriver: false, easing: Easing.out(Easing.quad),
        }).start();
      });
    } else {
      // Retour step 1 : fade out step 2 → restore step 1
      Animated.timing(step2Fade, {
        toValue: 0, duration: 180, useNativeDriver: false,
      }).start(() => {
        panelX.setValue(0);
        fadeAnim.setValue(0.6);
        setStep(target);
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 250, useNativeDriver: false,
        }).start();
      });
    }
  }

  function handleBack() {
    if (step === 2) slideToStep(1, 'backward');
    else navigation.goBack();
  }

  function handleNext() {
    if (selectedDomains.length === 0) {
      Alert.alert('Sélection requise', 'Choisis au moins un domaine pour continuer.');
      return;
    }
    if (!isAcheteur && !selectedLevel) {
      Alert.alert('Niveau requis', 'Indique ton niveau d\'expérience.');
      return;
    }
    slideToStep(2, 'forward');
  }

  // Reçoit nom/email/password depuis StepTwoForm
  async function handleRegister(nom, email, password) {
    if (!nom.trim() || !email.trim() || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { role, nom: nom.trim(), domains: selectedDomains, level: selectedLevel },
      },
    });
    if (signUpError) {
      setLoading(false);
      Alert.alert('Erreur', signUpError.message);
      return;
    }
    // Connexion immédiate après inscription
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (!signInError) {
      // Enrichir la fiche users avec les domaines et le niveau choisis à l'inscription
      try {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser?.id) {
          const domainLabels = selectedDomains.map(id => DOMAINS.find(d => d.id === id)?.label ?? id);
          await supabase.from('users').update({
            tags:      selectedDomains,                                           // IDs pour filtrage
            skills:    domainLabels,                                              // Labels affichés sur le profil
            specialty: !isAcheteur ? (LEVELS.find(l => l.id === selectedLevel)?.label ?? null) : null,
          }).eq('id', newUser.id);
        }
      } catch (err) {
        console.warn('[RegisterScreen] profile enrichment error:', err?.message ?? err);
      }
    }
    setLoading(false);
    if (signInError) {
      // Email confirmation requise côté Supabase
      Alert.alert(
        'Confirme ton email ✉️',
        `Un lien d'activation a été envoyé à ${email.trim()}. Clique dessus pour accéder à ton compte.`,
        [{ text: 'OK' }]
      );
    }
    // Sinon onAuthStateChange navigue automatiquement
  }

  const accentColor = meta.color;
  const accentBg    = meta.bg;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {step === 1 && <BubbleBackground variant={role} />}

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: accentColor }]} />
            <View style={[styles.stepLine, step === 2 && { backgroundColor: accentColor + '70' }]} />
            <View style={[styles.stepDot, step === 2 ? { backgroundColor: accentColor } : { backgroundColor: COLORS.border }]} />
          </View>
        </View>
      </SafeAreaView>

      {/* ── STEP 1 — dans Animated.View (slide + fade initiaux) ── */}
      {step === 1 && (
        <Animated.View
          style={[
            styles.panels,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: panelX }] },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isAcheteur ? (
              <>
                <Text style={styles.title}>Dans quelle niche ?</Text>
                <Text style={styles.subtitle}>
                  Sélectionne la ou les niches de ton business.{'\n'}On trouve les ghostwriters qui te correspondent.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Tes spécialités ?</Text>
                <Text style={styles.subtitle}>
                  Sélectionne les niches dans lesquelles tu écris.{'\n'}Tu peux en choisir plusieurs.
                </Text>
              </>
            )}

            {/* Grille domaines */}
            <View style={styles.grid}>
              {DOMAINS.map(domain => {
                const sel = selectedDomains.includes(domain.id);
                return (
                  <TouchableOpacity
                    key={domain.id}
                    style={[
                      styles.domainCard,
                      sel && { borderColor: accentColor + '90', backgroundColor: accentBg },
                    ]}
                    onPress={() => toggleDomain(domain.id)}
                    activeOpacity={0.72}
                  >
                    <View style={[styles.domainBar, sel && { backgroundColor: accentColor }]} />
                    <Text style={[styles.domainLabel, sel && { color: accentColor }]}>
                      {domain.label}
                    </Text>
                    <Text style={styles.domainSub}>{domain.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sélecteur niveau — ghostwriter uniquement */}
            {!isAcheteur && (
              <>
                <Text style={styles.sectionLabel}>Ton expérience en ghostwriting</Text>
                <View style={styles.levelRow}>
                  {LEVELS.map(lv => {
                    const sel = selectedLevel === lv.id;
                    return (
                      <TouchableOpacity
                        key={lv.id}
                        style={[
                          styles.levelCard,
                          sel && { borderColor: accentColor, backgroundColor: accentBg },
                        ]}
                        onPress={() => setSelectedLevel(lv.id)}
                        activeOpacity={0.72}
                      >
                        <Text style={[styles.levelLabel, sel && { color: accentColor }]}>
                          {lv.label}
                        </Text>
                        <Text style={styles.levelSub}>{lv.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: selectedDomains.length === 0 ? COLORS.card : accentColor },
                selectedDomains.length === 0 && { borderWidth: 1, borderColor: COLORS.border },
              ]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {selectedDomains.length > 0
                  ? `Continuer  ·  ${selectedDomains.length} domaine${selectedDomains.length > 1 ? 's' : ''}`
                  : 'Continuer'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      )}

      {/* ── STEP 2 — HORS Animated.View pour ne jamais interférer avec le clavier ── */}
      {step === 2 && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <Animated.View style={[styles.panels, { opacity: step2Fade }]}>
            {/* Badge rôle + titre */}
            <View style={[styles.rolePill, { borderColor: accentColor + '55', backgroundColor: accentBg, marginHorizontal: SPACING.lg, marginTop: SPACING.sm }]}>
              <View style={[styles.rolePillDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.rolePillText, { color: accentColor }]}>{meta.desc}</Text>
            </View>
            <Text style={[styles.title, { marginHorizontal: SPACING.lg, marginTop: SPACING.sm }]}>Créer un compte</Text>

            {/* Formulaire isolé — re-renders internes seulement */}
            <StepTwoForm
              accentColor={accentColor}
              onRegister={handleRegister}
              loading={loading}
              selectedDomains={selectedDomains}
              selectedLevel={selectedLevel}
              isAcheteur={isAcheteur}
              navigation={navigation}
              role={role}
              otherRole={otherRole}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* Footer épinglé en bas */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerText}>
            Déjà un compte ?{'  '}
            <Text style={styles.footerLink}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  backBtn: { paddingVertical: SPACING.sm, paddingRight: SPACING.md },
  backText: { fontSize: 20, color: COLORS.textMuted },

  stepRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingRight: SPACING.xl,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  stepLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  panels: { flex: 1 },

  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  title: {
    fontSize: 26,
    color: COLORS.text,
    ...FONT.bold,
    letterSpacing: -0.3,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },

  // ── Grille domaines ────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  domainCard: {
    width: CARD_W,
    backgroundColor: 'rgba(29,29,43,0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  domainBar: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  domainLabel: {
    fontSize: 13,
    color: COLORS.text,
    ...FONT.semibold,
    marginBottom: 3,
  },
  domainSub: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },

  // ── Niveau ────────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    ...FONT.semibold,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  levelRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  levelCard: {
    flex: 1,
    backgroundColor: 'rgba(29,29,43,0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 13,
    color: COLORS.text,
    ...FONT.semibold,
    marginBottom: 3,
  },
  levelSub: { fontSize: 11, color: COLORS.textMuted },

  // ── Step 2 : Formulaire ───────────────────────────────────────────────────
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: SPACING.sm,
  },
  rolePillDot: { width: 6, height: 6, borderRadius: 3 },
  rolePillText: { fontSize: 12, ...FONT.medium },

  summaryLine: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },

  fields: { gap: SPACING.md, marginBottom: SPACING.lg },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    ...FONT.medium,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.text,
  },

  // ── Boutons ───────────────────────────────────────────────────────────────
  btn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnMuted: {},
  btnLoading: { opacity: 0.5 },
  btnText: { fontSize: 15, color: '#fff', ...FONT.semibold },

  bottomFooter: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: 38,
  },
  footerText: { fontSize: 14, color: COLORS.textMuted },
  footerLink: { color: COLORS.primaryLight, ...FONT.semibold },

  switchBtn: { alignItems: 'center', marginTop: SPACING.sm },
  switchText: { fontSize: 13, color: COLORS.textLight },
});
