import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const BADGE_ORDER = ['Débutant', 'Créateur', 'Pro', 'Elite'];
const BADGE_THRESHOLDS = [0, 10, 50, 150];
const BADGE_COLORS = { 'Débutant': '#9090B0', 'Créateur': '#3B82F6', 'Pro': '#8B5CF6', 'Elite': '#F59E0B' };

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [sub, setSub] = useState(null);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
    const [{ data: s }, { data: sb }] = await Promise.all([
      supabase.from('user_stats').select('*').eq('user_id', session.user.id).single(),
      supabase.from('subscriptions').select('status, current_period_end').eq('user_id', session.user.id).single(),
    ]);
    setStats(s);
    setSub(sb);
  }, []);

  useFocusEffect(loadData);

  const isSubscribed = sub?.status === 'active' && new Date(sub.current_period_end) > new Date();
  const displayName = user?.user_metadata?.nom ?? user?.email?.split('@')[0] ?? '?';
  const badge = stats?.badge_level ?? 'Débutant';
  const badgeColor = BADGE_COLORS[badge] ?? '#9090B0';
  const badgeIdx = BADGE_ORDER.indexOf(badge);
  const nextBadge = BADGE_ORDER[badgeIdx + 1];
  const nextThreshold = BADGE_THRESHOLDS[badgeIdx + 1];
  const currentThreshold = BADGE_THRESHOLDS[badgeIdx];
  const totalGen = stats?.total_generations ?? 0;
  const progress = nextThreshold
    ? Math.min((totalGen - currentThreshold) / (nextThreshold - currentThreshold), 1)
    : 1;

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profil</Text>

        {/* Avatar + badge */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badgePill, { backgroundColor: badgeColor + '25' }]}>
            <Text style={[styles.badgePillText, { color: badgeColor }]}>{badge}</Text>
          </View>
          {nextBadge && (
            <View style={styles.progressWrap}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: badgeColor }]} />
              </View>
              <Text style={styles.progressText}>{totalGen}/{nextThreshold} scripts pour devenir {nextBadge}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🔥 {stats?.streak_count ?? 0}</Text>
            <Text style={styles.statLabel}>Streak actuel</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>📝 {totalGen}</Text>
            <Text style={styles.statLabel}>Scripts générés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🔍 {stats?.total_analyses ?? 0}</Text>
            <Text style={styles.statLabel}>Analyses</Text>
          </View>
        </View>

        {/* Abonnement */}
        <View style={styles.subCard}>
          <View style={styles.subRow}>
            <Ionicons name={isSubscribed ? 'checkmark-circle' : 'lock-closed-outline'} size={20} color={isSubscribed ? COLORS.success : COLORS.textMuted} />
            <Text style={styles.subText}>{isSubscribed ? 'Swiple Pro — Illimité ✓' : `${Math.max(0, 3 - (stats?.generations_free_used ?? 0))} générations gratuites restantes`}</Text>
          </View>
          {!isSubscribed && (
            <TouchableOpacity style={styles.subBtn} onPress={() => navigation.navigate('Paywall')}>
              <Text style={styles.subBtnText}>Passer à Pro — 9,99€/mois</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Legal', { type: 'cgu' })}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.menuText}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
            <Ionicons name="shield-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.menuText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  title: { fontSize: 24, color: COLORS.text, ...FONT.bold, marginBottom: SPACING.lg },
  heroCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm, marginBottom: SPACING.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, color: '#fff', ...FONT.bold },
  name: { fontSize: 18, color: COLORS.text, ...FONT.bold },
  email: { fontSize: 13, color: COLORS.textMuted },
  badgePill: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgePillText: { fontSize: 13, ...FONT.semibold },
  progressWrap: { width: '100%', gap: 6 },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  progressText: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  statValue: { fontSize: 15, color: COLORS.text, ...FONT.bold },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  subCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm, marginBottom: SPACING.lg },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  subText: { color: COLORS.text, fontSize: 14, ...FONT.medium, flex: 1 },
  subBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  subBtnText: { color: '#fff', ...FONT.semibold, fontSize: 13 },
  menuCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemLast: { borderBottomWidth: 0 },
  menuText: { flex: 1, color: COLORS.text, fontSize: 14, ...FONT.medium },
});
