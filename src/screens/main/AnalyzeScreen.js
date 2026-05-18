import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { callFunction } from '../../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

export default function AnalyzeScreen({ navigation }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!description.trim()) {
      Alert.alert('Champ manquant', 'Décris ta vidéo pour que l\'IA puisse l\'analyser.');
      return;
    }
    setLoading(true);
    try {
      const { ok, status, data } = await callFunction('analyze-video', {
        video_url: videoUrl.trim() || undefined,
        video_description: description.trim(),
      });

      if (status === 402) { navigation.navigate('Paywall'); return; }
      if (!ok) { Alert.alert('Erreur', data.error ?? 'Réessaie.'); return; }

      navigation.navigate('AnalysisResult', {
        analysis: {
          id: data.id,
          video_url: videoUrl.trim() || null,
          video_description: description.trim(),
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
          <Text style={styles.title}>Analyser ma vidéo</Text>
          <Text style={styles.subtitle}>L'IA analyse ton contenu et te donne un score de viralité + des suggestions concrètes.</Text>

          <Text style={styles.label}>Lien TikTok (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://www.tiktok.com/@..."
            placeholderTextColor={COLORS.textMuted}
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Décris ta vidéo <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.inputLarge]}
            placeholder="ex : je parle des 3 erreurs que font les débutants à la salle. J'ai une accroche en 3 secondes, je montre des exemples, et je termine par un conseil. La vidéo dure 45 secondes."
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
          />

          <View style={styles.tipCard}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>Plus tu décris ta vidéo en détail (accroche, structure, durée, style), meilleure sera l'analyse.</Text>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleAnalyze} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <><ActivityIndicator color="#fff" size="small" /><Text style={styles.btnText}>Analyse en cours...</Text></>
            ) : (
              <><Ionicons name="search" size={20} color="#fff" /><Text style={styles.btnText}>Analyser ma vidéo 🔍</Text></>
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
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.xl, lineHeight: 20 },
  label: { fontSize: 13, color: COLORS.textMuted, ...FONT.semibold, marginBottom: SPACING.sm, marginTop: SPACING.md },
  required: { color: COLORS.error },
  input: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 15, padding: SPACING.md },
  inputLarge: { minHeight: 120, textAlignVertical: 'top' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  tipText: { flex: 1, color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, ...FONT.bold },
});
