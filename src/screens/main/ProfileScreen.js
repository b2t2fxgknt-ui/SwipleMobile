/**
 * ProfileScreen.js — Profil utilisateur complet.
 * Freelancer : hero + stats + spécialités + badges + portfolio + disponibilité + compte
 * Client     : hero + stats + préférences + compte
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
 StatusBar, ActivityIndicator, Image,
  Switch, Animated, Modal, TextInput, Alert, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/SessionContext';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import ScrollProgressIndicator from '../../components/ui/ScrollProgressIndicator';

// ── Mock data ─────────────────────────────────────────────────────────────────

const SPECIALTIES = ['Hook', 'Montage', 'Captions', 'VO', 'Script', 'Effets'];
const MISSION_TYPES = ['Court format', 'Podcast', 'Pub', 'Tutoriel'];

const FREELANCER_BADGES = [
  { icon: 'flash',              label: 'Hook Expert',      color: '#F59E0B', desc: 'Top 5% accroche' },
  { icon: 'star',               label: 'Top Performer',    color: '#8B5CF6', desc: '4.9★ moyenne' },
  { icon: 'shield-checkmark',   label: 'Vérifié',          color: '#22C55E', desc: 'Identité validée' },
  { icon: 'trophy',             label: '50 missions',      color: '#3B82F6', desc: 'Milestone débloqué' },
];

const PORTFOLIO_ITEMS = [
  { id: 1, title: 'Hook TikTok',   views: '2.4M', color: '#F59E0B' },
  { id: 2, title: 'Reel Produit',  views: '890K',  color: '#8B5CF6' },
  { id: 3, title: 'Podcast Cut',   views: '340K',  color: '#3B82F6' },
  { id: 4, title: 'Brand Story',   views: '1.1M',  color: '#EC4899' },
];

const CLIENT_PLATFORMS = [
  { icon: 'logo-tiktok',     label: 'TikTok',     handle: '@moncreateur', followers: '42.5K', color: '#010101' },
  { icon: 'logo-instagram',  label: 'Instagram',   handle: '@moncreateur', followers: '18.2K', color: '#E1306C' },
  { icon: 'logo-youtube',    label: 'YouTube',     handle: '@moncreateur', followers: '8.9K',  color: '#FF0000' },
];

const CLIENT_CREATOR_STATS = [
  { icon: 'eye',      val: '1.2M', label: 'Vues totales', color: '#8B5CF6' },
  { icon: 'analytics',val: '4.8%', label: 'Engagement',   color: '#22C55E' },
  { icon: 'sparkles', val: '6',    label: 'Missions IA',  color: '#F59E0B' },
];

// ── SettingsSheet ──────────────────────────────────────────────────────────────
function SettingsSheet({ visible, onClose, accentColor, onSignOut, user, isFreelancer, memberYear }) {
  const slideAnim = useRef(new Animated.Value(700)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const [notifPush,   setNotifPush]   = useState(true);
  const [notifMsg,    setNotifMsg]    = useState(true);
  const [notifRatings,setNotifRatings]= useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function close() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 700, duration: 260, useNativeDriver: true }),
      Animated.timing(bgAnim,    { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }

  if (!visible) return null;

  function SwitchRow({ icon, label, value, onValueChange }) {
    return (
      <View style={stg.rowItem}>
        <View style={[stg.rowIcon, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon} size={15} color={accentColor} />
        </View>
        <Text style={stg.rowLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onValueChange(v); }}
          trackColor={{ false: COLORS.border, true: accentColor + '60' }}
          thumbColor={value ? accentColor : COLORS.textMuted}
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
      </View>
    );
  }

  function LinkRow({ icon, label, value, danger }) {
    return (
      <TouchableOpacity style={stg.rowItem} activeOpacity={0.7} onPress={() => {}}>
        <View style={[stg.rowIcon, { backgroundColor: (danger ? '#EF4444' : accentColor) + '18' }]}>
          <Ionicons name={icon} size={15} color={danger ? '#EF4444' : accentColor} />
        </View>
        <Text style={[stg.rowLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        {value ? <Text style={stg.rowValue}>{value}</Text> : null}
        {!danger && <Ionicons name="chevron-forward" size={13} color={COLORS.textLight} />}
      </TouchableOpacity>
    );
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Animated.View style={[stg.backdrop, {
        opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
      }]}>
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[stg.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={stg.handle} />
        <View style={stg.sheetHeader}>
          <TouchableOpacity onPress={close} activeOpacity={0.7} style={stg.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={stg.sheetTitle}>Paramètres</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={stg.scrollContent}>

          {/* ── Compte ── */}
          <Text style={stg.sectionTitle}>Compte</Text>
          <View style={stg.card}>
            <View style={stg.infoRow}>
              <View style={[stg.rowIcon, { backgroundColor: accentColor + '18' }]}>
                <Ionicons name="mail-outline" size={15} color={accentColor} />
              </View>
              <Text style={stg.rowLabel}>Email</Text>
              <Text style={stg.rowValue} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={stg.divider} />
            <View style={stg.infoRow}>
              <View style={[stg.rowIcon, { backgroundColor: accentColor + '18' }]}>
                <Ionicons name="person-outline" size={15} color={accentColor} />
              </View>
              <Text style={stg.rowLabel}>Rôle</Text>
              <Text style={stg.rowValue}>{isFreelancer ? 'Freelance' : 'Client'}</Text>
            </View>
            <View style={stg.divider} />
            <View style={stg.infoRow}>
              <View style={[stg.rowIcon, { backgroundColor: accentColor + '18' }]}>
                <Ionicons name="calendar-outline" size={15} color={accentColor} />
              </View>
              <Text style={stg.rowLabel}>Membre depuis</Text>
              <Text style={stg.rowValue}>{memberYear}</Text>
            </View>
          </View>

          {/* ── Notifications ── */}
          <Text style={stg.sectionTitle}>Notifications</Text>
          <View style={stg.card}>
            <SwitchRow icon="notifications-outline" label="Push"         value={notifPush}    onValueChange={setNotifPush} />
            <View style={stg.divider} />
            <SwitchRow icon="chatbubble-outline"     label="Messages"     value={notifMsg}     onValueChange={setNotifMsg} />
            <View style={stg.divider} />
            <SwitchRow icon="star-outline"           label="Évaluations"  value={notifRatings} onValueChange={setNotifRatings} />
          </View>

          {/* ── Préférences ── */}
          <Text style={stg.sectionTitle}>Préférences</Text>
          <View style={stg.card}>
            <LinkRow icon="language-outline"      label="Langue"     value="Français" />
            <View style={stg.divider} />
            <LinkRow icon="color-palette-outline" label="Apparence"  value="Sombre" />
          </View>

          {/* ── Confidentialité ── */}
          <Text style={stg.sectionTitle}>Confidentialité</Text>
          <View style={stg.card}>
            <LinkRow icon="shield-checkmark-outline" label="Sécurité du compte" />
            <View style={stg.divider} />
            <LinkRow icon="eye-off-outline" label="Visibilité du profil" value="Public" />
            <View style={stg.divider} />
            <LinkRow icon="key-outline" label="Changer le mot de passe" />
            <View style={stg.divider} />
            <LinkRow icon="document-text-outline" label="Conditions d'utilisation" />
          </View>

          {/* ── Support ── */}
          <Text style={stg.sectionTitle}>Support</Text>
          <View style={stg.card}>
            <LinkRow icon="help-circle-outline"  label="Centre d'aide" />
            <View style={stg.divider} />
            <LinkRow icon="chatbox-outline"      label="Contacter le support" />
            <View style={stg.divider} />
            <LinkRow icon="bug-outline"          label="Signaler un problème" />
          </View>

          {/* ── Déconnexion ── */}
          <View style={stg.card}>
            <TouchableOpacity
              style={stg.rowItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                close();
                setTimeout(() => onSignOut?.(), 300);
              }}
            >
              <View style={[stg.rowIcon, { backgroundColor: '#EF444418' }]}>
                <Ionicons name="log-out-outline" size={15} color="#EF4444" />
              </View>
              <Text style={[stg.rowLabel, { color: '#EF4444' }]}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// SettingsSheet styles (scoped)
