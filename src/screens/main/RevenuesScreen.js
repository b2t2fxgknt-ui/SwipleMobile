/**
 * RevenuesScreen.js — Historique, revenus et statistiques freelance.
 *
 * Affiche les gains, missions terminées, taux d'acceptation,
 * note moyenne et un graphique hebdomadaire.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
 StatusBar, Animated, TouchableOpacity,
  TextInput, Platform, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

// ── Données mock ──────────────────────────────────────────────────────────────

const TOTAL_EARNINGS = 1_847;
const STATS = {
  acceptanceRate: 87,
  avgRating:      4.9,
  missionsDone:   24,
  streak:         7,
};

// Revenus des 7 derniers jours
const WEEKLY_BARS = [
  { day: 'L',  amount: 120, isToday: false },
  { day: 'M',  amount: 0,   isToday: false },
  { day: 'Me', amount: 210, isToday: false },
  { day: 'J',  amount: 80,  isToday: false },
  { day: 'V',  amount: 340, isToday: false },
  { day: 'S',  amount: 190, isToday: false },
  { day: 'D',  amount: 65,  isToday: true  },
];

const MAX_BAR = Math.max(...WEEKLY_BARS.map(b => b.amount));

// Badges freelance
const FREELANCE_BADGES = [
  { icon: 'ribbon',       color: '#F97316', label: 'Hook Expert',     desc: '10 missions Hook complétées'  },
  { icon: 'flame',        color: '#EF4444', label: 'Top Performer',   desc: 'Note ≥ 4.8 sur 20 missions'   },
  { icon: 'flash',        color: '#F59E0B', label: 'Réactivité ★★★', desc: 'Répond en moins de 2h'         },
];

// Missions terminées (historique)
const COMPLETED_MISSIONS = [
  {
    id: 'c1', type: 'Hook',       icon: 'timer-outline',             color: '#EF4444',
    title: 'Hook TikTok lifestyle', client: 'Léa M.',
    budget: 45, rating: 5.0, date: 'Hier', status: 'Livré',
  },
  {
    id: 'c2', type: 'Montage',    icon: 'cut-outline',               color: '#8B5CF6',
    title: 'Montage YouTube Shorts fitness', client: 'Tom R.',
    budget: 120, rating: 4.9, date: 'Il y a 3j', status: 'Livré',
  },
  {
    id: 'c3', type: 'Sous-titres',icon: 'text-outline', color: '#3B82F6',
    title: 'Sous-titres Reels mode', client: 'Sarah K.',
    budget: 30, rating: 5.0, date: 'Il y a 5j', status: 'Livré',
  },
  {
    id: 'c4', type: 'Script',     icon: 'document-text-outline',     color: '#10B981',
    title: 'Script viral TikTok Tech', client: 'Alex P.',
    budget: 80, rating: 4.8, date: 'Il y a 1 sem', status: 'Livré',
  },
];

// ── Barre animée (graphique) ──────────────────────────────────────────────────

function WeekBar({ bar, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = MAX_BAR > 0 ? bar.amount / MAX_BAR : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.barCol}>
      {bar.amount > 0 && (
        <Text style={[styles.barAmount, bar.isToday && { color: COLORS.prestataire }]}>
          {bar.amount}€
        </Text>
      )}
      <View style={styles.barTrack}>
        <Animated.View style={[
          styles.barFill,
          {
            height: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: bar.isToday ? COLORS.prestataire : COLORS.prestataire + '55',
          },
        ]} />
      </View>
      <Text style={[styles.barDay, bar.isToday && { color: COLORS.prestataire, fontWeight: '800' }]}>
        {bar.day}
      </Text>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

// ── WithdrawalSheet ───────────────────────────────────────────────────────────

const AVAILABLE_BALANCE = 347; // solde disponible mock
const BANKS_MOCK = [
  { id: 'b1', name: 'BNP Paribas', iban: 'FR76 3000 4028 ****  **** **** 943', default: true },
];

function WithdrawalSheet({ visible, onClose }) {
  const sheetY   = useRef(new Animated.Value(700)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [amount,   setAmount]  = useState('');
  const [step,     setStep]    = useState('form'); // 'form' | 'confirm' | 'done'

  useEffect(() => {
    if (visible) {
      setStep('form'); setAmount('');
      Animated.parallel([
        Animated.spring(sheetY,   { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,   { toValue: 700, duration: 260, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0,   duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const requested = Number(amount) || AVAILABLE_BALANCE;
  const fee       = 0; // pas de frais

  const handleConfirm = useCallback(() => {
    Keyboard.dismiss();
    if (step === 'form') {
      if (amount !== '' && Number(amount) < 10) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep('confirm');
    } else if (step === 'confirm') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('done');
      setTimeout(onClose, 2400);
    }
  }, [step, amount, onClose]);

  if (!visible) return null;

  return (
    <>
      <Animated.View style={[wStyles.backdrop, { opacity: backdrop }]} pointerEvents="box-none">
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[wStyles.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={wStyles.handle} />

        {step === 'done' ? (
          // ── Succès ──
          <View style={wStyles.doneWrap}>
            <LinearGradient colors={[COLORS.prestataire, '#059669']} style={wStyles.doneIcon}>
              <Ionicons name="checkmark" size={32} color="#fff" />
            </LinearGradient>
            <Text style={wStyles.doneTitle}>Virement demandé !</Text>
            <Text style={wStyles.doneSub}>
              {requested}€ seront crédités sous 1–3 jours ouvrés sur votre compte BNP Paribas.
            </Text>
          </View>
        ) : step === 'confirm' ? (
          // ── Confirmation ──
          <>
            <Text style={wStyles.sheetTitle}>Confirmer le virement</Text>
            <View style={wStyles.confirmCard}>
              <LinearGradient colors={[COLORS.prestataire + '18', 'transparent']} style={StyleSheet.absoluteFill} borderRadius={RADIUS.lg} />
              <View style={wStyles.confirmRow}>
                <Text style={wStyles.confirmLabel}>Montant</Text>
                <Text style={[wStyles.confirmVal, { color: COLORS.prestataire }]}>{requested}€</Text>
              </View>
              <View style={wStyles.confirmRow}>
                <Text style={wStyles.confirmLabel}>Frais</Text>
                <Text style={wStyles.confirmVal}>0€ — Gratuit</Text>
              </View>
              <View style={[wStyles.confirmRow, { borderBottomWidth: 0 }]}>
                <Text style={wStyles.confirmLabel}>Destination</Text>
                <Text style={wStyles.confirmVal} numberOfLines={1}>BNP ···943</Text>
              </View>
              <View style={wStyles.confirmTotal}>
                <Text style={wStyles.confirmTotalLabel}>Vous recevrez</Text>
                <Text style={[wStyles.confirmTotalVal, { color: COLORS.prestataire }]}>{requested}€</Text>
              </View>
            </View>
            <View style={wStyles.confirmInfo}>
              <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
              <Text style={wStyles.confirmInfoText}>Délai : 1 à 3 jours ouvrés</Text>
            </View>
            <TouchableOpacity style={wStyles.cta} onPress={handleConfirm} activeOpacity={0.88}>
              <LinearGradient colors={[COLORS.prestataire, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={wStyles.ctaGrad}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={wStyles.ctaText}>Confirmer le virement</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={wStyles.back} onPress={() => setStep('form')}>
              <Text style={wStyles.backText}>Modifier</Text>
            </TouchableOpacity>
          </>
        ) : (
          // ── Formulaire ──
          <>
            <Text style={wStyles.sheetTitle}>Retirer mes gains</Text>
            <Text style={wStyles.sheetSub}>Solde disponible : <Text style={{ color: COLORS.prestataire, fontWeight: '700' }}>{AVAILABLE_BALANCE}€</Text></Text>

            {/* Montant */}
            <View style={wStyles.amountSection}>
              <Text style={wStyles.fieldLabel}>Montant (€)</Text>
              <View style={wStyles.amountRow}>
                <View style={wStyles.amountInput}>
                  <TextInput
                    style={wStyles.amountField}
                    value={amount}
                    onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
                    placeholder={String(AVAILABLE_BALANCE)}
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <Text style={wStyles.euroSign}>€</Text>
                </View>
                <TouchableOpacity style={wStyles.allBtn} onPress={() => { setAmount(String(AVAILABLE_BALANCE)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={wStyles.allBtnText}>Tout retirer</Text>
                </TouchableOpacity>
              </View>
              {amount !== '' && Number(amount) < 10 && (
                <Text style={wStyles.errorText}>Minimum 10€ par virement</Text>
              )}
            </View>

            {/* Compte bancaire */}
            <View style={wStyles.bankSection}>
              <Text style={wStyles.fieldLabel}>Compte destinataire</Text>
              {BANKS_MOCK.map(bank => (
                <View key={bank.id} style={wStyles.bankCard}>
                  <View style={wStyles.bankIconBox}>
                    <Ionicons name="card-outline" size={18} color={COLORS.prestataire} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={wStyles.bankName}>{bank.name}</Text>
                    <Text style={wStyles.bankIban}>{bank.iban}</Text>
                  </View>
                  <View style={wStyles.defaultBadge}>
                    <Text style={wStyles.defaultText}>Principal</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={wStyles.addBankBtn}>
                <Ionicons name="add-circle-outline" size={15} color={COLORS.textMuted} />
                <Text style={wStyles.addBankText}>Ajouter un compte</Text>
              </TouchableOpacity>
            </View>

            {/* Info frais */}
            <View style={wStyles.feeInfo}>
              <Ionicons name="shield-checkmark-outline" size={13} color='#22C55E' />
              <Text style={wStyles.feeInfoText}>Virement gratuit · Aucuns frais</Text>
            </View>

            <TouchableOpacity
              style={[wStyles.cta, (amount !== '' && Number(amount) < 10) && wStyles.ctaDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.88}
            >
              <LinearGradient colors={[COLORS.prestataire, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={wStyles.ctaGrad}>
                <Ionicons name="arrow-forward-circle-outline" size={16} color="#fff" />
                <Text style={wStyles.ctaText}>Continuer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </>
  );
}

const wStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 20 },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
    backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 48 : SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.xs },
  sheetTitle: { fontSize: 20, ...FONT.bold, color: COLORS.text },
  sheetSub:   { fontSize: 13, color: COLORS.textMuted, marginTop: -SPACING.sm },

  // Amount
  amountSection: { gap: 8 },
  fieldLabel: { fontSize: 12, ...FONT.semibold, color: COLORS.textMuted },
  amountRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  amountInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  amountField: { flex: 1, fontSize: 24, ...FONT.bold, color: COLORS.text },
  euroSign: { fontSize: 20, ...FONT.bold, color: COLORS.textMuted },
  allBtn: {
    backgroundColor: COLORS.prestataire + '18', borderWidth: 1, borderColor: COLORS.prestataire + '40',
    borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12,
  },
  allBtnText: { fontSize: 13, ...FONT.semibold, color: COLORS.prestataire },
  errorText: { fontSize: 11, color: COLORS.error },

  // Bank
  bankSection: { gap: 8 },
  bankCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  bankIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.prestataire + '18', alignItems: 'center', justifyContent: 'center' },
  bankName:   { fontSize: 13, ...FONT.semibold, color: COLORS.text },
  bankIban:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  defaultBadge: { backgroundColor: COLORS.prestataire + '18', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.prestataire + '40' },
  defaultText:  { fontSize: 10, ...FONT.semibold, color: COLORS.prestataire },
  addBankBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  addBankText:{ fontSize: 13, color: COLORS.textMuted },

  // Fee info
  feeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feeInfoText: { fontSize: 12, color: '#22C55E' },

  // CTA
  cta: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.sm },
  ctaDisabled: { opacity: 0.45 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  ctaText: { fontSize: 15, ...FONT.bold, color: '#fff' },
  back: { alignItems: 'center', paddingVertical: 4 },
  backText: { fontSize: 13, color: COLORS.textMuted },

  // Confirm
  confirmCard: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', paddingHorizontal: SPACING.md,
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  confirmLabel:{ fontSize: 13, color: COLORS.textMuted },
  confirmVal:  { fontSize: 13, ...FONT.semibold, color: COLORS.text },
  confirmTotal:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 0 },
  confirmTotalLabel: { fontSize: 15, ...FONT.semibold, color: COLORS.text },
  confirmTotalVal:   { fontSize: 22, fontWeight: '900' },
  confirmInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmInfoText: { fontSize: 12, color: COLORS.textMuted },

  // Done
  doneWrap: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xl },
  doneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
  doneTitle:{ fontSize: 22, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  doneSub:  { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function RevenuesScreen() {
  const earningsAnim = useRef(new Animated.Value(0)).current;
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  // Compteur revenus
  useEffect(() => {
    Animated.timing(earningsAnim, {
      toValue: 1, duration: 1400, useNativeDriver: false,
    }).start();
  }, []);

  const displayEarnings = earningsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOTAL_EARNINGS],
  });

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BubbleBackground variant="prestataire" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerBadge}>
              <Ionicons name="bar-chart" size={11} color={COLORS.prestataire} />
              <Text style={styles.headerBadgeText}>Tableau de bord</Text>
            </View>
            <Text style={styles.headerTitle}>
              {'Mes\n'}
              <Text style={{ color: COLORS.prestataire }}>revenus</Text>
            </Text>
          </View>
          <View style={[styles.streakPill, { borderColor: '#F59E0B40' }]}>
            <Ionicons name="flame" size={14} color="#F59E0B" />
            <Text style={styles.streakNum}>{STATS.streak}</Text>
            <Text style={styles.streakLabel}>jours</Text>
          </View>
        </View>

        {/* ── TOTAL GAINS ── */}
        <View style={styles.earningsCard}>
          <LinearGradient
            colors={[COLORS.prestataire + '25', COLORS.prestataire + '08']}
            style={StyleSheet.absoluteFill}
            borderRadius={RADIUS.xl}
          />
          <Text style={styles.earningsLabel}>Gains totaux ce mois</Text>
          <AnimatedEarnings anim={earningsAnim} total={TOTAL_EARNINGS} />
          <Text style={styles.earningsCurrency}>euros</Text>
          <View style={styles.earningsTrend}>
            <Ionicons name="trending-up" size={14} color="#22C55E" />
            <Text style={styles.earningsTrendText}>+23 % vs mois dernier</Text>
          </View>
        </View>

        {/* ── SOLDE DISPONIBLE + RETRAIT ── */}
        <TouchableOpacity
          style={styles.withdrawCard}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWithdrawal(true); }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.prestataire + '18', COLORS.prestataire + '06']}
            style={StyleSheet.absoluteFill}
            borderRadius={RADIUS.xl}
          />
          <View style={styles.withdrawLeft}>
            <View style={styles.withdrawIconBox}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.prestataire} />
            </View>
            <View>
              <Text style={styles.withdrawLabel}>Solde disponible</Text>
              <Text style={styles.withdrawAmount}>{AVAILABLE_BALANCE}€</Text>
            </View>
          </View>
          <View style={[styles.withdrawBtn, { backgroundColor: COLORS.prestataire }]}>
            <Ionicons name="arrow-up-outline" size={14} color="#fff" />
            <Text style={styles.withdrawBtnText}>Retirer</Text>
          </View>
        </TouchableOpacity>

        {/* ── STATS RAPIDES ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#22C55E' }]}>{STATS.acceptanceRate}%</Text>
            <Text style={styles.statLabel}>Acceptation</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRatingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.statNum, { color: '#F59E0B' }]}>{STATS.avgRating}</Text>
            </View>
            <Text style={styles.statLabel}>Note moy.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: COLORS.prestataire }]}>{STATS.missionsDone}</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
        </View>

        {/* ── GRAPHIQUE 7 JOURS ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Revenus 7 derniers jours</Text>
            <Text style={styles.chartTotal}>+{WEEKLY_BARS.reduce((s, b) => s + b.amount, 0)}€</Text>
          </View>
          <View style={styles.barsRow}>
            {WEEKLY_BARS.map((bar, i) => (
              <WeekBar key={bar.day} bar={bar} delay={i * 80} />
            ))}
          </View>
        </View>

        {/* ── BADGES ── */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>
            <Ionicons name="ribbon-outline" size={14} color={COLORS.textMuted} />
            {'  Mes badges'}
          </Text>
          <View style={styles.badgesGrid}>
            {FREELANCE_BADGES.map((b, i) => (
              <View key={i} style={[styles.badgeCard, { borderColor: b.color + '30', backgroundColor: b.color + '08' }]}>
                <View style={[styles.badgeIconBox, { backgroundColor: b.color + '20' }]}>
                  <Ionicons name={b.icon} size={22} color={b.color} />
                </View>
                <Text style={[styles.badgeName, { color: b.color }]}>{b.label}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HISTORIQUE MISSIONS ── */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>
            <Ionicons name="list-outline" size={14} color={COLORS.textMuted} />
            {'  Voir toutes les missions'}
          </Text>

          {COMPLETED_MISSIONS.map(m => (
            <View key={m.id} style={styles.historyCard}>
              <View style={[styles.historyIconBox, { backgroundColor: m.color + '18' }]}>
                <Ionicons name={m.icon} size={18} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle} numberOfLines={1}>{m.title}</Text>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyClient}>{m.client}</Text>
                  <Text style={styles.historyDot}>·</Text>
                  <Text style={styles.historyDate}>{m.date}</Text>
                  <Text style={styles.historyDot}>·</Text>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text style={styles.historyRating}>{m.rating}</Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <Text style={[styles.historyBudget, { color: '#22C55E' }]}>+{m.budget}€</Text>
                <View style={styles.deliveredBadge}>
                  <Text style={styles.deliveredText}>{m.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    <WithdrawalSheet visible={showWithdrawal} onClose={() => setShowWithdrawal(false)} />
    </View>
  );
}

// ── Composant earnings animé (Animated.Text n'existe pas nativement → workaround) ──

function AnimatedEarnings({ anim, total }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const listener = anim.addListener(({ value }) => {
      setDisplay(Math.round(value * total));
    });
    return () => anim.removeListener(listener);
  }, [anim, total]);

  return (
    <Text style={styles.earningsNum}>
      {display.toLocaleString('fr-FR')}
    </Text>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  // Header
  header: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.prestataire + '18', borderColor: COLORS.prestataire + '30', borderWidth: 1,
    borderRadius: RADIUS.full, alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3, marginBottom: 6,
  },
  headerBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.prestataire, letterSpacing: 0.3 },
  headerTitle:     { fontSize: 20, fontWeight: '800', color: COLORS.text, lineHeight: 26 },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2,
    backgroundColor: '#F59E0B12', borderWidth: 1,
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  streakNum:   { fontSize: 15, fontWeight: '900', color: '#F59E0B' },
  streakLabel: { fontSize: 10, color: '#F59E0B', fontWeight: '600' },

  // Withdrawal card
  withdrawCard: {
    marginHorizontal: SPACING.lg, marginTop: 0, marginBottom: SPACING.sm,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.prestataire + '30',
    padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden', position: 'relative',
  },
  withdrawLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  withdrawIconBox:{ width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.prestataire + '18', alignItems: 'center', justifyContent: 'center' },
  withdrawLabel:  { fontSize: 11, color: COLORS.textMuted, ...FONT.medium },
  withdrawAmount: { fontSize: 22, fontWeight: '900', color: COLORS.prestataire },
  withdrawBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 9 },
  withdrawBtnText:{ fontSize: 13, ...FONT.bold, color: '#fff' },

  // Earnings card
  earningsCard: {
    marginHorizontal: SPACING.lg, marginVertical: SPACING.sm,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    alignItems: 'center', overflow: 'hidden', gap: 2,
  },
  earningsLabel:    { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  earningsNum:      { fontSize: 42, fontWeight: '900', color: COLORS.prestataire, lineHeight: 50 },
  earningsCurrency: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: -2 },
  earningsTrend: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
    backgroundColor: '#22C55E12', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  earningsTrendText: { fontSize: 11, fontWeight: '700', color: '#22C55E' },

  // Stats row
  statsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingVertical: 10, paddingHorizontal: 6,
    alignItems: 'center', gap: 3,
  },
  statRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statNum:       { fontSize: 17, fontWeight: '900' },
  statLabel:     { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  // Chart
  chartCard: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.md,
  },
  chartHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  chartTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  chartTotal: { fontSize: 13, fontWeight: '800', color: '#22C55E' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 76 },
  barCol: { flex: 1, alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' },
  barAmount: { fontSize: 7, fontWeight: '700', color: COLORS.textMuted },
  barTrack: {
    width: '100%', flex: 1, backgroundColor: COLORS.border,
    borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 4 },
  barDay:  { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },

  // Block
  block: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, gap: 8 },
  blockTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.2 },

  // Badges
  badgesGrid: { flexDirection: 'row', gap: SPACING.sm },
  badgeCard: {
    flex: 1, borderWidth: 1, borderRadius: RADIUS.lg, paddingVertical: 10, paddingHorizontal: 6,
    alignItems: 'center', gap: 5,
  },
  badgeIconBox:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badgeName:     { fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2 },
  badgeDesc:     { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', lineHeight: 12 },

  // History cards
  historyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingVertical: 10, paddingHorizontal: SPACING.md,
  },
  historyIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  historyTitle:   { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  historyMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyClient:  { fontSize: 11, color: COLORS.textMuted },
  historyDot:     { fontSize: 10, color: COLORS.textMuted },
  historyDate:    { fontSize: 11, color: COLORS.textMuted },
  historyRating:  { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  historyRight:   { alignItems: 'flex-end', gap: 3 },
  historyBudget:  { fontSize: 14, fontWeight: '800' },
  deliveredBadge: {
    backgroundColor: '#22C55E14', borderWidth: 1, borderColor: '#22C55E30',
    borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  deliveredText:  { fontSize: 9, fontWeight: '800', color: '#22C55E' },
});
