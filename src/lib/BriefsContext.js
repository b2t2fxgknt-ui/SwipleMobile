/**
 * BriefsContext — gestion des briefs postés par les clients
 * et des candidatures des freelances.
 * Supabase-first avec fallback mock si les tables n'existent pas encore.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// ── Mock fallback ─────────────────────────────────────────────────────────────

export const MOCK_FREELANCERS = [
  { id: 'f1', initials: 'LM', name: 'Lucas M.', specialty: 'Script + Montage', rating: 4.9, missions: 34, bio: 'Spécialisé niches business & coaching. Scripts percutants + montage dynamique.' },
  { id: 'f2', initials: 'CA', name: 'Chloé A.',  specialty: 'Script seul',      rating: 4.7, missions: 21, bio: 'Ex-journaliste reconvertie en ghostwriter TikTok. Storytelling et accroches redoutables.' },
  { id: 'f3', initials: 'RB', name: 'Raphaël B.', specialty: 'Pack mensuel',   rating: 5.0, missions: 12, bio: 'Créateur de contenu depuis 3 ans. Livrables dans les délais, zéro mauvaise surprise.' },
  { id: 'f4', initials: 'SW', name: 'Sara W.',    specialty: 'Script + Montage', rating: 4.8, missions: 27, bio: 'Spécialisée bien-être, santé et développement personnel. Ton authentique garanti.' },
];

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

const INITIAL_BRIEFS = [
  {
    id: 'br1', type: 'Script + Montage', color: '#EF4444', icon: 'videocam-outline',
    title: 'Ghostwriter pour mon coaching business féminin',
    activity: 'Coach business pour femmes entrepreneures', audience: 'Femmes 30-45 ans qui veulent quitter leur CDI',
    subject: 'Comment se lancer sans quitter son job', tone: 'Cash et bienveillant',
    platform: 'TikTok', postsPerMonth: 4, budget: 150, deadline: '48h',
    status: 'open', applicants: [MOCK_FREELANCERS[0], MOCK_FREELANCERS[1]],
  },
  {
    id: 'br2', type: 'Pack mensuel', color: '#10B981', icon: 'calendar-outline',
    title: 'Pack 8 vidéos TikTok pour ma formation Excel',
    activity: 'Formateur Excel et productivité', audience: 'Salariés 25-45 ans',
    subject: 'Raccourcis Excel que personne ne connaît', tone: 'Pratique et concis',
    platform: 'TikTok + Instagram', postsPerMonth: 8, budget: 400, deadline: '5j',
    status: 'open', applicants: [MOCK_FREELANCERS[2]],
  },
];

// ── Mapping Supabase row → brief local ───────────────────────────────────────

function rowToBrief(row, applicants = []) {
  return {
    id:            row.id,
    type:          row.type,
    color:         row.color ?? TYPE_COLOR[row.type] ?? '#8B5CF6',
    icon:          row.icon  ?? TYPE_ICON[row.type]  ?? 'document-text-outline',
    title:         row.title,
    activity:      row.activity  ?? '',
    audience:      row.audience  ?? '',
    subject:       row.subject   ?? '',
    tone:          row.tone      ?? '',
    platform:      row.platform  ?? 'TikTok',
    postsPerMonth: row.posts_per_month ?? 4,
    budget:        row.budget    ?? 0,
    deadline:      row.deadline  ?? '',
    status:        row.status    ?? 'open',
    clientId:      row.client_id,
    applicants,
  };
}

function appToFreelancer(row) {
  return {
    id:        row.freelancer_id,
    initials:  row.freelancer_initials ?? '??',
    name:      row.freelancer_name     ?? 'Ghostwriter',
    specialty: row.specialty           ?? '',
    rating:    Number(row.rating)      ?? 5.0,
    missions:  row.missions_count      ?? 0,
    bio:       row.bio                 ?? '',
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

const BriefsContext = createContext(null);

export function BriefsProvider({ children }) {
  const [briefs,     setBriefs]     = useState(INITIAL_BRIEFS);
  const [useSupabase, setUseSupabase] = useState(false); // activé après 1er fetch réussi

  // ── Charger les briefs du client connecté depuis Supabase ─────────────────

  const fetchClientBriefs = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: rows, error } = await supabase
        .from('briefs')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Pour chaque brief, charger ses candidatures
      const briefsWithApps = await Promise.all((rows ?? []).map(async row => {
        const { data: apps } = await supabase
          .from('applications')
          .select('*')
          .eq('brief_id', row.id);
        return rowToBrief(row, (apps ?? []).map(appToFreelancer));
      }));

      setUseSupabase(true);
      // Garder les briefs mock locaux non encore créés en DB pour la démo
      setBriefs(prev => {
        const dbIds = new Set(briefsWithApps.map(b => b.id));
        const mockOnly = prev.filter(b => !dbIds.has(b.id) && b.id.startsWith('br'));
        return [...briefsWithApps, ...mockOnly];
      });
    } catch (_) {
      // Table pas encore créée ou erreur réseau → on garde les mocks
    }
  }, []);

  useEffect(() => { fetchClientBriefs(); }, [fetchClientBriefs]);

  // ── Poster un nouveau brief ───────────────────────────────────────────────

  async function postBrief(brief) {
    const localId = `br${Date.now()}`;
    const newBrief = {
      ...brief,
      id:         localId,
      color:      TYPE_COLOR[brief.type] ?? '#8B5CF6',
      icon:       TYPE_ICON[brief.type]  ?? 'document-text-outline',
      status:     'open',
      applicants: [],
      budget:     Number(brief.budget) || 0,
    };

    // Optimistic update immédiat
    setBriefs(prev => [newBrief, ...prev]);

    // Persist en DB
    if (useSupabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return newBrief;

        const { data, error } = await supabase
          .from('briefs')
          .insert({
            client_id:      session.user.id,
            type:           brief.type,
            title:          newBrief.title,
            activity:       brief.activity,
            audience:       brief.audience,
            subject:        brief.subject,
            tone:           brief.tone,
            platform:       brief.platform ?? 'TikTok',
            posts_per_month: brief.postsPerMonth ?? 4,
            budget:         newBrief.budget,
            deadline:       brief.deadline,
            color:          newBrief.color,
            icon:           newBrief.icon,
          })
          .select()
          .single();

        if (!error && data) {
          // Remplacer le localId par le vrai UUID Supabase
          setBriefs(prev => prev.map(b => b.id === localId ? { ...b, id: data.id } : b));
        }
      } catch (_) {}
    }

    return newBrief;
  }

  // ── Ajouter un candidat à un brief ───────────────────────────────────────

  async function addApplicant(briefId, freelancer) {
    // Optimistic
    setBriefs(prev => prev.map(b => {
      if (b.id !== briefId) return b;
      if (b.applicants.some(a => a.id === freelancer.id)) return b;
      return { ...b, applicants: [...b.applicants, freelancer] };
    }));

    // Persist
    if (useSupabase) {
      try {
        await supabase.from('applications').upsert({
          brief_id:            briefId,
          freelancer_id:       freelancer.id,
          freelancer_name:     freelancer.name,
          freelancer_initials: freelancer.initials,
          specialty:           freelancer.specialty,
          rating:              freelancer.rating,
          missions_count:      freelancer.missions,
          bio:                 freelancer.bio,
        }, { onConflict: 'brief_id,freelancer_id' });
      } catch (_) {}
    }
  }

  // ── Sélectionner un freelance (MATCH) ────────────────────────────────────

  async function selectFreelancer(briefId) {
    setBriefs(prev => prev.map(b =>
      b.id === briefId ? { ...b, status: 'matched' } : b
    ));

    if (useSupabase) {
      try {
        await supabase.from('briefs').update({ status: 'matched' }).eq('id', briefId);
      } catch (_) {}
    }
  }

  return (
    <BriefsContext.Provider value={{ briefs, postBrief, addApplicant, selectFreelancer, refresh: fetchClientBriefs }}>
      {children}
    </BriefsContext.Provider>
  );
}

export const useBriefs = () => useContext(BriefsContext);