const stg = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    maxHeight: '90%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: COLORS.border,
    paddingBottom: 34,
  },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetTitle:  { fontSize: 17, fontWeight: '800', color: COLORS.text },
  backBtn:     { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: SPACING.md },
  scrollContent:{ paddingTop: SPACING.sm },
  sectionTitle:{ fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 6 },
  card:        { marginHorizontal: SPACING.lg, backgroundColor: COLORS.bg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  divider:     { height: 1, backgroundColor: COLORS.border, marginLeft: 52 },
  rowItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: SPACING.md },
  rowIcon:     { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowLabel:    { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  rowValue:    { fontSize: 12, color: COLORS.textMuted, marginRight: 4 },
});

// ── Sub-composants ─────────────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return (
    <Text style={styles.sectionLabel}>{text.toUpperCase()}</Text>
  );
}

function RowItem({ icon, label, value, accentColor, onPress, danger, rightEl }) {
  return (
    <TouchableOpacity
      style={styles.rowItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIconBox, { backgroundColor: (danger ? '#EF4444' : accentColor) + '18' }]}>
        <Ionicons name={icon} size={15} color={danger ? '#EF4444' : accentColor} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: '#EF4444' }]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightEl ?? (
          <>
            {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
            {onPress && !rightEl && (
              <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function StarRating({ rating }) {
  return (
    <View style={styles.starRow}>
      {[1,2,3,4,5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={12}
          color="#F59E0B"
        />
      ))}
      <Text style={styles.ratingText}>{rating}</Text>
    </View>
  );
}

// ── Modal Edit profil ──────────────────────────────────────────────────────────

function EditProfileModal({ visible, profile, name, bio, onClose, onSave }) {
  const [draftName, setDraftName] = useState(name);
  const [draftBio,  setDraftBio]  = useState(bio ?? '');

  useEffect(() => {
    if (visible) { setDraftName(name); setDraftBio(bio ?? ''); }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Modifier le profil</Text>

          <Text style={styles.fieldLabel}>Nom affiché</Text>
          <TextInput
            style={styles.fieldInput}
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Ton nom ou pseudo"
            placeholderTextColor={COLORS.textLight}
            selectionColor={COLORS.primary}
          />

          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea]}
            value={draftBio}
            onChangeText={setDraftBio}
            placeholder="Décris-toi en quelques mots…"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            selectionColor={COLORS.primary}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => onSave(draftName, draftBio)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.gradientStart]}
                style={styles.modalSaveGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalSaveText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const user    = session?.user;

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [savedCount,    setSavedCount]    = useState(0);
  const [ordersCount,   setOrdersCount]   = useState(0);
  const [servicesCount, setServicesCount] = useState(0);

  // Modals
  const [editVisible,   setEditVisible]   = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [displayBio,  setDisplayBio]  = useState('');

  // Freelancer settings
  const [available,   setAvailable]   = useState(true);
  const [dailyRate,   setDailyRate]   = useState('350');

  // Completion bar animation
  const completionAnim = useRef(new Animated.Value(0)).current;
  const scrollIndicatorY = useRef(new Animated.Value(0)).current;
  const [scrollContentH,   setScrollContentH]   = useState(0);
  const [scrollContainerH, setScrollContainerH] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
  }, [user?.id]);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.name ?? user?.user_metadata?.nom ?? user?.email?.split('@')[0] ?? 'Utilisateur');
        setDisplayBio(profileData.bio ?? '');
      } else {
        setDisplayName(user?.user_metadata?.nom ?? user?.email?.split('@')[0] ?? 'Utilisateur');
      }

      const role         = profileData?.role ?? user?.user_metadata?.role ?? 'client';
      const isFreelancer = role === 'freelancer' || role === 'prestataire';

      if (isFreelancer) {
        const [{ count: svcCount }, { count: ordCount }] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact', head: true }).eq('freelancer_id', user.id).eq('is_active', true),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('freelancer_id', user.id),
        ]);
        setServicesCount(svcCount ?? 0);
        setOrdersCount(ordCount ?? 0);
      } else {
        const [{ count: savedCnt }, { count: ordCnt }] = await Promise.all([
          supabase.from('saved_services').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('client_id', user.id),
        ]);
        setSavedCount(savedCnt ?? 0);
        setOrdersCount(ordCnt ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  // Animate completion bar once loaded
  useEffect(() => {
    if (!loading) {
      Animated.timing(completionAnim, {
        toValue: 1, duration: 900, delay: 300, useNativeDriver: false,
      }).start();
    }
  }, [loading]);

  async function handleSaveProfile(newName, newBio) {
    try {
      await supabase.from('users').update({ name: newName, bio: newBio }).eq('id', user.id);
      setDisplayName(newName);
      setDisplayBio(newBio);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    }
    setEditVisible(false);
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const role         = profile?.role ?? user?.user_metadata?.role ?? 'client';
  const isFreelancer = role === 'freelancer' || role === 'prestataire';
  const accentColor  = isFreelancer ? COLORS.prestataire : COLORS.primary;

  const avatarUrl  = profile?.avatar_url ?? null;
  const initial    = displayName[0]?.toUpperCase() ?? 'U';
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : 2024;

  // Profile completion (mock logic)
  const completionPct = isFreelancer
    ? Math.min(100, 40 + (displayBio ? 20 : 0) + (servicesCount > 0 ? 20 : 0) + 20)
    : Math.min(100, 50 + (displayBio ? 30 : 0) + 20);

  const barWidth = completionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${completionPct}%`],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant={isFreelancer ? 'prestataire' : 'acheteur'} />
      </View>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        name={displayName}
        bio={displayBio}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />

      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        accentColor={accentColor}
        onSignOut={() => supabase.auth.signOut()}
        user={user}
        isFreelancer={isFreelancer}
        memberYear={memberYear}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollIndicatorY } } }],
            { useNativeDriver: false }
          )}
          onContentSizeChange={(_, h) => setScrollContentH(h)}
          onLayout={(e) => setScrollContainerH(e.nativeEvent.layout.height)}
        >

          {/* ── Barre supérieure avec cloche + gear ── */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.gearBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Notifications', { isFreelancer }); }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.textMuted} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity
              style={styles.gearBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettings(true); }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── HERO ── */}
          <View style={styles.hero}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: accentColor + '60' }]} />
              ) : (
                <LinearGradient
                  colors={[accentColor + '30', accentColor + '10']}
                  style={[styles.avatar, { borderColor: accentColor + '50' }]}
                >
                  <Text style={[styles.avatarInitial, { color: accentColor }]}>{initial}</Text>
                </LinearGradient>
              )}
              {/* Online dot */}
              {isFreelancer && (
                <View style={[styles.onlineDot, { backgroundColor: available ? '#22C55E' : '#6B6B8A' }]} />
              )}
            </View>

            {/* Name + role */}
            <Text style={styles.heroName}>{displayName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
              <View style={[styles.roleDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.roleBadgeText, { color: accentColor }]}>
                {isFreelancer ? 'Freelance créateur' : 'Client créateur'}
              </Text>
            </View>

            {/* Rating (freelancer) */}
            {isFreelancer && <StarRating rating={4.9} />}

            {/* Bio */}
            {displayBio ? (
              <Text style={styles.heroBio}>{displayBio}</Text>
            ) : (
              <Text style={[styles.heroBio, { color: COLORS.textLight, fontStyle: 'italic' }]}>
                Ajoute une bio pour te présenter…
              </Text>
            )}

            {/* Edit button */}
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: accentColor + '50', backgroundColor: accentColor + '12' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('EditProfile'); }}
              activeOpacity={0.75}
            >
              <Ionicons name="pencil-outline" size={14} color={accentColor} />
              <Text style={[styles.editBtnText, { color: accentColor }]}>Modifier le profil</Text>
            </TouchableOpacity>
          </View>

          {/* ── COMPLÉTION PROFIL ── */}
          <View style={[styles.cardPadded, { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm }]}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Profil complété</Text>
              <Text style={[styles.completionPct, { color: accentColor }]}>{completionPct}%</Text>
            </View>
            <View style={styles.completionTrack}>
              <Animated.View style={[styles.completionBar, { width: barWidth, backgroundColor: accentColor }]} />
            </View>
            {completionPct < 100 && (
              <Text style={styles.completionHint}>
                {isFreelancer
                  ? 'Ajoute des services pour booster ta visibilité'
                  : 'Complète ta bio pour personnaliser ton expérience'}
              </Text>
            )}
          </View>

          {/* ── STATS ── */}
          <View style={styles.statsRow}>
            {isFreelancer ? (
              <>
                <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
                  <Text style={[styles.statNum, { color: accentColor }]}>24</Text>
                  <Text style={styles.statLabel}>Missions</Text>
                </View>
                <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
                  <Text style={[styles.statNum, { color: accentColor }]}>1 847€</Text>
                  <Text style={styles.statLabel}>Revenus</Text>
                </View>
                <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
                  <Text style={[styles.statNum, { color: '#F59E0B' }]}>4.9★</Text>
                  <Text style={styles.statLabel}>Note moy.</Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
                  <Text style={[styles.statNum, { color: accentColor }]}>{ordersCount}</Text>
                  <Text style={styles.statLabel}>Commandes</Text>
                </View>
                <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
                  <Text style={[styles.statNum, { color: accentColor }]}>{savedCount}</Text>
                  <Text style={styles.statLabel}>Favoris</Text>
                </View>
                <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
                  <Text style={[styles.statNum, { color: accentColor }]}>{memberYear}</Text>
                  <Text style={styles.statLabel}>Membre</Text>
                </View>
              </>
            )}
          </View>

          {/* ── FREELANCER : SPÉCIALITÉS ── */}
          {isFreelancer && (
            <View style={styles.block}>
              <SectionLabel text="Spécialités" />
              <Card>
                <View style={styles.chipsWrap}>
                  {SPECIALTIES.map(s => (
                    <View key={s} style={[styles.chip, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
                      <Text style={[styles.chipText, { color: accentColor }]}>{s}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.chip, styles.chipAdd]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={13} color={COLORS.textMuted} />
                    <Text style={styles.chipAddText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          )}

          {/* ── FREELANCER : BADGES ── */}
          {isFreelancer && (
            <View style={styles.block}>
              <SectionLabel text="Badges" />
              <View style={styles.badgesGrid}>
                {FREELANCER_BADGES.map(b => (
                  <Card key={b.label} style={styles.badgeCard}>
                    <View style={[styles.badgeIconBox, { backgroundColor: b.color + '20' }]}>
                      <Ionicons name={b.icon} size={22} color={b.color} />
                    </View>
                    <Text style={styles.badgeName}>{b.label}</Text>
                    <Text style={styles.badgeDesc}>{b.desc}</Text>
                  </Card>
                ))}
              </View>
            </View>
          )}

          {/* ── FREELANCER : PORTFOLIO ── */}
          {isFreelancer && (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <SectionLabel text="Portfolio" />
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[styles.seeAll, { color: accentColor }]}>+ Ajouter</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
                {PORTFOLIO_ITEMS.map(item => (
                  <View key={item.id} style={[styles.portfolioCard, { borderColor: item.color + '30' }]}>
                    <LinearGradient
                      colors={[item.color + '25', item.color + '08']}
                      style={StyleSheet.absoluteFill}
                      borderRadius={RADIUS.lg}
                    />
                    <View style={[styles.portfolioPlay, { backgroundColor: item.color + '30' }]}>
                      <Ionicons name="play" size={22} color={item.color} />
                    </View>
                    <Text style={styles.portfolioTitle}>{item.title}</Text>
                    <View style={styles.portfolioViews}>
                      <Ionicons name="eye-outline" size={11} color={COLORS.textMuted} />
                      <Text style={styles.portfolioViewsText}>{item.views} vues</Text>
                    </View>
                  </View>
                ))}
                {/* Add card */}
                <TouchableOpacity style={styles.portfolioAddCard} activeOpacity={0.7}>
                  <Ionicons name="add-circle-outline" size={28} color={COLORS.textMuted} />
                  <Text style={styles.portfolioAddText}>Ajouter{'\n'}une vidéo</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* ── FREELANCER : DISPONIBILITÉ & TARIFS ── */}
          {isFreelancer && (
            <View style={styles.block}>
              <SectionLabel text="Disponibilité & Tarifs" />
              <Card>
                <RowItem
                  icon="flash-outline"
                  label="Disponible pour missions"
                  accentColor={accentColor}
                  rightEl={
                    <Switch
                      value={available}
                      onValueChange={(v) => { setAvailable(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      trackColor={{ false: COLORS.border, true: accentColor + '60' }}
                      thumbColor={available ? accentColor : COLORS.textMuted}
                    />
                  }
                />
                <View style={styles.divider} />
                <RowItem
                  icon="cash-outline"
                  label="Tarif journalier"
                  value={`${dailyRate}€ / jour`}
                  accentColor={accentColor}
                  onPress={() => {}}
                />
                <View style={styles.divider} />
                <View style={styles.missionTypesRow}>
                  <View style={[styles.rowIconBox, { backgroundColor: accentColor + '18' }]}>
                    <Ionicons name="list-outline" size={15} color={accentColor} />
                  </View>
                  <Text style={styles.rowLabel}>Types de missions</Text>
                </View>
                <View style={styles.missionChipsWrap}>
                  {MISSION_TYPES.map(t => (
                    <View key={t} style={[styles.chip, { backgroundColor: accentColor + '12', borderColor: accentColor + '30' }]}>
                      <Text style={[styles.chipText, { color: accentColor }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {/* ── CLIENT : PLATEFORMES ── */}
          {!isFreelancer && (
            <View style={styles.block}>
              <SectionLabel text="Mes plateformes" />
              <Card>
                {CLIENT_PLATFORMS.map((p, i) => (
                  <React.Fragment key={p.label}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.platformRow}>
                      <View style={[styles.platformIconBox, { backgroundColor: p.color + '18', borderColor: p.color + '30' }]}>
                        <Ionicons name={p.icon} size={16} color={p.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.platformName}>{p.label}</Text>
                        <Text style={styles.platformHandle}>{p.handle}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.platformNum, { color: p.color }]}>{p.followers}</Text>
                        <Text style={styles.platformSub}>abonnés</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </Card>
            </View>
          )}

          {/* ── CLIENT : STATS CRÉATEUR ── */}
          {!isFreelancer && (
            <View style={styles.block}>
              <SectionLabel text="Statistiques créateur" />
              <View style={styles.creatorStatsRow}>
                {CLIENT_CREATOR_STATS.map((s, i) => (
                  <View key={i} style={[styles.creatorStatCard, { borderColor: s.color + '30' }]}>
                    <LinearGradient colors={[s.color + '14', 'transparent']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
                    <Ionicons name={s.icon} size={20} color={s.color} />
                    <Text style={[styles.creatorStatVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.creatorStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.version}>Swiple · v2.0</Text>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Indicateur de scroll ── */}
        <ScrollProgressIndicator
          scrollY={scrollIndicatorY}
          contentHeight={scrollContentH}
          containerHeight={scrollContainerH}
        />
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingBottom: SPACING.xl },

  // Top bar with gear
  topBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 2 },
  gearBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 1.5, borderColor: COLORS.card },

  // Platform rows
  platformRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md },
  platformIconBox:{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  platformName:   { fontSize: 13, fontWeight: '700', color: COLORS.text },
  platformHandle: { fontSize: 11, color: COLORS.textMuted },
  platformNum:    { fontSize: 14, fontWeight: '900' },
  platformSub:    { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Creator stats
  creatorStatsRow: { flexDirection: 'row', gap: SPACING.sm },
  creatorStatCard: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center', gap: 5, overflow: 'hidden',
  },
  creatorStatVal:  { fontSize: 16, fontWeight: '900' },
  creatorStatLabel:{ fontSize: 9, color: COLORS.textMuted, fontWeight: '700' },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop:    SPACING.md,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.sm },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 3, right: 3,
    width: 13, height: 13, borderRadius: 7,
    borderWidth: 2, borderColor: COLORS.bg,
  },
  heroName: {
    fontSize: 22, fontWeight: '800', color: COLORS.text,
    marginBottom: 3, textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  roleDot:      { width: 5, height: 5, borderRadius: 3 },
  roleBadgeText:{ fontSize: 12, fontWeight: '600' },
  starRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginBottom: SPACING.xs,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#F59E0B', marginLeft: 4 },
  heroBio: {
    fontSize: 12, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 18, maxWidth: 300, marginBottom: SPACING.sm,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  editBtnText: { fontSize: 12, fontWeight: '700' },

  // Completion
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  completionTitle:  { fontSize: 12, fontWeight: '700', color: COLORS.text },
  completionPct:    { fontSize: 13, fontWeight: '900' },
  completionTrack:  { height: 5, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  completionBar:    { height: 5, borderRadius: RADIUS.full },
  completionHint:   { fontSize: 10, color: COLORS.textMuted, marginTop: 6, fontStyle: 'italic' },

  // Stats row
  statsRow: {
    flexDirection: 'row', gap: SPACING.xs,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1,
    borderRadius: RADIUS.lg, paddingVertical: 10,
    alignItems: 'center', gap: 3, ...SHADOW.sm,
  },
  statNum:   { fontSize: 15, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Blocks
  block:       { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel:{
    fontSize: 10, fontWeight: '700', color: COLORS.textLight,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
  },
  seeAll: { fontSize: 11, fontWeight: '700', marginBottom: 6 },

  // Card
  card: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.sm,
  },
  cardPadded: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.sm,
    padding: SPACING.md,
  },

  // Row items
  rowItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  rowIconBox: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowLabel:   { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  rowRight:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowValue:   { fontSize: 12, color: COLORS.textMuted, maxWidth: 120, textAlign: 'right' },
  divider:    { height: 1, backgroundColor: COLORS.border, marginLeft: SPACING.md + 28 + 10 },

  // Chips
  chipsWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: SPACING.sm },
  missionChipsWrap:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText:       { fontSize: 11, fontWeight: '700' },
  chipAdd:        { backgroundColor: COLORS.bg, borderColor: COLORS.border, borderStyle: 'dashed' },
  chipAddText:    { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  // Mission types row
  missionTypesRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.sm, paddingTop: 10, paddingBottom: 6 },

  // Badges grid
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  badgeCard:  {
    width: '47.5%', alignItems: 'center', gap: 5,
    paddingVertical: 12, paddingHorizontal: SPACING.xs,
  },
  badgeIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeName:    { fontSize: 11, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  badgeDesc:    { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },

  // Portfolio
  portfolioScroll:   { marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg },
  portfolioCard: {
    width: 110, height: 145, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card, borderWidth: 1,
    marginRight: SPACING.sm, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'flex-end',
    padding: SPACING.xs,
  },
  portfolioPlay:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 'auto', marginTop: SPACING.md },
  portfolioTitle:    { fontSize: 11, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  portfolioViews:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  portfolioViewsText:{ fontSize: 9, color: COLORS.textMuted },
  portfolioAddCard:  {
    width: 86, height: 145, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginRight: SPACING.lg,
  },
  portfolioAddText:  { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center', lineHeight: 14 },

  // Version
  version: { textAlign: 'center', fontSize: 11, color: COLORS.textLight, marginTop: SPACING.sm },

  // Edit modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.lg },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  fieldInput: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 13,
    fontSize: 14, color: COLORS.text, marginBottom: SPACING.md,
  },
  fieldTextarea: { height: 90, textAlignVertical: 'top' },
  modalActions:   { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  modalSaveBtn:    { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  modalSaveGradient:{ paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  modalSaveText:   { fontSize: 14, fontWeight: '800', color: '#fff' },
});
