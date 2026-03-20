/**
 * freelancers.js — Source de vérité partagée pour les freelancers Swiple.
 *
 * Utilisé par :
 *   - FreelanceSwipeScreen   (deck de cartes à swiper)
 *   - AuditScreen            (section "Experts recommandés" après audit)
 *   - AIRecommendationsSwipeScreen (section "Experts matchés" en fin de swipe)
 *
 * La fonction `matchFreelancers()` est le moteur de matching IA :
 * elle croise les catégories de problèmes détectés avec les tags
 * de chaque freelancer pour retourner les 3 meilleurs profils.
 */

import { COLORS } from '../lib/theme';

// ── Palette catégories (partagée avec les autres écrans) ──────────────────────

export const CATEGORY_ACCENT = {
  video_montage:     '#7C3AED',
  design:            '#EC4899',
  copywriting:       '#3B82F6',
  reseaux_sociaux:   '#F59E0B',
  ia_automatisation: '#10B981',
  site_web:          '#06B6D4',
};

export const CATEGORY_ICON = {
  video_montage:     'videocam',
  design:            'color-palette',
  copywriting:       'create',
  reseaux_sociaux:   'phone-portrait',
  ia_automatisation: 'hardware-chip',
  site_web:          'globe',
};

// ── Données freelancers ───────────────────────────────────────────────────────
//
// Chaque freelancer possède un champ `tags` (compétences internes pour le
// matching) et un champ `matchReasons` (libellé affiché sur la carte de match
// selon le type de problème détecté).

export const FREELANCERS = [
  {
    id: '1',
    name: 'Lucas Martin',
    initials: 'LM',
    specialty: 'Montage TikTok viral',
    skills: ['Hook 0–3s', 'Captions animées', 'Transitions'],
    price: 49,
    rating: 4.9,
    reviewCount: 127,
    level: 'Top vendeur',
    category: 'video_montage',
    bio: 'Je transforme tes raw footage en contenu viral. +500 vidéos, 3 créateurs à 1M+ abonnés.',
    deliveryTime: '24h',
    responseTime: '< 1h',
    before: { metric: '0.8% ER', views: '800 vues' },
    after:  { metric: '3.6% ER', views: '2.8M vues' },
    // Tags internes pour le moteur de matching
    tags: ['hook', 'subtitle', 'captions', 'sound', 'format', 'montage'],
    // Raison d'affichage selon la catégorie de problème
    matchReasons: {
      hook:          'Spécialiste hooks 0–3s percutants',
      subtitle:      'Captions animées incluses',
      sound:         'Intègre les sons trending',
      format:        'Format court natif TikTok',
      'Hook':        'Spécialiste hooks viraux',
      'Sous-titres': 'Captions animées pro',
      'Son':         'Sons trending intégrés',
      'Format':      'Format natif TikTok',
    },
  },
  {
    id: '2',
    name: 'Sofia Benali',
    initials: 'SB',
    specialty: 'Montage UGC natif',
    skills: ['UGC organique', 'Storytelling', 'Musique trending'],
    price: 79,
    rating: 5.0,
    reviewCount: 203,
    level: 'Top vendeur',
    category: 'video_montage',
    bio: 'Expert UGC. Mon montage génère +40 % de rétention vs contenu standard.',
    deliveryTime: '72h',
    responseTime: '< 3h',
    before: { metric: '1.1% ER', views: '1.2K vues' },
    after:  { metric: '4.8% ER', views: '1.4M vues' },
    tags: ['sound', 'framing', 'format', 'montage'],
    matchReasons: {
      sound:     'Sélection sons trending',
      framing:   'Cadrage UGC optimisé 9:16',
      format:    'Format natif UGC court',
      'Son':     'Musique trending intégrée',
      'Cadrage': 'Cadrage 9:16 natif',
      'Format':  'Format organique court',
    },
  },
  {
    id: '3',
    name: 'Marie Lefèvre',
    initials: 'ML',
    specialty: 'Design & Miniatures YouTube',
    skills: ['Miniatures CTR', 'Charte graphique', 'Motion design'],
    price: 29,
    rating: 4.8,
    reviewCount: 89,
    level: 'Confirmé',
    category: 'design',
    bio: 'Mes miniatures augmentent le CTR de +35 % en moyenne. Spé. tech & lifestyle.',
    deliveryTime: '12h',
    responseTime: '< 2h',
    before: { metric: '3.2% CTR', views: '12K impressions' },
    after:  { metric: '8.7% CTR', views: '12K impressions' },
    tags: ['framing', 'lighting', 'design', 'visuel'],
    matchReasons: {
      framing:   'Composition visuelle pro',
      lighting:  'Optimisation éclairage',
      'Cadrage': 'Cadrage & composition',
      'Lumière': 'Expert éclairage vidéo',
    },
  },
  {
    id: '4',
    name: 'Thomas Durand',
    initials: 'TD',
    specialty: 'Script & Hook viral',
    skills: ['Hook rédactionnel', 'Narration', 'CTA optimisé'],
    price: 35,
    rating: 4.7,
    reviewCount: 54,
    level: 'Expert',
    category: 'copywriting',
    bio: 'Ancien journaliste. Mes scripts génèrent ×2 d\'engagement vs scripts classiques.',
    deliveryTime: '48h',
    responseTime: '< 6h',
    before: { metric: '2% engagement', views: '800 vues avg' },
    after:  { metric: '6% engagement', views: '3.2M vues avg' },
    tags: ['hook', 'cta', 'hashtags', 'script', 'copywriting'],
    matchReasons: {
      hook:      'Scripts hooks percutants',
      cta:       'CTA haute conversion',
      hashtags:  'Stratégie texte & caption',
      'Hook':    'Maître des hooks viraux',
      'CTA':     'Expert appels à l\'action',
      'Hashtags':'Stratégie caption & hashtags',
    },
  },
  {
    id: '5',
    name: 'Emma Petit',
    initials: 'EP',
    specialty: 'Sous-titres animés TikTok',
    skills: ['Sous-titres animés', 'Sync parfaite', 'Styles trending'],
    price: 19,
    rating: 4.9,
    reviewCount: 312,
    level: 'Top vendeur',
    category: 'video_montage',
    bio: 'Spé. sous-titres depuis 3 ans. Utilisé par 50+ créateurs du Top 500.',
    deliveryTime: '6h',
    responseTime: '< 30min',
    before: { metric: '62% rétention', views: 'sans ss-titres' },
    after:  { metric: '88% rétention', views: 'avec ss-titres' },
    tags: ['subtitle', 'captions', 'format'],
    matchReasons: {
      subtitle:      'Spécialiste sous-titres animés',
      format:        'Livraison optimisée 6h',
      'Sous-titres': '312 avis 5★ sous-titres',
      'Format':      'Format et rétention',
    },
  },
  {
    id: '6',
    name: 'Alex Khoury',
    initials: 'AK',
    specialty: 'Stratégie réseaux sociaux',
    skills: ['Calendrier éditorial', 'Analyse insights', 'Growth hacking'],
    price: 55,
    rating: 4.8,
    reviewCount: 76,
    level: 'Expert',
    category: 'reseaux_sociaux',
    bio: 'J\'ai accompagné 30+ créateurs de 0 à 100K abonnés en moins de 6 mois.',
    deliveryTime: '3 jours',
    responseTime: '< 4h',
    before: { metric: '1.2K followers', views: 'avant stratégie' },
    after:  { metric: '112K followers', views: 'en 5 mois' },
    tags: ['hashtags', 'cta', 'strategie'],
    matchReasons: {
      hashtags:  'Stratégie hashtags ciblée',
      cta:       'Growth & calls-to-action',
      'Hashtags':'Expert hashtags & distribution',
      'CTA':     'Stratégie growth & CTA',
    },
  },
];

