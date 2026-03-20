/**
 * EditProfileScreen.js — Édition complète du profil
 * Freelance : nom, bio, spécialité, tarif, compétences, disponibilité
 * Client    : nom, bio, secteur, budget préféré
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Platform,
  KeyboardAvoidingView, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

// ─── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'dev',       label: 'Développement', icon: 'code-slash-outline' },
  { id: 'design',    label: 'Design & UI/UX', icon: 'color-palette-outline' },
  { id: 'mobile',    label: 'Mobile',         icon: 'phone-portrait-outline' },
  { id: 'marketing', label: 'Marketing',      icon: 'trending-up-outline' },
  { id: 'content',   label: 'Contenu & SEO',  icon: 'document-text-outline' },
  { id: 'video',     label: 'Vidéo & Motion', icon: 'videocam-outline' },
  { id: 'data',      label: 'Data & IA',      icon: 'analytics-outline' },
  { id: 'branding',  label: 'Branding',       icon: 'brush-outline' },
];

const SKILLS_BY_CAT = {
  dev:       ['React', 'Node.js', 'Python', 'TypeScript', 'Next.js', 'GraphQL', 'Docker', 'AWS'],
  design:    ['Figma', 'Sketch', 'Illustrator', 'Photoshop', 'Framer', 'UI Design', 'UX Research'],
  mobile:    ['React Native', 'Swift', 'Kotlin', 'Flutter', 'Expo', 'Firebase'],
  marketing: ['Google Ads', 'Meta Ads', 'SEO', 'Email', 'Growth Hacking', 'CRM', 'Analytics'],
  content:   ['Copywriting', 'SEO', 'Blog', 'LinkedIn', 'Newsletter', 'UX Writing'],
  video:     ['Premiere Pro', 'After Effects', 'DaVinci', 'Motion Design', 'YouTube'],
  data:      ['Python', 'SQL', 'Tableau', 'Power BI', 'ML', 'NLP', 'Data Engineering'],
  branding:  ['Logo', 'Charte graphique', 'Packaging', 'Naming', 'Identité visuelle'],
};

const ALL_SKILLS = Array.from(new Set(Object.values(SKILLS_BY_CAT).flat()));

const DELIVERY_OPTIONS = ['24h', '48h', '3 jours', '5 jours', '7 jours', '2 semaines'];

const BUDGET_RANGES = ['< 100€', '100–500€', '500–2k€', '2k–10k€', '> 10k€'];

const SECTORS = ['Tech', 'E-commerce', 'Startup', 'Média', 'Luxe', 'Santé', 'Finance', 'Education'];

// ─── FieldLabel ────────────────────────────────────────────────────────────────

function FieldLabel({ text, optional }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{text}</Text>
      {optional && <Text style={styles.fieldOptional}>optionnel</Text>}
    </View>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────

function Section({ title, icon, accentColor, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconBox, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={icon} size={14} color={accentColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

// ─── TagChip ───────────────────────────────────────────────────────────────────

function TagChip({ label, selected, accentColor, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected
          ? { backgroundColor: accentColor + '18', borderColor: accentColor + '50' }
          : { backgroundColor: COLORS.card, borderColor: COLORS.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {selected && <Ionicons name="checkmark" size={10} color={accentColor} />}
      <Text style={[styles.chipText, { color: selected ? accentColor : COLORS.textMuted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const navigation  = useNavigation();
  const session = useSession();
  const user        = session?.user;
  const role        = user?.user_metadata?.role ?? 'acheteur';
  const isFreelancer = role === 'prestataire';
  const accentColor  = isFreelancer ? COLORS.prestataire : COLORS.primary;

  // ── State ──────────────────────────────────────────────────────────────────
  const [name,     setName]     = useState(user?.user_metadata?.name ?? '');
  const [bio,      setBio]      = useState('');
  const [category, setCategory] = useState('');
  const [skills,   setSkills]   = useState([]);  // freelancer skills
  const [rate,     setRate]     = useState('');  // daily rate €
  const [delivery, setDelivery] = useState('');  // default delivery time
  const [portfolio, setPortfolio] = useState(''); // portfolio URL
  const [linkedin,  setLinkedin]  = useState(''); // LinkedIn URL

  // client fields
  const [sector, setSector]       = useState('');
  const [budget, setBudget]       = useState('');

  const [saving, setSaving] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;

  // ── Load profile from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('name, bio, category, skills, daily_rate, default_delivery, portfolio_url, linkedin_url, sector, budget_range')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.name)             setName(data.name);
        if (data.bio)              setBio(data.bio);
        if (data.category)         setCategory(data.category);
        if (data.skills)           setSkills(data.skills);
        if (data.daily_rate)       setRate(String(data.daily_rate));
        if (data.default_delivery) setDelivery(data.default_delivery);
        if (data.portfolio_url)    setPortfolio(data.portfolio_url);
        if (data.linkedin_url)     setLinkedin(data.linkedin_url);
        if (data.sector)           setSector(data.sector);
        if (data.budget_range)     setBudget(data.budget_range);
      });
  }, [user?.id]);

  // ── Skills toggle ──────────────────────────────────────────────────────────
  function toggleSkill(skill) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Champ requis', 'Le nom est obligatoire.');
      return;
    }

    setSaving(true);
    Animated.sequence([
      Animated.timing(saveScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(saveScale,  { toValue: 1,    useNativeDriver: true }),
    ]).start();

    try {
      const payload = isFreelancer
        ? {
            name: name.trim(),
            bio: bio.trim(),
            category,
            skills,
            daily_rate: rate ? parseInt(rate, 10) : null,
            default_delivery: delivery,
            portfolio_url: portfolio.trim(),
            linkedin_url: linkedin.trim(),
          }
        : {
            name: name.trim(),
            bio: bio.trim(),
            sector,
            budget_range: budget,
          };

      const { error } = await supabase
        .from('users')
        .upsert({ id: user.id, ...payload });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      setSaving(false);
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie dans un instant.');
    }
  }

  // ── Skills to show ─────────────────────────────────────────────────────────
  const skillsToShow = category && SKILLS_BY_CAT[category]
    ? Array.from(new Set([...SKILLS_BY_CAT[category], ...skills.filter(s => !SKILLS_BY_CAT[category]?.includes(s))]))
    : ALL_SKILLS.slice(0, 20);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Modifier le profil</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Avatar placeholder ── */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarCircle, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
                <Text style={[styles.avatarInitial, { color: accentColor }]}>
                  {name.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <TouchableOpacity style={styles.avatarEditBtn} activeOpacity={0.8}>
                <LinearGradient
                  colors={[accentColor, accentColor + 'CC']}
                  style={styles.avatarEditGrad}
                >
                  <Ionicons name="camera" size={13} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Appuyez pour changer la photo</Text>
            </View>

            {/* ── Section Identité ── */}
            <Section title="Identité" icon="person-outline" accentColor={accentColor}>
              <FieldLabel text="Nom complet" />
              <TextInput
                style={[styles.input, { borderColor: name ? accentColor + '40' : COLORS.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Ton nom ou pseudo"
                placeholderTextColor={COLORS.textLight}
                selectionColor={accentColor}
                returnKeyType="next"
              />

              <FieldLabel text="Bio" optional />
              <TextInput
                style={[styles.input, styles.textarea, { borderColor: bio ? accentColor + '40' : COLORS.border }]}
                value={bio}
                onChangeText={v => v.length <= 200 && setBio(v)}
                placeholder={isFreelancer
                  ? 'Décris ton expertise, ta passion, ce qui te différencie…'
                  : 'Parle de ton projet, de tes besoins…'}
                placeholderTextColor={COLORS.textLight}
                selectionColor={accentColor}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </Section>

            {/* ── Section Freelance ── */}
            {isFreelancer && (
              <>
                <Section title="Expertise" icon="briefcase-outline" accentColor={accentColor}>
                  <FieldLabel text="Catégorie principale" />
                  <View style={styles.chipsWrap}>
                    {CATEGORIES.map(cat => (
                      <TagChip
                        key={cat.id}
                        label={cat.label}
                        selected={category === cat.id}
                        accentColor={accentColor}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCategory(prev => prev === cat.id ? '' : cat.id);
                        }}
                      />
                    ))}
                  </View>

                  <View style={styles.rateRow}>
                    <View style={{ flex: 1 }}>
                      <FieldLabel text="Tarif journalier (€)" optional />
                      <View style={styles.rateInput}>
                        <TextInput
                          style={styles.rateField}
                          value={rate}
                          onChangeText={v => setRate(v.replace(/[^0-9]/g, ''))}
                          placeholder="350"
                          placeholderTextColor={COLORS.textLight}
                          keyboardType="numeric"
                          selectionColor={accentColor}
                        />
                        <Text style={styles.rateSuffix}>€ / jour</Text>
                      </View>
                    </View>
                  </View>

                  <FieldLabel text="Délai de livraison par défaut" optional />
                  <View style={styles.chipsWrap}>
                    {DELIVERY_OPTIONS.map(opt => (
                      <TagChip
                        key={opt}
                        label={opt}
                        selected={delivery === opt}
                        accentColor={accentColor}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setDelivery(prev => prev === opt ? '' : opt);
                        }}
                      />
                    ))}
                  </View>
                </Section>

                <Section title="Compétences" icon="code-slash-outline" accentColor={accentColor}>
                  <Text style={styles.skillsHint}>
                    Sélectionne jusqu'à 10 compétences · {skills.length}/10
                  </Text>
                  <View style={styles.chipsWrap}>
                    {skillsToShow.map(skill => (
                      <TagChip
                        key={skill}
                        label={skill}
                        selected={skills.includes(skill)}
                        accentColor={accentColor}
                        onPress={() => {
                          if (!skills.includes(skill) && skills.length >= 10) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            return;
                          }
                          toggleSkill(skill);
                        }}
                      />
                    ))}
                  </View>
                </Section>

                <Section title="Liens" icon="link-outline" accentColor={accentColor}>
                  <FieldLabel text="Portfolio / site web" optional />
                  <View style={styles.linkInput}>
                    <Ionicons name="globe-outline" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.linkField}
                      value={portfolio}
                      onChangeText={setPortfolio}
                      placeholder="https://monportfolio.com"
                      placeholderTextColor={COLORS.textLight}
                      selectionColor={accentColor}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>

                  <FieldLabel text="LinkedIn" optional />
                  <View style={styles.linkInput}>
                    <Ionicons name="logo-linkedin" size={15} color="#0A66C2" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.linkField}
                      value={linkedin}
                      onChangeText={setLinkedin}
                      placeholder="https://linkedin.com/in/moi"
                      placeholderTextColor={COLORS.textLight}
                      selectionColor={accentColor}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                </Section>
              </>
            )}

            {/* ── Section Client ── */}
            {!isFreelancer && (
              <>
                <Section title="Préférences" icon="options-outline" accentColor={accentColor}>
                  <FieldLabel text="Secteur d'activité" optional />
                  <View style={styles.chipsWrap}>
                    {SECTORS.map(s => (
                      <TagChip
                        key={s}
                        label={s}
                        selected={sector === s}
                        accentColor={accentColor}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSector(prev => prev === s ? '' : s);
                        }}
                      />
                    ))}
                  </View>

                  <FieldLabel text="Budget habituel" optional />
                  <View style={styles.chipsWrap}>
                    {BUDGET_RANGES.map(b => (
                      <TagChip
                        key={b}
                        label={b}
                        selected={budget === b}
                        accentColor={accentColor}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBudget(prev => prev === b ? '' : b);
                        }}
                      />
                    ))}
                  </View>
                </Section>
              </>
            )}

            <View style={{ height: 110 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── CTA sticky ── */}
        <View style={styles.ctaWrapper}>
          <Animated.View style={[styles.ctaBtn, { transform: [{ scale: saveScale }] }]}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
              style={{ borderRadius: RADIUS.xl, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={isFreelancer ? [COLORS.prestataire, '#059669'] : [COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.ctaGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <Text style={styles.ctaText}>Sauvegarde…</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.ctaText}>Sauvegarder</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.lg },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '800' },
  avatarEditBtn: {
    position: 'absolute', bottom: 32, right: '50%',
    marginRight: -48, width: 26, height: 26, borderRadius: 13,
    overflow: 'hidden',
  },
  avatarEditGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarHint: { fontSize: 11, color: COLORS.textLight, marginTop: 8 },

  // Sections
  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: SPACING.sm,
  },
  sectionIconBox: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionBody:   {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md, gap: SPACING.xs,
    ...SHADOW.sm,
  },

  // Fields
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 },
  fieldLabel:    { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldOptional: { fontSize: 10, color: COLORS.textLight, fontStyle: 'italic' },

  input: {
    backgroundColor: COLORS.bg, borderWidth: 1.5,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12,
    fontSize: 14, color: COLORS.text, marginBottom: 4,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: COLORS.textLight, textAlign: 'right', marginBottom: 4 },

  // Rate
  rateRow:   { marginBottom: 4 },
  rateInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12,
    marginBottom: 4,
  },
  rateField:  { flex: 1, fontSize: 14, color: COLORS.text },
  rateSuffix: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  // Skills
  skillsHint: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontStyle: 'italic' },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Links
  linkInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12,
    marginBottom: 4,
  },
  linkField: { flex: 1, fontSize: 13, color: COLORS.text },

  // CTA
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'F0',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
  },
  ctaBtn:  { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17,
  },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
