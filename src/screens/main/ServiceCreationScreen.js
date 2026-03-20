/**
 * ServiceCreationScreen.js — Créer une nouvelle offre (côté freelance)
 * 3 étapes : Catégorie + Titre → Description + Prix → Preview + Publish
 * Params : aucun
 * Retour : DashboardScreen (refresh)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Animated, StatusBar, Platform, KeyboardAvoidingView,
 Dimensions, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

const SW = Dimensions.get('window').width;

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'video_montage',     label: 'Vidéo & Montage',    icon: 'videocam-outline',        color: '#EF4444' },
  { id: 'copywriting',       label: 'Copywriting',         icon: 'create-outline',           color: '#3B82F6' },
  { id: 'reseaux_sociaux',   label: 'Réseaux sociaux',    icon: 'phone-portrait-outline',   color: '#F59E0B' },
  { id: 'design',            label: 'Design & Branding',  icon: 'color-palette-outline',    color: '#8B5CF6' },
  { id: 'ia_automatisation', label: 'IA & Automatisation', icon: 'flash-outline',            color: '#10B981' },
  { id: 'site_web',          label: 'Site web',            icon: 'globe-outline',            color: '#6366F1' },
  { id: 'legal_admin',       label: 'Légal & Admin',      icon: 'document-text-outline',    color: '#EC4899' },
  { id: 'comptabilite',      label: 'Comptabilité',        icon: 'calculator-outline',       color: '#14B8A6' },
];

const DELIVERY_OPTIONS = [
  { id: '24h',  label: '24h',    sub: 'Ultra rapide' },
  { id: '48h',  label: '48h',    sub: 'Rapide' },
  { id: '3j',   label: '3 jours', sub: 'Standard' },
  { id: '5j',   label: '5 jours', sub: 'Confortable' },
  { id: '7j',   label: '7 jours', sub: 'Qualité' },
];

const REVISION_OPTIONS = [
  { id: '0', label: 'Aucune' },
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: 'illimité', label: 'Illimité' },
];

const TAGS_BY_CATEGORY = {
  video_montage:     ['Reels', 'TikTok', 'YouTube', 'Motion design', 'Sous-titres', 'Montage', 'UGC'],
  copywriting:       ['Hook', 'Script', 'Caption', 'Thread', 'Email', 'Landing page', 'Storytelling'],
  reseaux_sociaux:   ['Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'Pinterest', 'YouTube'],
  design:            ['Logo', 'Identité visuelle', 'Bannière', 'Thumbnail', 'Infographie', 'Carroussels'],
  ia_automatisation: ['ChatGPT', 'Make', 'Zapier', 'n8n', 'Automation', 'Prompt engineering'],
  site_web:          ['WordPress', 'Webflow', 'Shopify', 'React', 'Landing page', 'E-commerce'],
  legal_admin:       ['Statuts', 'Contrats', 'CGV', 'Mentions légales', 'RGPD'],
  comptabilite:      ['Bilan', 'Déclaration TVA', 'Facturation', 'Trésorerie'],
};

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total = 3 }) {
  const progress = useRef(new Animated.Value((step - 1) / (total - 1))).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: (step - 1) / (total - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ServiceCreationScreen() {
  const navigation = useNavigation();
  const session = useSession();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);

  // Form state
  const [category,     setCategory]     = useState(null);
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [price,        setPrice]        = useState('');
  const [delivery,     setDelivery]     = useState('48h');
  const [revisions,    setRevisions]    = useState('2');
  const [selectedTags, setSelectedTags] = useState([]);

  const panelX  = useRef(new Animated.Value(0)).current;
  const fadeIn  = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const slide = useCallback((target, dir = 'forward') => {
    Keyboard.dismiss();
    const outTo  = dir === 'forward' ? -SW : SW;
    const inFrom = dir === 'forward' ?  SW * 0.8 : -SW * 0.8;
    Animated.timing(panelX, { toValue: outTo, duration: 220, useNativeDriver: true }).start(() => {
      setStep(target);
      panelX.setValue(inFrom);
      Animated.timing(panelX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    });
  }, [panelX]);

  const handleBack = useCallback(() => {
    if (step === 1) navigation.goBack();
    else slide(step - 1, 'backward');
  }, [step, slide, navigation]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!category) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
      if (!title.trim() || title.trim().length < 10) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      slide(2);
    } else if (step === 2) {
      if (!price || isNaN(Number(price)) || Number(price) < 5) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      slide(3);
    }
  }, [step, category, title, price, slide]);

  const handlePublish = useCallback(async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const catData = CATEGORIES.find(c => c.id === category);
      await supabase.from('services').insert({
        freelancer_id: session?.user?.id,
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        delivery_time: delivery,
        revisions,
        tags: selectedTags,
        is_active: true,
      });
    } catch (_) {}

    setLoading(false);
    setPublished(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(successAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    setTimeout(() => navigation.goBack(), 2400);
  }, [session, category, title, description, price, delivery, revisions, selectedTags, successAnim, navigation]);

  const toggleTag = useCallback((tag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const catMeta = CATEGORIES.find(c => c.id === category);
  const step1Valid = !!category && title.trim().length >= 10;
  const step2Valid = !!price && !isNaN(Number(price)) && Number(price) >= 5;

  // ── Published success ──
  if (published) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0A180E', COLORS.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
          <Animated.View style={[styles.successWrap, { transform: [{ scale: successAnim }], opacity: successAnim }]}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.successCircle}>
              <Ionicons name="checkmark" size={42} color="#fff" />
            </LinearGradient>
            <Text style={styles.successTitle}>Offre publiée !</Text>
            <Text style={styles.successSub}>
              "{title.trim()}" est maintenant visible par les acheteurs.
            </Text>
            <View style={[styles.successCat, { backgroundColor: catMeta?.color + '20', borderColor: catMeta?.color + '40' }]}>
              <Ionicons name={catMeta?.icon ?? 'briefcase-outline'} size={14} color={catMeta?.color} />
              <Text style={[styles.successCatText, { color: catMeta?.color }]}>{catMeta?.label}</Text>
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

        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {step === 1 ? 'Ma prestation' : step === 2 ? 'Tarif & délai' : 'Aperçu'}
              </Text>
              <Text style={styles.headerStep}>Étape {step} sur 3</Text>
            </View>
          </View>
          <ProgressBar step={step} />
        </SafeAreaView>

        <Animated.View style={[{ flex: 1, transform: [{ translateX: panelX }] }]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && <Step1
              category={category}
              setCategory={setCategory}
              title={title}
              setTitle={setTitle}
            />}
            {step === 2 && <Step2
              price={price}
              setPrice={setPrice}
              description={description}
              setDescription={setDescription}
              delivery={delivery}
              setDelivery={setDelivery}
              revisions={revisions}
              setRevisions={setRevisions}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              category={category}
            />}
            {step === 3 && <Step3
              category={category}
              title={title}
              description={description}
              price={price}
              delivery={delivery}
              revisions={revisions}
              selectedTags={selectedTags}
            />}
            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              step === 1 && !step1Valid && styles.ctaBtnDisabled,
              step === 2 && !step2Valid && styles.ctaBtnDisabled,
            ]}
            onPress={step === 3 ? handlePublish : handleNext}
            disabled={loading}
            activeOpacity={0.88}
          >
            {step === 3 ? (
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Ionicons name="rocket-outline" size={16} color="#fff" />
                <Text style={styles.ctaText}>{loading ? 'Publication...' : 'Publier l\'offre'}</Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 1 : Catégorie + Titre ───────────────────────────────────────────────

function Step1({ category, setCategory, title, setTitle }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Quelle est votre prestation ?</Text>
      <Text style={styles.stepSub}>Sélectionnez une catégorie et donnez un titre accrocheur.</Text>

      {/* Category grid */}
      <View style={styles.catGrid}>
        {CATEGORIES.map(cat => {
          const active = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, active && { borderColor: cat.color, backgroundColor: cat.color + '12' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.id); }}
              activeOpacity={0.8}
            >
              <View style={[styles.catIconBox, { backgroundColor: cat.color + (active ? '25' : '15') }]}>
                <Ionicons name={cat.icon} size={20} color={cat.color} />
              </View>
              <Text style={[styles.catLabel, active && { color: COLORS.text }]} numberOfLines={2}>
                {cat.label}
              </Text>
              {active && <View style={[styles.catCheck, { backgroundColor: cat.color }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Title input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          Titre de l'offre <Text style={styles.inputHint}>(min. 10 caractères)</Text>
        </Text>
        <View style={[styles.inputBox, title.length > 0 && title.length < 10 && styles.inputBoxError]}>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Montage Reels TikTok professionnel en 48h"
            placeholderTextColor={COLORS.textLight}
            maxLength={80}
            returnKeyType="done"
          />
          <Text style={styles.inputCount}>{title.length}/80</Text>
        </View>
        {title.length > 0 && title.length < 10 && (
          <Text style={styles.inputError}>Minimum 10 caractères</Text>
        )}
      </View>
    </View>
  );
}

// ─── Step 2 : Prix + Délai + Tags ─────────────────────────────────────────────

function Step2({ price, setPrice, description, setDescription, delivery, setDelivery, revisions, setRevisions, selectedTags, toggleTag, category }) {
  const tags = TAGS_BY_CATEGORY[category] ?? [];

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Tarif & délai de livraison</Text>
      <Text style={styles.stepSub}>Définissez votre prix et vos conditions.</Text>

      {/* Price */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Prix (€)</Text>
        <View style={styles.priceRow}>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <TextInput
              style={[styles.textInput, styles.priceInput]}
              value={price}
              onChangeText={v => setPrice(v.replace(/[^0-9]/g, ''))}
              placeholder="89"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          <View style={styles.priceEuro}>
            <Text style={styles.priceEuroText}>€</Text>
          </View>
        </View>
        {price !== '' && (Number(price) < 5) && (
          <Text style={styles.inputError}>Prix minimum : 5€</Text>
        )}
      </View>

      {/* Delivery */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Délai de livraison</Text>
        <View style={styles.optionRow}>
          {DELIVERY_OPTIONS.map(opt => {
            const active = delivery === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDelivery(opt.id); }}
              >
                {active && <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>{opt.label}</Text>
                <Text style={[styles.optionChipSub, active && { color: 'rgba(255,255,255,0.7)' }]}>{opt.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Revisions */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Révisions incluses</Text>
        <View style={styles.revisionRow}>
          {REVISION_OPTIONS.map(opt => {
            const active = revisions === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.revChip, active && styles.revChipActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRevisions(opt.id); }}
              >
                {active && <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                <Text style={[styles.revChipLabel, active && styles.revChipLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          Description <Text style={styles.inputHint}>(optionnel)</Text>
        </Text>
        <View style={styles.inputBox}>
          <TextInput
            style={[styles.textInput, { minHeight: 80 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre prestation, votre méthode, ce qui vous différencie..."
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={400}
            textAlignVertical="top"
          />
          <Text style={styles.inputCount}>{description.length}/400</Text>
        </View>
      </View>

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Mots-clés <Text style={styles.inputHint}>(optionnel)</Text>
          </Text>
          <View style={styles.tagsWrap}>
            {tags.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  {active && <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                  <Text style={[styles.tagChipLabel, active && styles.tagChipLabelActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Step 3 : Aperçu avant publication ────────────────────────────────────────

function Step3({ category, title, description, price, delivery, revisions, selectedTags }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const delivLabel = DELIVERY_OPTIONS.find(d => d.id === delivery)?.label ?? delivery;

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Aperçu de votre offre</Text>
      <Text style={styles.stepSub}>Voici comment votre offre apparaîtra aux acheteurs.</Text>

      {/* Preview card */}
      <View style={styles.previewCard}>
        {/* Cat badge */}
        <View style={[styles.previewCatBadge, { backgroundColor: (cat?.color ?? COLORS.primary) + '20', borderColor: (cat?.color ?? COLORS.primary) + '40' }]}>
          <Ionicons name={cat?.icon ?? 'briefcase-outline'} size={14} color={cat?.color ?? COLORS.primary} />
          <Text style={[styles.previewCatLabel, { color: cat?.color ?? COLORS.primary }]}>{cat?.label ?? category}</Text>
        </View>

        {/* Title */}
        <Text style={styles.previewTitle}>{title}</Text>

        {/* Description */}
        {description ? (
          <Text style={styles.previewDesc} numberOfLines={3}>{description}</Text>
        ) : null}

        {/* Tags */}
        {selectedTags.length > 0 && (
          <View style={styles.previewTagsRow}>
            {selectedTags.slice(0, 4).map(tag => (
              <View key={tag} style={styles.previewTag}>
                <Text style={styles.previewTagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.previewDivider} />

        {/* Meta row */}
        <View style={styles.previewMeta}>
          <View style={styles.previewMetaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.previewMetaLabel}>{delivLabel}</Text>
          </View>
          <View style={styles.previewMetaItem}>
            <Ionicons name="refresh-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.previewMetaLabel}>{revisions === 'illimité' ? 'Révisions illimitées' : `${revisions} révision${revisions !== '1' ? 's' : ''}`}</Text>
          </View>
          <View style={[styles.previewPrice]}>
            <Text style={styles.previewPriceText}>{price}€</Text>
          </View>
        </View>
      </View>

      {/* Checklist */}
      <View style={styles.checkList}>
        {[
          { icon: 'shield-checkmark-outline', text: 'Paiement sécurisé par escrow', color: '#22C55E' },
          { icon: 'eye-outline',              text: 'Visible dans la marketplace dès publication', color: COLORS.primary },
          { icon: 'pencil-outline',           text: 'Modifiable à tout moment depuis Dashboard', color: '#F59E0B' },
        ].map((item, i) => (
          <View key={i} style={styles.checkItem}>
            <Ionicons name={item.icon} size={16} color={item.color} />
            <Text style={styles.checkText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 4 : 16,
    paddingBottom: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, ...FONT.bold, color: COLORS.text },
  headerStep:  { fontSize: 11, color: COLORS.textMuted },

  // Progress
  progressTrack: { height: 2, backgroundColor: COLORS.border, marginHorizontal: 0 },
  progressFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 1 },

  scroll:   { padding: SPACING.lg },
  stepWrap: { gap: SPACING.lg },
  stepTitle:{ fontSize: 22, fontWeight: '800', color: COLORS.text },
  stepSub:  { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginTop: -SPACING.sm },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  catCard: {
    width: (SW - SPACING.lg * 2 - SPACING.sm * 3) / 4,
    aspectRatio: 0.9,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    padding: 6, gap: 5, position: 'relative',
  },
  catIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 9, ...FONT.medium, color: COLORS.textMuted, textAlign: 'center', lineHeight: 12 },
  catCheck: {
    position: 'absolute', top: 5, right: 5,
    width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
  },

  // Input
  inputSection: { gap: 8 },
  inputLabel: { fontSize: 13, ...FONT.semibold, color: COLORS.text },
  inputHint:  { ...FONT.regular, color: COLORS.textLight },
  inputBox: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  inputBoxError: { borderColor: COLORS.error },
  textInput: { color: COLORS.text, fontSize: 14 },
  inputCount: { textAlign: 'right', fontSize: 10, color: COLORS.textLight, marginTop: 4 },
  inputError: { fontSize: 11, color: COLORS.error },

  // Price
  priceRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  priceInput: { fontSize: 20, ...FONT.bold },
  priceEuro: {
    width: 44, height: 50, backgroundColor: COLORS.cardElevated,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  priceEuroText: { fontSize: 20, ...FONT.bold, color: COLORS.textMuted },

  // Delivery
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', overflow: 'hidden', position: 'relative', minWidth: 72,
  },
  optionChipActive: { borderColor: 'transparent' },
  optionChipLabel:  { fontSize: 13, ...FONT.semibold, color: COLORS.textMuted },
  optionChipLabelActive: { color: '#fff' },
  optionChipSub:    { fontSize: 9, color: COLORS.textLight, marginTop: 2 },

  // Revisions
  revisionRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  revChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, overflow: 'hidden', position: 'relative',
  },
  revChipActive: { borderColor: 'transparent' },
  revChipLabel:  { fontSize: 13, ...FONT.semibold, color: COLORS.textMuted },
  revChipLabelActive: { color: '#fff' },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 7,
    overflow: 'hidden', position: 'relative',
  },
  tagChipActive: { borderColor: 'transparent' },
  tagChipLabel:  { fontSize: 12, ...FONT.medium, color: COLORS.textMuted },
  tagChipLabelActive: { color: '#fff' },

  // Preview card
  previewCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, gap: 10,
  },
  previewCatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  previewCatLabel: { fontSize: 11, ...FONT.semibold },
  previewTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, lineHeight: 22 },
  previewDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  previewTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewTag: {
    backgroundColor: COLORS.border + '60', borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  previewTagLabel: { fontSize: 10, color: COLORS.textMuted },
  previewDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 4 },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  previewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  previewMetaLabel: { fontSize: 12, color: COLORS.textMuted },
  previewPrice: { alignItems: 'flex-end' },
  previewPriceText: { fontSize: 20, fontWeight: '900', color: COLORS.text },

  // Checklist
  checkList: { gap: 10, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkText: { fontSize: 13, color: COLORS.textMuted, flex: 1, lineHeight: 17 },

  // CTA
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
  },
  ctaBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  // Success
  successWrap: { alignItems: 'center', gap: SPACING.md },
  successCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', ...SHADOW.md, marginBottom: SPACING.sm },
  successTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  successSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  successCat: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1, marginTop: SPACING.sm,
  },
  successCatText: { fontSize: 13, ...FONT.semibold },
});
