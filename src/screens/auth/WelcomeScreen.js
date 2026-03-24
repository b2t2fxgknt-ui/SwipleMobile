import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,

  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <BubbleBackground variant="welcome" />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={styles.textBlock}>
            <Text style={styles.brand}>Swiple</Text>
            <Text style={styles.tagline}>
              Trouve le freelance qu'il te faut,{'\n'}en quelques secondes.
            </Text>
          </View>

          <View style={styles.cards}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Register', { role: 'acheteur' })}
              activeOpacity={0.72}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                <View>
                  <Text style={styles.cardTitle}>Je cherche un freelance</Text>
                  <Text style={styles.cardDesc}>Parcours des profils, swipe, contacte.</Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.cardActive]}
              onPress={() => navigation.navigate('FreelanceOnboarding')}
              activeOpacity={0.72}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.dot, { backgroundColor: COLORS.primaryLight }]} />
                <View>
                  <Text style={styles.cardTitle}>Je suis freelance</Text>
                  <Text style={styles.cardDesc}>Crée ton profil, reçois des missions.</Text>
                </View>
              </View>
              <Text style={[styles.arrow, { color: COLORS.primaryLight }]}>→</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </SafeAreaView>

      <View style={styles.bottomFooter}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Déjà un compte ?{'  '}
            <Text style={styles.loginLink}>Connexion</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg + 4,
  },
  textBlock: {
    marginBottom: SPACING.xxl,
  },
  brand: {
    fontSize: 44,
    color: COLORS.text,
    ...FONT.extrabold,
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 26,
  },
  cards: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26,26,36,0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 4,
  },
  cardActive: {
    borderColor: COLORS.primary + '70',
    backgroundColor: 'rgba(124,58,237,0.10)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    color: COLORS.text,
    ...FONT.semibold,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  bottomFooter: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: 38,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginLink: {
    color: COLORS.primaryLight,
    ...FONT.semibold,
  },
});