// ── Moteur de matching IA ─────────────────────────────────────────────────────
//
// Correspondance catégories de problèmes → tags freelancers.
// Couvre à la fois les catégories de AuditScreen (clés minuscules)
// et celles de AIRecommendationsSwipeScreen (catégories affichées).

const CATEGORY_TO_TAGS = {
  // ── AuditScreen (issueCategory) ──
  hook:     ['hook', 'script', 'copywriting'],
  subtitle: ['subtitle', 'captions'],
  sound:    ['sound', 'montage'],
  framing:  ['framing', 'design', 'visuel'],
  hashtags: ['hashtags', 'strategie'],
  format:   ['format', 'montage'],
  cta:      ['cta', 'hook', 'script'],
  lighting: ['lighting', 'design', 'visuel'],

  // ── AIRecommendationsSwipeScreen (rec.category exact) ──
  'Hook':        ['hook', 'script'],
  'Sous-titres': ['subtitle', 'captions'],
  'Son':         ['sound', 'montage'],
  'Cadrage':     ['framing', 'design'],
  'Hashtags':    ['hashtags', 'strategie'],
  'Format':      ['format', 'montage'],
  'CTA':         ['cta', 'hook'],
  'Lumière':     ['lighting', 'design'],
};

/**
 * Retourne les N freelancers les mieux adaptés aux catégories de problèmes
 * passées en paramètre.
 *
 * @param {string[]} categories - Catégories de problèmes détectés.
 *   Ex. issue audit: ['hook', 'subtitle', 'sound']
 *   Ex. reco IA:     ['Hook', 'Sous-titres', 'Format']
 * @param {number}   limit      - Nombre max de freelancers à retourner (défaut 3).
 * @returns {Array}  Freelancers enrichis avec `matchReason` et `score`.
 */
export function matchFreelancers(categories = [], limit = 3) {
  if (!categories || categories.length === 0) {
    // Aucune catégorie → top freelancers par note
    return [...FREELANCERS]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(f => ({ ...f, matchReason: f.specialty, score: 0 }));
  }

  const scored = FREELANCERS.map(f => {
    let score = 0;
    let bestCat = null;

    categories.forEach(cat => {
      const tags      = CATEGORY_TO_TAGS[cat] ?? [];
      const hitCount  = tags.filter(t => f.tags.includes(t)).length;
      if (hitCount > 0) {
        score += hitCount;
        if (!bestCat) bestCat = cat;
      }
    });

    const matchReason =
      bestCat && f.matchReasons?.[bestCat]
        ? f.matchReasons[bestCat]
        : f.specialty;

    return { ...f, score, matchReason };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.rating - a.rating)
    .slice(0, limit);
}
