/**
 * OnboardingScreen.js — Post-inscription : intro slides rôle-aware
 * Affiché une seule fois après la première connexion (flag AsyncStorage)
 */

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  StatusBar, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

// ─── Slide content ─────────────────────────────────────────────────────────────

const SLIDES_ACHETEUR = [
  {
    icon: 'flash',
    iconBg: '#7C3AED18',
    iconColor: COLORS.primary,
    gradient: [COLORS.gradientStart + 'CC', COLORS.gradientEnd + 'CC'],
    tag: 'DÉCOUVRIR',
    tagColor: COLORS.primary,
    title: 'Trouvez l\'expert\nparfait',
    desc: 'Swipez les profils de freelances comme Tinder. Matchez en 30 secondes avec le talent qu\'il vous faut.',
    illustration: 'people-outline',
    illustrationColor: COLORS.primary,
  },
  {
    icon: 'shield-checkmark',
    iconBg: '#22C55E18',
    iconColor: '#22C55E',
    gradient: ['#052E1633', '#0F4C2233'],
    tag: 'SÉCURITÉ',
    tagColor: '#22C55E',
    title: 'Payez en\ntoute sécurité',
    desc: 'Votre paiement est bloqué en escrow. Il n\'est libéré qu\'une fois que vous validez la livraison.',
    illustration: 'lock-closed-outline',
    illustrationColor: '#22C55E',
  },
  {
    icon: 'star',
    iconBg: '#F59E0B18',
    iconColor: '#F59E0B',
    gradient: ['#2D1B0033', '#3D250033'],
    tag: 'ÉVALUER',
    tagColor: '#F59E0B',
    title: 'Validez et\ncélébrez',
    desc: 'Suivez votre mission en direct, validez la livraison et laissez un avis pour booster le freelance.',
    illustration: 'checkmark-circle-outline',
    illustrationColor: '#F59E0B',
  },
];

const SLIDES_FREELANCE = [
  {
    icon: 'briefcase',
    iconBg: '#10B98118',
    iconColor: COLORS.prestataire,
    gradient: ['#05261A33', '#0C3D2833'],
    tag: 'PROFIL',
    tagColor: COLORS.prestataire,
    title: 'Montrez vos\ntalents',
    desc: 'Créez votre profil, ajoutez vos services et soyez matchés avec des clients qui ont besoin de vous.',
    illustration: 'person-circle-outline',
    illustrationColor: COLORS.prestataire,
  },
  {
    icon: 'document-text',
    iconBg: '#3B82F618',
    iconColor: '#3B82F6',
    gradient: ['#0A1E3333', '#0F2B4533'],
    tag: 'MISSIONS',
    tagColor: '#3B82F6',
    title: 'Gérez vos\nmissions',
    desc: 'Recevez des briefs détaillés, communiquez avec vos clients et livrez directement dans l\'app.',
    illustration: 'clipboard-outline',
    illustrationColor: '#3B82F6',
  },
  {
    icon: 'wallet',
    iconBg: '#F59E0B18',
    iconColor: '#F59E0B',
    gradient: ['#2D1B0033', '#3D250033'],
    tag: 'REVENUS',
    tagColor: '#F59E0B',
    title: 'Encaissez\nfacilement',
    desc: 'Paiements sécurisés à chaque mission. Retirez vos gains en 1 clic, directement sur votre compte.',
    illustration: 'card-outline',
    illustrationColor: '#F59E0B',
  },
];

// ─── IllustrationBox ────────────────────────────────────────────────────────────

