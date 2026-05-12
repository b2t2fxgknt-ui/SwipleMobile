/**
 * ConversationsContext.js
 * Stockage global des conversations (chat) — RAM + Supabase persistence
 * Clé : missionId / orderId (string)
 *
 * Table Supabase attendue : messages
 *   id            uuid          primary key default gen_random_uuid()
 *   conversation_id text        not null (indexed)
 *   sender_id     text          not null
 *   sender_name   text
 *   sender_initials text
 *   text          text          not null
 *   msg_type      text          default 'text'   -- 'text' | 'system'
 *   created_at    timestamptz   default now()
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';

const ConversationsCtx = createContext({
  conversations:               {},
  initConversation:             () => {},
  pushMessage:                  () => {},
  loadConversation:             async () => {},
  sendMessage:                  async () => {},
  subscribeToConversation:      () => {},
  unsubscribeFromConversation:  () => {},
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return 'Récent';
  const d    = new Date(isoString);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)     return "À l'instant";
  if (diff < 3_600_000)  return `Il y a ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ConversationsProvider({ children }) {
  // { [id]: { meta: {...}, messages: [...], updatedAt: number } }
  const [conversations, setConversations] = useState({});

  // Channels Supabase actifs { [conversationId]: RealtimeChannel }
  const channelsRef = useRef({});

  // ── Initialise une conversation en RAM (idempotent) ─────────────────────────
  const initConversation = useCallback((id, meta, initialMessages = []) => {
    setConversations(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: { meta, messages: initialMessages, updatedAt: Date.now() } };
    });
  }, []);

  // ── Ajoute un message localement (optimiste) ────────────────────────────────
  const pushMessage = useCallback((id, msg) => {
    setConversations(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: { ...existing, messages: [...existing.messages, msg], updatedAt: Date.now() },
      };
    });
  }, []);

  // ── Charge l'historique Supabase et met à jour la RAM ───────────────────────
  const loadConversation = useCallback(async (id, meta, currentUserId) => {
    // Garantit que la conv existe en RAM immédiatement
    setConversations(prev => ({
      ...prev,
      [id]: prev[id] ?? { meta, messages: [], updatedAt: Date.now() },
    }));

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error || !data?.length) return;

      const mapped = data.map(row => ({
        id:       row.id,
        from:     row.msg_type === 'system' ? 'system'
                  : row.sender_id === currentUserId ? 'me' : 'client',
        text:     row.text,
        ts:       formatRelativeTime(row.created_at),
        senderId: row.sender_id,
      }));

      setConversations(prev => ({
        ...prev,
        [id]: {
          meta:      prev[id]?.meta ?? meta,
          messages:  mapped,
          updatedAt: Date.now(),
        },
      }));
    } catch (_) {
      // Table inexistante ou réseau absent → fallback silencieux
    }
  }, []);

  // ── Envoie un message : optimiste local + persist Supabase ──────────────────
  const sendMessage = useCallback(async (conversationId, text, senderMeta = {}) => {
    if (!text?.trim()) return;

    // 1. Ajout optimiste immédiat
    pushMessage(conversationId, {
      id:   `temp_${Date.now()}`,
      from: 'me',
      text: text.trim(),
      ts:   "À l'instant",
    });

    // 2. Persist Supabase
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id:  conversationId,
        sender_id:        senderMeta.userId    ?? 'anonymous',
        sender_name:      senderMeta.name      ?? 'Moi',
        sender_initials:  senderMeta.initials  ?? '?',
        text:             text.trim(),
        msg_type:         'text',
      });
      if (error) console.warn('[ConversationsContext] sendMessage error:', error.message);
    } catch (err) {
      console.warn('[ConversationsContext] sendMessage error:', err?.message ?? err);
    }
  }, [pushMessage]);

  // ── Abonnement temps réel à une conversation ────────────────────────────────
  const subscribeToConversation = useCallback((id, currentUserId) => {
    if (channelsRef.current[id]) return; // déjà abonné

    const channel = supabase
      .channel(`conv:${id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${id}`,
        },
        payload => {
          const row = payload.new;
          // Ne pas dupliquer nos propres messages (déjà ajoutés de façon optimiste)
          if (row.sender_id === currentUserId) return;
          setConversations(prev => {
            const existing = prev[id];
            if (!existing) return prev;
            return {
              ...prev,
              [id]: {
                ...existing,
                messages: [
                  ...existing.messages,
                  {
                    id:       row.id,
                    from:     row.msg_type === 'system' ? 'system' : 'client',
                    text:     row.text,
                    ts:       formatRelativeTime(row.created_at),
                    senderId: row.sender_id,
                  },
                ],
                updatedAt: Date.now(),
              },
            };
          });
        }
      )
      .subscribe();

    channelsRef.current[id] = channel;
  }, []);

  // ── Désabonnement ───────────────────────────────────────────────────────────
  const unsubscribeFromConversation = useCallback((id) => {
    const ch = channelsRef.current[id];
    if (ch) {
      try { supabase.removeChannel(ch); } catch (_) {}
      delete channelsRef.current[id];
    }
  }, []);

  return (
    <ConversationsCtx.Provider value={{
      conversations,
      initConversation,
      pushMessage,
      loadConversation,
      sendMessage,
      subscribeToConversation,
      unsubscribeFromConversation,
    }}>
      {children}
    </ConversationsCtx.Provider>
  );
}

export const useConversations = () => useContext(ConversationsCtx);
