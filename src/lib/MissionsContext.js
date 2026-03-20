/**
 * MissionsContext.js — État partagé pour les missions acceptées.
 *
 * Permet à MissionsScreen (swipe) et ProjetsScreen (suivi) de
 * partager le même état sans Redux.
 *
 * Usage :
 *   const { acceptedMissions, acceptMission, updateStatus } = useMissions();
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const MissionsContext = createContext({
  acceptedMissions: [],
  acceptMission:    () => {},
  updateStatus:     () => {},
  removeMission:    () => {},
});

export const useMissions = () => useContext(MissionsContext);

export function MissionsProvider({ children }) {
  const [acceptedMissions, setAcceptedMissions] = useState([]);

  const acceptMission = useCallback((mission) => {
    setAcceptedMissions(prev => {
      if (prev.find(m => m.id === mission.id)) return prev;
      return [
        { ...mission, status: 'en_cours', acceptedAt: new Date().toISOString() },
        ...prev,
      ];
    });
  }, []);

  const updateStatus = useCallback((id, status, extraData = {}) => {
    setAcceptedMissions(prev =>
      prev.map(m => m.id === id ? { ...m, status, ...extraData } : m)
    );
  }, []);

  const removeMission = useCallback((id) => {
    setAcceptedMissions(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <MissionsContext.Provider value={{ acceptedMissions, acceptMission, updateStatus, removeMission }}>
      {children}
    </MissionsContext.Provider>
  );
}
