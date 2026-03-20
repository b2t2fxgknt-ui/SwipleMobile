import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width } = Dimensions.get('window');

const ROLE_META = {
  acheteur:    { label: 'Acheteur',  color: COLORS.acheteur,    bg: COLORS.acheteurBg,    desc: 'Tu cherches un freelance' },
  prestataire: { label: 'Freelance', color: COLORS.prestataire,  bg: COLORS.prestataireBg, desc: 'Tu proposes tes services'  },
};

const DOMAINS = [
  { id: 'dev',       label: 'Développement',  sub: 'Web, back-end, API'      },
  { id: 'design',    label: 'Design & UI/UX', sub: 'Interfaces, produit'     },
  { id: 'mobile',    label: 'Mobile',         sub: 'iOS, Android'            },
  { id: 'marketing', label: 'Marketing',      sub: 'Growth, paid, CRM'       },
  { id: 'content',   label: 'Contenu & SEO',  sub: 'Rédaction, copywriting'  },
  { id: 'video',     label: 'Vidéo & Motion', sub: 'Montage, animation'      },
  { id: 'data',      label: 'Data & IA',      sub: 'Analyse, modèles'        },
  { id: 'branding',  label: 'Branding',       sub: 'Identité, logo'          },
  { id: 'photo',     label: 'Photo',          sub: 'Corporate, produit'      },
  { id: 'social',    label: 'Social Media',   sub: 'Community, stratégie'    },
  { id: '3d',        label: '3D & Archi',     sub: 'Modélisation, rendu'     },
  { id: 'audio',     label: 'Audio',          sub: 'Son, musique, podcast'   },
];

const LEVELS = [
  { id: 'junior',   label: 'Junior',    sub: '0 – 2 ans' },
  { id: 'confirme', label: 'Confirmé',  sub: '3 – 5 ans' },
  { id: 'expert',   label: 'Expert',    sub: '6 ans +'   },
];

const CARD_W = (width - SPACING.lg * 2 - SPACING.sm) / 2;

export default function RegisterScreen({ navigation, route }) {
  const role       = route.params?.role ?? 'acheteur';
  const meta       = ROLE_META[role];
  const otherRole  = role === 'acheteur' ? 'prestataire' : 'acheteur';
  const isAcheteur = role === 'acheteur';

  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedLevel,   setSelectedLevel]   = useState(null); // prestataire only

  // Step 2 state
  const [nom,      setNom]      = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const panelX    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  function toggleDomain(id) {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  }

  function slideToStep(target, dir = 'forward') {
    const outTo  = dir === 'forward' ? -width : width;
    const inFrom = dir === 'forward' ?  width * 0.7 : -width * 0.7;
    Animated.timing(panelX, {
      toValue: outTo,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad),
    }).start(() => {
      setStep(target);
      panelX.setValue(inFrom);
      Animated.timing(panelX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }).start();
    });
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

  async function handleRegister() {
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
      <BubbleBackground variant={role} />

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

      {/* Panels */}
      <Animated.View
        style={[
          styles.panels,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: panelX }] },
        ]}
      >
        {/* ── STEP 1 ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isAcheteur ? (
              <>
                <Text style={styles.title}>Tu cherches quoi ?</Text>
                <Text style={styles.subtitle}>
                  Sélectionne les domaines qui t'intéressent.{'\n'}Tu peux en choisir plusieurs.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Tu fais quoi ?</Text>
                <Text style={styles.subtitle}>
                  Sélectionne tes domaines d'expertise.{'\n'}Tu peux en choisir plusieurs.
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

            {/* Sélecteur niveau — prestataire uniquement */}
            {!isAcheteur && (
              <>
                <Text style={styles.sectionLabel}>Ton niveau</Text>
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
        )}

        {/* ── STEP 2 ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Badge rôle */}
              <View style={[styles.rolePill, { borderColor: accentColor + '55', backgroundColor: accentBg }]}>
                <View style={[styles.rolePillDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.rolePillText, { color: accentColor }]}>{meta.desc}</Text>
              </View>

              <Text style={styles.title}>Créer un compte</Text>

              {/* Résumé discret */}
              <Text style={styles.summaryLine} numberOfLines={1}>
                {selectedDomains
                  .slice(0, 3)
                  .map(id => DOMAINS.find(x => x.id === id)?.label)
                  .join(' · ')}
                {selectedDomains.length > 3 ? ` +${selectedDomains.length - 3}` : ''}
                {!isAcheteur && selectedLevel
                  ? '  ·  ' + LEVELS.find(x => x.id === selectedLevel)?.label
                  : ''}
              </Text>

              {/* Champs */}
              <View style={styles.fields}>
                {[
                  { key: 'nom',      label: 'Prénom',       placeholder: 'Ton prénom',   value: nom,      set: setNom,      secure: false, kb: 'default'       },
                  { key: 'email',    label: 'Email',        placeholder: 'ton@email.com', value: email,    set: setEmail,    secure: false, kb: 'email-address' },
                  { key: 'password', label: 'Mot de passe', placeholder: '••••••••',      value: password, set: setPassword, secure: true,  kb: 'default'       },
                ].map(f => {
                  const isFocused = focused === f.key;
                  return (
                    <View key={f.key} style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, isFocused && { color: accentColor }]}>
                        {f.label}
                      </Text>
                      <TextInput
                        style={[styles.input, isFocused && { borderColor: accentColor }]}
                        placeholder={f.placeholder}
                        placeholderTextColor={COLORS.textLight}
                        value={f.value}
                        onChangeText={f.set}
                        secureTextEntry={f.secure}
                        autoCapitalize="none"
                        keyboardType={f.kb}
                        onFocus={() => setFocused(f.key)}
                        onBlur={() => setFocused(null)}
                      />
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: accentColor }, loading && styles.btnLoading]}
                onPress={handleRegister}
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
                  Continuer en tant que {ROLE_META[otherRole].label}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>

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
