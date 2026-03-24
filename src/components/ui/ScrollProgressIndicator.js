/**
 * ScrollProgressIndicator.js
 * Indicateur de progression de scroll — discret, bord droit de l'écran.
 * Apparaît au défilement, disparaît après ~700ms d'inactivité.
 *
 * Usage :
 *   const scrollIndicatorY = useRef(new Animated.Value(0)).current;
 *   const [scrollContentH, setScrollContentH] = useState(0);
 *   const [scrollContainerH, setScrollContainerH] = useState(0);
 *
 *   <ScrollView
 *     scrollEventThrottle={16}
 *     onScroll={Animated.event(
 *       [{ nativeEvent: { contentOffset: { y: scrollIndicatorY } } }],
 *       { useNativeDriver: false }
 *     )}
 *     onContentSizeChange={(_, h) => setScrollContentH(h)}
 *     onLayout={(e) => setScrollContainerH(e.nativeEvent.layout.height)}
 *   />
 *
 *   <ScrollProgressIndicator
 *     scrollY={scrollIndicatorY}
 *     contentHeight={scrollContentH}
 *     containerHeight={scrollContainerH}
 *   />
 */

import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/theme';

/** Marges verticales entre le bord de l'écran et la track */
const V_PADDING = 72;

export default function ScrollProgressIndicator({
  scrollY,
  contentHeight  = 0,
  containerHeight = 0,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // Écoute les changements de scrollY pour afficher/masquer l'indicateur
  useEffect(() => {
    const id = scrollY.addListener(() => {
      // Apparition rapide
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
      // Disparition différée
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 700);
    });

    return () => {
      scrollY.removeListener(id);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scrollY]);

  // Ne rien afficher si le contenu tient dans l'écran
  if (!contentHeight || !containerHeight || contentHeight <= containerHeight + 10) {
    return null;
  }

  const trackH = Math.max(0, containerHeight - V_PADDING * 2);
  if (trackH <= 0) return null;

  // Hauteur du thumb proportionnelle au ratio visible/total
  const thumbH  = Math.max(24, (containerHeight / contentHeight) * trackH);
  const travel  = Math.max(0, trackH - thumbH);
  const maxScroll = Math.max(1, contentHeight - containerHeight);

  const thumbY = scrollY.interpolate({
    inputRange:  [0, maxScroll],
    outputRange: [0, travel],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.track, { opacity: fadeAnim, height: trackH, top: V_PADDING }]}
    >
      <Animated.View
        style={[styles.thumb, { height: thumbH, transform: [{ translateY: thumbY }] }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    right: 4,
    width: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  thumb: {
    position: 'absolute',
    width: 3,
    borderRadius: 3,
    backgroundColor: COLORS.primary + 'B0',
  },
});
