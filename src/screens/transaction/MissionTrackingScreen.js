/**
 * MissionTrackingScreen.js — Suivi mission côté CLIENT
 * Timeline de statuts, freelance assigné, deadline, chat, CTA livraison
 * Params : { mission, freelancer }
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, KeyboardAvoidingView, Platform, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import DeliveryCard from '../../components/ui/DeliveryCard';
import { useMissions }       from '../../lib/MissionsContext';
import { useConversations } from '../../lib/ConversationsContext';

// ── Étapes de suivi ────────────────────────────────────────────────────────────
const TRACKING_STEPS = [
  { key: 'waiting',    label: 'Mission envoyée',      sub: 'En attente d\'acceptation',   icon: 'paper-plane-outline'   },
  { key: 'accepted',   label: 'Freelance assigné',     sub: 'Il commence dès maintenant',  icon: 'person-circle-outline' },
  { key: 'in_progress',label: 'En cours de création',  sub: 'Le freelance travaille',      icon: 'construct-outline'     },
  { key: 'delivered',  label: 'Livraison reçue',       sub: 'À valider avant paiement',    icon: 'cloud-download-outline'},
  { key: 'validated',  label: 'Mission terminée',      sub: 'Freelance payé',              icon: 'checkmark-circle'      },
];

// ── Mapping statut → étape timeline ──────────────────────────────────────────
const STATUS_TO_STEP = { en_cours: 2, livre: 3, revision: 2, valide: 4 };

// ── Config badge statut ───────────────────────────────────────────────────────
const STATUS_UI = {
  en_cours: { label: 'En cours',          color: COLORS.primary, icon: 'ellipse'          },
  livre:    { label: 'Livraison reçue',   color: '#3B82F6',      icon: 'cloud-download'   },
  revision: { label: 'Révision en cours', color: '#F59E0B',      icon: 'refresh'          },
  valide:   { label: 'Validé',            color: '#22C55E',      icon: 'checkmark-circle' },
};

// ── Mock messages chat ────────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  { id: 1, from: 'system', text: 'Mission créée — paiement sécurisé', ts: 'Il y a 2min' },
  { id: 2, from: 'freelance', text: 'Bonjour ! J\'ai bien reçu votre mission, je commence tout de suite.', ts: 'Il y a 1min' },
];

// ── Composant Step ─────────────────────────────────────────────────────────────
function TrackStep({ step, activeIndex, index, accentColor }) {
  const isDone   = index < activeIndex;
  const isActive = index === activeIndex;
  const color    = isDone || isActive ? accentColor : COLORS.textLight;

  return (
    <View style={styles.trackRow}>
      {/* Ligne verticale */}
      <View style={styles.trackLeft}>
        <View style={[
          styles.trackDot,
          (isDone || isActive) && { backgroundColor: color, borderColor: color },
          isActive && { width: 18, height: 18, borderRadius: 9, ...SHADOW.sm },
        ]}>
          {isDone && <Ionicons name="checkmark" size={10} color="#fff" />}
          {isActive && <View style={[styles.trackDotInner, { backgroundColor: color }]} />}
        </View>
        {index < TRACKING_STEPS.length - 1 && (
          <View style={[styles.trackLine, isDone && { backgroundColor: color }]} />
        )}
      </View>
      {/* Contenu */}
      <View style={[styles.trackContent, isActive && { opacity: 1 }, !isDone && !isActive && { opacity: 0.4 }]}>
        <Text style={[styles.trackLabel, (isDone || isActive) && { color: COLORS.text }]}>{step.label}</Text>
        {isActive && <Text style={[styles.trackSub, { color: accentColor }]}>{step.sub}</Text>}
      </View>
    </View>
  );
}

