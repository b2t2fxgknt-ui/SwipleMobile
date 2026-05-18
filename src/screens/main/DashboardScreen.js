import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const TRENDS = [
  { id: 1, emoji: '💰', title: 'Gagner 1000€ en 30 jours', niche: 'finance', idee: 'Comment j\'ai gagné 1000€ en 30 jours avec cette méthode simple' },
  { id: 2, emoji: '💪', title: 'Transformation physique en 90 jours', niche: 'sport', idee: 'Ma transformation physique en 90 jours : ce qui a vraiment changé' },
  { id: 3, emoji: '🍳', title: 'Repas healthy en moins de 10 min', niche: 'cuisine', idee: '3 repas healthy que je prépare en moins de 10 minutes' },
];

const BADGE_COLORS = {
  'Débutant': '#9090B0',
  'Créateur': '#3B82F6',
  'Pro': '#8B5CF6',
  'Elite': '#F59E0B',
};

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    setStats(data);
  }, []);

  useFocusEffect(loadData);

  const displayName = user?.user_metadata?.nom ?? user?.email?.split('@')[0] ?? '';
  const badge = stats?.badge_level ?? 'Débutant';
  const streak = stats?.streak_count ?? 0;
  const totalGen = stats?.total_generations ?? 0;
  const freeUsed = stats?.generations_free_used ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const generatedToday = stats?.last_generation_date === today;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour {displayName} 👋</Text>
          <View style={[styles.badge, { backgroundColor: (BADGE_COLORS[badge] ?? '#9090B0') + '25' }]}>
            <Text style={[styles.badgeText, { color: BADGE_COLORS[badge] ?? '#9090B0' }]}>{badge}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Jours de suite</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{totalGen}</Text>
            <Text style={styles.statLabel}>Scripts générés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚡️</Text>
            <Text style={styles.statValue}>{Math.max(0, 3 - freeUsed)}</Text>
            <Text style={styles.statLabel}>Crédits gratuits</Text>
          </View>
        </View>

        {!generatedToday && totalGen > 0 && (
          <View style={styles.reminderCard}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.reminderText}>Maintiens ton streak — génère un script aujourd'hui !</Text>
          </View>
        )}

        <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate('Générer')} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={22} color="#fff" />
          <Text style={styles.mainBtnText}>Générer un script TikTok</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>🚀 Tendances TikTok FR du jour</Text>
        {TRENDS.map(trend => (
          <TouchableOpacity
            key={trend.id}
            style={styles.trendCard}
            onPress={() => navigation.navigate('Générer', { niche: trend.niche, idee: trend.idee })}
            activeOpacity={0.75}
          >
            <Text style={styles.trendEmoji}>{trend.emoji}</Text>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>{trend.title}</Text>
              <Text style={styles.trendCta}>Générer sur ce trend →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  greeting: { fontSize: 20, color: COLORS.text, ...FONT.bold, flex: 1 },
  badge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, ...FONT.semibold },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 2 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 22, color: COLORS.text, ...FONT.bold },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  reminderText: { flex: 1, color: COLORS.text, fontSize: 13, lineHeight: 18 },
  mainBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
  mainBtnText: { color: '#fff', fontSize: 16, ...FONT.bold },
  sectionTitle: { fontSize: 16, color: COLORS.text, ...FONT.bold, marginBottom: SPACING.md },
  trendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  trendEmoji: { fontSize: 28 },
  trendContent: { flex: 1 },
  trendTitle: { color: COLORS.text, fontSize: 14, ...FONT.semibold, marginBottom: 4 },
  trendCta: { color: COLORS.primary, fontSize: 12, ...FONT.medium },
});
