import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from './supabase';

const FavoritesCtx = createContext({ favorites: [], toggleFavorite: () => {}, isFavorite: () => false });

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [userId,    setUserId]    = useState(null);

  // ── Récupère le userId courant ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Charge les favoris depuis Supabase au login ───────────────────────────
  useEffect(() => {
    if (!userId) { setFavorites([]); return; }

    supabase
      .from('saved_services')
      .select('freelancer_id, freelancer:users!freelancer_id(id, name, specialty, rating, reviews_count, avatar_color, initials)')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        const loaded = data
          .map(row => row.freelancer)
          .filter(Boolean);
        setFavorites(loaded);
      });
  }, [userId]);

  // ── Toggle favori ─────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (freelancer) => {
    const exists = favorites.some(f => f.id === freelancer.id);

    // Optimistic local
    setFavorites(prev =>
      exists
        ? prev.filter(f => f.id !== freelancer.id)
        : [...prev, freelancer]
    );

    // Persiste en Supabase (silencieux)
    if (userId) {
      try {
        if (exists) {
          await supabase
            .from('saved_services')
            .delete()
            .eq('user_id', userId)
            .eq('freelancer_id', freelancer.id);
        } else {
          await supabase
            .from('saved_services')
            .upsert({ user_id: userId, freelancer_id: freelancer.id });
        }
      } catch (_) {}
    }
  }, [favorites, userId]);

  const isFavorite = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  return (
    <FavoritesCtx.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesCtx.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesCtx);