function IllustrationBox({ slide }) {
  return (
    <View style={styles.illustrationWrap}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.illustrationGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      {/* Outer ring */}
      <View style={[styles.illustrationRing, { borderColor: slide.illustrationColor + '20' }]}>
        {/* Inner ring */}
        <View style={[styles.illustrationInner, { borderColor: slide.illustrationColor + '30', backgroundColor: slide.illustrationColor + '0C' }]}>
          {/* Center icon box */}
          <View style={[styles.iconCircle, { backgroundColor: slide.iconBg, borderColor: slide.iconColor + '30' }]}>
            <Ionicons name={slide.illustration} size={52} color={slide.illustrationColor} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Slide ──────────────────────────────────────────────────────────────────────

function Slide({ slide }) {
  return (
    <View style={styles.slide}>
      <IllustrationBox slide={slide} />

      <View style={styles.textBlock}>
        {/* Tag */}
        <View style={[styles.tag, { backgroundColor: slide.tagColor + '15', borderColor: slide.tagColor + '30' }]}>
          <View style={[styles.tagDot, { backgroundColor: slide.tagColor }]} />
          <Text style={[styles.tagText, { color: slide.tagColor }]}>{slide.tag}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Desc */}
        <Text style={styles.desc}>{slide.desc}</Text>
      </View>
    </View>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const role = route.params?.role ?? 'acheteur';
  const isFreelancer = role === 'prestataire';
  const slides = isFreelancer ? SLIDES_FREELANCE : SLIDES_ACHETEUR;
  const accentColor = isFreelancer ? COLORS.prestataire : COLORS.primary;

  const [step, setStep] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(slides.map(() => new Animated.Value(0))).current;

  // Animate first dot on mount
  React.useEffect(() => {
    Animated.spring(progressAnim[0], { toValue: 1, useNativeDriver: false, tension: 60 }).start();
  }, []);

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < slides.length - 1) {
      const next = step + 1;
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width * next,
          duration: 340,
          useNativeDriver: true,
        }),
        Animated.spring(progressAnim[next], {
          toValue: 1,
          useNativeDriver: false,
          tension: 60,
        }),
      ]).start(() => setStep(next));
    } else {
      handleFinish();
    }
  }

  function goPrev() {
    if (step === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prev = step - 1;
    Animated.timing(slideX, {
      toValue: -width * prev,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setStep(prev));
  }

  async function handleFinish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('swiple_onboarded', '1');
    navigation.replace('Main');
  }

  async function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('swiple_onboarded', '1');
    navigation.replace('Main');
  }

  const isLast = step === slides.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.bg, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const w = progressAnim[i].interpolate({
              inputRange: [0, 1],
              outputRange: [6, 22],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: w, backgroundColor: i <= step ? accentColor : COLORS.border },
                ]}
              />
            );
          })}
        </View>

        <View style={{ width: 56 }} />
      </View>

      {/* Slides carousel */}
      <Animated.View
        style={[styles.carousel, { transform: [{ translateX: slideX }] }]}
      >
        {slides.map((slide, i) => (
          <Slide key={i} slide={slide} />
        ))}
      </Animated.View>

      {/* Bottom actions */}
      <View style={styles.bottomArea}>
        {/* Back gesture hint on step > 0 */}
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={goPrev} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
            <Text style={styles.prevText}>Précédent</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, { opacity: 1 }]}
          onPress={goNext}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isFreelancer
              ? [COLORS.prestataire, '#059669']
              : [COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.nextGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {isLast ? (
              <>
                <Ionicons name="rocket-outline" size={18} color="#fff" />
                <Text style={styles.nextText}>C'est parti !</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextText}>Suivant</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Step count */}
        <Text style={styles.stepCount}>{step + 1} / {slides.length}</Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: SPACING.md,
  },
  skipBtn:  {},
  skipText: { fontSize: 14, color: COLORS.textMuted, ...FONT.medium },
  dots:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:      { height: 6, borderRadius: 3 },

  carousel: {
    flexDirection: 'row',
    width: width * 3, // 3 slides
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },

  // Illustration
  illustrationWrap: {
    width: width - SPACING.xl * 2,
    height: height * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  illustrationGrad: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
  },
  illustrationRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInner: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text block
  textBlock: { alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md },

  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  tagDot:  { width: 5, height: 5, borderRadius: 2.5 },
  tagText: { fontSize: 10, ...FONT.bold, letterSpacing: 0.8 },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 40,
  },
  desc: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    marginTop: 4,
  },

  // Bottom
  bottomArea: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: SPACING.md,
    alignItems: 'center',
    gap: 12,
  },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  prevText: { fontSize: 13, color: COLORS.textMuted, ...FONT.medium },

  nextBtn: { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  nextGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  nextText: { fontSize: 17, ...FONT.bold, color: '#fff' },

  stepCount: { fontSize: 11, color: COLORS.textLight, ...FONT.medium },
});
