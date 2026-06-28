import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_OPERATORS, type AeOperator } from '@/data/arknights-endfield/operators';
import type { AeOperatorPatch, AeWeaponPatch, AeTrackedOperator } from '@/types';
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
    phase: 0,
    skillsMaxed: false,
    weaponName: null,
    weaponLevel: 1,
    weaponPreferences: [],
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

  const updatePhase = (id: string, phase: number) => {
    const validPhase = Math.min(5, Math.max(0, phase));
    setTrackedOperators((prev) => prev.map((o) => (o.id === id ? { ...o, phase: validPhase } : o)));
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, { phase: validPhase } satisfies AeOperatorPatch, (p) =>
        updateOperator(op.dbId!, p),
      );
  };

  const updateSkillsMaxed = (id: string, value: boolean) => {
    setTrackedOperators((prev) =>
      prev.map((o) => (o.id === id ? { ...o, skillsMaxed: value } : o)),
    );
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, { skillsMaxed: value } satisfies AeOperatorPatch, (p) =>
        updateOperator(op.dbId!, p),
      );
  };

  const updateWeapon = (id: string, patch: AeWeaponPatch) => {
    const normalized: AeWeaponPatch = { ...patch };
    if (normalized.weaponLevel !== undefined) {
      normalized.weaponLevel = Math.min(90, Math.max(1, normalized.weaponLevel));
    }
    setTrackedOperators((prev) => prev.map((o) => (o.id === id ? { ...o, ...normalized } : o)));
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, normalized satisfies AeOperatorPatch, (p) =>
        updateOperator(op.dbId!, p),
      );
  };

  const updateWeaponPreferences = (id: string, preferences: string[]) => {
    // A weapon id may appear at most once; keep first occurrence, preserve order.
    const deduped = preferences.filter((p, i) => preferences.indexOf(p) === i);
    setTrackedOperators((prev) =>
      prev.map((o) => (o.id === id ? { ...o, weaponPreferences: deduped } : o)),
    );
    const op = trackedOperatorsRef.current.find((o) => o.id === id);
    if (op?.dbId)
      queueUpdate(op.dbId, { weaponPreferences: deduped } satisfies AeOperatorPatch, (p) =>
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
    updatePhase,
    updateSkillsMaxed,
    updateWeapon,
    updateWeaponPreferences,
    toggleFavorite,
    getFilteredRoster,
  };
}
