/**
 * MissionBriefScreen.js — Brief mission côté FREELANCE
 * Affiche le contexte client, brief complet, livrables attendus → CTA Accepter / Livrer
 * Params : { mission }
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, TouchableWithoutFeedback,
  Dimensions, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground    from '../../components/ui/BubbleBackground';
import { CreatorProfileSheet } from '../../components/ui/CreatorCard';
import DeliverySheet       from '../../components/ui/DeliverySheet';
import { useMissions }     from '../../lib/MissionsContext';
import { useConversations } from '../../lib/ConversationsContext';
import { useSession }      from '../../lib/SessionContext';
import { supabase }        from '../../lib/supabase';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Conseils par type de mission (sans IA) ───────────────────────────────────
const TIPS_BY_TYPE = {
  'Script seul': {
    dos:   ['Hook fort dans les 3 premières secondes', 'Structure : accroche → valeur → CTA', 'Adapter le ton au persona du client'],
    donts: ['Introduction trop longue', 'Langage trop formel ou générique', 'Oublier le call-to-action'],
  },
  'Script': {
    dos:   ['Hook percutant dès la première ligne', 'Phrases courtes, rythme rapide', 'CTA clair et naturel en fin de script'],
    donts: ['Commencer par "Bonjour je suis…"', 'Trop de détails dans l\'accroche', 'Négliger la ponctuation pour la diction'],
  },
  'Montage': {
    dos:   ['Coupes dynamiques sur les temps forts', 'Sous-titres clairs et bien lisibles', 'Musique trending adaptée au contenu'],
    donts: ['Transitions trop lentes', 'Audio de mauvaise qualité', 'Plan d\'intro statique > 2 secondes'],
  },
  'Script + Montage': {
    dos:   ['Script calé sur le format court', 'Montage rythmé sur le texte', 'Visuels cohérents avec le branding'],
    donts: ['Trop de texte simultané à l\'écran', 'Musique qui couvre la voix off', 'Durée > 60s sans justification'],
  },
  'Pack mensuel': {
    dos:   ['Cohérence éditoriale sur tous les scripts', 'Varier les formats pour maintenir l\'intérêt', 'Livrer avec un calendrier suggéré'],
    donts: ['Scripts trop similaires entre eux', 'Ignorer le tone of voice du client', 'Livrer en vrac sans organisation'],
  },
  'UGC': {
    dos:   ['Authenticité avant tout — ton naturel', 'Montrer le produit en action rapidement', 'Inclure une vraie réaction ou opinion'],
    donts: ['Paraître trop "publicitaire"', 'Texte lu de façon trop mécanique', 'Ignorer les contraintes de durée'],
  },
};
const DEFAULT_TIPS = {
  dos:   ['Respecter le ton et le style du client', 'Proposer des alternatives si besoin', 'Livrer avant la deadline'],
  donts: ['Ignorer les instructions du brief', 'Livrer sans relecture', 'Communiquer uniquement à la livraison'],
};

// ─── Statuts de la timeline freelancer ───────────────────────────────────────
const TIMELINE = [
  { key: 'en_cours', label: 'En cours',  icon: 'construct-outline'    },
  { key: 'livre',    label: 'Livré',     icon: 'cloud-upload-outline' },
  { key: 'valide',   label: 'Validé',    icon: 'checkmark-circle'     },
];

// ─── Sous-composants ──────────────────────────────────────────────────────────
function CheckItem({ text, positive }) {
  return (
    <View style={styles.checkItem}>
      <View style={[styles.checkDot, { backgroundColor: positive ? '#22C55E18' : '#EF444418' }]}>
        <Ionicons name={positive ? 'checkmark' : 'close'} size={11} color={positive ? '#22C55E' : '#EF4444'} />
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, color }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIconBox, { backgroundColor: (color ?? COLORS.primary) + '18' }]}>
        <Ionicons name={icon} size={13} color={color ?? COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function MissionBriefScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { updateStatus, acceptedMissions } = useMissions();
  const session    = useSession();
  const userId     = session?.user?.id ?? null;
  const userMeta   = session?.user?.user_metadata ?? {};
  const senderName     = userMeta.nom ?? userMeta.full_name ?? 'Ghostwriter';
  const senderInitials = senderName.charAt(0).toUpperCase();

  const {
    initConversation,
    sendMessage: ctxSendMessage,
    subscribeToConversation,
    loadConversation,
  } = useConversations();

  const mission = route.params?.mission ?? {};
  const mColor  = mission.color ?? COLORS.prestataire;

  // Profil créateur
  const effectiveCreator = mission.creator ?? {
    name:     mission.clientName     ?? 'Client',
    username: '',
    initials: mission.clientInitials ?? (mission.clientName?.charAt(0) ?? '?'),
    platform: 'TikTok',
    niche:    mission.type ?? '',
    style:    '',
    tags:     [],
    objective: mission.objective ?? '',
    dos:   mission.dos   ?? [],
    donts: mission.donts ?? [],
    collab: 0,
  };

  // Conseils : priorité données mission > defaults par type > fallback
  const tips = TIPS_BY_TYPE[mission.type] ?? DEFAULT_TIPS;
  const dosList   = (mission.dos?.length   > 0) ? mission.dos   : tips.dos;
  const dontsList = (mission.donts?.length > 0) ? mission.donts : tips.donts;

  // ── État ──────────────────────────────────────────────────────────────────
  const [accepted,           setAccepted]           = useState(() => acceptedMissions.some(m => m.id === mission.id));
  const [showDeliverySheet,  setShowDeliverySheet]  = useState(false);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [showMessageSheet,   setShowMessageSheet]   = useState(false);
  const [messageText,        setMessageText]        = useState('');
  const [messageSent,        setMessageSent]        = useState(false);
  const [briefDetails,       setBriefDetails]       = useState(null);

  // ── Fetch brief depuis Supabase si brief_id disponible ──────────────────
  useEffect(() => {
    if (!mission.brief_id) return;
    supabase
      .from('briefs')
      .select('description, subject, tone, platform, audience, posts_per_month, activity')
      .eq('id', mission.brief_id)
      .single()
      .then(({ data }) => { if (data) setBriefDetails(data); });
  }, [mission.brief_id]);

  // Données combinées : DB > params > vide
  const description   = briefDetails?.description ?? mission.description ?? null;
  const subject       = briefDetails?.subject     ?? mission.subject      ?? null;
  const tone          = briefDetails?.tone        ?? mission.tone         ?? null;
  const platform      = briefDetails?.platform    ?? mission.platform     ?? 'TikTok';
  const audience      = briefDetails?.audience    ?? mission.audience     ?? null;
  const postsPerMonth = briefDetails?.posts_per_month ?? mission.postsPerMonth ?? null;
  const activity      = briefDetails?.activity    ?? mission.activity     ?? null;

  // Deadline en heures restantes
  const deadlineH = parseInt(mission.deadline, 10) || 24;

  // ── Message sheet ─────────────────────────────────────────────────────────
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
    const convMeta = {
      name:     mission.clientName     ?? 'Client',
      initials: mission.clientInitials ?? mission.clientName?.charAt(0) ?? '?',
      color:    mColor,
      type:     mission.type  ?? 'Mission',
      title:    mission.title ?? 'Mission',
      budget:   mission.budget ?? 0,
    };
    initConversation(mission.id, convMeta, []);
    ctxSendMessage(mission.id, messageText.trim(), { userId: userId ?? 'anonymous', name: senderName, initials: senderInitials });
    if (userId) {
      loadConversation(mission.id, convMeta, userId);
      subscribeToConversation(mission.id, userId);
    }
    setMessageText('');
    setMessageSent(true);
  }

  // ── Accepter / Livrer ─────────────────────────────────────────────────────
  function handleAccept() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAccepted(true);
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

  // ── Statut courant dans la timeline ──────────────────────────────────────
  const currentStatus = acceptedMissions.find(m => m.id === mission.id)?.status ?? mission.status ?? 'en_cours';
  const stepIndex     = TIMELINE.findIndex(s => s.key === currentStatus);
  const isDelivered   = currentStatus === 'livre' || currentStatus === 'valide';

  // ─────────────────────────────────────────────────────────────────────────
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
        missionColor={mColor}
        revisionCount={mission.revisionCount ?? 0}
        maxRevisions={mission.revisions ?? 2}
      />

      {/* ── Profil créateur ── */}
      <CreatorProfileSheet
        visible={showCreatorProfile}
        creator={effectiveCreator}
        accentColor={mColor}
        onClose={() => setShowCreatorProfile(false)}
        onChat={() => {
          setShowCreatorProfile(false);
          setTimeout(() => navigation.navigate('Messagerie', { missionId: mission.id }), 320);
        }}
      />

      {/* ── Sheet message ── */}
      <Modal transparent visible={showMessageSheet} animationType="none" onRequestClose={closeMessage}>
        <Animated.View style={[styles.msgOverlay, { opacity: msgBg }]}>
          <TouchableWithoutFeedback onPress={closeMessage}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[styles.msgSheet, { transform: [{ translateY: msgSlide }] }]}>
            <View style={styles.msgDragHandle} />
            {messageSent ? (
              <View style={styles.msgSentState}>
                <View style={[styles.msgSentIcon, { backgroundColor: '#22C55E18' }]}>
                  <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                </View>
                <Text style={styles.msgSentTitle}>Message envoyé !</Text>
                <Text style={styles.msgSentSub}>Le client verra votre message dans la messagerie.</Text>
                <View style={styles.msgSentActions}>
                  <TouchableOpacity
                    style={styles.msgSentPrimary}
                    onPress={() => { closeMessage(); navigation.navigate('Messagerie', { missionId: mission.id }); }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={[COLORS.primary, '#5B21B6']} style={styles.msgSentPrimaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
              <>
                <View style={styles.msgHeader}>
                  <View style={styles.msgHeaderLeft}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={mColor} />
                    <Text style={styles.msgTitle}>Message à {mission.clientName ?? 'le client'}</Text>
                  </View>
                  <TouchableOpacity onPress={closeMessage} activeOpacity={0.7}>
                    <Ionicons name="close" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.msgInput}
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Posez une question ou donnez des précisions..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline maxLength={500} autoFocus
                />
                <TouchableOpacity
                  style={[styles.msgSendBtn, { opacity: messageText.trim() ? 1 : 0.45 }]}
                  onPress={sendMessage}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[COLORS.primary, '#5B21B6']} style={styles.msgSendGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.msgSendText}>Envoyer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Contenu principal ── */}
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Détail de la mission</Text>
          <TouchableOpacity onPress={openMessage} style={styles.chatIconBtn} activeOpacity={0.75}>
            <View style={[styles.chatIconWrap, { backgroundColor: mColor }]}>
              <Ionicons name="chatbubble" size={15} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Client chip ── */}
          <TouchableOpacity
            style={[styles.clientChip, { borderColor: mColor + '35' }]}
            onPress={() => setShowCreatorProfile(true)}
            activeOpacity={0.78}
          >
            <View style={[styles.clientAvatar, { backgroundColor: mColor + '20' }]}>
              <Text style={[styles.clientInitials, { color: mColor }]}>{effectiveCreator.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{effectiveCreator.name}</Text>
              <Text style={styles.clientSub} numberOfLines={1}>
                {platform}{effectiveCreator.niche ? ` · ${effectiveCreator.niche}` : ''}
                {activity ? ` · ${activity}` : ''}
              </Text>
            </View>
            <View style={[styles.profileCta, { borderColor: mColor + '40', backgroundColor: mColor + '0D' }]}>
              <Text style={[styles.profileCtaText, { color: mColor }]}>Voir le profil</Text>
              <Ionicons name="chevron-forward" size={11} color={mColor} />
            </View>
          </TouchableOpacity>

          {/* ── Carte mission ── */}
          <View style={[styles.card, { borderColor: mColor + '35' }]}>
            <LinearGradient colors={[mColor + '15', mColor + '03']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.xl} />
            <View style={styles.missionTop}>
              <View style={[styles.missionIconBox, { backgroundColor: mColor + '20', borderColor: mColor + '40' }]}>
                <Ionicons name={mission.icon ?? 'document-text-outline'} size={22} color={mColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.missionType, { color: mColor }]}>{(mission.type ?? 'Mission').toUpperCase()}</Text>
                <Text style={styles.missionTitle}>{mission.title ?? mission.type ?? 'Mission'}</Text>
                <TouchableOpacity onPress={() => setShowCreatorProfile(true)} style={styles.clientRow} activeOpacity={0.7}>
                  <Ionicons name="person-circle-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.missionClient}>{mission.clientName ?? 'Client'}</Text>
                  <Ionicons name="chevron-forward" size={11} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.budgetBadge}>
                <Text style={styles.budgetText}>{mission.budget ?? '—'}€</Text>
              </View>
            </View>

            {/* Chips infos */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="alarm-outline" size={12} color="#F59E0B" />
                <Text style={[styles.metaText, { color: '#F59E0B' }]}>{deadlineH}h de délai</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="refresh-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{mission.revisions ?? 2} révisions</Text>
              </View>
              {postsPerMonth && (
                <View style={styles.metaChip}>
                  <Ionicons name="layers-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{postsPerMonth} posts/mois</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Timeline statut ── */}
          <View style={styles.timeline}>
            {TIMELINE.map((step, i) => {
              const isDone    = i < (stepIndex >= 0 ? stepIndex : 0);
              const isCurrent = step.key === currentStatus || (stepIndex === -1 && i === 0);
              return (
                <React.Fragment key={step.key}>
                  <View style={styles.timelineStep}>
                    <View style={[
                      styles.timelineDot,
                      isCurrent && { backgroundColor: mColor, borderColor: mColor },
                      isDone     && { backgroundColor: '#22C55E', borderColor: '#22C55E' },
                    ]}>
                      <Ionicons
                        name={isDone ? 'checkmark' : step.icon}
                        size={11}
                        color={isCurrent || isDone ? '#fff' : COLORS.textMuted}
                      />
                    </View>
                    <Text style={[
                      styles.timelineLabel,
                      isCurrent && { color: mColor, fontWeight: '700' },
                      isDone     && { color: '#22C55E', fontWeight: '700' },
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                  {i < TIMELINE.length - 1 && (
                    <View style={[styles.timelineLine, isDone && { backgroundColor: '#22C55E' }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* ── Brief client ── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Brief client</Text>
          </View>
          <View style={styles.card}>
            {description ? (
              <Text style={styles.briefText}>{description}</Text>
            ) : subject ? (
              <Text style={styles.briefText}>{subject}</Text>
            ) : (
              <Text style={styles.emptyText}>Pas de description fournie — contactez le client pour plus de détails.</Text>
            )}
          </View>

          {/* ── Détails de la mission ── */}
          {(platform || tone || audience || activity) && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="options-outline" size={14} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Détails</Text>
              </View>
              <View style={styles.card}>
                <DetailRow icon="phone-portrait-outline" label="Plateforme"   value={platform}  color="#3B82F6" />
                <DetailRow icon="people-outline"         label="Audience"     value={audience}  color="#8B5CF6" />
                <DetailRow icon="mic-outline"            label="Ton / Style"  value={tone}      color="#F59E0B" />
                <DetailRow icon="briefcase-outline"      label="Secteur"      value={activity}  color="#10B981" />
                {postsPerMonth && (
                  <DetailRow icon="calendar-outline" label="Fréquence" value={`${postsPerMonth} posts / mois`} color="#EC4899" />
                )}
              </View>
            </>
          )}

          {/* ── À faire / À éviter ── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done-outline" size={14} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Bonnes pratiques</Text>
          </View>
          <View style={styles.twoCol}>
            <View style={[styles.card, { flex: 1, backgroundColor: '#22C55E08', borderColor: '#22C55E25' }]}>
              <View style={styles.doHeader}>
                <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
                <Text style={styles.doTitle}>À faire</Text>
              </View>
              {dosList.map((d, i) => <CheckItem key={i} text={d} positive />)}
            </View>
            <View style={[styles.card, { flex: 1, backgroundColor: '#EF44440A', borderColor: '#EF444425' }]}>
              <View style={styles.doHeader}>
                <Ionicons name="close-circle" size={13} color="#EF4444" />
                <Text style={styles.dontTitle}>À éviter</Text>
              </View>
              {dontsList.map((d, i) => <CheckItem key={i} text={d} positive={false} />)}
            </View>
          </View>

          {/* ── Note paiement ── */}
          <View style={[styles.paymentNote, { borderColor: '#F59E0B25', backgroundColor: '#F59E0B08' }]}>
            <Ionicons name="card-outline" size={16} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentNoteTitle}>Paiement à la validation</Text>
              <Text style={styles.paymentNoteSub}>
                {mission.budget ?? '—'}€ réglés par le client à la validation de votre livraison.
              </Text>
            </View>
          </View>

          <View style={{ height: 130 }} />
        </ScrollView>

        {/* ── CTA sticky ── */}
        <View style={styles.ctaWrapper}>
          {isDelivered ? (
            /* Mission déjà livrée */
            <View style={[styles.deliveredBanner, { borderColor: mColor + '40', backgroundColor: mColor + '0E' }]}>
              <Ionicons name="cloud-done-outline" size={20} color={mColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deliveredTitle, { color: mColor }]}>
                  {currentStatus === 'valide' ? 'Mission validée ✓' : 'Livraison envoyée'}
                </Text>
                <Text style={styles.deliveredSub}>
                  {currentStatus === 'valide' ? 'Le client a validé votre travail.' : 'En attente de validation du client.'}
                </Text>
              </View>
            </View>
          ) : !accepted ? (
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
            <TouchableOpacity onPress={() => setShowDeliverySheet(true)} activeOpacity={0.88} style={styles.ctaBtn}>
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
          {!isDelivered && (
            <Text style={styles.ctaSub}>
              {accepted ? 'Envoyez votre livraison quand elle est prête' : 'Démarre dès que tu acceptes la mission'}
            </Text>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatIconWrap:{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  // Client chip
  clientChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1,
    borderRadius: RADIUS.xl, padding: 10,
    marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  clientAvatar:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  clientInitials: { fontSize: 14, fontWeight: '800' },
  clientName:     { fontSize: 13, fontWeight: '700', color: COLORS.text },
  clientSub:      { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  profileCta:     { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  profileCtaText: { fontSize: 11, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
    overflow: 'hidden', ...SHADOW.sm,
  },

  // Mission header
  missionTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: SPACING.sm },
  missionIconBox:{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  missionType:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 3 },
  missionTitle:  { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3, lineHeight: 20 },
  clientRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  missionClient: { fontSize: 11, color: COLORS.textMuted },
  budgetBadge:   { backgroundColor: '#22C55E18', borderWidth: 1, borderColor: '#22C55E35', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  budgetText:    { fontSize: 15, fontWeight: '900', color: '#22C55E' },
  metaRow:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 5 },
  metaText:      { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  // Timeline
  timeline: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: 12,
    marginBottom: SPACING.md, ...SHADOW.sm,
  },
  timelineStep:  { alignItems: 'center', gap: 5, flex: 1 },
  timelineDot:   {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  timelineLine:  { height: 2, flex: 0.3, backgroundColor: COLORS.border, marginBottom: 14 },

  // Sections
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.xs, marginBottom: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.text, letterSpacing: 0.2 },

  // Brief
  briefText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 21 },
  emptyText: { fontSize: 13, color: COLORS.textLight, lineHeight: 20, fontStyle: 'italic' },

  // Detail rows
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  detailLabel:   { fontSize: 10, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  detailValue:   { fontSize: 13, fontWeight: '600', color: COLORS.text },

  // Checklist
  twoCol:   { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  doHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  doTitle:  { fontSize: 11, fontWeight: '800', color: '#22C55E' },
  dontTitle:{ fontSize: 11, fontWeight: '800', color: '#EF4444' },
  checkItem:{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 7 },
  checkDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkText:{ flex: 1, fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },

  // Payment note
  paymentNote:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  paymentNoteTitle: { fontSize: 13, fontWeight: '700', color: '#F59E0B', marginBottom: 2 },
  paymentNoteSub:   { fontSize: 11, color: '#F59E0B99', lineHeight: 16 },

  // CTA
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg + 'EE',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  ctaBtn:      { borderRadius: RADIUS.xl, marginBottom: 8, ...SHADOW.md },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: RADIUS.xl, overflow: 'hidden' },
  ctaText:     { fontSize: 16, fontWeight: '900', color: '#fff' },
  ctaSub:      { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },

  // Delivered banner
  deliveredBanner:{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: RADIUS.xl, padding: 14, marginBottom: 4 },
  deliveredTitle: { fontSize: 14, fontWeight: '800' },
  deliveredSub:   { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  // Message sheet
  msgOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000080' },
  msgSheet:      { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, paddingBottom: SPACING.xl + 8 },
  msgDragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  msgHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  msgHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgTitle:      { fontSize: 15, fontWeight: '700', color: COLORS.text },
  msgInput:      { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.text, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: SPACING.md },
  msgSendBtn:    { borderRadius: RADIUS.xl, overflow: 'hidden' },
  msgSendGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  msgSendText:   { fontSize: 15, fontWeight: '800', color: '#fff' },
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
