/**
 * ProjetsScreen.js — Tableau de bord freelance
 * Sections en onglets : En cours · En révision · Livrés · Validés
 * Alimenté par MissionsContext (partagé avec MissionsScreen + transaction screens)
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
 StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';
import { useMissions } from '../../lib/MissionsContext';
import { CreatorProfileSheet } from '../../components/ui/CreatorCard';

// ── Config statuts ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  en_cours: { label: 'En cours',  color: '#F59E0B', icon: 'time-outline'             },
  revision: { label: 'Retouche',  color: '#3B82F6', icon: 'refresh-circle-outline'   },
  livre:    { label: 'Livré',     color: '#22C55E', icon: 'cloud-upload-outline'      },
  valide:   { label: 'Validé ✓',  color: '#10B981', icon: 'checkmark-circle-outline'  },
};

const TABS = [
  { key: 'en_cours', label: 'En cours',  color: '#F59E0B' },
  { key: 'revision', label: 'Retouche',  color: '#3B82F6' },
  { key: 'livre',    label: 'Livrés',    color: '#22C55E' },
  { key: 'valide',   label: 'Validés',   color: '#10B981' },
];

// ── Carte mission ──────────────────────────────────────────────────────────────
function ProjetCard({ mission, onOpenBrief, onValidate }) {
  const navigation = useNavigation();
  const status = STATUS_CFG[mission.status] ?? STATUS_CFG.en_cours;
  const [profileOpen, setProfileOpen] = useState(false);

  const effectiveCreator = mission.creator ?? {
    name: mission.clientName ?? 'Client',
    username: '',
    initials: mission.clientInitials ?? (mission.clientName?.charAt(0) ?? '?'),
    platform: 'TikTok', niche: mission.type ?? '',
    style: '', tags: [], objective: mission.objective ?? '',
    dos: mission.dos ?? [], donts: mission.donts ?? [], collab: 0,
  };

  const deadlineH = parseInt(mission.deadline, 10) || 48;
  const elapsed   = Math.floor((Date.now() - new Date(mission.acceptedAt).getTime()) / 3600000);
  const remaining = Math.max(0, deadlineH - elapsed);
  const pct       = Math.min(1, elapsed / deadlineH);
  const isUrgent  = pct > 0.7;

  return (
    <>
    <CreatorProfileSheet
      visible={profileOpen}
      creator={effectiveCreator}
      accentColor={mission.color}
      onClose={() => setProfileOpen(false)}
      onChat={() => { setProfileOpen(false); navigation.navigate('Messagerie', { missionId: mission.id }); }}
    />
    <View style={styles.card}>
      <LinearGradient
        colors={[mission.color + '0D', 'transparent']}
        style={StyleSheet.absoluteFill}
        borderRadius={RADIUS.xl}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* ── En-tête : icône · titre · statut ── */}
      <View style={styles.cardHead}>
        <View style={[styles.cardIconBox, { backgroundColor: mission.color + '18', borderColor: mission.color + '38' }]}>
          <Ionicons name={mission.icon ?? 'sparkles-outline'} size={15} color={mission.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardType, { color: mission.color }]}>{mission.type}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{mission.title}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: status.color + '16', borderColor: status.color + '30' }]}>
          <Ionicons name={status.icon} size={9} color={status.color} />
          <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* ── Ligne infos : client · budget · deadline ── */}
      <View style={styles.infoRow}>
        <TouchableOpacity style={styles.clientChip} onPress={() => setProfileOpen(true)} activeOpacity={0.7}>
          <Ionicons name="person-circle-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.clientChipText}>{mission.clientName}</Text>
          <Ionicons name="chevron-forward" size={9} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.infoSep} />
        <Ionicons name="cash-outline" size={11} color="#22C55E" />
        <Text style={styles.budgetText}>{mission.budget}€</Text>
        {mission.status !== 'valide' && (
          <>
            <View style={styles.infoSep} />
            <Ionicons name="alarm-outline" size={11} color={isUrgent ? '#EF4444' : COLORS.textMuted} />
            <Text style={[styles.deadlineText, isUrgent && { color: '#EF4444' }]}>
              {remaining > 0 ? `${remaining}h` : 'Dépassé'}
            </Text>
          </>
        )}
      </View>

      {/* ── Barre de progression deadline ── */}
      {mission.status === 'en_cours' && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {
            width: `${Math.round(pct * 100)}%`,
            backgroundColor: isUrgent ? '#EF4444' : mission.color,
          }]} />
        </View>
      )}

      {/* ── Action — En cours ── */}
      {mission.status === 'en_cours' && (
        <TouchableOpacity
          style={styles.missionBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onOpenBrief(mission); }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#475569', '#334155']}
            style={styles.missionBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Ionicons name="briefcase-outline" size={16} color="#fff" />
            <Text style={styles.missionBtnLabel}>Ouvrir la mission</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── Révision en cours ── */}
      {mission.status === 'revision' && (
        <View style={styles.statusBanner}>
          <View style={[styles.statusBannerDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.statusBannerText, { color: '#3B82F6' }]}>Retouche demandée par le client</Text>
          <TouchableOpacity
            style={[styles.statusBannerCta, { borderColor: '#3B82F640', backgroundColor: '#3B82F610' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenBrief(mission); }}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={12} color="#3B82F6" />
            <Text style={[styles.statusBannerCtaText, { color: '#3B82F6' }]}>Livrer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── En attente validation ── */}
      {mission.status === 'livre' && (
        <View style={styles.statusBanner}>
          <View style={[styles.statusBannerDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.statusBannerText, { color: '#F59E0B' }]}>En attente du client</Text>
          <TouchableOpacity
            style={[styles.statusBannerCta, { borderColor: '#F59E0B40', backgroundColor: '#F59E0B10' }]}
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onValidate(mission.id); }}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={12} color="#F59E0B" />
            <Text style={[styles.statusBannerCtaText, { color: '#F59E0B' }]}>Forcer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Validé ── */}
      {mission.status === 'valide' && (
        <View style={styles.statusBanner}>
          <View style={[styles.statusBannerDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusBannerText, { color: '#10B981' }]}>Mission complète · Paiement libéré</Text>
          <Text style={styles.valideAmount}>+{mission.budget}€</Text>
        </View>
      )}
    </View>
    </>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────────
export default function ProjetsScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { acceptedMissions, updateStatus } = useMissions();
  const [activeTab, setActiveTab] = useState('en_cours');

  // Auto-switch tab si on arrive depuis un écran transaction avec un initialTab
  useEffect(() => {
    const initialTab = route.params?.initialTab;
    if (initialTab && TABS.some(t => t.key === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [route.params?.initialTab]);

  const enCours = acceptedMissions.filter(m => m.status === 'en_cours');
  const revision = acceptedMissions.filter(m => m.status === 'revision');
  const livres   = acceptedMissions.filter(m => m.status === 'livre');
  const valides  = acceptedMissions.filter(m => m.status === 'valide');

  const totalEarned = valides.reduce((s, m) => s + (m.budget ?? 0), 0);
  const activeCount = enCours.length + revision.length;

  const countByKey = { en_cours: enCours.length, revision: revision.length, livre: livres.length, valide: valides.length };
  const listByKey  = { en_cours: enCours, revision, livre: livres, valide: valides };
  const activeList = listByKey[activeTab] ?? [];

  // ── Handlers avec auto-switch tab ─────────────────────────────────────────
  function handleValidate(id) {
    updateStatus(id, 'valide');
    setActiveTab('valide');
  }
  function handleOpenBrief(mission) {
    navigation.navigate('MissionBrief', { mission });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
      </View>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadge}>
            <Ionicons name="layers" size={10} color={COLORS.prestataire} />
            <Text style={styles.headerBadgeText}>FREELANCE</Text>
          </View>
          <Text style={styles.headerTitle}>Mes projets</Text>
        </View>
        <View style={styles.headerStatsRow}>
          {activeCount > 0 && (
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNum, { color: COLORS.prestataire }]}>{activeCount}</Text>
              <Text style={styles.headerStatLabel}>actifs</Text>
            </View>
          )}
          {activeCount > 0 && totalEarned > 0 && <View style={styles.headerStatDivider} />}
          {totalEarned > 0 && (
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNum, { color: '#22C55E' }]}>{totalEarned}€</Text>
              <Text style={styles.headerStatLabel}>gagnés</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.headerChatBtn}
            onPress={() => navigation.navigate('Messagerie')}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsInner}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            const count  = countByKey[tab.key];
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, active && { color: tab.color, fontWeight: '800' }]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.tabBadge,
                    { backgroundColor: active ? tab.color : COLORS.card, borderColor: active ? tab.color : COLORS.border },
                  ]}>
                    <Text style={[styles.tabBadgeText, { color: active ? '#fff' : COLORS.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── LISTE ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Aucune mission du tout */}
        {acceptedMissions.length === 0 && (
          <View style={styles.emptyFull}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="layers-outline" size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucun projet en cours</Text>
            <Text style={styles.emptySub}>
              Swipe des missions dans l'onglet{' '}
              <Text style={{ fontWeight: '800', color: COLORS.prestataire }}>Missions</Text>
              {'\n'}ou commande un expert depuis l'onglet{' '}
              <Text style={{ fontWeight: '800', color: COLORS.primary }}>Experts</Text>
            </Text>
          </View>
        )}

        {/* Tab vide mais des missions existent ailleurs */}
        {acceptedMissions.length > 0 && activeList.length === 0 && (
          <View style={styles.emptyTab}>
            <Ionicons name="checkmark-done-outline" size={26} color={COLORS.textMuted} />
            <Text style={styles.emptyTabText}>
              Aucun projet « {TABS.find(t => t.key === activeTab)?.label} »
            </Text>
          </View>
        )}

        {/* Cartes */}
        {activeList.map(m => (
          <ProjetCard
            key={m.id}
            mission={m}
            onValidate={handleValidate}
            onOpenBrief={handleOpenBrief}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.prestataire + '18', borderColor: COLORS.prestataire + '30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3, marginBottom: 5,
  },
  headerBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.prestataire, letterSpacing: 1 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerStatsRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerStat:      { alignItems: 'center' },
  headerStatNum:   { fontSize: 22, fontWeight: '900' },
  headerStatLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  headerStatDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // Tabs
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsInner:     { flexDirection: 'row' },
  tab: {
    flex: 1, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tabText:      { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabBadge:     { borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center', borderWidth: 1 },
  tabBadgeText: { fontSize: 10, fontWeight: '800' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 24 },

  // Empty states
  emptyFull: {
    alignItems: 'center', paddingTop: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg, gap: 12,
  },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  emptySub:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyTab:   { alignItems: 'center', paddingTop: SPACING.xl * 2, gap: 10 },
  emptyTabText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md,
    overflow: 'hidden', ...SHADOW.sm,
    marginBottom: SPACING.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIconBox: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardType:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 2 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusPillText: { fontSize: 9, fontWeight: '800' },

  // Ligne infos client · budget · deadline
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  clientChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  infoSep: { width: 1, height: 10, backgroundColor: COLORS.border },
  budgetText: { fontSize: 11, fontWeight: '800', color: '#22C55E' },
  deadlineText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  // Barre progression
  progressTrack: {
    height: 2, backgroundColor: COLORS.bg, borderRadius: 1,
    overflow: 'hidden', marginBottom: 10,
  },
  progressFill: { height: '100%', borderRadius: 1 },

  // Chat header btn
  headerChatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.prestataire,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },

  // Bouton unique mission
  missionBtn:      { marginTop: 10, borderRadius: RADIUS.md, overflow: 'hidden' },
  missionBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  missionBtnLabel: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Bannière statut (révision / livré / validé)
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  statusBannerDot: { width: 6, height: 6, borderRadius: 3 },
  statusBannerText: { flex: 1, fontSize: 11, fontWeight: '600' },
  statusBannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusBannerCtaText: { fontSize: 11, fontWeight: '800' },
  valideAmount: { fontSize: 13, fontWeight: '900', color: '#10B981' },
});
