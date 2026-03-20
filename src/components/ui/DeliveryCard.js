/**
 * DeliveryCard.js — Card de livraison dans le chat MissionTracking
 * S'insère dans le fil de messages quand le freelance a livré.
 *
 * Props:
 *   url           — string  (lien fichier)
 *   message       — string  (message optionnel du freelance)
 *   revisionCount — number
 *   maxRevisions  — number
 *   isValidated   — boolean (si déjà validé, désactive les CTA)
 *   onRevision    — () => void
 *   onValidate    — () => void
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';

export default function DeliveryCard({
  url,
  message,
  revisionCount = 0,
  maxRevisions = 2,
  isValidated = false,
  onRevision,
  onValidate,
}) {
  const canRevise = revisionCount < maxRevisions && !isValidated;

  async function handleOpenUrl() {
    if (!url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Lien invalide', 'Impossible d\'ouvrir ce lien.');
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="cloud-download" size={15} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {isValidated ? 'Livraison validée' : 'Livraison reçue'}
            </Text>
            {revisionCount > 0 && (
              <Text style={styles.revisionLabel}>
                Révision {revisionCount}/{maxRevisions}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, isValidated && styles.statusBadgeGreen]}>
          <Ionicons
            name={isValidated ? 'checkmark-circle' : 'time-outline'}
            size={11}
            color={isValidated ? '#22C55E' : '#3B82F6'}
          />
          <Text style={[styles.statusText, isValidated && { color: '#22C55E' }]}>
            {isValidated ? 'Validée' : 'À valider'}
          </Text>
        </View>
      </View>

      {/* ── Lien fichier ── */}
      <TouchableOpacity onPress={handleOpenUrl} style={styles.linkBtn} activeOpacity={0.78}>
        <LinearGradient
          colors={['#3B82F614', '#3B82F608']}
          style={StyleSheet.absoluteFill}
          borderRadius={RADIUS.lg}
        />
        <Ionicons name="link-outline" size={15} color="#3B82F6" />
        <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
          {url || '—'}
        </Text>
        <Ionicons name="open-outline" size={13} color="#3B82F680" />
      </TouchableOpacity>

      {/* ── Message freelance ── */}
      {!!message && (
        <View style={styles.messageBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      {/* ── Actions ── */}
      {!isValidated && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.validateBtn]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onValidate?.();
          }}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={StyleSheet.absoluteFill}
            borderRadius={RADIUS.lg}
          />
          <Ionicons name="checkmark" size={15} color="#fff" />
          <Text style={styles.validateBtnText}>Valider la livraison</Text>
        </TouchableOpacity>
      )}

      {/* ── État validé ── */}
      {isValidated && (
        <View style={styles.validatedBanner}>
          <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
          <Text style={styles.validatedText}>Paiement libéré au freelance</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#3B82F630',
    padding: SPACING.md,
    gap: SPACING.sm,
    alignSelf: 'stretch',
    ...SHADOW.sm,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#3B82F618', borderWidth: 1, borderColor: '#3B82F630',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:   { fontSize: 13, fontWeight: '800', color: COLORS.text },
  revisionLabel: { fontSize: 10, color: '#F59E0B', fontWeight: '700', marginTop: 1 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#3B82F610', borderWidth: 1, borderColor: '#3B82F625',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusBadgeGreen: { backgroundColor: '#22C55E10', borderColor: '#22C55E25' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#3B82F6' },

  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#3B82F625',
    paddingHorizontal: SPACING.sm, paddingVertical: 10,
    overflow: 'hidden',
  },
  linkText: { flex: 1, fontSize: 12, color: '#3B82F6', fontWeight: '600' },

  messageBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 10,
  },
  messageText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: 2 },

  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: RADIUS.lg, paddingVertical: 11, overflow: 'hidden',
  },
  revisionBtn: {
    backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B30',
  },
  revisionBtnText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  validateBtn:     { position: 'relative' },
  validateBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  validatedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#22C55E0C', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#22C55E25', paddingVertical: 9,
  },
  validatedText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
});
