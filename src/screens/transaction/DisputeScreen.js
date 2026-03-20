/**
 * DisputeScreen.js — Gestion de litige / médiation
 * Description du problème, contact support, FAQ, médiation
 * Params : { mission, freelancer }
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
 StatusBar, TextInput, Linking,
  Animated, KeyboardAvoidingView, Platform, Keyboard,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

const DISPUTE_REASONS = [
  { icon: 'alert-circle-outline', label: 'Le travail ne correspond pas au brief',   color: '#EF4444' },
  { icon: 'time-outline',         label: 'Délai non respecté',                       color: '#F59E0B' },
  { icon: 'chatbubbles-outline',  label: 'Problème de communication',                color: '#3B82F6' },
  { icon: 'close-circle-outline', label: 'Autre problème',                           color: COLORS.textMuted },
];

const FAQ = [
  {
    q: 'Mon argent est-il en sécurité ?',
    a: 'Oui. Votre paiement est bloqué en escrow chez Swiple et ne sera libéré que lorsque vous validez la mission. En cas de litige, le montant reste gelé jusqu\'à résolution.',
  },
  {
    q: 'Combien de temps dure la médiation ?',
    a: 'Notre équipe traite les litiges sous 48h ouvrées. Vous serez notifié à chaque étape.',
  },
  {
    q: 'Puis-je être remboursé ?',
    a: 'Si le freelance ne livre pas ou que la livraison est non-conforme au brief initial, un remboursement complet est possible après analyse.',
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(o => !o); }}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={COLORS.textMuted} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

// ─── SupportChatSheet ─────────────────────────────────────────────────────────

const INITIAL_MESSAGES = [
  {
    id: '1', from: 'support', time: 'maintenant',
    text: '👋 Bonjour ! Je suis le support Swiple. Comment puis-je vous aider avec votre litige ?',
  },
  {
    id: '2', from: 'support', time: 'maintenant',
    text: 'Décrivez-moi le problème rencontré et je ferai de mon mieux pour vous aider rapidement.',
  },
];

const BOT_REPLIES = [
  'Je comprends votre situation. Votre demande est bien prise en compte.',
  'Merci pour ces précisions. Notre équipe va analyser votre dossier sous 48h.',
  'Je transmets votre message à l\'équipe de médiation. Vous recevrez une réponse par notification.',
  'Votre paiement est sécurisé pendant toute la durée du litige. Ne vous inquiétez pas.',
];

function SupportChatSheet({ visible, onClose }) {
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const sheetY  = useRef(new Animated.Value(500)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);
  const replyIndex = useRef(0);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,  { toValue: 0,   useNativeDriver: true, tension: 60, friction: 11 }),
        Animated.timing(backdrop, { toValue: 1,  useNativeDriver: true, duration: 250 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,  { toValue: 500, useNativeDriver: true, duration: 260 }),
        Animated.timing(backdrop, { toValue: 0,  useNativeDriver: true, duration: 200 }),
      ]).start();
    }
  }, [visible]);

  function sendMessage() {
    const text = inputText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg = { id: Date.now().toString(), from: 'user', time: 'maintenant', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    Keyboard.dismiss();

    // Bot typing indicator + reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply = BOT_REPLIES[replyIndex.current % BOT_REPLIES.length];
      replyIndex.current += 1;
      const botMsg = { id: (Date.now() + 1).toString(), from: 'support', time: 'maintenant', text: reply };
      setMessages(prev => [...prev, botMsg]);
    }, 1400);
  }

  if (!visible && sheetY._value >= 499) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: Animated.multiply(backdrop, 0.55) }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[chatStyles.sheet, { transform: [{ translateY: sheetY }] }]}>
        {/* Handle */}
        <View style={chatStyles.handle} />

        {/* Header */}
        <View style={chatStyles.header}>
          <View style={chatStyles.agentRow}>
            <View style={chatStyles.agentAvatar}>
              <Ionicons name="shield-checkmark" size={18} color="#22C55E" />
            </View>
            <View>
              <Text style={chatStyles.agentName}>Support Swiple</Text>
              <View style={chatStyles.onlineRow}>
                <View style={chatStyles.onlineDot} />
                <Text style={chatStyles.onlineText}>En ligne · Répond en {"<"} 2 min</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={chatStyles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={chatStyles.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[chatStyles.msgRow, item.from === 'user' && chatStyles.msgRowUser]}>
                {item.from === 'support' && (
                  <View style={chatStyles.msgAvatar}>
                    <Ionicons name="shield-checkmark" size={12} color="#22C55E" />
                  </View>
                )}
                <View style={[
                  chatStyles.bubble,
                  item.from === 'user' ? chatStyles.bubbleUser : chatStyles.bubbleSupport,
                ]}>
                  <Text style={[chatStyles.bubbleText, item.from === 'user' && chatStyles.bubbleTextUser]}>
                    {item.text}
                  </Text>
                  <Text style={[chatStyles.bubbleTime, item.from === 'user' && { color: 'rgba(255,255,255,0.55)' }]}>
                    {item.time}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={isTyping ? (
              <View style={[chatStyles.msgRow]}>
                <View style={chatStyles.msgAvatar}>
                  <Ionicons name="shield-checkmark" size={12} color="#22C55E" />
                </View>
                <View style={[chatStyles.bubble, chatStyles.bubbleSupport, chatStyles.typingBubble]}>
                  <View style={chatStyles.typingDots}>
                    <View style={[chatStyles.typingDot, { opacity: 0.4 }]} />
                    <View style={[chatStyles.typingDot, { opacity: 0.7 }]} />
                    <View style={[chatStyles.typingDot, { opacity: 1 }]} />
                  </View>
                </View>
              </View>
            ) : null}
          />

          {/* Input bar */}
          <View style={chatStyles.inputBar}>
            <TextInput
              style={chatStyles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Écrivez votre message…"
              placeholderTextColor={COLORS.textLight}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              selectionColor={COLORS.primary}
              multiline
            />
            <TouchableOpacity
              style={[chatStyles.sendBtn, !inputText.trim() && { opacity: 0.4 }]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={chatStyles.sendGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="send" size={14} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Chat styles ───────────────────────────────────────────────────────────────

const chatStyles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '78%',
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  agentRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#22C55E14', borderWidth: 1, borderColor: '#22C55E30',
    alignItems: 'center', justifyContent: 'center',
  },
  agentName:   { fontSize: 14, ...FONT.bold, color: COLORS.text },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  onlineText:  { fontSize: 11, color: COLORS.textMuted },
  closeBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  msgList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 10 },
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser:  { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#22C55E14', borderWidth: 1, borderColor: '#22C55E25',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble:       { maxWidth: '75%', borderRadius: 16, padding: SPACING.sm, gap: 3 },
  bubbleSupport: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleUser:    { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleText:    { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  bubbleTextUser:{ color: '#fff' },
  bubbleTime:    { fontSize: 10, color: COLORS.textLight, alignSelf: 'flex-end' },
  typingBubble:  { paddingHorizontal: 14, paddingVertical: 12 },
  typingDots:    { flexDirection: 'row', gap: 4, alignItems: 'center' },
  typingDot:     { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 13, color: COLORS.text,
  },
  sendBtn:  { flexShrink: 0 },
  sendGrad: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

// ─── DisputeScreen ─────────────────────────────────────────────────────────────

export default function DisputeScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { mission, freelancer } = route.params ?? {};

  const [selectedReason, setSelectedReason] = useState(null);
  const [description,    setDescription]    = useState('');
  const [submitted,      setSubmitted]      = useState(false);
  const [showChat,       setShowChat]       = useState(false);

  function handleSubmit() {
    if (!selectedReason) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1A0A0A', COLORS.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.submittedSafe}>
          <View style={[styles.submittedIcon, { backgroundColor: '#EF444418', borderColor: '#EF444435' }]}>
            <Ionicons name="shield-outline" size={40} color="#EF4444" />
          </View>
          <Text style={styles.submittedTitle}>Litige déclaré</Text>
          <Text style={styles.submittedSub}>
            Notre équipe va analyser votre cas sous{' '}
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>48h</Text>.
            {'\n'}Votre paiement reste sécurisé pendant toute la durée.
          </Text>
          <View style={[styles.submittedNote, { borderColor: '#22C55E25', backgroundColor: '#22C55E08' }]}>
            <Ionicons name="lock-closed" size={14} color="#22C55E" />
            <Text style={styles.submittedNoteText}>
              {mission?.budget ?? 45}€ gelés — remboursement possible si litige confirmé
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[COLORS.primary, '#4F46E5']} style={styles.backHomeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.backHomeText}>Retour à l'accueil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
          <Text style={styles.topBarTitle}>Signaler un litige</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Alerte paiement protégé ── */}
          <View style={[styles.protectedBanner, { borderColor: '#22C55E30', backgroundColor: '#22C55E0A' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.protectedTitle}>Votre argent est protégé</Text>
              <Text style={styles.protectedSub}>
                Le paiement reste gelé jusqu'à résolution du litige
              </Text>
            </View>
          </View>

          {/* ── Choix du problème ── */}
          <Text style={styles.sectionLabelText}>QUEL EST LE PROBLÈME ?</Text>
          <View style={styles.reasonsGrid}>
            {DISPUTE_REASONS.map((r, i) => {
              const isSelected = selectedReason === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.reasonCard,
                    isSelected && { borderColor: r.color, backgroundColor: r.color + '14' },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedReason(i); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.reasonIcon, { backgroundColor: r.color + '18' }]}>
                    <Ionicons name={r.icon} size={18} color={r.color} />
                  </View>
                  <Text style={[styles.reasonLabel, isSelected && { color: r.color }]}>{r.label}</Text>
                  {isSelected && (
                    <View style={[styles.reasonCheck, { backgroundColor: r.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Description ── */}
          <Text style={styles.sectionLabelText}>DÉCRIVEZ LE PROBLÈME (OPTIONNEL)</Text>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Donnez le maximum de détails pour accélérer la résolution…"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            selectionColor={COLORS.primary}
            textAlignVertical="top"
          />

          {/* ── Contact direct support ── */}
          <Text style={styles.sectionLabelText}>BESOIN D'UNE AIDE IMMÉDIATE ?</Text>
          <View style={styles.supportCard}>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={() => Linking.openURL('mailto:support@swiple.app')}
              activeOpacity={0.8}
            >
              <View style={[styles.supportIconBox, { backgroundColor: COLORS.primary + '18' }]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportBtnLabel}>Email support</Text>
                <Text style={styles.supportBtnSub}>support@swiple.app · Réponse sous 4h</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.supportDivider} />

            <TouchableOpacity
              style={styles.supportBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowChat(true); }}
              activeOpacity={0.8}
            >
              <View style={[styles.supportIconBox, { backgroundColor: '#22C55E18' }]}>
                <Ionicons name="chatbubbles-outline" size={18} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportBtnLabel}>Chat en direct</Text>
                <Text style={styles.supportBtnSub}>Disponible lun–ven 9h–18h</Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── FAQ ── */}
          <Text style={styles.sectionLabelText}>QUESTIONS FRÉQUENTES</Text>
          <View style={styles.faqCard}>
            {FAQ.map((item, i) => (
              <View key={i}>
                <FaqItem item={item} />
                {i < FAQ.length - 1 && <View style={styles.faqDivider} />}
              </View>
            ))}
          </View>

          <View style={{ height: 130 }} />
        </ScrollView>

        {/* ── CTA sticky ── */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.88}
            style={[styles.ctaBtn, !selectedReason && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={['#EF4444', '#B91C1C']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="shield-outline" size={16} color="#fff" />
              <Text style={styles.ctaText}>Déclarer le litige</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>
            {selectedReason !== null ? 'Notre équipe vous contacte sous 48h' : 'Sélectionnez un problème pour continuer'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
    <SupportChatSheet visible={showChat} onClose={() => setShowChat(false)} />
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

  protectedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
  },
  protectedTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  protectedSub:   { fontSize: 11, color: COLORS.textMuted },

  sectionLabelText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 10, marginTop: SPACING.sm },

  // Reasons
  reasonsGrid: { gap: 8, marginBottom: SPACING.sm },
  reasonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, position: 'relative',
  },
  reasonIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reasonLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  reasonCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Description
  descInput: {
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md,
    fontSize: 13, color: COLORS.text, lineHeight: 20, minHeight: 90,
    marginBottom: SPACING.md,
  },

  // Support
  supportCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, marginBottom: SPACING.sm, overflow: 'hidden',
  },
  supportBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md },
  supportIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  supportBtnLabel:{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  supportBtnSub:  { fontSize: 11, color: COLORS.textMuted },
  supportDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: SPACING.md },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22C55E14', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#22C55E30' },
  liveDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#22C55E' },
  liveText:  { fontSize: 10, ...FONT.bold, color: '#22C55E' },

  // FAQ
  faqCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, marginBottom: SPACING.sm, overflow: 'hidden',
  },
  faqItem:   { padding: SPACING.md },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ:      { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  faqA:      { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginTop: 10 },
  faqDivider:{ height: 1, backgroundColor: COLORS.border },

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

  // Submitted state
  submittedSafe: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  submittedIcon: { width: 90, height: 90, borderRadius: 45, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  submittedTitle:{ fontSize: 24, fontWeight: '900', color: COLORS.text },
  submittedSub:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  submittedNote: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md },
  submittedNoteText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#22C55E' },
  backHomeBtn:   { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  backHomeGrad:  { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backHomeText:  { fontSize: 15, fontWeight: '900', color: '#fff' },
});
