/**
 * RevisionRequestScreen.js — Demande de modification
 * Input texte, compteur révisions, envoi
 * Params : { mission, freelancer, revisionsLeft }
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
 StatusBar, ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useMissions } from '../../lib/MissionsContext';

const QUICK_SUGGESTIONS = [
  'Le hook doit être plus percutant',
  'Réduire la durée de l\'intro à 2 secondes',
  'Ajouter un élément de surprise dès l\'ouverture',
  'Changer la transition entre les plans',
];

export default function RevisionRequestScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { updateStatus } = useMissions();
  const { mission, freelancer, revisionsLeft = 2 } = route.params ?? {};

  const [text, setText] = useState('');
  const [sent, setSent]  = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const MAX_LENGTH  = 500;
  const remaining   = MAX_LENGTH - text.length;
  const isValid     = text.trim().length >= 10;

  function handleSend() {
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // ── Met à jour le statut + compteur de révisions utilisées ──
    if (mission?.id) updateStatus(mission.id, 'revision', {
      revisionsUsed: (mission?.revisionsUsed ?? 0) + 1,
    });
    setSent(true);
    setTimeout(() => navigation.goBack(), 2000);
  }

  function addSuggestion(s) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText(prev => prev ? `${prev} ${s}` : s);
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0D1B2A', COLORS.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.sentSafe}>
          <Ionicons name="paper-plane" size={52} color={COLORS.primary} />
          <Text style={styles.sentTitle}>Demande envoyée !</Text>
          <Text style={styles.sentSub}>{freelancer?.name ?? 'Le freelance'} va retravaille votre contenu.</Text>
          <View style={[styles.sentBadge, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B35' }]}>
            <Ionicons name="refresh-circle" size={13} color="#F59E0B" />
            <Text style={styles.sentBadgeText}>{revisionsLeft - 1} révision{revisionsLeft - 1 !== 1 ? 's' : ''} restante{revisionsLeft - 1 !== 1 ? 's' : ''}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Demander une modification</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Compteur révisions ── */}
            <View style={[styles.revCounter, { borderColor: revisionsLeft > 1 ? '#F59E0B30' : '#EF444430', backgroundColor: revisionsLeft > 1 ? '#F59E0B08' : '#EF44440A' }]}>
              <Ionicons name="refresh-circle-outline" size={18} color={revisionsLeft > 1 ? '#F59E0B' : '#EF4444'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.revCounterTitle, { color: revisionsLeft > 1 ? '#F59E0B' : '#EF4444' }]}>
                  {revisionsLeft} révision{revisionsLeft > 1 ? 's' : ''} restante{revisionsLeft > 1 ? 's' : ''}
                </Text>
                <Text style={styles.revCounterSub}>
                  Après épuisement, le support peut intervenir en médiation
                </Text>
              </View>
            </View>

            {/* ── Zone de texte ── */}
            <Text style={styles.fieldLabel}>Que souhaitez-vous améliorer ?</Text>
            <Animated.View style={[styles.textAreaWrap, { transform: [{ scale: scaleAnim }] }]}>
              <TextInput
                style={styles.textArea}
                value={text}
                onChangeText={t => { if (t.length <= MAX_LENGTH) setText(t); }}
                placeholder="Ex : Le hook doit être plus fort, démarrer directement sur l'action sans intro…"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={5}
                selectionColor={COLORS.primary}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, remaining < 50 && { color: '#EF4444' }]}>
                {remaining} car. restants
              </Text>
            </Animated.View>

            {/* ── Suggestions rapides ── */}
            <Text style={styles.suggestLabel}>Suggestions rapides</Text>
            <View style={styles.suggestions}>
              {QUICK_SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => addSuggestion(s)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Note escrow ── */}
            <View style={[styles.escrowNote, { borderColor: '#22C55E25', backgroundColor: '#22C55E08' }]}>
              <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
              <Text style={styles.escrowText}>
                Le paiement reste sécurisé jusqu'à votre validation finale
              </Text>
            </View>

            <View style={{ height: 130 }} />
          </ScrollView>

          {/* ── CTA ── */}
          <View style={styles.ctaWrapper}>
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.88}
              style={[styles.ctaBtn, !isValid && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={[COLORS.primary, '#4F46E5']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.ctaText}>Envoyer la demande</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.ctaSub}>
              {isValid ? '✓ Prêt à envoyer' : 'Décrivez en au moins 10 caractères'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 24 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  // Rev counter
  revCounter: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
  },
  revCounterTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 3 },
  revCounterSub:  { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },

  // Field
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  textAreaWrap: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1.5,
    borderColor: COLORS.primary + '40', padding: SPACING.md, marginBottom: SPACING.md,
  },
  textArea: {
    fontSize: 14, color: COLORS.text, lineHeight: 22, minHeight: 110,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: COLORS.textLight, marginTop: 6 },

  // Suggestions
  suggestLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.4 },
  suggestions:  { gap: 8, marginBottom: SPACING.md },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  suggestionText: { flex: 1, fontSize: 13, color: COLORS.text },

  // Escrow
  escrowNote: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: RADIUS.lg, padding: 12 },
  escrowText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#22C55E', lineHeight: 17 },

  // CTA
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'EC', paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  ctaBtn:      { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 8, ...SHADOW.md },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText:     { fontSize: 15, fontWeight: '900', color: '#fff' },
  ctaSub:      { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },

  // Sent state
  sentSafe: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  sentTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text },
  sentSub:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8 },
  sentBadgeText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
});
