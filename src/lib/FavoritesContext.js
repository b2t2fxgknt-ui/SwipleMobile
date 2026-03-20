import React, { createContext, useContext, useState, useCallback } from 'react';

const FavoritesCtx = createContext({ favorites: [], toggleFavorite: () => {}, isFavorite: () => false });

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = useCallback((freelancer) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === freelancer.id);
      return exists ? prev.filter(f => f.id !== freelancer.id) : [...prev, freelancer];
    });
  }, []);

  const isFavorite = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  return (
    <FavoritesCtx.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesCtx.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesCtx);
