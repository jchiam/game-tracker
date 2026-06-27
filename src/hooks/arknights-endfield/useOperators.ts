import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_OPERATORS, type AeOperator } from '@/data/arknights-endfield/operators';
import type { AeOperatorPatch, AeTrackedOperator } from '@/types';
import {
  loadOperatorsFromDB,
  insertOperator,
  deleteOperator,
  updateOperator,
} from '@/services/arknights-endfield/operatorService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedOperator(operator: AeOperator): AeTrackedOperator {
  return {
    ...operator,
    isFavorited: false,
    level: 1,
    potential: 0,
  };
}

export function useOperators(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableOperators,
    trackedEntities: trackedOperators,
    setTrackedEntities: setTrackedOperators,
    trackedRef: trackedOperatorsRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueUpdate,
    addEntity: addOperator,
    removeEntity: removeOperator,
    filterRoster,
  } = useRoster<AeOperator, AeTrackedOperator>(session, isAuthLoading, {
    allEntities: ALL_OPERATORS,
    loadFromDB: loadOperatorsFromDB,
    insertEntity: insertOperator,
    deleteEntity: deleteOperator,
    createTracked: createTrackedOperator,
    nounSingular: 'operator',
    nounPlural: 'operators',
    fuseKeys: ['name', 'class', 'element', 'weapon'],
  });

  const updateLevel = (id: string, level: number) => {
    const validLevel = Math.min(90, Math.max(1, level));
    setTrackedOperators((prev) => prev.map((o) => (o.id === id ? { ...o, level: validLevel } : o)));
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, { level: validLevel } satisfies AeOperatorPatch, (p) =>
        updateOperator(op.dbId!, p),
      );
  };

  const updatePotential = (id: string, potential: number) => {
    const validPotential = Math.min(5, Math.max(0, potential));
    setTrackedOperators((prev) =>
      prev.map((o) => (o.id === id ? { ...o, potential: validPotential } : o)),
    );
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, { potential: validPotential } satisfies AeOperatorPatch, (p) =>
        updateOperator(op.dbId!, p),
      );
  };

  const toggleFavorite = (id: string, value: boolean) => {
    setTrackedOperators((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isFavorited: value } : o)),
    );
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, { isFavorited: value } satisfies AeOperatorPatch, (p) =>
        updateOperator(op.dbId!, p),
      );
  };

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
      filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined),
    [filterRoster],
  );

  return {
    availableOperators,
    trackedOperators,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addOperator,
    removeOperator,
    updateLevel,
    updatePotential,
    toggleFavorite,
    getFilteredRoster,
  };
}
