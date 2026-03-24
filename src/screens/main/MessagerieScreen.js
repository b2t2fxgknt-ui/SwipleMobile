/**
 * MessagerieScreen.js — Messagerie unifiée (client + freelance)
 * Liste en 3 sections déroulantes : En attente / En cours / Terminées
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
 StatusBar, TextInput, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useMissions }      from '../../lib/MissionsContext';
import { useConversations } from '../../lib/ConversationsContext';


// ─── buildInitialMessages ───────────────────────────────────────────────────────

function buildInitialMessages(mission) {
  return [
    {
      id: 'sys_start',
      from: 'system',
      text: `Mission démarrée · Paiement ${mission.budget ?? 0}€ sécurisé`,
    },
    {
      id: 'sys_client',
      from: 'client',
      text: 'Bonjour ! J\'ai bien reçu votre mission. N\'hésitez pas si vous avez des questions.',
      ts: 'Il y a 2 min',
    },
  ];
}

// ─── Bubble ────────────────────────────────────────────────────────────────────

function Bubble({ msg, accentColor, peerInitials }) {
  if (msg.from === 'system') {
    return (
      <View style={styles.systemMsg}>
        <Ionicons name="checkmark-circle" size={11} color="#22C55E" />
        <Text style={styles.systemText}>{msg.text}</Text>
      </View>
    );
  }
  const isMe = msg.from === 'me';
  return (
    <View style={[styles.bubbleWrap, isMe && { alignItems: 'flex-end' }]}>
      {!isMe && (
        <View style={[styles.bubbleMiniAvatar, { backgroundColor: accentColor + '22' }]}>
          <Text style={[styles.bubbleMiniAvatarText, { color: accentColor }]}>
            {peerInitials ?? '?'}
          </Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isMe
          ? [styles.bubbleMe, { backgroundColor: accentColor }]
          : styles.bubbleThem,
      ]}>
        <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{msg.text}</Text>
        {msg.ts && (
          <Text style={[styles.bubbleTs, isMe && { color: 'rgba(255,255,255,0.55)' }]}>
            {msg.ts}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── ConvRow ────────────────────────────────────────────────────────────────────

function ConvRow({ conv, onPress, accent, isLast }) {
  const color    = conv.meta.color ?? COLORS.primary;
  const initials = conv.meta.initials ?? '?';
  const preview  = conv.lastMsg;
  const isMe     = preview?.from === 'me';
  const hasUnread = conv.unread > 0;

  return (
    <TouchableOpacity
      style={[styles.convCard, !isLast && styles.convCardDivider]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {/* Accent strip */}
      <View style={[styles.convAccentStrip, { backgroundColor: accent }]} />

      {/* Avatar */}
      <View style={[styles.listAvatar, { backgroundColor: color + '18' }]}>
        <Text style={[styles.listAvatarText, { color }]}>{initials}</Text>
        {hasUnread && <View style={styles.listAvatarOnline} />}
      </View>

      {/* Infos */}
      <View style={{ flex: 1 }}>
        <View style={styles.convRowTop}>
          <Text style={[styles.convRowName, hasUnread && { color: COLORS.text }]}>{conv.meta.name}</Text>
          <Text style={styles.convRowTime}>{preview?.ts ?? ''}</Text>
        </View>
        <Text style={[styles.convRowMission, { color }]} numberOfLines={1}>
          {conv.meta.type} · {conv.meta.title}
        </Text>
        <Text
          style={[styles.convRowPreview, hasUnread && styles.convRowPreviewUnread, isMe && { fontStyle: 'italic' }]}
          numberOfLines={1}
        >
          {isMe ? `Vous : ${preview?.text}` : preview?.text}
        </Text>
      </View>

      {/* Badge */}
      {hasUnread ? (
        <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
          <Text style={styles.unreadText}>{conv.unread}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={12} color={COLORS.border} />
      )}
    </TouchableOpacity>
  );
}

// ─── CollapsibleSection ─────────────────────────────────────────────────────────

