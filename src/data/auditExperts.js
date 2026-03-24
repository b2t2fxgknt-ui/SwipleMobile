/**
 * auditExperts.js
 * Données partagées des experts Swiple utilisés dans :
 *  - AuditScreen (offres post-audit)
 *  - AIRecommendationsSwipeScreen (deck optimisation)
 *  - ExpertsScreen (experts sélectionnés)
 *  - MissionConfirmationScreen (profil freelance)
 */

export const CONVERSION_EXPERTS = [
  {
    id: 'cx1', name: 'Thomas G.', initials: 'TG',
    specialty: 'Hook & Script viral',
    tagline: 'Réécrit tes 3 premières secondes pour ×3 la rétention',
    bio: 'Copywriter TikTok avec 3 ans d\'expérience. Spécialisé dans les hooks viraux qui arrêtent le scroll et captent l\'attention en moins de 2 secondes. +127 créateurs optimisés.',
    solves: 'Hook trop lent',
    rating: 4.9, reviews: 127, price: 29, deliveryTime: '24h',
    proof: '2.1M vues en moyenne', color: '#EF4444',
    icon: 'flash-outline', badge: 'Top Copywriter',
    skills: ['Hook 0–3s', 'Script viral', 'Accroche TikTok', 'Rétention'],
    responseTime: '1h',
    before: { metric: '12%', views: 'rétention moyenne' },
    after:  { metric: '38%', views: 'après réécriture hook' },
  },
  {
    id: 'cx2', name: 'Léa M.', initials: 'LM',
    specialty: 'Montage & Sous-titres TikTok',
    tagline: 'Sous-titres pro + rythme de coupe optimisé',
    bio: 'Monteuse vidéo spécialisée TikTok et Reels. Sous-titres animés natifs, cuts dynamiques et synchronisation son pour maximiser le watch time et la complétion.',
    solves: 'Sous-titres manquants',
    rating: 4.8, reviews: 89, price: 49, deliveryTime: '24h',
    proof: '1.4M vues en moyenne', color: '#F59E0B',
    icon: 'text-outline', badge: 'Livraison 24h',
    skills: ['Sous-titres animés', 'Montage TikTok', 'CapCut Pro', 'Watch time'],
    responseTime: '2h',
    before: { metric: '42%', views: 'watch time moyen' },
    after:  { metric: '71%', views: 'après optimisation montage' },
  },
  {
    id: 'cx3', name: 'Noah P.', initials: 'NP',
    specialty: 'Optimisation TikTok complète',
    tagline: 'Prend en charge l\'intégralité de l\'optimisation',
    bio: 'Expert en optimisation TikTok de bout en bout. Hook, montage, sous-titres, son trending — Noah s\'occupe de tout pour une vidéo entièrement prête à performer.',
    solves: 'Tous les points critiques',
    rating: 5.0, reviews: 56, price: 89, deliveryTime: '48h',
    proof: '3.2M vues en moyenne', color: '#8B5CF6',
    icon: 'sparkles-outline', badge: 'Expert Swiple',
    skills: ['Optimisation complète', 'Hook & Script', 'Montage pro', 'Son trending', 'Distribution'],
    responseTime: '3h',
    before: { metric: '8%',   views: 'portée organique' },
    after:  { metric: '3.2M', views: 'vues en moyenne' },
  },
];

export const PACK_PRICE    = 60;
export const PACK_ORIGINAL = 127;

export const PACK_ITEMS = [
  { icon: 'flash-outline',        label: 'Hook réécrit (0–3s)' },
  { icon: 'cut-outline',          label: 'Montage + rythme optimisé' },
  { icon: 'text-outline',         label: 'Sous-titres animés' },
  { icon: 'musical-note-outline', label: 'Son trending ajouté' },
];

/**
 * Convertit un CONVERSION_EXPERT en objet compatible FreelancerProfileSheet.
 */
export function toSheetExpert(expert) {
  return {
    name:         expert.name,
    initials:     expert.initials,
    specialty:    expert.specialty,
    bio:          expert.bio ?? expert.tagline,
    skills:       expert.skills ?? [],
    price:        expert.price,
    rating:       expert.rating,
    reviewCount:  expert.reviews,
    level:        expert.badge,
    deliveryTime: expert.deliveryTime,
    responseTime: expert.responseTime,
    before:       expert.before,
    after:        expert.after,
    color:        expert.color,
    icon:         expert.icon,
  };
}

/**
 * Convertit un expert issu du contexte ExpertSelection (format AUDIT_EXPERT_RECS)
 * en objet compatible FreelancerProfileSheet.
 * Enrichit avec les données CONVERSION_EXPERTS si l'expert est reconnu.
 */
export function toSheetFromContextExpert(expert) {
  const base = CONVERSION_EXPERTS.find(e => e.initials === expert.expertInitials) ?? {};
  return {
    name:         expert.expertName,
    initials:     expert.expertInitials,
    specialty:    expert.expertSpecialty,
    bio:          base.bio ?? expert.expertDesc,
    skills:       base.skills ?? [],
    price:        expert.expertPrice,
    rating:       expert.expertRating,
    reviewCount:  expert.expertReviews ?? base.reviews,
    level:        expert.expertBadge,
    deliveryTime: expert.expertDelivery,
    responseTime: base.responseTime,
    before:       base.before,
    after:        base.after,
    color:        expert.expertColor,
    icon:         expert.expertIcon,
  };
}

/**
 * Convertit les params freelancer de MissionConfirmationScreen
 * en objet compatible FreelancerProfileSheet.
 */
export function toSheetFromMissionFreelancer(freelancer) {
  const base = CONVERSION_EXPERTS.find(e => e.initials === freelancer.initials) ?? {};
  return {
    name:         freelancer.name,
    initials:     freelancer.initials,
    specialty:    freelancer.specialty,
    bio:          base.bio,
    skills:       base.skills ?? [],
    price:        freelancer.price ?? base.price,
    rating:       freelancer.rating,
    reviewCount:  base.reviews,
    level:        freelancer.level,
    deliveryTime: base.deliveryTime ?? freelancer.deadline,
    responseTime: base.responseTime,
    before:       base.before,
    after:        base.after,
    color:        freelancer.color,
    icon:         base.icon ?? 'person-outline',
  };
}
