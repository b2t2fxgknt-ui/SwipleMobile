/**
 * ExpertSelectionContext.js
 * Partagé entre AIRecommendationsSwipeScreen, AuditOfferScreen et ExpertsScreen.
 *
 * Stocke tous les experts que l'utilisateur a soit :
 *  - acceptés (swipe droite) dans la page Optimisation
 *  - commandés depuis les offres de la page Audit
 *
 * Chaque entrée a la forme :
 * {
 *   id, source ('optimisation' | 'audit'),
 *   expertName, expertInitials, expertColor,
 *   expertSpecialty, expertRating, expertReviews,
 *   expertPrice, expertDelivery, expertBadge,
 *   expertDesc, problem, videoTitle, auditDate,
 *   category, icon, color, impact, impactLabel,
 * }
 */

import React, { createContext, useContext, useState } from 'react';

const ExpertSelectionContext = createContext(null);

export function ExpertSelectionProvider({ children }) {
  const [selectedExperts, setSelectedExperts] = useState([]);

  /** Ajoute un expert (dédupliqué par id) */
  function addExpert(expert) {
    setSelectedExperts(prev => {
      if (prev.find(e => e.id === expert.id)) return prev;
      return [...prev, expert];
    });
  }

  /** Ajoute plusieurs experts en une fois */
  function addExperts(experts) {
    setSelectedExperts(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newOnes = experts.filter(e => !existingIds.has(e.id));
      return [...prev, ...newOnes];
    });
  }

  return (
    <ExpertSelectionContext.Provider value={{ selectedExperts, addExpert, addExperts }}>
      {children}
    </ExpertSelectionContext.Provider>
  );
}

export const useExpertSelection = () => useContext(ExpertSelectionContext);
