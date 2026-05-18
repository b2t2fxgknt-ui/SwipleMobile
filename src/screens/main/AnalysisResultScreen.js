import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { viralityColor, viralityEmoji } from '../../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const DETAIL_LABELS = {
  accroche: 'Accroche',
  rythme: 'Rythme',
  structure: 'Structure',
  appel_action: 'Appel à l\'action',
};

export default function AnalysisResultScreen({ navigation, route }) {
  const { analysis } = route.params;
  const { output, virality_score } = analysis;
  const score = virality_score ?? output?.virality_score ?? 50;
  const color = viralityColor(score);
  const scoresDetail = output?.scores_detail ?? {};

  function handleCreateScript() {
    navigation.navigate('Générer', {
      idee: `Améliorer cette vidéo : ${analysis.video_description?.slice(0, 100)}`,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Résultat de l'analyse</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score global */}
        <View style={[styles.scoreCard, { borderColor: color + '40' }]}>
          <Text style={styles.scoreEmoji}>{viralityEmoji(score)}</Text>
          <View style={styles.scoreCenter}>
            <Text style={styles.scoreLabel}>Score de viralité global</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: color }]} />
            </View>
          </View>
          <Text style={[styles.scoreValue, { color }]}>{score}/100</Text>
        </View>

        {/* Scores détaillés */}
        {Object.keys(scoresDetail).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scores détaillés</Text>
            {Object.entries(scoresDetail).map(([key, val]) => {
              const c = viralityColor(Number(val));
              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{DETAIL_LABELS[key] ?? key}</Text>
                  <View style={styles.detailBarWrap}>
                    <View style={[styles.detailBarFill, { width: `${val}%`, backgroundColor: c }]} />
                  </View>
                  <Text style={[styles.detailScore, { color: c }]}>{val}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Points forts */}
        {output?.points_forts?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ Points forts</Text>
            {output.points_forts.map((p, i) => (
              <View key={i} style={styles.pointRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.pointText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Points faibles */}
        {output?.points_faibles?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>❌ Points faibles</Text>
            {output.points_faibles.map((p, i) => (
              <View key={i} style={styles.pointRow}>
                <Ionicons name="close-circle" size={16} color={COLORS.error} />
                <Text style={styles.pointText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {output?.suggestions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Suggestions</Text>
            {output.suggestions.map((s, i) => (
              <View key={i} style={styles.suggRow}>
                <View style={styles.suggNum}><Text style={styles.suggNumText}>{i + 1}</Text></View>
                <Text style={styles.pointText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Verdict */}
        {output?.verdict && (
          <View style={[styles.card, styles.verdictCard]}>
            <Text style={styles.cardTitle}>⚡ Verdict</Text>
            <Text style={styles.verdictText}>{output.verdict}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateScript} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Créer un meilleur script à partir de cette analyse</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBtn: { padding: 6, width: 40 },
  topTitle: { color: COLORS.text, ...FONT.bold, fontSize: 16 },
  content: { padding: SPACING.lg, paddingBottom: 40, gap: SPACING.md },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, gap: SPACING.md },
  scoreEmoji: { fontSize: 28 },
  scoreCenter: { flex: 1, gap: 6 },
  scoreLabel: { color: COLORS.textMuted, fontSize: 12, ...FONT.medium },
  scoreBar: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: RADIUS.full },
  scoreValue: { fontSize: 20, ...FONT.extrabold },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  cardTitle: { color: COLORS.text, ...FONT.bold, fontSize: 14, marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  detailLabel: { color: COLORS.textMuted, fontSize: 12, width: 110 },
  detailBarWrap: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  detailBarFill: { height: '100%', borderRadius: RADIUS.full },
  detailScore: { fontSize: 13, ...FONT.bold, width: 28, textAlign: 'right' },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  pointText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20 },
  suggRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  suggNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  suggNumText: { color: '#fff', fontSize: 11, ...FONT.bold },
  verdictCard: { borderColor: COLORS.primary + '40' },
  verdictText: { color: COLORS.text, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  createBtnText: { color: '#fff', fontSize: 14, ...FONT.bold, textAlign: 'center' },
});