function CollapsibleSection({ title, count, accent, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const heightAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  function toggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(heightAnim, { toValue, useNativeDriver: false, tension: 55, friction: 10 }),
      Animated.timing(rotateAnim, { toValue, duration: 220, useNativeDriver: true }),
    ]).start();
    setOpen(o => !o);
  }

  const maxHeight = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1200] });
  const rotate    = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.section}>
      {/* Section header — pill style */}
      <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={[styles.sectionDot, { backgroundColor: accent }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {count > 0 && (
          <View style={[styles.sectionBadge, { backgroundColor: accent }]}>
            <Text style={styles.sectionBadgeText}>{count}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Animated.View style={[styles.sectionChevron, { transform: [{ rotate }] }]}>
          <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Animated container — cards */}
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <View style={[styles.sectionCard, { borderColor: accent + '22' }]}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function MessagerieScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { acceptedMissions }                             = useMissions();
  const { conversations, initConversation, pushMessage } = useConversations();

  const [selectedId, setSelectedId] = useState(null);
  const [inputText,  setInputText]  = useState('');
  const scrollRef = useRef(null);

  // ── Pré-peupler depuis les missions freelance ─────────────────────────────
  useEffect(() => {
    acceptedMissions.forEach(m => {
      initConversation(m.id, {
        name:     m.clientName     ?? 'Client',
        initials: m.clientInitials ?? m.clientName?.charAt(0) ?? '?',
        color:    m.color          ?? COLORS.prestataire,
        type:     m.type           ?? 'Mission',
        title:    m.title          ?? 'Mission',
        budget:   m.budget         ?? 0,
        raw:      m,
      }, buildInitialMessages(m));
    });
  }, [acceptedMissions.length]);

  // ── Auto-ouvrir depuis un param de navigation ─────────────────────────────
  useEffect(() => {
    const missionId = route.params?.missionId;
    if (!missionId) return;
    const m = acceptedMissions.find(x => x.id === missionId);
    if (m) {
      initConversation(m.id, {
        name:     m.clientName     ?? 'Client',
        initials: m.clientInitials ?? m.clientName?.charAt(0) ?? '?',
        color:    m.color          ?? COLORS.prestataire,
        type:     m.type           ?? 'Mission',
        title:    m.title          ?? 'Mission',
        budget:   m.budget         ?? 0,
        raw:      m,
      }, buildInitialMessages(m));
    }
    setSelectedId(missionId);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }, [route.params?.missionId]);

  // ── Conversations contexte → section "En cours" ───────────────────────────
  const ctxConvs = Object.entries(conversations)
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .map(([id, conv]) => {
      const lastMsg = conv.messages.at(-1);
      return {
        id,
        meta: conv.meta,
        lastMsg: {
          from: lastMsg?.from ?? 'system',
          text: lastMsg?.text ?? 'Appuyer pour ouvrir…',
          ts:   lastMsg?.ts  ?? 'Récent',
        },
        unread: 0,
        _raw: conv,
      };
    });

  // Conversations réelles uniquement — alimentées par MissionsContext + ConversationsContext
  const enCoursAll  = ctxConvs.filter(c => {
    const missionStatus = c.meta?.raw?.status;
    return !missionStatus || (missionStatus !== 'valide' && missionStatus !== 'completed');
  });
  const enAttenteAll = [];  // Sera peuplé lorsque les missions "en attente d'acceptation" seront gérées
  const termineesAll = ctxConvs.filter(c => {
    const missionStatus = c.meta?.raw?.status;
    return missionStatus === 'valide' || missionStatus === 'completed';
  });

  // ── Ouvrir une conversation ───────────────────────────────────────────────
  function openConversation(conv) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Pour les mocks, on initialise une conv vide si inexistante
    if (!conversations[conv.id]) {
      initConversation(conv.id, conv.meta, [
        {
          id: 'sys_start', from: 'system',
          text: `${conv.meta.type} · ${conv.meta.title}`,
        },
        {
          id: 'msg_0', from: 'client',
          text: conv.lastMsg.text,
          ts: conv.lastMsg.ts,
        },
      ]);
    }
    setSelectedId(conv.id);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }

  function sendMessage() {
    if (!inputText.trim() || !selectedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pushMessage(selectedId, {
      id:   Date.now(),
      from: 'me',
      text: inputText.trim(),
      ts:   'À l\'instant',
    });
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  const selected    = selectedId ? conversations[selectedId] : null;
  const messages    = selected?.messages ?? [];
  const meta        = selected?.meta ?? {};
  const accentColor = meta.color ?? COLORS.primary;
  const peerInitials = meta.initials ?? '?';

  // ═══════════════════════════════════════════════════════════════════════════
  //  VUE CONVERSATION OUVERTE
  // ═══════════════════════════════════════════════════════════════════════════
  if (selectedId && selected) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BubbleBackground variant="prestataire" />
        </View>

        <SafeAreaView style={{ flex: 1 }}>
          {/* TopBar */}
          <View style={styles.convTopBar}>
            <TouchableOpacity
              onPress={() => { setSelectedId(null); setInputText(''); }}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={[styles.convAvatar, { backgroundColor: accentColor + '22', borderColor: accentColor + '45' }]}>
              <Text style={[styles.convAvatarText, { color: accentColor }]}>{peerInitials}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.convTopName}>{meta.name}</Text>
              <Text style={[styles.convTopMission, { color: accentColor }]} numberOfLines={1}>
                {meta.type} · {meta.title}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          {/* Messages */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(msg => (
                <Bubble key={msg.id} msg={msg} accentColor={accentColor} peerInitials={peerInitials} />
              ))}
              <View style={{ height: 8 }} />
            </ScrollView>

            <View style={styles.inputBar}>
              <TextInput
                style={styles.chatInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Écrire un message…"
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: accentColor, opacity: inputText.trim() ? 1 : 0.32 }]}
                onPress={sendMessage}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VUE LISTE AVEC SECTIONS DÉROULANTES
  // ═══════════════════════════════════════════════════════════════════════════
  const totalUnread = enCoursAll.reduce((s, c) => s + (c.unread ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Messagerie</Text>
          <Text style={styles.headerSub}>
            {enAttenteAll.length + enCoursAll.length + termineesAll.length} conversations
          </Text>
        </View>
        {totalUnread > 0 && (
          <View style={styles.headerUnread}>
            <Text style={styles.headerUnreadText}>{totalUnread} non lus</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── En attente ── */}
        <CollapsibleSection
          title="En attente"
          count={enAttenteAll.length}
          accent="#F59E0B"
          icon="time-outline"
          defaultOpen={true}
        >
          {enAttenteAll.length === 0 ? (
            <View style={styles.sectionEmpty}>
              <Text style={styles.sectionEmptyText}>Aucune conversation en attente</Text>
            </View>
          ) : (
            enAttenteAll.map((conv, i) => (
              <ConvRow key={conv.id} conv={conv} accent="#F59E0B" isLast={i === enAttenteAll.length - 1} onPress={() => openConversation(conv)} />
            ))
          )}
        </CollapsibleSection>

        {/* ── En cours ── */}
        <CollapsibleSection
          title="En cours"
          count={enCoursAll.length}
          accent="#22C55E"
          icon="chatbubbles-outline"
          defaultOpen={true}
        >
          {enCoursAll.length === 0 ? (
            <View style={styles.sectionEmpty}>
              <Text style={styles.sectionEmptyText}>Aucune conversation active</Text>
            </View>
          ) : (
            enCoursAll.map((conv, i) => (
              <ConvRow key={conv.id} conv={conv} accent="#22C55E" isLast={i === enCoursAll.length - 1} onPress={() => openConversation(conv)} />
            ))
          )}
        </CollapsibleSection>

        {/* ── Terminées ── */}
        <CollapsibleSection
          title="Terminées"
          count={termineesAll.length}
          accent={COLORS.textMuted}
          icon="checkmark-done-outline"
          defaultOpen={false}
        >
          {termineesAll.length === 0 ? (
            <View style={styles.sectionEmpty}>
              <Text style={styles.sectionEmptyText}>Aucune conversation terminée</Text>
            </View>
          ) : (
            termineesAll.map((conv, i) => (
              <ConvRow key={conv.id} conv={conv} accent={COLORS.textMuted} isLast={i === termineesAll.length - 1} onPress={() => openConversation(conv)} />
            ))
          )}
        </CollapsibleSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  iconBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  headerUnread: {
    backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.primary + '35',
  },
  headerUnreadText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  scroll:        { flex: 1 },
  scrollContent: { paddingTop: SPACING.md, paddingBottom: 20 },

  // Sections
  section: { marginBottom: SPACING.sm },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.lg, paddingVertical: 12,
    marginBottom: 4,
  },
  sectionDot: {
    width: 7, height: 7, borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: COLORS.text,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  sectionBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  sectionChevron: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Card container for section rows
  sectionCard: {
    marginHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    ...SHADOW.sm,
  },

  sectionEmpty: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  sectionEmptyText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },

  // Conversation card row
  convCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 15, paddingRight: SPACING.md,
    backgroundColor: COLORS.card,
  },
  convCardDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  convAccentStrip: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginLeft: 14 },

  listAvatar: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  listAvatarText:   { fontSize: 16, fontWeight: '800' },
  listAvatarOnline: {
    position: 'absolute', top: -2, right: -2,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.card,
  },
  convRowTop:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convRowName:            { fontSize: 14, fontWeight: '800', color: COLORS.text },
  convRowTime:            { fontSize: 11, color: COLORS.textMuted },
  convRowMission:         { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  convRowPreview:         { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  convRowPreviewUnread:   { color: COLORS.text, fontWeight: '700' },

  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // ── Conversation ouverte ─────────────────────────────────────────────────────
  convTopBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  convAvatar:     { width: 40, height: 40, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  convAvatarText: { fontSize: 14, fontWeight: '800' },
  convTopName:    { fontSize: 15, fontWeight: '800', color: COLORS.text },
  convTopMission: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  onlineDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },

  chatScroll:  { flex: 1 },
  chatContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, gap: 10 },

  systemMsg: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    backgroundColor: '#22C55E0C', borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  systemText: { fontSize: 11, fontWeight: '600', color: '#22C55E' },

  bubbleWrap:           { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  bubbleMiniAvatar:     { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleMiniAvatarText: { fontSize: 11, fontWeight: '800' },
  bubble:    { maxWidth: '74%', borderRadius: RADIUS.lg, padding: 11 },
  bubbleMe:  { borderBottomRightRadius: 4 },
  bubbleThem:{ backgroundColor: COLORS.cardElevated, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText:{ fontSize: 14, color: COLORS.text, lineHeight: 19 },
  bubbleTs:  { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },

  inputBar: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-end',
    paddingHorizontal: SPACING.md, paddingTop: 10, paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  chatInput: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 11,
    fontSize: 14, color: COLORS.text, maxHeight: 100,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
