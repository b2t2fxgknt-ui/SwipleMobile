import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { viralityColor } from '../../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const FILTERS = ['Tout', 'Scripts', 'Analyses', 'Favoris'];

export default function HistoryScreen({ navigation }) {
  const [generations, setGenerations] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [filter, setFilter] = useState('Tout');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [{ data: gens }, { data: ans }] = await Promise.all([
        supabase.from('generations').select('id, input, output, virality_score, is_favorite, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('analyses').select('id, video_description, output, virality_score, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ]);

      setGenerations(gens ?? []);
      setAnalyses(ans ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(loadData);

  async function toggleFavorite(id, current) {
    await supabase.from('generations').update({ is_favorite: !current }).eq('id', id);
    setGenerations(prev => prev.map(g => g.id === id ? { ...g, is_favorite: !current } : g));
  }

  const allItems = [
    ...generations.map(g => ({ ...g, _type: 'script' })),
    ...analyses.map(a => ({ ...a, _type: 'analysis' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filtered = allItems.filter(item => {
    if (filter === 'Scripts') return item._type === 'script';
    if (filter === 'Analyses') return item._type === 'analysis';
    if (filter === 'Favoris') return item._type === 'script' && item.is_favorite;
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>{allItems.length} éléments</Text>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Aucun élément</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.map(item => {
            const score = item.virality_score ?? 70;
            const color = viralityColor(score);
            const isScript = item._type === 'script';

            return (
              <TouchableOpacity
                key={item.id + item._type}
                style={styles.card}
                onPress={() => isScript
                  ? navigation.navigate('Result', { generation: item })
                  : navigation.navigate('AnalysisResult', { analysis: item })
                }
                activeOpacity={0.75}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: isScript ? 'rgba(124,58,237,0.15)' : 'rgba(6,182,212,0.15)' }]}>
                    <Text style={[styles.typeText, { color: isScript ? COLORS.primary : '#06B6D4' }]}>
                      {isScript ? '📝 Script' : '🔍 Analyse'}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
                </View>

                <Text style={styles.cardAccroche} numberOfLines={2}>
                  {isScript ? item.output?.accroche : item.video_description}
                </Text>

                <View style={styles.cardBottom}>
                  {isScript && <Text style={styles.cardNiche}>{item.input?.niche} · {item.input?.format}</Text>}
                  <View style={styles.cardBottomRight}>
                    <Text style={[styles.scoreText, { color }]}>{score}/100</Text>
                    {isScript && (
                      <TouchableOpacity onPress={() => toggleFavorite(item.id, item.is_favorite)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={item.is_favorite ? 'heart' : 'heart-outline'} size={18} color={item.is_favorite ? '#EC4899' : COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 24, color: COLORS.text, ...FONT.bold },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  filterScroll: { maxHeight: 48 },
  filterRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 13, ...FONT.medium },
  filterTextActive: { color: '#fff' },
  content: { padding: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 40, gap: SPACING.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 11, ...FONT.semibold },
  cardDate: { color: COLORS.textMuted, fontSize: 12 },
  cardAccroche: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  cardNiche: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBottomRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  scoreText: { fontSize: 13, ...FONT.bold },
});
