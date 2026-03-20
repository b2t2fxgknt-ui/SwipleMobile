import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Easing } from 'react-native';
import { COLORS } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

function Bubble({ x, y, size, color, delay, duration, opacity = 1 }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Apparition douce
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(fadeIn, {
        toValue: opacity,
        duration: 1800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // Flottement sinusoïdal naturel (pas de scale — les bulles de verre ne pulsent pas)
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 1000),
        Animated.timing(translateY, {
          toValue: -20,
          duration,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: fadeIn,
        transform: [{ translateY }],
      }}
    >
      {/* ── Halo ambiant extérieur ── très subtil */}
      <View
        style={{
          position: 'absolute',
          top: -size * 0.24,
          left: -size * 0.24,
          width: size * 1.48,
          height: size * 1.48,
          borderRadius: size * 0.74,
          backgroundColor: color + '0A',
        }}
      />

      {/* ── Corps de la sphère ── quasi invisible */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '05',
          overflow: 'hidden',
        }}
      >
        {/* Dôme de lueur douce (quart supérieur gauche) */}
        <View
          style={{
            position: 'absolute',
            top: -size * 0.10,
            left: -size * 0.10,
            width: size * 0.74,
            height: size * 0.62,
            borderRadius: size * 0.37,
            backgroundColor: 'rgba(255,255,255,0.07)',
            transform: [{ rotate: '-28deg' }],
          }}
        />

        {/* Arc spéculaire principal — reflet net et brillant */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.062,
            left: size * 0.088,
            width: size * 0.52,
            height: size * 0.150,
            borderRadius: size * 0.075,
            backgroundColor: 'rgba(255,255,255,0.52)',
            transform: [{ rotate: '-32deg' }],
          }}
        />

        {/* Coeur de l'arc — centre encore plus lumineux */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.085,
            left: size * 0.148,
            width: size * 0.25,
            height: size * 0.065,
            borderRadius: size * 0.033,
            backgroundColor: 'rgba(255,255,255,0.80)',
            transform: [{ rotate: '-32deg' }],
          }}
        />

        {/* Arc secondaire — plus bas, plus doux */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.210,
            left: size * 0.125,
            width: size * 0.22,
            height: size * 0.060,
            borderRadius: size * 0.030,
            backgroundColor: 'rgba(255,255,255,0.22)',
            transform: [{ rotate: '-32deg' }],
          }}
        />

        {/* Point spéculaire haut-droit */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.090,
            left: size * 0.630,
            width: size * 0.092,
            height: size * 0.092,
            borderRadius: size * 0.046,
            backgroundColor: 'rgba(255,255,255,0.34)',
          }}
        />

        {/* Coeur du point spéculaire */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.112,
            left: size * 0.652,
            width: size * 0.046,
            height: size * 0.046,
            borderRadius: size * 0.023,
            backgroundColor: 'rgba(255,255,255,0.75)',
          }}
        />

        {/* Caustique basse — lumière transmise à travers la bulle */}
        <View
          style={{
            position: 'absolute',
            bottom: -size * 0.15,
            right: -size * 0.15,
            width: size * 0.70,
            height: size * 0.70,
            borderRadius: size * 0.35,
            backgroundColor: color + '1C',
          }}
        />

        {/* Croissant caustique bas */}
        <View
          style={{
            position: 'absolute',
            bottom: size * 0.065,
            left: size * 0.175,
            width: size * 0.65,
            height: size * 0.110,
            borderRadius: size * 0.055,
            backgroundColor: 'rgba(255,255,255,0.045)',
            transform: [{ rotate: '7deg' }],
          }}
        />
      </View>

      {/* ── Rim Fresnel ── blanc brillant sur le pourtour */}
      <View
        style={{
          position: 'absolute',
          top: -1.5,
          left: -1.5,
          width: size + 3,
          height: size + 3,
          borderRadius: (size + 3) / 2,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.22)',
        }}
      />

      {/* Rim coloré ── teinte de verre sur le bord */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: color + '52',
        }}
      />

      {/* Anneau de profondeur intérieur ── ombre juste sous le bord */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.045,
          left: size * 0.045,
          width: size * 0.910,
          height: size * 0.910,
          borderRadius: size * 0.455,
          borderWidth: 0.5,
          borderColor: color + '1A',
        }}
      />
    </Animated.View>
  );
}

