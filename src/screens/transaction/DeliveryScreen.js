/**
 * DeliveryScreen.js — Visualisation de la livraison + validation / révision
 * Params : { mission, freelancer }
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useMissions } from '../../lib/MissionsContext';

const DEFAULT_MAX_REVISIONS = 1;

export default function DeliveryScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { updateStatus } = useMissions();
  const { mission, freelancer } = route.params ?? {};

  const mColor        = mission?.color ?? COLORS.primary;
  const maxRevisions  = mission?.revisions   ?? DEFAULT_MAX_REVISIONS;
  const revisionsUsed = mission?.revisionsUsed ?? 0;
  const revisionsLeft = Math.max(0, maxRevisions - revisionsUsed);
  const deliveryUrl     = mission?.deliveryUrl;
  const deliveryMessage = mission?.deliveryMessage;

  function handleValidate() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mission?.id) updateStatus(mission.id, 'valide', {}, mission);
    navigation.replace('Validation', { mission, freelancer });
  }

  function handleRevision() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (revisionsLeft === 0) {
      navigation.navigate('Dispute', { mission, freelancer });
      return;
    }
    navigation.navigate('RevisionRequest', { mission, freelancer, revisionsLeft });
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
          <Text style={styles.topBarTitle}>Livraison reçue</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Carte principale livraison ── */}
          <View style={[styles.deliveryCard, { borderColor: mColor + '35' }]}>
            <LinearGradient
              colors={[mColor + '12', 'transparent']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.xl}
            />

            {/* Freelancer */}
            <View style={styles.freelancerRow}>
              <View style={[styles.freelancerAvatar, { backgroundColor: mColor + '22', borderColor: mColor + '45' }]}>
                <Text style={[styles.freelancerInitials, { color: mColor }]}>
                  {freelancer?.initials ?? 'FL'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.freelancerName}>{freelancer?.name ?? 'Le freelance'}</Text>
                <Text style={styles.freelancerSub}>a livré votre mission</Text>
              </View>
              <View style={styles.deliveredBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
                <Text style={styles.deliveredBadgeText}>Livré</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Titre mission */}
            {!!mission?.title && (
              <Text style={styles.missionTitle} numberOfLines={2}>{mission.title}</Text>
            )}

            {/* Bouton visualiser */}
            <Text style={styles.sectionLabel}>FICHIER LIVRÉ</Text>
            {deliveryUrl ? (
              <TouchableOpacity
                style={styles.fileBtn}
                onPress={() => Linking.openURL(deliveryUrl).catch(() => {})}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F620', '#3B82F608']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.lg}
                />
                <View style={styles.fileIconWrap}>
                  <Ionicons name="document-attach" size={22} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileBtnText}>Voir la livraison</Text>
                  <Text style={styles.fileBtnSub}>Ouvrir dans le navigateur</Text>
                </View>
                <View style={styles.openBtnCircle}>
                  <Ionicons name="open-outline" size={16} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.fileBtn, { opacity: 0.45 }]}>
                <View style={styles.fileIconWrap}>
                  <Ionicons name="document-attach-outline" size={22} color={COLORS.textMuted} />
                </View>
                <Text style={[styles.fileBtnText, { color: COLORS.textMuted }]}>En attente du fichier</Text>
              </View>
            )}

            {/* Message du freelance */}
            {!!deliveryMessage && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: SPACING.sm }]}>MESSAGE DU FREELANCE</Text>
                <View style={styles.messageBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.textMuted} style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text style={styles.messageText}>"{deliveryMessage}"</Text>
                </View>
              </>
            )}
          </View>

          {/* ── Infos révisions ── */}
          <View style={[styles.revisionsBar, {
            borderColor:     revisionsLeft > 0 ? '#F59E0B30' : '#EF444430',
            backgroundColor: revisionsLeft > 0 ? '#F59E0B08' : '#EF44440A',
          }]}>
            <Ionicons
              name="refresh-circle-outline"
              size={16}
              color={revisionsLeft > 0 ? '#F59E0B' : '#EF4444'}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.revisionsText, { color: revisionsLeft > 0 ? '#F59E0B' : '#EF4444' }]}>
                {revisionsLeft > 0 ? '1 révision gratuite incluse' : 'Révision gratuite utilisée'}
              </Text>
              <Text style={[styles.revisionsSub, { color: revisionsLeft > 0 ? '#F59E0B99' : '#EF444499' }]}>
                Révisions supplémentaires : 5€ / retouche
              </Text>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* ── CTAs sticky ── */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity onPress={handleValidate} activeOpacity={0.88} style={styles.validateBtn}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.validateGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.validateText}>Valider la livraison</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRevision} activeOpacity={0.8} style={styles.revisionBtn}>
            <Ionicons
              name={revisionsLeft > 0 ? 'refresh-circle-outline' : 'warning-outline'}
              size={15}
              color={revisionsLeft > 0 ? COLORS.primary : '#EF4444'}
            />
            <Text style={[styles.revisionBtnText, { color: revisionsLeft > 0 ? COLORS.primary : '#EF4444' }]}>
              {revisionsLeft > 0
                ? `Demander une révision (${revisionsLeft} restante)`
                : 'Ouvrir un litige'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.ctaSub}>Le paiement est libéré uniquement après votre validation</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.sm },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  // Delivery card
  deliveryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: SPACING.md, overflow: 'hidden',
    gap: 0,
    ...SHADOW.sm,
  },
  freelancerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  freelancerAvatar:   { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  freelancerInitials: { fontSize: 17, fontWeight: '900' },
  freelancerName:     { fontSize: 14, fontWeight: '800', color: COLORS.text },
  freelancerSub:      { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  deliveredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#22C55E12', borderWidth: 1, borderColor: '#22C55E30',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  deliveredBadgeText: { fontSize: 11, fontWeight: '700', color: '#22C55E' },

  divider:    { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },

  missionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: SPACING.sm, lineHeight: 18 },

  sectionLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 8 },

  // File button
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#3B82F625',
    padding: SPACING.md, overflow: 'hidden',
  },
  fileIconWrap: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: '#3B82F615', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileBtnText: { fontSize: 14, fontWeight: '800', color: '#3B82F6' },
  fileBtnSub:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  openBtnCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#3B82F615', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Message
  messageBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, paddingVertical: 10,
  },
  messageText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 18, fontStyle: 'italic' },

  // Revisions
  revisionsBar:  { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: RADIUS.lg, padding: 12 },
  revisionsText: { fontSize: 12, fontWeight: '700' },
  revisionsSub:  { fontSize: 10, fontWeight: '500', marginTop: 1 },

  // CTAs
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'EC',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm,
  },
  validateBtn:      { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  validateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  validateText:     { fontSize: 16, fontWeight: '900', color: '#fff' },
  revisionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.primary + '50', borderRadius: RADIUS.xl,
    paddingVertical: 13, backgroundColor: COLORS.primary + '0A',
  },
  revisionBtnText: { fontSize: 14, fontWeight: '700' },
  ctaSub:          { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
});
