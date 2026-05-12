/**
 * ApplicantsScreen.js — Liste des ghostwriters ayant candidaté sur un brief.
 * Le client choisit l'un d'eux → MATCH → MissionTracking.
 * Params : { brief }
 *
 * Données : fusionnées depuis BriefsContext (optimiste) + Supabase (réel)
 * Persistance : création de la mission dans `orders` + statut `accepted` dans `applications`
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../lib/theme';
import { useBriefs }   from '../../lib/BriefsContext';
import { useSession }  from '../../lib/SessionContext';
import { supabase }    from '../../lib/supabase';

// ── Étoiles ───────────────────────────────────────────────────────────────────

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < full ? 'star' : (i === full && half ? 'star-half' : 'star-outline')}
          size={12}
          color="#F59E0B"
        />
      ))}
      <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
    </View>
  );
}

// ── Carte freelance ───────────────────────────────────────────────────────────

function FreelancerCard({ freelancer, briefColor, onSelect, isSelected, disabled }) {
  return (
    <View style={[styles.card, isSelected && { borderColor: briefColor, backgroundColor: briefColor + '08' }]}>

      {/* Avatar + infos */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: briefColor + '28' }]}>
          <Text style={[styles.avatarInitials, { color: briefColor }]}>{freelancer.initials}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{freelancer.name}</Text>
          <Text style={styles.cardSpecialty}>{freelancer.specialty}</Text>
          <View style={styles.cardMeta}>
            <Stars rating={freelancer.rating ?? 4.8} />
            <View style={styles.missionsBadge}>
              <Text style={styles.missionsText}>{freelancer.missions ?? 0} missions</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Message de candidature */}
      {!!freelancer.bio && (
        <Text style={styles.bio}>{freelancer.bio}</Text>
      )}

      {/* Tarif proposé si disponible */}
      {!!freelancer.proposedRate && (
        <View style={styles.rateChip}>
          <Ionicons name="cash-outline" size={11} color="#22C55E" />
          <Text style={styles.rateText}>Tarif proposé : {freelancer.proposedRate}€</Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.selectBtn, disabled && { opacity: 0.45 }]}
        onPress={() => !disabled && onSelect(freelancer)}
        activeOpacity={disabled ? 1 : 0.85}
      >
        <LinearGradient
          colors={isSelected ? ['#22C55E', '#16A34A'] : [briefColor, briefColor + 'BB']}
          style={styles.selectBtnGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Ionicons name={isSelected ? 'checkmark-circle' : 'heart'} size={16} color="#fff" />
          <Text style={styles.selectBtnText}>
            {isSelected ? 'Sélectionné ✓' : 'Choisir ce ghostwriter'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function ApplicantsScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { brief }  = route.params ?? {};
  const { selectFreelancer } = useBriefs();
  const session  = useSession();
  const userId   = session?.user?.id ?? null;
  const userMeta = session?.user?.user_metadata ?? {};
  const clientName     = userMeta.nom ?? userMeta.full_name ?? 'Client';
  const clientInitials = clientName.charAt(0).toUpperCase();

  const [chosen,             setChosen]             = useState(null);
  const [loading,            setLoading]            = useState(false);
  const [supabaseApplicants, setSupabaseApplicants] = useState([]);
  const [loadingApplicants,  setLoadingApplicants]  = useState(true);

  const color = brief?.color ?? COLORS.primary;

  // ── Charger les candidatures réelles depuis Supabase ─────────────────────────
  useEffect(() => {
    if (!brief?.id) { setLoadingApplicants(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('applications')
          .select('*')
          .eq('brief_id', String(brief.id))
          .neq('status', 'rejected');

        if (data?.length) {
          setSupabaseApplicants(data.map(row => ({
            id:           row.freelancer_id ?? row.id,
            name:         row.freelancer_name     ?? 'Ghostwriter',
            initials:     row.freelancer_initials ?? (row.freelancer_name?.charAt(0) ?? 'G'),
            specialty:    row.specialty            ?? 'Ghostwriter TikTok',
            rating:       Number(row.rating)       || 4.8,
            missions:     Number(row.missions_count) || 0,
            bio:          row.message ?? row.bio   ?? '',
            proposedRate: row.proposed_rate        ?? null,
          })));
        }
      } catch (err) {
        console.warn('[ApplicantsScreen] fetch applicants error:', err?.message ?? err);
      }
      setLoadingApplicants(false);
    })();
  }, [brief?.id]);

  // ── Fusion : Supabase en priorité + contexte (optimiste) sans doublon ─────────
  const allApplicants = useMemo(() => {
    const supabaseIds = new Set(supabaseApplicants.map(a => String(a.id)));
    const ctxApplicants = (brief?.applicants ?? []).filter(a => !supabaseIds.has(String(a.id)));
    return [...supabaseApplicants, ...ctxApplicants];
  }, [supabaseApplicants, brief?.applicants]);

  // ── Sélectionner un ghostwriter → créer la mission en Supabase ───────────────
  async function handleSelect(freelancer) {
    if (chosen || loading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setChosen(freelancer.id);
    setLoading(true);

    // 1. Marquer le brief comme matché en contexte + Supabase
    selectFreelancer(brief.id);

    // 2. Créer la mission dans `orders`
    let missionId = `m${Date.now()}`;
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          brief_id:            String(brief.id),
          freelancer_id:       String(freelancer.id ?? 'unknown'),
          freelancer_name:     freelancer.name     ?? 'Ghostwriter',
          freelancer_initials: freelancer.initials ?? 'GW',
          client_id:           userId              ?? null,
          client_name:         clientName,
          client_initials:     clientInitials,
          title:               brief.title         ?? 'Mission TikTok',
          type:                brief.type          ?? 'Script seul',
          budget:              Number(brief.budget) || 0,
          deadline:            brief.deadline      ?? '48h',
          status:              'in_progress',
          color:               brief.color         ?? COLORS.primary,
        })
        .select('id')
        .single();

      if (data?.id) missionId = data.id;

      // 3. Marquer la candidature comme acceptée
      await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('brief_id', String(brief.id))
        .eq('freelancer_id', String(freelancer.id));

    } catch (_) {
      // Supabase indisponible → on continue avec l'ID local
    }

    setLoading(false);

    const mission = {
      id:              missionId,
      title:           brief.title,
      type:            brief.type,
      budget:          brief.budget,
      deadline:        brief.deadline,
      color:           brief.color ?? COLORS.primary,
      clientInitials,
      clientName,
      status:          'en_cours',
    };

    setTimeout(() => {
      navigation.navigate('Match', {
        mission,
        freelancer,
        client:   { initials: clientInitials, name: clientName },
        isClient: true,
      });
    }, 150);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{brief?.title ?? 'Candidatures'}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Récap du brief ── */}
          <View style={[styles.briefCard, { borderColor: color + '40' }]}>
            <LinearGradient
              colors={[color + '20', color + '06']}
              style={styles.briefGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.briefRow}>
                <View style={[styles.briefIconBox, { backgroundColor: color + '25', borderColor: color + '40' }]}>
                  <Ionicons name={brief?.icon ?? 'document-text-outline'} size={18} color={color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.briefType, { color }]}>{brief?.type}</Text>
                  <Text style={styles.briefTitle} numberOfLines={2}>{brief?.title}</Text>
                </View>
              </View>
              <View style={styles.briefChips}>
                <View style={styles.briefChip}>
                  <Ionicons name="cash-outline" size={10} color="#22C55E" />
                  <Text style={[styles.briefChipText, { color: '#22C55E' }]}>{brief?.budget}€</Text>
                </View>
                <View style={styles.briefChip}>
                  <Ionicons name="alarm-outline" size={10} color={COLORS.textMuted} />
                  <Text style={styles.briefChipText}>{brief?.deadline}</Text>
                </View>
                {!!brief?.postsPerMonth && (
                  <View style={styles.briefChip}>
                    <Ionicons name="film-outline" size={10} color={COLORS.textMuted} />
                    <Text style={styles.briefChipText}>{brief.postsPerMonth} vidéos/mois</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* ── Liste des candidatures ── */}
          {loadingApplicants ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.emptySub}>Chargement des candidatures…</Text>
            </View>
          ) : allApplicants.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="hourglass-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucune candidature</Text>
              <Text style={styles.emptySub}>
                Des ghostwriters vont bientôt swiper votre brief. Revenez dans quelques heures !
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.countRow}>
                <Text style={styles.countText}>
                  {allApplicants.length} ghostwriter{allApplicants.length > 1 ? 's' : ''} {allApplicants.length > 1 ? 'ont candidaté' : 'a candidaté'}
                </Text>
              </View>

              {loading && (
                <View style={styles.loadingBanner}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                  <Text style={styles.loadingBannerText}>Création de la mission…</Text>
                </View>
              )}

              <View style={styles.list}>
                {allApplicants.map(f => (
                  <FreelancerCard
                    key={f.id}
                    freelancer={f}
                    briefColor={color}
                    onSelect={handleSelect}
                    isSelected={chosen === f.id}
                    disabled={!!chosen && chosen !== f.id}
                  />
                ))}
              </View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: COLORS.text },

  scroll:        { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: 20, paddingBottom: 40 },

  // Brief recap
  briefCard:    { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden', ...SHADOW.sm },
  briefGrad:    { padding: SPACING.md, gap: 10 },
  briefRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  briefIconBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  briefType:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  briefTitle:   { fontSize: 14, fontWeight: '800', color: COLORS.text, lineHeight: 19 },
  briefChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  briefChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg + 'AA', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  briefChipText:{ fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  // Count + loading
  countRow:  {},
  countText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  loadingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primary + '25',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
  },
  loadingBannerText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // List
  list: { gap: 14 },

  // Card
  card: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md, gap: 12, ...SHADOW.sm,
  },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar:         { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitials: { fontSize: 18, fontWeight: '900' },
  cardInfo:       { flex: 1, gap: 3 },
  cardName:       { fontSize: 16, fontWeight: '800', color: COLORS.text },
  cardSpecialty:  { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },

  stars:      { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B', marginLeft: 2 },

  missionsBadge: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  missionsText:  { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },

  bio: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  rateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#22C55E0C', borderWidth: 1, borderColor: '#22C55E25',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  rateText: { fontSize: 11, fontWeight: '700', color: '#22C55E' },

  selectBtn:     { borderRadius: RADIUS.lg, overflow: 'hidden' },
  selectBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  selectBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Empty
  emptyWrap:  { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  emptySub:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
