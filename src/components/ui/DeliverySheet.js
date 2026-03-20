/**
 * DeliverySheet.js — Bottom sheet de livraison (côté freelance)
 * Slide up depuis MissionBriefScreen quand l'utilisateur clique "Livrer"
 *
 * Props:
 *   visible       — boolean
 *   onClose       — () => void
 *   onDeliver     — (url: string, message: string) => void
 *   missionColor  — string (accent couleur du type de mission)
 *   revisionCount — number (0 = première livraison)
 *   maxRevisions  — number
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Animated, TouchableWithoutFeedback, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.58;

export default function DeliverySheet({
  visible,
  onClose,
  onDeliver,
  missionColor = COLORS.primary,
  revisionCount = 0,
  maxRevisions = 2,
}) {
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  const [url,     setUrl]     = useState('');
  const [message, setMessage] = useState('');
  const [urlError, setUrlError] = useState(false);

  // ── Animations ──────────────────────────────────────────────────────────────
  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      Animated.timing(bgAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_H, duration: 280, useNativeDriver: true }),
      Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      // Réinitialise à chaque ouverture
      setUrl('');
      setMessage('');
      setUrlError(false);
      open();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_H, duration: 250, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // ── Validation & envoi ───────────────────────────────────────────────────────
  function handleSend() {
    if (!url.trim()) {
      setUrlError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDeliver?.(url.trim(), message.trim());
  }

  const isRevision = revisionCount > 0;
  const canSend    = url.trim().length > 0;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={close}>
      {/* ── Overlay ── */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.overlay, { opacity: bgAnim }]} />
      </TouchableWithoutFeedback>

      {/* ── Sheet ── */}
      <KeyboardAvoidingView
        style={styles.kvWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIconBox, { backgroundColor: missionColor + '18', borderColor: missionColor + '35' }]}>
              <Ionicons name="cloud-upload-outline" size={22} color={missionColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {isRevision ? `Révision ${revisionCount}/${maxRevisions}` : 'Livrer votre travail'}
              </Text>
              <Text style={styles.subtitle}>
                {isRevision
                  ? 'Partagez la version corrigée'
                  : 'Partagez un lien vers votre fichier'}
              </Text>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Révision counter */}
          {isRevision && (
            <View style={[styles.revisionBadge, { borderColor: '#F59E0B30', backgroundColor: '#F59E0B0C' }]}>
              <Ionicons name="refresh-outline" size={12} color="#F59E0B" />
              <Text style={styles.revisionText}>
                Révision {revisionCount}/{maxRevisions} · {maxRevisions - revisionCount} révision{maxRevisions - revisionCount > 1 ? 's' : ''} restante{maxRevisions - revisionCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Lien vidéo */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>LIEN VERS LE FICHIER</Text>
            <View style={[styles.inputRow, urlError && { borderColor: '#EF4444' }]}>
              <Ionicons name="link-outline" size={16} color={urlError ? '#EF4444' : COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={(t) => { setUrl(t); setUrlError(false); }}
                placeholder="drive.google.com, WeTransfer, Dropbox…"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                selectionColor={missionColor}
              />
              {url.length > 0 && (
                <TouchableOpacity onPress={() => setUrl('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {urlError && (
              <Text style={styles.errorText}>Un lien est requis pour livrer</Text>
            )}
          </View>

          {/* Message optionnel */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>MESSAGE (OPTIONNEL)</Text>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="Décrivez ce que vous avez réalisé, les choix créatifs…"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              maxLength={280}
              selectionColor={missionColor}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length}/280</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={canSend ? 0.88 : 1}
            style={[styles.ctaBtn, !canSend && { opacity: 0.45 }]}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="cloud-upload" size={17} color="#fff" />
              <Text style={styles.ctaText}>Envoyer la livraison</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Ionicons name="notifications-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.footerText}>Le client recevra une notification immédiate</Text>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + 8,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOW.md,
  },

  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 4,
  },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBox: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  title:       { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  subtitle:    { fontSize: 12, color: COLORS.textMuted },
  closeBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  revisionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  revisionText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },

  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.7 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 13, color: COLORS.text },
  errorText: { fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 2 },

  textArea: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingTop: 12, paddingBottom: 12,
    fontSize: 13, color: COLORS.text, minHeight: 80,
  },
  charCount: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },

  ctaBtn:      { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginTop: -4,
  },
  footerText: { fontSize: 11, color: COLORS.textMuted },
});
