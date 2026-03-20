/**
 * MissionBriefScreen.js — Brief mission côté FREELANCE
 * Affiche le contexte IA, objectif, deadline → CTA "Livrer"
 * Params : { mission }
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, TextInput,
  TouchableWithoutFeedback, Dimensions, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { CreatorProfileSheet } from '../../components/ui/CreatorCard';
import DeliverySheet from '../../components/ui/DeliverySheet';
import { useMissions }       from '../../lib/MissionsContext';
import { useConversations }  from '../../lib/ConversationsContext';

const { height: SCREEN_H } = Dimensions.get('window');

const DEFAULT_MISSION = {
  type: 'Hook',
  icon: 'timer-outline',
  color: '#EF4444',
  title: 'Refonte du hook TikTok lifestyle',
  clientName: 'Léa M.',
  budget: 45,
  deadline: '24h',
  revisions: 2,
  description: 'La créatrice perd l\'attention de ses viewers dans les 2 premières secondes. Elle a besoin d\'un hook percutant qui accroche dès la première image.',
  problem: 'Tu perds l\'attention dès les 2 premières secondes',
  objective: 'Créer un hook de 2–3 secondes maximum qui génère de la curiosité immédiate et incite à regarder la suite.',
  dos: ['Commencer par une question provocante', 'Montrer le résultat avant de montrer le processus', 'Utiliser des transitions rapides'],
  donts: ['Intro musicale longue', 'Texte statique sans mouvement', 'Commencer par "Bonjour"'],
  creator: {
    name: 'Léa Marchand', username: '@leamarchand', initials: 'LM',
    platform: 'TikTok',
    followers: '48K', avgViews: '12K', engagement: '6.2%', postFreq: '5/sem',
    niche: 'Lifestyle & Routine', style: 'Authentique, lumineux, chill',
    tags: ['Lifestyle', 'Routine', 'Bien-être'],
    objective: 'Atteindre 100K abonnés en 3 mois via du contenu quotidien engageant sur sa routine morning.',
    dos: ['Tonalité bienveillante', 'Plans rapprochés naturels', 'Musique chill ou trending'],
    donts: ['Trop de texte à l\'écran', 'Intro longue', 'Voix off'],
    collab: 0,
  },
};

function CheckItem({ text, positive }) {
  return (
    <View style={styles.checkItem}>
      <View style={[styles.checkDot, { backgroundColor: positive ? '#22C55E20' : '#EF444420' }]}>
        <Ionicons name={positive ? 'checkmark' : 'close'} size={11} color={positive ? '#22C55E' : '#EF4444'} />
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

export default function MissionBriefScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { updateStatus, acceptedMissions } = useMissions();

  const mission = route.params?.mission ?? DEFAULT_MISSION;
  // Profil acheteur toujours disponible — fallback si creator absent
  const effectiveCreator = mission.creator ?? {
    name: mission.clientName ?? 'Client',
    username: '',
    initials: mission.clientInitials ?? (mission.clientName?.charAt(0) ?? '?'),
    platform: 'TikTok',
    niche: mission.type ?? '',
    style: '',
    tags: [],
    objective: mission.objective ?? '',
    dos: mission.dos ?? [],
    donts: mission.donts ?? [],
    collab: 0,
  };
  const [accepted,           setAccepted]           = useState(() => acceptedMissions.some(m => m.id === mission.id));
  const [showDeliverySheet,  setShowDeliverySheet]  = useState(false);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [showMessageSheet,   setShowMessageSheet]   = useState(false);
  const [messageText,        setMessageText]        = useState('');
  const [messageSent,        setMessageSent]        = useState(false);
  const { initConversation, pushMessage } = useConversations();

  const msgSlide = useRef(new Animated.Value(SCREEN_H)).current;
  const msgBg    = useRef(new Animated.Value(0)).current;

  function openMessage() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMessageSheet(true);
    Animated.parallel([
      Animated.spring(msgSlide, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      Animated.timing(msgBg,    { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function closeMessage() {
    setMessageSent(false);
    Animated.parallel([
      Animated.timing(msgSlide, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }),
      Animated.timing(msgBg,    { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowMessageSheet(false));
  }

  function sendMessage() {
    if (!messageText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Enregistrer dans le contexte global de conversations
    initConversation(mission.id, {
      name:     mission.clientName     ?? 'Client',
      initials: mission.clientInitials ?? mission.clientName?.charAt(0) ?? '?',
      color:    mission.color          ?? COLORS.primary,
      type:     mission.type           ?? 'Mission',
      title:    mission.title          ?? 'Mission',
      budget:   mission.budget         ?? 0,
    }, []);
    pushMessage(mission.id, {
      id: Date.now(), from: 'me', text: messageText.trim(), ts: 'À l\'instant',
    });
    setMessageText('');
    setMessageSent(true);
  }

  function closeMessageSheet() {
    setMessageSent(false);
    Animated.parallel([
      Animated.timing(msgSlide, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }),
      Animated.timing(msgBg,    { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowMessageSheet(false));
  }

  const elapsed   = 0;
  const deadlineH = parseInt(mission.deadline, 10) || 24;
  const remaining = Math.max(0, deadlineH - elapsed);

  function handleAccept() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAccepted(true);
  }

  function handleDeliver() {
    setShowDeliverySheet(true);
  }

  function handleConfirmDelivery(url, message) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mission?.id) {
      updateStatus(mission.id, 'livre', {
        deliveryUrl:     url,
        deliveryMessage: message,
        deliveredAt:     new Date().toISOString(),
        revisionCount:   mission.revisionCount ?? 0,
      });
    }
    setShowDeliverySheet(false);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
      </View>

      {/* ── Sheet livraison ── */}
      <DeliverySheet
        visible={showDeliverySheet}
        onClose={() => setShowDeliverySheet(false)}
        onDeliver={handleConfirmDelivery}
        missionColor={mission.color}
        revisionCount={mission.revisionCount ?? 0}
        maxRevisions={mission.revisions ?? 2}
      />

      {/* ── Profil créateur ── */}
      <CreatorProfileSheet
        visible={showCreatorProfile}
        creator={effectiveCreator}
        accentColor={mission.color}
        onClose={() => setShowCreatorProfile(false)}
        onChat={() => { setShowCreatorProfile(false); setTimeout(() => navigation.navigate('Messagerie', { missionId: mission.id }), 320); }}
      />

      {/* ── Sheet message ── */}
      <Modal transparent visible={showMessageSheet} animationType="none" onRequestClose={closeMessage}>
        <Animated.View style={[styles.msgOverlay, { opacity: msgBg }]}>
          <TouchableWithoutFeedback onPress={closeMessage}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={[styles.msgSheet, { transform: [{ translateY: msgSlide }] }]}>
            <View style={styles.msgDragHandle} />

            {messageSent ? (
              /* ── État confirmé ── */
              <View style={styles.msgSentState}>
                <View style={[styles.msgSentIcon, { backgroundColor: '#22C55E18' }]}>
                  <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                </View>
                <Text style={styles.msgSentTitle}>Message envoyé !</Text>
                <Text style={styles.msgSentSub}>
                  Votre message est maintenant visible dans la conversation.
                </Text>
                <View style={styles.msgSentActions}>
                  <TouchableOpacity
                    style={styles.msgSentPrimary}
                    onPress={() => { closeMessage(); navigation.navigate('Messagerie', { missionId: mission.id }); }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, '#5B21B6']}
                      style={styles.msgSentPrimaryGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
                      <Text style={styles.msgSentPrimaryText}>Voir la conversation</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.msgSentSecondary} onPress={closeMessage} activeOpacity={0.7}>
                    <Text style={styles.msgSentSecondaryText}>Retour à la mission</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ── Rédaction ── */
              <>
                <View style={styles.msgHeader}>
                  <View style={styles.msgHeaderLeft}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={mission.color} />
                    <Text style={styles.msgTitle}>Message à {mission.clientName}</Text>
                  </View>
                  <TouchableOpacity onPress={closeMessage} activeOpacity={0.7}>
                    <Ionicons name="close" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.msgInput}
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Écrivez votre message au client..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={500}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.msgSendBtn, { opacity: messageText.trim() ? 1 : 0.45 }]}
                  onPress={sendMessage}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#5B21B6']}
                    style={styles.msgSendGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.msgSendText}>Envoyer le message</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Brief mission</Text>
          <TouchableOpacity onPress={openMessage} style={styles.chatIconBtn} activeOpacity={0.75}>
            <View style={[styles.chatIconWrap, { backgroundColor: mission.color, borderColor: mission.color }]}>
              <Ionicons name="chatbubble" size={15} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Profil acheteur compact ── */}
          <TouchableOpacity
            style={[styles.clientChipRow, { borderColor: mission.color + '35' }]}
            onPress={() => setShowCreatorProfile(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.clientChipAvatar, { backgroundColor: mission.color + '20' }]}>
              <Text style={[styles.clientChipInitials, { color: mission.color }]}>
                {effectiveCreator.initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientChipName}>{effectiveCreator.name}</Text>
              <Text style={styles.clientChipSub} numberOfLines={1}>
                {effectiveCreator.platform}{effectiveCreator.niche ? ` · ${effectiveCreator.niche}` : ''}
              </Text>
            </View>
            <View style={[styles.clientChipCta, { borderColor: mission.color + '40', backgroundColor: mission.color + '0D' }]}>
              <Text style={[styles.clientChipCtaText, { color: mission.color }]}>Profil</Text>
              <Ionicons name="chevron-forward" size={11} color={mission.color} />
            </View>
          </TouchableOpacity>

          {/* ── Header mission ── */}
          <View style={[styles.card, { borderColor: mission.color + '35' }]}>
            <LinearGradient colors={[mission.color + '18', mission.color + '05']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
            <View style={styles.missionTop}>
              <View style={[styles.missionIcon, { backgroundColor: mission.color + '22', borderColor: mission.color + '45' }]}>
                <Ionicons name={mission.icon} size={22} color={mission.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.missionType, { color: mission.color }]}>{mission.type}</Text>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <TouchableOpacity
                  onPress={() => setShowCreatorProfile(true)}
                  style={styles.clientRow}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-circle-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.missionClient}>{mission.clientName}</Text>
                  <Ionicons name="chevron-forward" size={11} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={[styles.budgetBadge, { backgroundColor: '#22C55E18', borderColor: '#22C55E35' }]}>
                <Text style={styles.budgetText}>{mission.budget}€</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="alarm-outline" size={12} color="#F59E0B" />
                <Text style={[styles.metaText, { color: '#F59E0B' }]}>{remaining}h restantes</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="refresh-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{mission.revisions} révisions max</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="lock-closed-outline" size={12} color="#22C55E" />
                <Text style={[styles.metaText, { color: '#22C55E' }]}>Paiement garanti</Text>
              </View>
            </View>
          </View>

          {/* ── Problème détecté ── */}
          <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>PROBLÈME DÉTECTÉ PAR L'IA</Text></View>
          <View style={[styles.card, { backgroundColor: '#EF44440A', borderColor: '#EF444430' }]}>
            <View style={styles.problemRow}>
              <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
              <Text style={styles.problemText}>{mission.problem}</Text>
            </View>
          </View>

          {/* ── Objectif ── */}
          <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>OBJECTIF ATTENDU</Text></View>
          <View style={styles.card}>
            <View style={styles.objectiveRow}>
              <Ionicons name="trophy-outline" size={16} color={COLORS.prestataire} />
              <Text style={styles.objectiveText}>{mission.objective}</Text>
            </View>
          </View>

          {/* ── Brief détaillé ── */}
          <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>BRIEF COMPLET</Text></View>
          <View style={styles.card}>
            <Text style={styles.briefText}>{mission.description}</Text>
          </View>

          {/* ── À faire / À éviter ── */}
          <View style={styles.twoCol}>
            <View style={[styles.card, { flex: 1, backgroundColor: '#22C55E08', borderColor: '#22C55E25' }]}>
              <View style={styles.doHeader}>
                <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
                <Text style={styles.doTitle}>À faire</Text>
              </View>
              {mission.dos?.map((d, i) => <CheckItem key={i} text={d} positive />)}
            </View>
            <View style={[styles.card, { flex: 1, backgroundColor: '#EF44440A', borderColor: '#EF444428' }]}>
              <View style={styles.doHeader}>
                <Ionicons name="close-circle" size={13} color="#EF4444" />
                <Text style={styles.dontTitle}>À éviter</Text>
              </View>
              {mission.donts?.map((d, i) => <CheckItem key={i} text={d} positive={false} />)}
            </View>
          </View>

          {/* ── Note escrow ── */}
          <View style={[styles.escrowNote, { borderColor: '#22C55E25', backgroundColor: '#22C55E08' }]}>
            <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.escrowTitle}>Paiement garanti</Text>
              <Text style={styles.escrowSub}>
                {mission.budget}€ est sécurisé chez Swiple. Tu seras payé dès validation du client.
              </Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── CTA sticky ── */}
        <View style={styles.ctaWrapper}>
          {!accepted ? (
            <TouchableOpacity onPress={handleAccept} activeOpacity={0.88} style={styles.ctaBtn}>
              <LinearGradient
                colors={[COLORS.prestataire, '#059669']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.ctaText}>Accepter la mission</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleDeliver} activeOpacity={0.88} style={styles.ctaBtn}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.ctaText}>Livrer la mission</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <Text style={styles.ctaSub}>
            {accepted ? 'Paiement libéré à la validation client' : 'Démarre dès que tu acceptes la mission'}
          </Text>
        </View>
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
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatIconBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatIconWrap: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.md, overflow: 'hidden', ...SHADOW.sm,
  },
  sectionLabel:     { marginTop: SPACING.md, marginBottom: 8 },
  sectionLabelText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8 },

  missionTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: SPACING.sm },
  missionIcon:  { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  missionType:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  missionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  clientRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  missionClient:{ fontSize: 11, color: COLORS.textMuted },
  budgetBadge:  { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  budgetText:   { fontSize: 15, fontWeight: '900', color: '#22C55E' },

  metaRow:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 5 },
  metaText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  problemRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  problemText:  { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '600', lineHeight: 19 },
  objectiveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  objectiveText:{ flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  briefText:    { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },

  twoCol: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  doHeader:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  doTitle:   { fontSize: 12, fontWeight: '800', color: '#22C55E' },
  dontTitle: { fontSize: 12, fontWeight: '800', color: '#EF4444' },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 6 },
  checkDot:  { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkText: { flex: 1, fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },

  // Compact client profile chip
  clientChipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1,
    borderRadius: RADIUS.xl, padding: 10,
    marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  clientChipAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  clientChipInitials: { fontSize: 14, fontWeight: '800' },
  clientChipName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  clientChipSub:  { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  clientChipCta: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  clientChipCtaText: { fontSize: 11, fontWeight: '700' },

  escrowNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  escrowTitle:{ fontSize: 13, fontWeight: '700', color: '#22C55E', marginBottom: 3 },
  escrowSub:  { fontSize: 11, color: '#22C55E99', lineHeight: 16 },

  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'E8', paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  ctaBtn:      { borderRadius: RADIUS.xl, marginBottom: 8, ...SHADOW.md },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: RADIUS.xl, overflow: 'hidden' },
  ctaText:     { fontSize: 16, fontWeight: '900', color: '#fff' },
  ctaSub:      { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },

  // Message sheet
  msgOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000080' },
  msgSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, paddingBottom: SPACING.xl + 8,
  },
  msgDragHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: SPACING.md,
  },
  msgHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md,
  },
  msgHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgTitle:      { fontSize: 15, fontWeight: '700', color: COLORS.text },
  msgInput: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.text,
    fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: SPACING.md,
  },
  msgSendBtn:  { borderRadius: RADIUS.xl, overflow: 'hidden' },
  msgSendGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  msgSendText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Success state
  msgSentState:       { alignItems: 'center', paddingVertical: 8, gap: 10 },
  msgSentIcon:        { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  msgSentTitle:       { fontSize: 17, fontWeight: '800', color: COLORS.text },
  msgSentSub:         { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: SPACING.md },
  msgSentActions:     { width: '100%', gap: 8, marginTop: 4 },
  msgSentPrimary:     { borderRadius: RADIUS.xl, overflow: 'hidden' },
  msgSentPrimaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  msgSentPrimaryText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  msgSentSecondary:   { alignItems: 'center', paddingVertical: 10 },
  msgSentSecondaryText:{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
});
