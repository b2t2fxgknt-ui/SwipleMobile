import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { callFunction } from '../../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const NICHES = ['cuisine', 'finance', 'humour', 'lifestyle', 'sport', 'beauté', 'autre'];
const FORMATS = ['Tuto', 'Storytelling', 'Opinion', 'Trending', 'Autre'];
const STYLES_LIST = ['Cash', 'Éducatif', 'Humour', 'Inspirant'];

export default function GenerateScreen({ navigation, route }) {
  const [niche, setNiche] = useState(route.params?.niche ?? 'cuisine');
  const [idee, setIdee] = useState(route.params?.idee ?? '');
  const [format, setFormat] = useState('Tuto');
  const [style, setStyle] = useState('Éducatif');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.niche) setNiche(route.params.niche);
    if (route.params?.idee) setIdee(route.params.idee);
  }, [route.params]);

  async function handleGenerate() {
    if (!idee.trim()) {
      Alert.alert('Champ manquant', 'Décris ton idée avant de générer.');
      return;
    }
    setLoading(true);
    try {
      const { ok, status, data } = await callFunction('generate-script', {
        niche, idee: idee.trim(), format, style,
      });

      if (status === 402) { navigation.navigate('Paywall'); return; }
      if (!ok) { Alert.alert('Erreur', data.error ?? 'Réessaie.'); return; }

      navigation.navigate('Result', {
        generation: {
          id: data.id,
          input: { niche, idee: idee.trim(), format, style },
          output: data.output,
          virality_score: data.virality_score,
          created_at: new Date().toISOString(),
        },
      });
    } catch {
      Alert.alert('Erreur', 'Problème de connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Nouveau script</Text>
          <Text style={styles.subtitle}>L'IA génère ton script TikTok en 30 secondes.</Text>

          <Text style={styles.label}>Ta niche</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {NICHES.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.chip, niche === n && styles.chipActive]}
                onPress={() => setNiche(n)}
              >
                <Text style={[styles.chipText, niche === n && styles.chipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Ton idée</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="ex : 3 erreurs que font les débutants à la salle de sport"
            placeholderTextColor={COLORS.textMuted}
            value={idee}
            onChangeText={setIdee}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Format</Text>
          <View style={styles.chipRow}>
            {FORMATS.map(f => (
              <TouchableOpacity key={f} style={[styles.chip, format === f && styles.chipActive]} onPress={() => setFormat(f)}>
                <Text style={[styles.chipText, format === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Style</Text>
          <View style={styles.chipRow}>
            {STYLES_LIST.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, style === s && styles.chipActive]} onPress={() => setStyle(s)}>
                <Text style={[styles.chipText, style === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleGenerate} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <><ActivityIndicator color="#fff" size="small" /><Text style={styles.btnText}>Génération en cours...</Text></>
            ) : (
              <><Ionicons name="sparkles" size={20} color="#fff" /><Text style={styles.btnText}>Générer mon script 🚀</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  title: { fontSize: 24, color: COLORS.text, ...FONT.bold, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.xl },
  label: { fontSize: 13, color: COLORS.textMuted, ...FONT.semibold, marginBottom: SPACING.sm, marginTop: SPACING.md },
  hScroll: { marginBottom: SPACING.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, marginRight: SPACING.sm, marginBottom: SPACING.sm },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 13, ...FONT.medium },
  chipTextActive: { color: '#fff' },
  input: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 15, padding: SPACING.md },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, ...FONT.bold },
});
