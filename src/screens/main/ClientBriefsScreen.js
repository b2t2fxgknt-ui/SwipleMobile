/**
 * ClientBriefsScreen.js — Onglet "Briefs" côté client.
 * Liste les briefs postés, affiche les candidatures reçues,
 * permet d'en créer un nouveau.
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOW, FONT } from '../../lib/theme';
import { useBriefs } from '../../lib/BriefsContext';

const TYPE_COLOR = {
  'Script seul':      { color: '#8B5CF6', bg: '#8B5CF614', border: '#8B5CF630' },
  'Script + Montage': { color: '#EF4444', bg: '#EF444414', border: '#EF444430' },
  'Pack mensuel':     { color: '#10B981', bg: '#10B98114', border: '#10B98130' },
};

// ── Avatars empilés des candidats ─────────────────────────────────────────────

function ApplicantStack({ applicants, color }) {
  const shown = applicants.slice(0, 3);
  return (
    <View style={styles.stackWrap}>
      {shown.map((a, i) => (
        <View
          key={a.id}
          style={[
            styles.stackAvatar,
            { backgroundColor: color + '33', borderColor: COLORS.bg, marginLeft: i === 0 ? 0 : -8 },
          ]}
        >
          <Text style={[styles.stackInitials, { color }]}>{a.initials}</Text>
        </View>
      ))}
      {applicants.length > 3 && (
        <View style={[styles.stackAvatar, { backgroundColor: COLORS.border, borderColor: COLORS.bg, marginLeft: -8 }]}>
          <Text style={[styles.stackInitials, { color: COLORS.textMuted }]}>+{applicants.length - 3}</Text>
        </View>
      )}
    </View>
  );
}

// ── Carte brief ───────────────────────────────────────────────────────────────

function BriefCard({ brief, onPress }) {
  const tc     = TYPE_COLOR[brief.type] ?? TYPE_COLOR['Script seul'];
  const count  = brief.applicants.length;
  const isMatched = brief.status === 'matched';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Bande colorée gauche */}
      <View style={[styles.cardAccent, { backgroundColor: brief.color }]} />

      <View style={styles.cardContent}>

        {/* Ligne 1 : type badge + statut */}
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
            <Ionicons name={brief.icon} size={10} color={tc.color} />
            <Text style={[styles.typeBadgeText, { color: tc.color }]}>{brief.type}</Text>
          </View>

          {isMatched ? (
            <View style={styles.matchedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text style={styles.matchedText}>Matchée</Text>
            </View>
          ) : (
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>En attente</Text>
            </View>
          )}
        </View>

        {/* Titre */}
        <Text style={styles.cardTitle} numberOfLines={2}>{brief.title}</Text>

        {/* Budget + deadline */}
        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="cash-outline" size={11} color="#22C55E" />
            <Text style={[styles.metaText, { color: '#22C55E', fontWeight: '800' }]}>{brief.budget}€</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="alarm-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{brief.deadline}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="film-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{brief.postsPerMonth} vidéos/mois</Text>
          </View>
        </View>

        {/* Candidats */}
        <View style={styles.cardBottom}>
          {count === 0 ? (
            <Text style={styles.noApplicants}>Aucune candidature pour l'instant…</Text>
          ) : (
            <View style={styles.applicantsRow}>
              <ApplicantStack applicants={brief.applicants} color={brief.color} />
              <Text style={styles.applicantsLabel}>
                {count} ghostwriter{count > 1 ? 's' : ''} ha candidaté{count > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {!isMatched && count > 0 && (
            <View style={[styles.viewCta, { borderColor: brief.color + '55' }]}>
              <Text style={[styles.viewCtaText, { color: brief.color }]}>Voir les candidatures</Text>
              <Ionicons name="arrow-forward" size={12} color={brief.color} />
            </View>
          )}
        </View>

      </View>
    </TouchableOpacity>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function ClientBriefsScreen() {
  const navigation = useNavigation();
  const { briefs } = useBriefs();

  const open    = briefs.filter(b => b.status === 'open');
  const matched = briefs.filter(b => b.status === 'matched');
  const newApplicants = open.reduce((n, b) => n + b.applicants.length, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mes Briefs</Text>
            <Text style={styles.headerSub}>
              {briefs.length === 0
                ? 'Postez votre premier brief'
                : `${briefs.length} brief${briefs.length > 1 ? 's' : ''} posté${briefs.length > 1 ? 's' : ''}`}
            </Text>
          </View>

          {newApplicants > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifText}>{newApplicants} nouvelle{newApplicants > 1 ? 's' : ''}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('BriefCreation')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, '#5B21B6']}
              style={styles.fabGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── État vide ── */}
          {briefs.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucun brief posté</Text>
              <Text style={styles.emptySub}>
                Créez votre premier brief pour recevoir des candidatures de ghostwriters TikTok.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('BriefCreation')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#5B21B6']}
                  style={styles.emptyBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.emptyBtnText}>Poster un brief</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Briefs ouverts ── */}
          {open.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>En attente de ghostwriter</Text>
              {open.map(b => (
                <BriefCard
                  key={b.id}
                  brief={b}
                  onPress={() => navigation.navigate('Applicants', { brief: b })}
                />
              ))}
            </View>
          )}

          {/* ── Briefs matchés ── */}
          {matched.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Matchées ✓</Text>
              {matched.map(b => (
                <BriefCard
                  key={b.id}
                  brief={b}
                  onPress={() => {}}
                />
              ))}
            </View>
          )}

          {/* ── CTA poster un autre ── */}
          {briefs.length > 0 && (
            <TouchableOpacity
              style={styles.newBriefBtn}
              onPress={() => navigation.navigate('BriefCreation')}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.newBriefText}>Poster un nouveau brief</Text>
            </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, flex: 1 },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  notifBadge:  {
    backgroundColor: COLORS.primary + '22', borderWidth: 1, borderColor: COLORS.primary + '44',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  notifText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  fab:       { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  fabGrad:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: 24 },

  // Empty
  emptyWrap:    { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyIcon:    { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: COLORS.text },
  emptySub:     { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACING.lg },
  emptyBtn:     { alignSelf: 'stretch', borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 4 },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Section
  section:      { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.sm,
  },
  cardAccent:  { width: 4 },
  cardContent: { flex: 1, padding: SPACING.md, gap: 10 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },

  matchedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22C55E12', borderWidth: 1, borderColor: '#22C55E30', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 'auto' },
  matchedText:  { fontSize: 10, fontWeight: '700', color: '#22C55E' },
  openBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  openDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  openText:     { fontSize: 10, fontWeight: '600', color: '#F59E0B' },

  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, lineHeight: 21 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  metaText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  cardBottom:    { gap: 8 },
  noApplicants:  { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  applicantsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  applicantsLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  // Avatar stack
  stackWrap:     { flexDirection: 'row', alignItems: 'center' },
  stackAvatar:   { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stackInitials: { fontSize: 9, fontWeight: '800' },

  // View CTA
  viewCta:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  viewCtaText: { fontSize: 11, fontWeight: '700' },

  // New brief button
  newBriefBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.primary + '40', borderStyle: 'dashed',
    borderRadius: RADIUS.xl, paddingVertical: 16,
  },
  newBriefText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