// ── Configurations par variante ────────────────────────────────────────────────
const CONFIGS = {
  welcome: [
    { x: -65,         y: -50,           size: 230, color: COLORS.primary,      delay: 0,    duration: 5800, opacity: 0.92 },
    { x: width - 115, y: 35,            size: 165, color: '#3B82F6',           delay: 450,  duration: 5000, opacity: 0.85 },
    { x: width * 0.2, y: height * 0.09, size: 95,  color: '#8B5CF6',           delay: 750,  duration: 4200, opacity: 0.75 },
    { x: -45,         y: height * 0.30, size: 135, color: '#10B981',           delay: 220,  duration: 5400, opacity: 0.65 },
    { x: width * 0.54,y: height * 0.21, size: 115, color: COLORS.primaryLight, delay: 950,  duration: 4800, opacity: 0.75 },
    { x: width - 85,  y: height * 0.44, size: 145, color: COLORS.primary,      delay: 550,  duration: 5200, opacity: 0.55 },
    { x: width * 0.3, y: height * 0.50, size: 72,  color: '#3B82F6',           delay: 320,  duration: 3900, opacity: 0.55 },
    { x: -35,         y: height * 0.64, size: 105, color: '#8B5CF6',           delay: 620,  duration: 4600, opacity: 0.45 },
  ],
  acheteur: [
    { x: -55,         y: -35,           size: 210, color: '#3B82F6',           delay: 0,    duration: 5800, opacity: 0.92 },
    { x: width - 105, y: 55,            size: 148, color: '#6366F1',           delay: 350,  duration: 5000, opacity: 0.78 },
    { x: width * 0.3, y: height * 0.08, size: 84,  color: '#0EA5E9',           delay: 650,  duration: 4300, opacity: 0.68 },
    { x: -35,         y: height * 0.34, size: 125, color: '#3B82F6',           delay: 220,  duration: 5200, opacity: 0.58 },
    { x: width * 0.6, y: height * 0.24, size: 105, color: COLORS.primary,      delay: 850,  duration: 4800, opacity: 0.68 },
    { x: width - 75,  y: height * 0.50, size: 135, color: '#6366F1',           delay: 520,  duration: 5400, opacity: 0.48 },
  ],
  prestataire: [
    { x: -60,         y: -40,           size: 220, color: '#10B981',           delay: 0,    duration: 5800, opacity: 0.92 },
    { x: width - 110, y: 45,            size: 155, color: COLORS.primary,      delay: 380,  duration: 5000, opacity: 0.78 },
    { x: width * 0.25,y: height * 0.09, size: 88,  color: '#34D399',           delay: 680,  duration: 4200, opacity: 0.68 },
    { x: -38,         y: height * 0.32, size: 128, color: '#10B981',           delay: 230,  duration: 5400, opacity: 0.58 },
    { x: width * 0.57,y: height * 0.23, size: 108, color: '#8B5CF6',           delay: 880,  duration: 4800, opacity: 0.68 },
    { x: width - 78,  y: height * 0.47, size: 138, color: '#10B981',           delay: 540,  duration: 5200, opacity: 0.48 },
  ],
};

export default function BubbleBackground({ variant = 'welcome' }) {
  const bubbles = CONFIGS[variant] ?? CONFIGS.welcome;
  return (
    <>
      {bubbles.map((b, i) => (
        <Bubble key={i} {...b} />
      ))}
    </>
  );
}
