import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { viralityColor, viralityEmoji } from '../../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const SECTIONS = [
  { key: 'accroche',    label: '🎣 Accroche',         color: '#F59E0B' },
  { key: 'script',      label: '📝 Script',            color: '#7C3AED' },
  { key: 'captions',    label: '📱 Textes à l\'écran', color: '#06B6D4' },
  { key: 'montage',     label: '🎬 Montage',           color: '#10B981' },
  { key: 'conseil_pro', label: '💡 Conseil pro',       color: '#EC4899' },
];

export default function ResultScreen({ navigation, route }) {
  const { generation } = route.params;
  const { output, input, virality_score } = generation;
  const score = virality_score ?? output?.virality_score ?? 70;
  const color = viralityColor(score);

  function buildFullText() {
    return SECTIONS.map(s => {
      const val = output[s.key];
      return `${s.label}\n${Array.isArray(val) ? val.join('\n') : val}`;
    }).join('\n\n');
  }

  async function handleShare() {
    try { await Share.share({ message: buildFullText() }); } catch {}
  }

  function handleRegenerate() {
    navigation.replace('Result', {
      generation: { ...generation, _regen: true },
    });
    navigation.navigate('Générer', { niche: input?.niche, idee: input?.idee });
  }

  function renderValue(key) {
    const val = output[key];
    if (Array.isArray(val)) return val.map((line, i) => <Text key={i} style={styles.line}>• {line}</Text>);
    return <Text style={styles.line}>{val}</Text>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topNiche} numberOfLines={1}>{input?.niche}</Text>
          <Text style={styles.topMeta}>{input?.format} · {input?.style}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score de viralité */}
        <View style={[styles.scoreCard, { borderColor: color + '40' }]}>
          <Text style={styles.scoreEmoji}>{viralityEmoji(score)}</Text>
          <View style={styles.scoreCenter}>
            <Text style={styles.scoreLabel}>Score de viralité</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: color }]} />
            </View>
          </View>
          <Text style={[styles.scoreValue, { color }]}>{score}/100</Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.key} style={styles.section}>
            <View style={[styles.sectionHeader, { borderLeftColor: section.color }]}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
            </View>
            <View style={styles.sectionBody}>{renderValue(section.key)}</View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.regenBtn} onPress={handleRegenerate} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
          <Text style={styles.regenBtnText}>Regénérer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.copyBtn} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Text style={styles.copyBtnText}>Copier tout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBtn: { padding: 6, width: 40 },
  topCenter: { flex: 1, alignItems: 'center' },
  topNiche: { color: COLORS.text, ...FONT.bold, fontSize: 15 },
  topMeta: { color: COLORS.textMuted, fontSize: 12 },
  content: { padding: SPACING.lg, paddingBottom: 110, gap: SPACING.md },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, gap: SPACING.md },
  scoreEmoji: { fontSize: 28 },
  scoreCenter: { flex: 1, gap: 6 },
  scoreLabel: { color: COLORS.textMuted, fontSize: 12, ...FONT.medium },
  scoreBar: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: RADIUS.full },
  scoreValue: { fontSize: 20, ...FONT.extrabold },
  section: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { borderLeftWidth: 4, paddingHorizontal: SPACING.md, paddingVertical: 10, backgroundColor: COLORS.cardElevated },
  sectionLabel: { color: COLORS.text, ...FONT.bold, fontSize: 14 },
  sectionBody: { padding: SPACING.md, gap: 6 },
  line: { color: COLORS.text, fontSize: 14, lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: SPACING.lg, paddingBottom: 32, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  regenBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 13 },
  regenBtnText: { color: COLORS.primary, fontSize: 14, ...FONT.bold },
  copyBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  copyBtnText: { color: '#fff', fontSize: 14, ...FONT.bold },
});
