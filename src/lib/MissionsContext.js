/**
 * MissionsContext.js — État partagé pour les missions acceptées.
 *
 * Freelancer : charge les ordres depuis Supabase au login,
 * puis synchronise les changements de statut en temps réel.
 *
 * Usage :
 *   const { acceptedMissions, acceptMission, updateStatus } = useMissions();
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from './supabase';

// ─── Mapping camelCase → snake_case pour les champs extra ────────────────────
const EXTRA_FIELD_MAP = {
  deliveryUrl:     'delivery_url',
  deliveryMessage: 'delivery_message',
  deliveredAt:     'delivered_at',
  revisionCount:   'revision_count',
};

// ─── Mapping statut local → statut Supabase ──────────────────────────────────
const STATUS_TO_DB = {
  en_cours:  'in_progress',
  livre:     'delivered',
  valide:    'completed',
  revision:  'revision',
  cancelled: 'cancelled',
};

// ─── Mapping statut Supabase → statut local ──────────────────────────────────
const DB_TO_STATUS = {
  in_progress: 'en_cours',
  delivered:   'livre',
  completed:   'valide',
  revision:    'revision',
  cancelled:   'cancelled',
  // accepter les valeurs locales telles quelles
  en_cours:    'en_cours',
  livre:       'livre',
  valide:      'valide',
};

// ─── IDs mock : jamais écrits dans Supabase via UPDATE ───────────────────────
const isMockId = (id) =>
  !id || /^(mock_|demo_|br\d|temp_|b\d)/.test(String(id));

const MissionsContext = createContext({
  acceptedMissions: [],
  acceptMission:    () => {},
  updateStatus:     () => {},
  removeMission:    () => {},
  refreshMissions:  () => {},
});

export const useMissions = () => useContext(MissionsContext);

export function MissionsProvider({ children }) {
  const [acceptedMissions, setAcceptedMissions] = useState([]);
  const [userId, setUserId] = useState(null);

  // Ref pour lire les missions courantes sans closure périmée dans updateStatus
  const missionsRef = useRef([]);
  useEffect(() => { missionsRef.current = acceptedMissions; }, [acceptedMissions]);

  // ── Détecte le userId courant ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Charge les missions freelance depuis Supabase ─────────────────────────
  const refreshMissions = useCallback(async (uid = userId) => {
    if (!uid) return;
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, title, type, budget, status, color, deadline, client_name, client_initials, delivery_url, delivery_message, created_at')
        .eq('freelancer_id', uid)
        .in('status', ['en_cours', 'in_progress', 'delivered', 'livre', 'revision', 'completed', 'valide'])
        .order('created_at', { ascending: false });

      if (!orders?.length) return;

      // Mapper les ordres DB
      const dbMissions = orders.map(o => ({
        id:              o.id,
        title:           o.title           ?? 'Mission',
        type:            o.type            ?? 'Script',
        budget:          Number(o.budget)  || 0,
        status:          DB_TO_STATUS[o.status] ?? o.status ?? 'en_cours',
        color:           o.color           ?? '#10B981',
        icon:            'sparkles-outline',
        deadline:        o.deadline        ?? '48h',
        clientName:      o.client_name     ?? 'Client',
        clientInitials:  o.client_initials ?? 'CL',
        deliveryUrl:     o.delivery_url    ?? null,
        deliveryMessage: o.delivery_message ?? null,
        acceptedAt:      o.created_at,
        source:          'supabase',
      }));

      // Merger : DB + missions mock RAM en cours (non encore en DB)
      // → les missions mock (b1, b2…) restent visibles même quand la DB a des ordres
      setAcceptedMissions(prev => {
        const dbIds = new Set(orders.map(o => o.id));
        const mockOnly = prev.filter(m => isMockId(m.id) && !dbIds.has(m.id));
        return [...dbMissions, ...mockOnly];
      });
    } catch (err) {
      console.warn('[MissionsContext] refreshMissions error:', err?.message ?? err);
    }
  }, [userId]);

  // Charge au login
  useEffect(() => {
    if (userId) {
      refreshMissions(userId);
    } else {
      // Déconnecté → vide le state pour ne pas mélanger des données d'un ancien compte
      setAcceptedMissions([]);
    }
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────

  const acceptMission = useCallback((mission) => {
    // 1. Ajout optimiste en RAM
    setAcceptedMissions(prev => {
      if (prev.find(m => m.id === mission.id)) return prev;
      return [
        { ...mission, status: 'en_cours', acceptedAt: new Date().toISOString() },
        ...prev,
      ];
    });

    // 2. Pour les vrais briefs Supabase (UUID, pas mock) :
    //    créer l'ordre immédiatement en DB, puis remplacer l'ID brief par l'ID order en RAM
    if (!isMockId(mission.id)) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const uid = session?.user?.id;
        if (!uid) return;
        supabase
          .from('orders')
          .insert({
            freelancer_id:   uid,
            brief_id:        mission.id,
            title:           mission.title           ?? 'Mission',
            type:            mission.type            ?? 'Script',
            budget:          Number(mission.budget)  || 0,
            status:          'in_progress',
            color:           mission.color           ?? '#10B981',
            deadline:        mission.deadline        ?? '48h',
            client_name:     mission.clientName      ?? 'Client',
            client_initials: mission.clientInitials  ?? 'CL',
          })
          .select()
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.warn('[MissionsContext] acceptMission insert order error:', error.message);
              return;
            }
            if (data) {
              // L'order a son propre UUID — on l'utilise pour les futures mise à jour de statut
              setAcceptedMissions(prev =>
                prev.map(m => m.id === mission.id ? { ...m, id: data.id } : m)
              );
            }
          });
      });
    }
  }, []);

  const updateStatus = useCallback((id, status, extraData = {}, missionData = null) => {
    // 1. Mise à jour optimiste en RAM — immédiate
    setAcceptedMissions(prev => {
      const found = prev.find(m => m.id === id);
      if (found) return prev.map(m => m.id === id ? { ...m, status, ...extraData } : m);
      if (missionData) return [...prev, { ...missionData, id, status, acceptedAt: new Date().toISOString(), ...extraData }];
      return prev;
    });

    if (!isMockId(id)) {
      // ── Ordre réel (UUID Supabase) : met à jour le statut ─────────────────
      const dbStatus = STATUS_TO_DB[status] ?? status;
      const payload  = { status: dbStatus };
      for (const [camel, snake] of Object.entries(EXTRA_FIELD_MAP)) {
        if (extraData[camel] !== undefined) payload[snake] = extraData[camel];
      }
      supabase
        .from('orders')
        .update(payload)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[MissionsContext] updateStatus error:', error.message);
        });

    } else if (status === 'valide' && userId) {
      // ── Mission mock validée → insère un ordre complété dans Supabase ─────
      // Pas de brief_id pour éviter l'erreur de type UUID sur les IDs mock (b1, b2…)
      const m = missionsRef.current.find(mis => mis.id === id) ?? missionData;
      if (m) {
        const payload = {
          freelancer_id:   userId,
          title:           m.title           ?? 'Mission',
          type:            m.type            ?? 'Script',
          budget:          Number(m.budget)  || 0,
          status:          'completed',
          color:           m.color           ?? '#10B981',
          deadline:        m.deadline        ?? '48h',
          client_name:     m.clientName      ?? 'Client',
          client_initials: m.clientInitials  ?? 'CL',
        };
        if (extraData.deliveryUrl)     payload.delivery_url     = extraData.deliveryUrl;
        if (extraData.deliveryMessage) payload.delivery_message = extraData.deliveryMessage;

        supabase
          .from('orders')
          .insert(payload)
          .select()
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.warn('[MissionsContext] insert validated order error:', error.message);
              return;
            }
            if (data) {
              // Remplacer l'ID mock par le vrai UUID Supabase en RAM
              setAcceptedMissions(prev =>
                prev.map(m => m.id === id ? { ...m, id: data.id } : m)
              );
              refreshMissions();
            }
          });
      }
    }
  }, [userId, refreshMissions]);

  const removeMission = useCallback((id) => {
    setAcceptedMissions(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <MissionsContext.Provider value={{ acceptedMissions, acceptMission, updateStatus, removeMission, refreshMissions }}>
      {children}
    </MissionsContext.Provider>
  );
}
