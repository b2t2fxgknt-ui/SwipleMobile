/**
 * BriefDetailScreen.js — Détail d'une demande côté freelance + candidature
 * Params : { brief } (objet brief complet de SearchScreen)
 * Flow : SearchScreen → BriefDetailScreen → (envoi message) → confirmation
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Animated, StatusBar, Platform, SafeAreaView, KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

// ─── Extended brief data ───────────────────────────────────────────────────────

const BRIEF_EXTRAS = {
  '1': {
    description: 'Créatrice TikTok avec 450K abonnés dans la musique. Besoin d\'un monteur régulier pour 4 à 8 vidéos/mois. Style dynamique, cuts rapides, sous-titres animés.',
    requirements: ['Maîtrise CapCut ou Premiere Pro', 'Portfolio TikTok requis', 'Disponibilité sous 48h'],
    examplesRef: 'Style @charlidamelio, @dojacat — cuts rapides, transitions tendance',
    responseTime: '< 2h',
    postedAt: 'Il y a 3h',
    applicants: 4,
  },
  '2': {
    description: 'Marque de cosmétiques française cherche designer pour miniatures YouTube cohérentes avec la charte graphique existante. Besoin d\'une série de 10 miniatures.',
    requirements: ['Photoshop ou Canva Pro', 'Sens de la couleur et du luxe', 'Charte à respecter'],
    examplesRef: 'Style premium, tons roses et dorés, typographie Serif',
    responseTime: '< 4h',
    postedAt: 'Il y a 1 jour',
    applicants: 11,
  },
  '3': {
    description: 'Tech YouTuber français 200K abonnés cherche scénariste pour scripts hebdomadaires. Sujets : IA, crypto, tech. Durée cible : 8-12 minutes.',
    requirements: ['Connaissance tech et IA', 'Style narratif dynamique', 'Structure storytelling'],
    examplesRef: 'Style MrBeast pour la structure, vulgarisation à la Micode',
    responseTime: '< 3h',
    postedAt: 'Il y a 5h',
    applicants: 7,
  },
  '4': {
    description: 'Startup D2C beauté cherche éditeur UGC régulier. Vidéos produit native, format TikTok et Reels. Contenu livré par acteurs UGC, besoin de montage final.',
    requirements: ['Expérience UGC brand obligatoire', 'Maîtrise des trends TikTok', 'Livraison en 24h impérative'],
    examplesRef: 'Contenu natif, pas de feeling publicité. Style @thinx, @fenty',
    responseTime: '< 1h',
    postedAt: 'Il y a 45 min',
    applicants: 2,
  },
  '5': {
    description: 'Influenceur 1M abonnés TikTok lifestyle cherche expert sous-titres animés. Style similaire aux sous-titres de type "podcast clips".',
    requirements: ['CapCut ou After Effects', 'Rapidité d\'exécution', 'Pack de styles perso bienvenu'],
    examplesRef: 'Style podcast clips viraux — mots colorés, animation mot à mot',
    responseTime: '< 6h',
    postedAt: 'Il y a 2 jours',
    applicants: 19,
  },
  '6': {
    description: 'Coach fitness 120K abonnés Instagram cherche monteur Reels dynamique. Contenu workout à la salle. Besoin de rythme, de musique bien choisie.',
    requirements: ['Sens du rythme musical fort', 'Transitions dynamiques', 'Connaissance fitness bienvenue'],
    examplesRef: 'Style Chris Heria, Larry Wheels — énergie, cuts sur le beat',
    responseTime: '< 2h',
    postedAt: 'Il y a 8h',
    applicants: 6,
  },
  '7': {
    description: 'Fashion creator 80K cherche scripteur pour hooks TikTok. Contenu mode, lifestyle, tendances. 3-4 scripts/semaine.',
    requirements: ['Écriture créative et concise', 'Veille mode et tendances', 'Ton naturel et authentique'],
    examplesRef: 'Hooks courts, accrocheurs, punchlines en 3s max',
    responseTime: '< 4h',
    postedAt: 'Il y a 1 jour',
    applicants: 9,
  },
  '8': {
    description: 'Gaming channel 500K YouTube cherche monteur professionnel. Sessions longue durée (3h+), besoin de montage condensé 15-20 min. Genre FPS/Battle Royale.',
    requirements: ['Maîtrise Premiere Pro ou DaVinci', 'Fan de gaming essentiel', 'Expérience gaming content'],
    examplesRef: 'Style Squeezie, MontanaBlack — énergie, zooms, réactions',
    responseTime: '< 3h',
    postedAt: 'Il y a 3 jours',
    applicants: 14,
  },
};

const BRIEF_CAT_COLOR = {
  tiktok:  '#7C3AED',
  reels:   '#EC4899',
  youtube: '#EF4444',
  ugc:     '#F59E0B',
  script:  '#3B82F6',
  video:   '#10B981',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BriefDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const brief = route.params?.brief ?? {};
  const extra = BRIEF_EXTRAS[brief.id] ?? {};

  const [showApply, setShowApply] = useState(false);
  const [message, setMessage]    = useState('');
  const [rate, setRate]          = useState('');
  const [sent, setSent]          = useState(false);

  const sheetY   = useRef(new Animated.Value(600)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const successA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const openApply = useCallback(() => {
    setShowApply(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(sheetY,   { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [sheetY, backdrop]);

  const closeApply = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(sheetY,   { toValue: 600, duration: 280, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0,   duration: 280, useNativeDriver: true }),
    ]).start(() => setShowApply(false));
  }, [sheetY, backdrop]);

  const handleSend = useCallback(() => {
    if (message.trim().length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
    Animated.spring(successA, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    setTimeout(() => {
      closeApply();
      setSent(false);
      navigation.goBack();
    }, 2200);
  }, [message, successA, closeApply, navigation]);

  const primaryCat = brief.categories?.[0];
  const accentColor = BRIEF_CAT_COLOR[primaryCat] ?? COLORS.primary;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Demande</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <Animated.View style={{ flex: 1, opacity: fadeIn }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Creator hero */}
            <View style={[styles.heroCard, { borderColor: accentColor + '30' }]}>
              <LinearGradient colors={[accentColor + '15', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.heroRow}>
                <View style={[styles.creatorAvatar, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
                  <Text style={styles.creatorEmoji}>{brief.emoji ?? '👤'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.creatorName}>{brief.creator}</Text>
                  <View style={styles.metaChips}>
                    {(brief.categories ?? []).map(cat => (
                      <View key={cat} style={[styles.catChip, { backgroundColor: (BRIEF_CAT_COLOR[cat] ?? COLORS.primary) + '20', borderColor: (BRIEF_CAT_COLOR[cat] ?? COLORS.primary) + '40' }]}>
                        <Text style={[styles.catChipText, { color: BRIEF_CAT_COLOR[cat] ?? COLORS.primary }]}>{cat}</Text>
                      </View>
                    ))}
                    {brief.urgency && (
                      <View style={styles.urgentChip}>
                        <Ionicons name="flash" size={10} color="#EF4444" />
                        <Text style={styles.urgentText}>Urgent</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.briefTitle}>{brief.title}</Text>

              {/* Budget + meta */}
              <View style={styles.briefMeta}>
                <View style={styles.budgetBox}>
                  <Text style={[styles.budgetVal, { color: accentColor }]}>{brief.budgetMin}–{brief.budgetMax}€</Text>
                  <Text style={styles.budgetLabel}>par mission</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaItemText}>{extra.applicants ?? 3} candidats</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaItemText}>{extra.postedAt ?? 'Récent'}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            {extra.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>La demande</Text>
                <Text style={styles.sectionBody}>{extra.description}</Text>
              </View>
            )}

            {/* Requirements */}
            {extra.requirements && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Compétences requises</Text>
                <View style={styles.reqList}>
                  {extra.requirements.map((req, i) => (
                    <View key={i} style={styles.reqItem}>
                      <View style={[styles.reqDot, { backgroundColor: accentColor }]} />
                      <Text style={styles.reqText}>{req}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Examples ref */}
            {extra.examplesRef && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Références souhaitées</Text>
                <View style={[styles.refBox, { borderColor: accentColor + '40', backgroundColor: accentColor + '08' }]}>
                  <Ionicons name="sparkles-outline" size={14} color={accentColor} />
                  <Text style={[styles.refText, { color: accentColor }]}>{extra.examplesRef}</Text>
                </View>
              </View>
            )}

            {/* Response time */}
            <View style={styles.trustRow}>
              {[
                { icon: 'shield-checkmark-outline', text: 'Paiement escrow protégé', color: '#22C55E' },
                { icon: 'chatbubble-outline',        text: `Répond en ${extra.responseTime ?? '< 4h'}`, color: accentColor },
              ].map((item, i) => (
                <View key={i} style={styles.trustItem}>
                  <Ionicons name={item.icon} size={14} color={item.color} />
                  <Text style={[styles.trustText, { color: item.color }]}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>

        {/* CTA sticky */}
        <View style={styles.ctaBar}>
          <TouchableOpacity style={styles.ctaBtn} onPress={openApply} activeOpacity={0.88}>
            <LinearGradient
              colors={[accentColor, accentColor + 'CC']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#fff" />
              <Text style={styles.ctaText}>Proposer mes services</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Apply sheet backdrop */}
        {showApply && (
          <Animated.View
            style={[styles.backdrop, { opacity: backdrop }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeApply} activeOpacity={1} />
          </Animated.View>
        )}

        {/* Apply bottom sheet */}
        {showApply && (
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            {sent ? (
              // Success state
              <Animated.View style={[styles.sentState, { transform: [{ scale: successA }], opacity: successA }]}>
                <LinearGradient colors={[accentColor, accentColor + 'CC']} style={styles.sentIcon}>
                  <Ionicons name="checkmark" size={30} color="#fff" />
                </LinearGradient>
                <Text style={styles.sentTitle}>Candidature envoyée !</Text>
                <Text style={styles.sentSub}>Le créateur a été notifié et vous répondra rapidement.</Text>
              </Animated.View>
            ) : (
              <>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Proposer mes services</Text>
                <Text style={styles.sheetSub}>Présentez-vous et expliquez pourquoi vous êtes le bon profil pour ce brief.</Text>

                {/* Rate input */}
                <View style={styles.rateRow}>
                  <Text style={styles.rateLabel}>Mon tarif pour ce brief</Text>
                  <View style={styles.rateInput}>
                    <TextInput
                      style={styles.rateField}
                      value={rate}
                      onChangeText={v => setRate(v.replace(/[^0-9]/g, ''))}
                      placeholder={`${brief.budgetMin ?? 40}`}
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    <Text style={styles.rateEuro}>€</Text>
                  </View>
                </View>

                {/* Message */}
                <View style={styles.messageBox}>
                  <TextInput
                    style={styles.messageInput}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Bonjour ! J'ai vu votre demande et je serais parfait pour ce brief. Voici pourquoi..."
                    placeholderTextColor={COLORS.textLight}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    autoFocus
                  />
                  <Text style={styles.charCount}>{message.length}/500</Text>
                </View>

                <TouchableOpacity
                  style={[styles.sendBtn, message.trim().length < 10 && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={[accentColor, accentColor + 'CC']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.sendGrad}
                  >
                    <Ionicons name="paper-plane" size={15} color="#fff" />
                    <Text style={styles.sendText}>Envoyer la candidature</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 4 : 16,
    paddingBottom: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, ...FONT.semibold, color: COLORS.text },

  scroll: { padding: SPACING.lg, gap: SPACING.lg },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, padding: SPACING.lg, gap: SPACING.md, overflow: 'hidden',
  },
  heroRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  creatorAvatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  creatorEmoji: { fontSize: 26 },
  creatorName:  { fontSize: 15, ...FONT.semibold, color: COLORS.text, marginBottom: 6 },
  metaChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  catChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  catChipText:  { fontSize: 10, ...FONT.semibold },
  urgentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444440',
  },
  urgentText: { fontSize: 10, ...FONT.semibold, color: '#EF4444' },

  briefTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, lineHeight: 26 },

  briefMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  budgetBox:  { alignItems: 'center' },
  budgetVal:  { fontSize: 18, fontWeight: '900' },
  budgetLabel:{ fontSize: 10, color: COLORS.textMuted },
  metaDivider:{ width: 1, height: 30, backgroundColor: COLORS.border },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  metaItemText:{ fontSize: 12, color: COLORS.textMuted },

  // Sections
  section:     { gap: SPACING.sm },
  sectionTitle:{ fontSize: 13, ...FONT.semibold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionBody: { fontSize: 14, color: COLORS.text, lineHeight: 22 },

  // Requirements
  reqList:  { gap: 8 },
  reqItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reqDot:   { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  reqText:  { fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 },

  // Ref box
  refBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  refText: { fontSize: 13, flex: 1, lineHeight: 19, ...FONT.medium },

  // Trust row
  trustRow: {
    flexDirection: 'row', gap: SPACING.md,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  trustText: { fontSize: 12, ...FONT.medium },

  // CTA bar
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
  },
  ctaBtn:  { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  ctaText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  // Sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10 },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 44 : SPACING.xl,
    gap: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: SPACING.xs,
  },
  sheetTitle: { fontSize: 18, ...FONT.bold, color: COLORS.text },
  sheetSub:   { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginTop: -SPACING.sm },

  // Rate row
  rateRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rateLabel: { fontSize: 14, ...FONT.semibold, color: COLORS.text },
  rateInput: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 8, minWidth: 80,
  },
  rateField: { fontSize: 16, ...FONT.bold, color: COLORS.text, minWidth: 40 },
  rateEuro:  { fontSize: 16, ...FONT.bold, color: COLORS.textMuted },

  // Message
  messageBox: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  messageInput: { color: COLORS.text, fontSize: 14, minHeight: 90, lineHeight: 20 },
  charCount:    { textAlign: 'right', fontSize: 10, color: COLORS.textLight, marginTop: 4 },

  // Send
  sendBtn:          { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  sendBtnDisabled:  { opacity: 0.45 },
  sendGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  sendText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  // Sent success
  sentState: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xl },
  sentIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
  sentTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  sentSub:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});
