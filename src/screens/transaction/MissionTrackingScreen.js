/**
 * MissionTrackingScreen.js — Suivi mission côté CLIENT (refonte)
 * Params : { mission, freelancer }
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, KeyboardAvoidingView, Platform,
  Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import { useMissions }       from '../../lib/MissionsContext';
import { useConversations } from '../../lib/ConversationsContext';
import { useSession }        from '../../lib/SessionContext';

const { width: SW } = Dimensions.get('window');

// ── Étapes de progression ──────────────────────────────────────────────────────
const STEPS = [
  { key: 'sent',      label: 'Envoyé',     icon: 'paper-plane'    },
  { key: 'progress',  label: 'En cours',   icon: 'construct'      },
  { key: 'delivered', label: 'Livré',      icon: 'cloud-download' },
  { key: 'done',      label: 'Validé',     icon: 'checkmark-circle' },
];
const STATUS_TO_STEP_IDX = { en_cours: 1, livre: 2, revision: 1, valide: 3 };

// ── Badge statut ───────────────────────────────────────────────────────────────
const STATUS_UI = {
  en_cours: { label: 'En cours',          color: COLORS.primary,  icon: 'radio-button-on' },
  livre:    { label: 'Livraison reçue',   color: '#3B82F6',       icon: 'cloud-download'  },
  revision: { label: 'Révision demandée', color: '#F59E0B',       icon: 'refresh-circle'  },
  valide:   { label: 'Validée',           color: '#22C55E',       icon: 'checkmark-circle'},
};

// ── Messages système initiaux ──────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  { id: 1, from: 'system', text: 'Mission créée — paiement sécurisé en escrow', ts: 'Il y a 2min' },
  { id: 2, from: 'freelance', text: 'Bonjour ! J\'ai bien reçu votre mission, je commence tout de suite.', ts: 'Il y a 1min' },
];

// ── Barre de progression horizontale ──────────────────────────────────────────
function ProgressBar({ activeIndex, accentColor }) {
  return (
    <View style={pb.container}>
      {STEPS.map((step, i) => {
        const done   = i < activeIndex;
        const active = i === activeIndex;
        const color  = done || active ? accentColor : COLORS.border;
        return (
          <React.Fragment key={step.key}>
            <View style={pb.step}>
              <View style={[
                pb.dot,
                done   && { backgroundColor: accentColor, borderColor: accentColor },
                active && { backgroundColor: accentColor, borderColor: accentColor, width: 22, height: 22, borderRadius: 11 },
                !done && !active && { backgroundColor: COLORS.card },
              ]}>
                {done   && <Ionicons name="checkmark" size={11} color="#fff" />}
                {active && <View style={[pb.dotInner, { backgroundColor: '#fff' }]} />}
              </View>
              <Text style={[pb.label, (done || active) && { color: COLORS.text, fontWeight: '700' }]}>
                {step.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[pb.line, i < activeIndex && { backgroundColor: accentColor }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const pb = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.sm },
  step:      { alignItems: 'center', gap: 6, width: 56 },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotInner: { width: 7, height: 7, borderRadius: 3.5 },
  label:    { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  line:     { flex: 1, height: 1.5, backgroundColor: COLORS.border, marginBottom: 18, marginHorizontal: 2 },
});

// ── Composant principal ────────────────────────────────────────────────────────
export default function MissionTrackingScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const session    = useSession();
  const userId     = session?.user?.id ?? null;
  const userMeta   = session?.user?.user_metadata ?? {};
  const senderName     = userMeta.nom ?? userMeta.full_name ?? 'Client';
  const senderInitials = senderName.charAt(0).toUpperCase();

  const { acceptedMissions } = useMissions();
  const {
    conversations, initConversation, pushMessage,
    sendMessage: ctxSendMessage, loadConversation,
    subscribeToConversation, unsubscribeFromConversation,
  } = useConversations();

  const { mission: routeMission, freelancer } = route.params ?? {};

  const liveMission = acceptedMissions.find(m => m.id === routeMission?.id) ?? routeMission ?? {
    id: 'demo_mission', status: 'livre', title: 'Script TikTok identité de marque',
    budget: 45, deadline: '24h', deliveryUrl: 'https://drive.google.com/file/demo',
    deliveryMessage: 'Voici la livraison finale, j\'espère qu\'elle vous convient.',
    revisionCount: 0, color: COLORS.primary,
  };

  const activeIdx  = STATUS_TO_STEP_IDX[liveMission?.status] ?? 1;
  const statusUI   = STATUS_UI[liveMission?.status] ?? STATUS_UI.en_cours;
  const accentColor = liveMission?.color ?? COLORS.primary;

  const [chatInput, setChatInput] = useState('');

  // ── Conversation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!liveMission?.id) return;
    const convMeta = {
      name:     freelancer?.name     ?? 'Freelance',
      initials: freelancer?.initials ?? (freelancer?.name?.charAt(0) ?? 'F'),
      color:    accentColor,
      type:     liveMission.type  ?? 'Mission',
      title:    liveMission.title ?? 'Mission',
      budget:   liveMission.budget ?? 0,
      raw:      liveMission,
    };
    initConversation(liveMission.id, convMeta, INITIAL_MESSAGES);
    if (userId) {
      loadConversation(liveMission.id, convMeta, userId);
      subscribeToConversation(liveMission.id, userId);
    }
    return () => { if (userId) unsubscribeFromConversation(liveMission.id); };
  }, [liveMission?.id, userId]);

  // Inject delivery card in chat when delivered
  const messages = conversations[liveMission?.id]?.messages ?? INITIAL_MESSAGES;
  useEffect(() => {
    const status = liveMission?.status;
    if ((status === 'livre' || status === 'valide') && liveMission.id) {
      const current = conversations[liveMission.id]?.messages ?? [];
      if (!current.find(m => m.type === 'delivery')) {
        pushMessage(liveMission.id, {
          id: 'delivery', type: 'delivery', from: 'system',
          deliveryUrl: liveMission.deliveryUrl,
          deliveryMessage: liveMission.deliveryMessage,
          revisionCount: liveMission.revisionCount ?? 0,
          ts: 'Maintenant',
        });
      }
    }
  }, [liveMission?.status, liveMission?.deliveryUrl]);

  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !liveMission?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ctxSendMessage(liveMission.id, chatInput.trim(), {
      userId: userId ?? 'anonymous',
      name: senderName, initials: senderInitials,
    });
    setChatInput('');
  }, [chatInput, liveMission?.id, userId]);

  // ── Delivery data ────────────────────────────────────────────────────────────
  const deliveryMsg  = messages.find(m => m.type === 'delivery') ?? {
    deliveryUrl:     liveMission?.deliveryUrl     ?? null,
    deliveryMessage: liveMission?.deliveryMessage ?? null,
    revisionCount:   liveMission?.revisionCount   ?? 0,
  };
  const isDelivered  = liveMission?.status === 'livre';
  const isValidated  = liveMission?.status === 'valide';
  const showDelivery = isDelivered || isValidated;
  const revCount     = deliveryMsg.revisionCount ?? 0;
  const canRevise    = revCount < 1 && !isValidated;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topTitle} numberOfLines={1}>
              {liveMission?.title ?? 'Suivi de mission'}
            </Text>
            <View style={[styles.statusBadge, {
              backgroundColor: statusUI.color + '18',
              borderColor:     statusUI.color + '35',
            }]}>
              <Ionicons name={statusUI.icon} size={9} color={statusUI.color} />
              <Text style={[styles.statusBadgeText, { color: statusUI.color }]}>
                {statusUI.label}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Hero card : budget + deadline ── */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[accentColor + '18', accentColor + '06']}
                style={StyleSheet.absoluteFill}
                borderRadius={RADIUS.xl}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={[styles.heroAccent, { backgroundColor: accentColor }]} />
              <View style={styles.heroBody}>
                <View style={styles.heroMetrics}>
                  <View style={styles.heroMetric}>
                    <Ionicons name="lock-closed" size={14} color="#22C55E" />
                    <Text style={styles.heroMetricValue}>{liveMission?.budget ?? 0}€</Text>
                    <Text style={styles.heroMetricLabel}>sécurisés</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroMetric}>
                    <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    <Text style={styles.heroMetricValue}>{liveMission?.deadline ?? '24h'}</Text>
                    <Text style={styles.heroMetricLabel}>délai</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroMetric}>
                    <Ionicons name="refresh-outline" size={14} color={COLORS.primaryLight} />
                    <Text style={styles.heroMetricValue}>1</Text>
                    <Text style={styles.heroMetricLabel}>révision</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Progression ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Progression</Text>
              <ProgressBar activeIndex={activeIdx} accentColor={accentColor} />
            </View>

            {/* ── Freelance ── */}
            <View style={styles.freelanceCard}>
              <View style={[styles.freelanceAvatar, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
                <Text style={[styles.freelanceInitials, { color: accentColor }]}>
                  {freelancer?.initials ?? 'SL'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.freelanceNameRow}>
                  <Text style={styles.freelanceName}>{freelancer?.name ?? 'Sophie L.'}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={10} color="#22C55E" />
                    <Text style={styles.verifiedText}>Vérifié</Text>
                  </View>
                </View>
                <Text style={styles.freelanceSpec}>{freelancer?.specialty ?? 'Experte Hook'}</Text>
                <View style={styles.freelanceStats}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.freelanceRating}>{freelancer?.rating ?? '4.9'}</Text>
                  <View style={styles.responseBadge}>
                    <Ionicons name="flash" size={10} color="#22C55E" />
                    <Text style={styles.responseText}>Répond en moins d'1h</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.msgBtn, { borderColor: accentColor + '40', backgroundColor: accentColor + '10' }]}
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={16} color={accentColor} />
              </TouchableOpacity>
            </View>

            {/* ── Zone de livraison (quand livré ou validé) ── */}
            {showDelivery && (
              <View style={[styles.deliveryZone, {
                borderColor: isValidated ? '#22C55E35' : '#3B82F635',
              }]}>
                <LinearGradient
                  colors={isValidated ? ['#22C55E0C', 'transparent'] : ['#3B82F60C', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.xl}
                />

                {/* En-tête livraison */}
                <View style={styles.deliveryHeader}>
                  <View style={[styles.deliveryIconWrap, {
                    backgroundColor: isValidated ? '#22C55E20' : '#3B82F620',
                  }]}>
                    <Ionicons
                      name={isValidated ? 'checkmark-circle' : 'cloud-download'}
                      size={22}
                      color={isValidated ? '#22C55E' : '#3B82F6'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deliveryTitle, { color: isValidated ? '#22C55E' : '#3B82F6' }]}>
                      {isValidated ? 'Mission validée' : 'Livraison reçue'}
                    </Text>
                    <Text style={styles.deliverySub}>
                      {isValidated
                        ? `${liveMission?.budget ?? 0}€ libérés au freelance`
                        : 'Examinez le fichier avant de valider'}
                    </Text>
                  </View>
                  {isValidated && (
                    <View style={styles.validatedCircle}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Lien fichier */}
                {deliveryMsg.deliveryUrl ? (
                  <TouchableOpacity
                    style={styles.fileRow}
                    onPress={() => Linking.openURL(deliveryMsg.deliveryUrl).catch(() => {})}
                    activeOpacity={0.78}
                  >
                    <View style={styles.fileIcon}>
                      <Ionicons name="document-attach-outline" size={17} color="#3B82F6" />
                    </View>
                    <Text style={styles.fileLabel} numberOfLines={1} ellipsizeMode="middle">
                      Ouvrir la livraison
                    </Text>
                    <Ionicons name="open-outline" size={14} color="#3B82F680" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.fileRow, { opacity: 0.4 }]}>
                    <View style={styles.fileIcon}>
                      <Ionicons name="document-attach-outline" size={17} color="#3B82F6" />
                    </View>
                    <Text style={styles.fileLabel}>En attente du fichier</Text>
                  </View>
                )}

                {/* Message du freelance */}
                {!!deliveryMsg.deliveryMessage && (
                  <View style={styles.deliveryMsgBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.textMuted} style={{ marginTop: 1 }} />
                    <Text style={styles.deliveryMsgText}>"{deliveryMsg.deliveryMessage}"</Text>
                  </View>
                )}

                {/* Actions (si pas encore validé) */}
                {!isValidated && (
                  <View style={styles.deliveryActions}>
                    {/* Révision / Litige */}
                    <TouchableOpacity
                      style={[
                        styles.revisionRow,
                        !canRevise && { borderColor: '#EF444430', backgroundColor: '#EF44440A' },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate(
                          canRevise ? 'RevisionRequest' : 'Dispute',
                          { mission: liveMission, freelancer }
                        );
                      }}
                      activeOpacity={0.78}
                    >
                      <View style={[styles.revisionIcon, !canRevise && { backgroundColor: '#EF444415' }]}>
                        <Ionicons
                          name={canRevise ? 'refresh-outline' : 'warning-outline'}
                          size={16}
                          color={canRevise ? '#F59E0B' : '#EF4444'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.revisionTitle, !canRevise && { color: '#EF4444' }]}>
                          {canRevise ? 'Demander une retouche' : 'Ouvrir un litige'}
                        </Text>
                        <Text style={styles.revisionSub}>
                          {canRevise ? `Gratuit · ${revCount}/1 utilisée` : 'Toutes les révisions épuisées'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={13} color={canRevise ? '#F59E0B50' : '#EF444450'} />
                    </TouchableOpacity>

                    {/* Séparateur */}
                    <View style={styles.actionsDivider} />

                    {/* Valider */}
                    <TouchableOpacity
                      style={styles.validateBtn}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        navigation.navigate('Delivery', { mission: liveMission, freelancer });
                      }}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={['#22C55E', '#16A34A']}
                        style={StyleSheet.absoluteFill}
                        borderRadius={RADIUS.lg}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      />
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.validateBtnText}>Valider la livraison</Text>
                        <Text style={styles.validateBtnSub}>
                          Libère les {liveMission?.budget ?? 0}€ au freelance
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ── Messagerie ── */}
            <View style={styles.chatCard}>
              <Text style={styles.sectionLabel}>Messages</Text>
              <View style={styles.chatMessages}>
                {messages.map(msg => {
                  if (msg.type === 'delivery') return null;
                  const isMe     = msg.from === 'client' || msg.from === 'me';
                  const isSystem = msg.from === 'system';
                  if (isSystem) return (
                    <View key={msg.id} style={styles.systemBubble}>
                      <Ionicons name="checkmark-circle" size={11} color="#22C55E" />
                      <Text style={styles.systemText}>{msg.text}</Text>
                    </View>
                  );
                  return (
                    <View key={msg.id} style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                      <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{msg.text}</Text>
                      <Text style={[styles.bubbleTs, isMe && { color: 'rgba(255,255,255,0.55)' }]}>{msg.ts}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Input */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Envoyer un message…"
                  placeholderTextColor={COLORS.textLight}
                  selectionColor={COLORS.primary}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: accentColor }]}
                  onPress={sendMessage}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send" size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: 16 },

  // ── Top bar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center', gap: 4 },
  topTitle:  { fontSize: 15, fontWeight: '800', color: COLORS.text, maxWidth: 200 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  // ── Hero card ───────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.sm, overflow: 'hidden',
    backgroundColor: COLORS.card, flexDirection: 'row',
  },
  heroAccent: { width: 4, borderRadius: 0 },
  heroBody:   { flex: 1, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md },
  heroMetrics: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  heroMetric: { alignItems: 'center', gap: 3 },
  heroMetricValue: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  heroMetricLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  heroDivider:     { width: 1, height: 32, backgroundColor: COLORS.border },

  // ── Section label ────────────────────────────────────────────────────────────
  section:      { marginBottom: SPACING.sm },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: SPACING.sm,
  },

  // ── Freelance card ───────────────────────────────────────────────────────────
  freelanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  freelanceAvatar: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  freelanceInitials: { fontSize: 18, fontWeight: '900' },
  freelanceNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  freelanceName:     { fontSize: 15, fontWeight: '800', color: COLORS.text },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#22C55E0E', borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedText:  { fontSize: 9, fontWeight: '700', color: '#22C55E' },
  freelanceSpec: { fontSize: 12, color: COLORS.textMuted, marginBottom: 5 },
  freelanceStats:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  freelanceRating:{ fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  responseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#22C55E0E', borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  responseText:  { fontSize: 9, fontWeight: '700', color: '#22C55E' },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  // ── Zone livraison ───────────────────────────────────────────────────────────
  deliveryZone: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.md, marginBottom: SPACING.sm,
    overflow: 'hidden', gap: SPACING.sm,
    ...SHADOW.sm,
  },
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deliveryIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deliveryTitle: { fontSize: 15, fontWeight: '800' },
  deliverySub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  validatedCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },

  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#3B82F620',
    paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  fileIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#3B82F615', alignItems: 'center', justifyContent: 'center',
  },
  fileLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  deliveryMsgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, paddingVertical: 10,
  },
  deliveryMsgText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17, fontStyle: 'italic' },

  // Actions livraison
  deliveryActions: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  revisionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 13,
    backgroundColor: '#F59E0B07',
  },
  revisionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F59E0B15', alignItems: 'center', justifyContent: 'center',
  },
  revisionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  revisionSub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  actionsDivider:{ height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  validateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 15,
    overflow: 'hidden',
  },
  validateBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  validateBtnSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // ── Chat ─────────────────────────────────────────────────────────────────────
  chatCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
    ...SHADOW.sm,
  },
  chatMessages: { gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: RADIUS.lg, paddingHorizontal: 13, paddingVertical: 10 },
  bubbleMe:   { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: COLORS.cardElevated, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  bubbleTs:   { fontSize: 10, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  systemBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: '#22C55E0C', borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  systemText: { fontSize: 11, fontWeight: '600', color: '#22C55E' },

  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chatInput: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 13, color: COLORS.text,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