export default function MissionTrackingScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { acceptedMissions }                       = useMissions();
  const { conversations, initConversation, pushMessage } = useConversations();

  const { mission: routeMission, freelancer } = route.params ?? {};

  // Priorité : données live → params navigation → mock de démonstration
  const liveMission = acceptedMissions.find(m => m.id === routeMission?.id) ?? routeMission ?? {
    id:              'demo_mission',
    status:          'livre',
    title:           'Logo identité visuelle',
    budget:          45,
    deadline:        '24h',
    deliveryUrl:     'https://drive.google.com/file/demo-livraison',
    deliveryMessage: 'Bonjour ! Voici la livraison finale, j\'espère qu\'elle vous convient. N\'hésitez pas à me faire un retour.',
    revisionCount:   0,
    color:           COLORS.primary,
  };

  const [activeStep, setActiveStep] = useState(
    STATUS_TO_STEP[liveMission?.status] ?? 1
  );
  const [chatInput, setChatInput] = useState('');

  // Initialise la conversation dans le contexte global dès l'ouverture
  useEffect(() => {
    if (!liveMission?.id) return;
    initConversation(liveMission.id, {
      name:     freelancer?.name     ?? 'Freelance',
      initials: freelancer?.initials ?? (freelancer?.name?.charAt(0) ?? 'F'),
      color:    liveMission.color    ?? COLORS.primary,
      type:     liveMission.type     ?? 'Mission',
      title:    liveMission.title    ?? 'Mission',
      budget:   liveMission.budget   ?? 0,
      raw:      liveMission,
    }, INITIAL_MESSAGES);
  }, [liveMission?.id]);

  // Messages depuis le contexte global
  const messages = conversations[liveMission?.id]?.messages ?? INITIAL_MESSAGES;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Sync statut → étape + injection DeliveryCard dans le chat ──────────────
  useEffect(() => {
    const status = liveMission?.status;
    if (!status) return;

    setActiveStep(STATUS_TO_STEP[status] ?? 1);

    // Injecter la DeliveryCard dans le chat quand livré ou validé
    if ((status === 'livre' || status === 'valide') && liveMission.id) {
      const current = conversations[liveMission.id]?.messages ?? [];
      if (!current.find(m => m.type === 'delivery')) {
        pushMessage(liveMission.id, {
          id:              'delivery',
          type:            'delivery',
          from:            'system',
          deliveryUrl:     liveMission.deliveryUrl,
          deliveryMessage: liveMission.deliveryMessage,
          revisionCount:   liveMission.revisionCount ?? 0,
          ts:              'Maintenant',
        });
      }
    }
  }, [liveMission?.status, liveMission?.deliveryUrl]);

  // ── Pulse animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function sendMessage() {
    if (!chatInput.trim() || !liveMission?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pushMessage(liveMission.id, {
      id: Date.now(), from: 'client', text: chatInput.trim(), ts: 'À l\'instant',
    });
    setChatInput('');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="acheteur" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>Suivi mission</Text>
            {(() => {
              const ui = STATUS_UI[liveMission?.status] ?? STATUS_UI.en_cours;
              return (
                <View style={[styles.liveBadge, {
                  backgroundColor: ui.color + '18',
                  borderColor:     ui.color + '35',
                }]}>
                  <Ionicons name={ui.icon} size={9} color={ui.color} />
                  <Text style={[styles.liveText, { color: ui.color }]}>{ui.label}</Text>
                </View>
              );
            })()}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Timeline ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Progression</Text>
              <View style={styles.timeline}>
                {TRACKING_STEPS.map((step, i) => (
                  <TrackStep
                    key={step.key}
                    step={step}
                    index={i}
                    activeIndex={activeStep}
                    accentColor={COLORS.primary}
                  />
                ))}
              </View>
            </View>

            {/* ── Freelance assigné ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Freelance</Text>
              <View style={styles.freelanceRow}>
                <View style={[styles.avatarBox, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary + '40' }]}>
                  <Text style={[styles.avatarInitials, { color: COLORS.primary }]}>
                    {freelancer?.initials ?? 'SL'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.freelanceName}>{freelancer?.name ?? 'Sophie L.'}</Text>
                    <View style={styles.verifiedPill}>
                      <Ionicons name="shield-checkmark" size={10} color="#22C55E" />
                      <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                  </View>
                  <Text style={styles.freelanceSpec}>{freelancer?.specialty ?? 'Experte Hook'}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingText}>{freelancer?.rating ?? '4.9'}</Text>
                    <View style={[styles.flashBadge]}>
                      <Ionicons name="flash" size={10} color="#22C55E" />
                      <Text style={styles.flashText}>Répond en {'< 1h'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Deadline & montant ── */}
            <View style={styles.infoRow}>
              <View style={[styles.infoCard, { borderColor: '#F59E0B30' }]}>
                <LinearGradient colors={['#F59E0B14', '#F59E0B04']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                <Ionicons name="alarm-outline" size={20} color="#F59E0B" />
                <Text style={[styles.infoCardNum, { color: '#F59E0B' }]}>
                  {liveMission?.deadline ?? '24h'}
                </Text>
                <Text style={styles.infoCardLabel}>de délai</Text>
              </View>
              <View style={[styles.infoCard, { borderColor: '#22C55E30' }]}>
                <LinearGradient colors={['#22C55E14', '#22C55E04']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                <Ionicons name="lock-closed" size={20} color="#22C55E" />
                <Text style={[styles.infoCardNum, { color: '#22C55E' }]}>
                  {liveMission?.budget ?? 45}€
                </Text>
                <Text style={styles.infoCardLabel}>sécurisés</Text>
              </View>
              <View style={[styles.infoCard, { borderColor: COLORS.primary + '30' }]}>
                <LinearGradient colors={[COLORS.primary + '14', COLORS.primary + '04']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.infoCardNum, { color: COLORS.primary }]}>
                  1
                </Text>
                <Text style={styles.infoCardLabel}>révision</Text>
              </View>
            </View>

            {/* ── VALIDATION HÉRO (élément central, hors card) ── */}
            {(liveMission?.status === 'livre' || liveMission?.status === 'valide') && (() => {
              const deliveryMsg = messages.find(m => m.type === 'delivery') ?? {
                deliveryUrl:     liveMission?.deliveryUrl     ?? null,
                deliveryMessage: liveMission?.deliveryMessage ?? null,
                revisionCount:   liveMission?.revisionCount   ?? 0,
              };
              const isValidated = liveMission?.status === 'valide';
              const revCount    = deliveryMsg.revisionCount ?? 0;
              const canRevise   = revCount < 1 && !isValidated;

              return (
                <View style={styles.validationHero}>
                  {/* ── Bande de statut ── */}
                  <View style={[styles.validationStatusBar, { backgroundColor: isValidated ? '#22C55E18' : '#3B82F618', borderColor: isValidated ? '#22C55E35' : '#3B82F635' }]}>
                    <View style={[styles.validationIconBig, { backgroundColor: isValidated ? '#22C55E20' : '#3B82F620' }]}>
                      <Ionicons name={isValidated ? 'checkmark-circle' : 'cloud-download'} size={24} color={isValidated ? '#22C55E' : '#3B82F6'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.validationTitle, { color: isValidated ? '#22C55E' : '#3B82F6' }]}>
                        {isValidated ? 'Mission validée' : 'Livraison reçue'}
                      </Text>
                      <Text style={styles.validationSub}>
                        {isValidated ? 'Paiement libéré au freelance' : 'Examinez le fichier avant de valider'}
                      </Text>
                    </View>
                    {isValidated && (
                      <View style={styles.validationCheckCircle}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* ── Bouton fichier ── */}
                  {deliveryMsg.deliveryUrl ? (
                    <TouchableOpacity
                      style={styles.validationFileBtn}
                      onPress={() => Linking.openURL(deliveryMsg.deliveryUrl).catch(() => {})}
                      activeOpacity={0.78}
                    >
                      <View style={styles.validationFileBtnIcon}>
                        <Ionicons name="document-attach-outline" size={18} color="#3B82F6" />
                      </View>
                      <Text style={styles.validationFileBtnText} numberOfLines={1} ellipsizeMode="middle">
                        Voir la livraison
                      </Text>
                      <Ionicons name="arrow-forward-outline" size={15} color="#3B82F680" />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.validationFileBtn, { opacity: 0.45 }]}>
                      <View style={styles.validationFileBtnIcon}>
                        <Ionicons name="document-attach-outline" size={18} color="#3B82F6" />
                      </View>
                      <Text style={styles.validationFileBtnText}>Fichier en attente</Text>
                    </View>
                  )}

                  {/* ── Message du freelance ── */}
                  {!!deliveryMsg.deliveryMessage && (
                    <View style={styles.validationMsgBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.textMuted} style={{ marginTop: 1 }} />
                      <Text style={styles.validationMsgText}>"{deliveryMsg.deliveryMessage}"</Text>
                    </View>
                  )}

                  {/* ── Actions (plusieurs actions visibles) ── */}
                  {!isValidated && (
                    <View style={styles.validationActions}>

                      {/* Retouche gratuite */}
                      <TouchableOpacity
                        style={[styles.validationActionBtn, styles.revisionActionBtn, !canRevise && { opacity: 0.38 }]}
                        onPress={() => {
                          if (!canRevise) return;
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate('RevisionRequest', { mission: liveMission, freelancer });
                        }}
                        activeOpacity={canRevise ? 0.78 : 1}
                      >
                        <View style={styles.revisionActionIcon}>
                          <Ionicons name="refresh-outline" size={18} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.revisionActionTitle}>Demander une retouche</Text>
                          <Text style={styles.revisionActionSub}>
                            {canRevise ? `Gratuit · ${revCount}/1 utilisée` : '1/1 retouche utilisée'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#F59E0B60" />
                      </TouchableOpacity>

                      {/* Divider */}
                      <View style={styles.validationDivider} />

                      {/* Valider — CTA principal */}
                      <TouchableOpacity
                        style={styles.validateMainBtn}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          navigation.navigate('Delivery', { mission: liveMission, freelancer });
                        }}
                        activeOpacity={0.88}
                      >
                        <LinearGradient
                          colors={['#22C55E', '#16A34A']}
                          style={StyleSheet.absoluteFill}
                          borderRadius={RADIUS.xl}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        />
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.validateMainBtnText}>Valider la livraison</Text>
                          <Text style={styles.validateMainBtnSub}>Libère le paiement de {liveMission?.budget ?? 45}€</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>

                    </View>
                  )}

                  {/* ── Validé : confirmation ── */}
                  {isValidated && (
                    <View style={styles.validatedConfirm}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#22C55E" />
                      <Text style={styles.validatedConfirmText}>
                        {liveMission?.budget ?? 45}€ libérés · Mission clôturée
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* ── Chat ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Messages</Text>
              <View style={styles.chatMessages}>
                {messages.map(msg => {
                  // Carte livraison maintenant affichée hors chat
                  if (msg.type === 'delivery') return null;
                  // ── Bulles normales ──
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.bubble,
                        msg.from === 'client'    && styles.bubbleClient,
                        msg.from === 'system'    && styles.bubbleSystem,
                        msg.from === 'freelance' && styles.bubbleFreelance,
                      ]}
                    >
                      {msg.from === 'system' ? (
                        <View style={styles.systemMsg}>
                          <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                          <Text style={styles.systemText}>{msg.text}</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={[styles.bubbleText, msg.from === 'client' && { color: '#fff' }]}>
                            {msg.text}
                          </Text>
                          <Text style={[styles.bubbleTs, msg.from === 'client' && { color: 'rgba(255,255,255,0.6)' }]}>
                            {msg.ts}
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Envoyer un message…"
                  placeholderTextColor={COLORS.textLight}
                  selectionColor={COLORS.primary}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: COLORS.primary }]}
                  onPress={sendMessage}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Retouche payante (visible quand livré) ── */}
            {liveMission?.status === 'livre' && (
              <View style={[styles.card, { borderColor: COLORS.primary + '30', gap: 0 }]}>
                <LinearGradient
                  colors={[COLORS.primary + '0A', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={RADIUS.xl}
                />
                <View style={styles.paidRevRow}>
                  <View style={[styles.paidRevIcon, { backgroundColor: COLORS.primary + '18' }]}>
                    <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paidRevTitle}>Retouche supplémentaire</Text>
                    <Text style={styles.paidRevSub}>
                      1 révision gratuite incluse · Au-delà : 5€/retouche
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.paidRevBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      navigation.navigate('RevisionRequest', { mission: liveMission, freelancer, isPaid: true });
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={14} color="#fff" />
                    <Text style={styles.paidRevBtnText}>Retouche</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 24 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarCenter:{ alignItems: 'center', gap: 4 },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3 },
  liveText:  { fontSize: 10, fontWeight: '700' },
  disputeBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm, gap: SPACING.sm,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' },

  // Timeline
  timeline: { gap: 0 },
  trackRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  trackLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  trackDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
  },
  trackDotInner: { width: 6, height: 6, borderRadius: 3 },
  trackLine:     { width: 1.5, flex: 1, minHeight: 28, backgroundColor: COLORS.border, marginVertical: 3 },
  trackContent:  { flex: 1, paddingBottom: 20, opacity: 0.4 },
  trackLabel:    { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  trackSub:      { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Freelance
  freelanceRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox:       { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontSize: 16, fontWeight: '800' },
  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  freelanceName:   { fontSize: 15, fontWeight: '800', color: COLORS.text },
  verifiedPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#22C55E0E', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  verifiedText:    { fontSize: 10, fontWeight: '700', color: '#22C55E' },
  freelanceSpec:   { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText:      { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  flashBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#22C55E0E', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  flashText:       { fontSize: 10, fontWeight: '700', color: '#22C55E' },

  // Info cards
  infoRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  infoCard: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center', gap: 4, overflow: 'hidden',
  },
  infoCardNum:   { fontSize: 18, fontWeight: '900' },
  infoCardLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Chat
  chatMessages: { gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: RADIUS.lg, padding: 10 },
  bubbleClient: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleFreelance: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardElevated,
    borderBottomLeftRadius: 4,
  },
  bubbleSystem: { alignSelf: 'center' },
  systemMsg: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22C55E0C', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  systemText:{ fontSize: 11, fontWeight: '600', color: '#22C55E' },
  bubbleText:{ fontSize: 13, color: COLORS.text, lineHeight: 18 },
  bubbleTs:  { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },

  chatInputRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.xs },
  chatInput: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 13, color: COLORS.text,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  // Validation héro
  validationHero: {
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  validationStatusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: SPACING.md,
  },
  validationIconBig: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  validationTitle: { fontSize: 15, fontWeight: '800' },
  validationSub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
  validationCheckCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },

  validationFileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#3B82F625',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  validationFileBtnIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#3B82F618', alignItems: 'center', justifyContent: 'center',
  },
  validationFileBtnText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  validationMsgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  validationMsgText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17, fontStyle: 'italic' },

  validationActions: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', ...SHADOW.sm,
  },
  validationActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  revisionActionBtn:   { backgroundColor: '#F59E0B08' },
  revisionActionIcon:  {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F59E0B15', alignItems: 'center', justifyContent: 'center',
  },
  revisionActionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  revisionActionSub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  validationDivider:   { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  validateMainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 16,
    overflow: 'hidden', position: 'relative',
  },
  validateMainBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  validateMainBtnSub:  { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  validatedConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: '#22C55E0C', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#22C55E25', paddingVertical: 12,
  },
  validatedConfirmText: { fontSize: 13, fontWeight: '700', color: '#22C55E' },

  // Retouche payante
  paidRevRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md },
  paidRevIcon: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  paidRevTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  paidRevSub:   { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },
  paidRevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  paidRevBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
