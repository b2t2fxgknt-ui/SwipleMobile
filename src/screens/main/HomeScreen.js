import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const FREE_LIMIT = 3;

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const [{ count: genCount }, { data: recentData }, { data: sub }] = await Promise.all([
        supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('generations').select('id, input, output, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('subscriptions').select('status, current_period_end').eq('user_id', session.user.id).single(),
      ]);

      setCount(genCount ?? 0);
      setRecent(recentData ?? []);
      setIsSubscribed(sub?.status === 'active' && new Date(sub.current_period_end) > new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(loadData);

  const remaining = Math.max(0, FREE_LIMIT - count);
  const canGenerate = isSubscribed || count < FREE_LIMIT;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.name}>
              {user?.user_metadata?.nom ?? user?.email?.split('@')[0]}
            </Text>
          </View>
        </View>

        {/* Quota / Pro card */}
        {isSubscribed ? (
          <View style={[styles.quotaCard, styles.proCard]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.proText}>Swiple Pro — Générations illimitées</Text>
          </View>
        ) : (
          <View style={styles.quotaCard}>
            <View style={styles.quotaTop}>
              <Ionicons name="flash" size={18} color={COLORS.primary} />
              <Text style={styles.quotaTitle}>Générations gratuites</Text>
            </View>
            <View style={styles.quotaBar}>
              <View style={[styles.quotaFill, { width: `${(count / FREE_LIMIT) * 100}%` }]} />
            </View>
            <Text style={styles.quotaText}>
              {remaining} restante{remaining > 1 ? 's' : ''} sur {FREE_LIMIT}
            </Text>
            {remaining === 0 && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Paywall')}>
                <Text style={styles.upgradeBtnText}>Passer à l'illimité — 9,99€/mois</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* CTA générer */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => canGenerate ? navigation.navigate('Générer') : navigation.navigate('Paywall')}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={22} color="#fff" />
          <Text style={styles.generateBtnText}>Générer un script TikTok</Text>
        </TouchableOpacity>

        {/* Derniers scripts */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : recent.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Derniers scripts</Text>
            {recent.map(gen => (
              <TouchableOpacity
                key={gen.id}
                style={styles.genCard}
                onPress={() => navigation.navigate('Result', { generation: gen })}
                activeOpacity={0.75}
              >
                <View style={styles.genCardTop}>
                  <Text style={styles.genNiche}>{gen.input?.niche}</Text>
                  <Text style={styles.genDate}>
                    {new Date(gen.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={styles.genAccroche} numberOfLines={2}>
                  {gen.output?.accroche}
                </Text>
                <View style={styles.genMeta}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{gen.input?.format}</Text></View>
                  <View style={styles.badge}><Text style={styles.badgeText}>{gen.input?.style}</Text></View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  header: { marginBottom: SPACING.lg },
  greeting: { fontSize: 14, color: COLORS.textMuted, ...FONT.medium },
  name: { fontSize: 26, color: COLORS.text, ...FONT.bold, marginTop: 2 },
  quotaCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  proCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  proText: { color: COLORS.success, ...FONT.semibold, fontSize: 14 },
  quotaTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  quotaTitle: { color: COLORS.text, ...FONT.semibold, fontSize: 14 },
  quotaBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  quotaFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  quotaText: { color: COLORS.textMuted, fontSize: 12, ...FONT.medium },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  upgradeBtnText: { color: '#fff', ...FONT.semibold, fontSize: 13 },
  generateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  generateBtnText: { color: '#fff', fontSize: 16, ...FONT.bold },
  sectionTitle: { fontSize: 16, color: COLORS.text, ...FONT.bold, marginBottom: SPACING.md },
  genCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  genCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  genNiche: { color: COLORS.primary, ...FONT.semibold, fontSize: 13 },
  genDate: { color: COLORS.textMuted, fontSize: 12 },
  genAccroche: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  genMeta: { flexDirection: 'row', gap: SPACING.sm },
  badge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: COLORS.primary, fontSize: 11, ...FONT.semibold },
});
