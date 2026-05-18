import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

const SUPABASE_URL = 'https://gpouhmapulfdbsntiivi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwb3VobWFwdWxmZGJzbnRpaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDYzMDYsImV4cCI6MjA4OTE4MjMwNn0.7bcudd3JUX6iNC-iFN2ncnOMgOa3SL_Dx7CZLELMddI';

const FEATURES = [
  'Scripts TikTok illimités',
  'Accroche + script complet + captions',
  'Plan de montage détaillé',
  'Conseil pro personnalisé',
  'Historique complet de tes scripts',
  'Résiliable à tout moment',
];

export default function PaywallScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        Alert.alert('Erreur', data.error ?? 'Impossible de lancer le paiement, réessaie.');
        return;
      }

      // Ouvre la page de paiement Stripe dans le navigateur
      await WebBrowser.openBrowserAsync(data.url);

      // Quand l'utilisateur revient, on vérifie si l'abo est actif
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', session.user.id)
        .single();

      if (sub?.status === 'active') {
        navigation.navigate('Accueil');
      }
    } catch {
      Alert.alert('Erreur', 'Problème de connexion, vérifie ta connexion internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color={COLORS.textMuted} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Passez à l'illimité</Text>
        <Text style={styles.subtitle}>
          Vous avez utilisé vos 3 générations gratuites.{'\n'}Continuez à créer sans limite.
        </Text>

        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>9,99€</Text>
          <Text style={styles.pricePer}> / mois</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>S'abonner maintenant</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Résiliable à tout moment. Aucun engagement.{'\n'}
          Paiement sécurisé par Stripe.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: SPACING.lg,
    zIndex: 1,
    padding: 4,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: 40,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(124,58,237,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 26, color: COLORS.text, ...FONT.bold, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featureText: { color: COLORS.text, fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 36, color: COLORS.text, ...FONT.extrabold },
  pricePer: { fontSize: 16, color: COLORS.textMuted },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, ...FONT.bold },
  legal: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
