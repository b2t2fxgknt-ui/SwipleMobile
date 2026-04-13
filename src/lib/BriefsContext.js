/**
 * BriefsContext — gestion des briefs postés par les clients
 * et des candidatures des freelances.
 */

import React, { createContext, useContext, useState } from 'react';

// ── Mock freelances déjà candidats ────────────────────────────────────────────

export const MOCK_FREELANCERS = [
  {
    id: 'f1', initials: 'LM', name: 'Lucas M.',
    specialty: 'Script + Montage', rating: 4.9, missions: 34,
    bio: 'Spécialisé niches business & coaching. Scripts percutants + montage dynamique.',
  },
  {
    id: 'f2', initials: 'CA', name: 'Chloé A.',
    specialty: 'Script seul', rating: 4.7, missions: 21,
    bio: 'Ex-journaliste reconvertie en ghostwriter TikTok. Storytelling et accroches redoutables.',
  },
  {
    id: 'f3', initials: 'RB', name: 'Raphaël B.',
    specialty: 'Pack mensuel', rating: 5.0, missions: 12,
    bio: 'Créateur de contenu depuis 3 ans. Livrables dans les délais, zéro mauvaise surprise.',
  },
  {
    id: 'f4', initials: 'SW', name: 'Sara W.',
    specialty: 'Script + Montage', rating: 4.8, missions: 27,
    bio: 'Spécialisée bien-être, santé et développement personnel. Ton authentique garanti.',
  },
];

// ── Briefs initiaux (démo) ────────────────────────────────────────────────────

const INITIAL_BRIEFS = [
  {
    id: 'br1',
    type: 'Script + Montage',
    color: '#EF4444',
    icon: 'videocam-outline',
    title: 'Ghostwriter pour mon coaching business féminin',
    activity: 'Coach business pour femmes entrepreneures',
    audience: 'Femmes 30-45 ans qui veulent quitter leur CDI',
    subject: 'Comment se lancer sans quitter son job',
    tone: 'Cash et bienveillant',
    platform: 'TikTok',
    postsPerMonth: 4,
    budget: 150,
    deadline: '48h',
    status: 'open',
    applicants: [MOCK_FREELANCERS[0], MOCK_FREELANCERS[1]],
  },
  {
    id: 'br2',
    type: 'Pack mensuel',
    color: '#10B981',
    icon: 'calendar-outline',
    title: 'Pack 8 vidéos TikTok pour ma formation Excel',
    activity: 'Formateur Excel et productivité',
    audience: 'Salariés 25-45 ans',
    subject: 'Raccourcis Excel que personne ne connaît',
    tone: 'Pratique et concis',
    platform: 'TikTok + Instagram',
    postsPerMonth: 8,
    budget: 400,
    deadline: '5j',
    status: 'open',
    applicants: [MOCK_FREELANCERS[2]],
  },
];

// ── Context ───────────────────────────────────────────────────────────────────

const BriefsContext = createContext(null);

export function BriefsProvider({ children }) {
  const [briefs, setBriefs] = useState(INITIAL_BRIEFS);

  function postBrief(brief) {
    const TYPE_COLOR = {
      'Script seul':      '#8B5CF6',
      'Script + Montage': '#EF4444',
      'Pack mensuel':     '#10B981',
    };
    const TYPE_ICON = {
      'Script seul':      'document-text-outline',
      'Script + Montage': 'videocam-outline',
      'Pack mensuel':     'calendar-outline',
    };
    const newBrief = {
      ...brief,
      id: `br${Date.now()}`,
      color: TYPE_COLOR[brief.type] ?? '#8B5CF6',
      icon:  TYPE_ICON[brief.type]  ?? 'document-text-outline',
      status: 'open',
      applicants: [],
    };
    setBriefs(prev => [newBrief, ...prev]);
    return newBrief;
  }

  function addApplicant(briefId, freelancer) {
    setBriefs(prev => prev.map(b => {
      if (b.id !== briefId) return b;
      if (b.applicants.some(a => a.id === freelancer.id)) return b;
      return { ...b, applicants: [...b.applicants, freelancer] };
    }));
  }

  function selectFreelancer(briefId) {
    setBriefs(prev => prev.map(b =>
      b.id === briefId ? { ...b, status: 'matched' } : b
    ));
  }

  return (
    <BriefsContext.Provider value={{ briefs, postBrief, addApplicant, selectFreelancer }}>
      {children}
    </BriefsContext.Provider>
  );
}

export const useBriefs = () => useContext(BriefsContext);
