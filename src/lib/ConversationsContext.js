/**
 * ConversationsContext.js
 * Stockage global des conversations (chat) partagé entre
 * MissionTrackingScreen (inline chat client) et MessagerieScreen.
 * Clé : missionId / orderId (string)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const ConversationsCtx = createContext({
  conversations:   {},
  initConversation: () => {},
  pushMessage:      () => {},
});

export function ConversationsProvider({ children }) {
  // { [id]: { meta: {...}, messages: [...], updatedAt: number } }
  const [conversations, setConversations] = useState({});

  /** Initialise une conversation si elle n'existe pas encore */
  const initConversation = useCallback((id, meta, initialMessages = []) => {
    setConversations(prev => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: { meta, messages: initialMessages, updatedAt: Date.now() },
      };
    });
  }, []);

  /** Ajoute un message dans une conversation existante */
  const pushMessage = useCallback((id, msg) => {
    setConversations(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: {
          ...existing,
          messages:  [...existing.messages, msg],
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  return (
    <ConversationsCtx.Provider value={{ conversations, initConversation, pushMessage }}>
      {children}
    </ConversationsCtx.Provider>
  );
}

export const useConversations = () => useContext(ConversationsCtx);
