import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_CZN_COMBATANTS, type CznCombatant } from '@/data/chaos-zero-nightmare/combatants';
import {
  type CznEquippedFragment,
  type CznFragmentSlot,
} from '@/data/chaos-zero-nightmare/fragments';
import type {
  CznCombatantPatch,
  CznFragmentBuildPreferences,
  CznPartnerPatch,
  CznTrackedCombatant,
} from '@/types';
import {
  loadCombatantsFromDB,
  insertCombatant,
  deleteCombatant,
  updateCombatant,
  upsertFragment,
  deleteFragment,
  saveFragmentPreferences as saveFragmentPreferencesToDB,
} from '@/services/chaos-zero-nightmare/combatantService';
import { useRoster } from '@/hooks/useRoster';
import {
  CZN_MAX_EGO,
  CZN_MAX_LEVEL,
  CZN_PARTNER_MAX_EGO,
  CZN_PARTNER_MAX_LEVEL,
} from '@/hooks/chaos-zero-nightmare/combatantLimits';

export { CZN_MAX_EGO, CZN_MAX_LEVEL, CZN_PARTNER_MAX_EGO, CZN_PARTNER_MAX_LEVEL };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createTrackedCombatant(combatant: CznCombatant): CznTrackedCombatant {
  return {
    ...combatant,
    isFavorited: false,
    level: 1,
    ego: 0,
    potentialAttained: false,
    partnerId: null,
    partnerLevel: 1,
    partnerEgo: 0,
    partnerPreferences: [],
    // Fresh objects per combatant — a module-level default assigned directly
    // would share one identity across every added combatant (P5X aliasing bug class).
    fragments: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    fragmentPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [], targetSetIds: [] },
  };
}

export function useCombatants(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableCombatants,
    trackedEntities: trackedCombatants,
    setTrackedEntities: setTrackedCombatants,
    trackedRef: trackedCombatantsRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueAction,
    addEntity: addCombatant,
    removeEntity: removeCombatant,
    makeFieldUpdater,
    applyPatch,
    filterRoster,
  } = useRoster<CznCombatant, CznTrackedCombatant, CznCombatantPatch>(session, isAuthLoading, {
    allEntities: ALL_CZN_COMBATANTS,
    loadFromDB: loadCombatantsFromDB,
    insertEntity: insertCombatant,
    deleteEntity: deleteCombatant,
    updateEntity: updateCombatant,
    createTracked: createTrackedCombatant,
    nounSingular: 'combatant',
    nounPlural: 'combatants',
    fuseKeys: ['name', 'class', 'element'],
  });

  const updateLevel = makeFieldUpdater('level', { clamp: [1, CZN_MAX_LEVEL] });
  const updateEgo = makeFieldUpdater('ego', { clamp: [0, CZN_MAX_EGO] });
  const togglePotential = makeFieldUpdater('potentialAttained');
  const toggleFavorite = makeFieldUpdater('isFavorited');
  const updatePartnerPreferences = makeFieldUpdater('partnerPreferences', {
    // A partner id may appear at most once; keep first occurrence, preserve order.
    transform: (preferences) => preferences.filter((p, i) => preferences.indexOf(p) === i),
  });

  // Picker, level slider, and Ego rung share one callback so the three Partner
  // columns ride a single debounced write.
  const updatePartner = (id: string, patch: CznPartnerPatch) => {
    const normalized: CznPartnerPatch = { ...patch };
    if (normalized.partnerLevel !== undefined) {
      normalized.partnerLevel = clamp(normalized.partnerLevel, 1, CZN_PARTNER_MAX_LEVEL);
    }
    if (normalized.partnerEgo !== undefined) {
      normalized.partnerEgo = clamp(normalized.partnerEgo, 0, CZN_PARTNER_MAX_EGO);
    }
    applyPatch(id, normalized);
  };

  // Equipped pieces write through the upsert_equipment_slot RPC rather than a
  // row patch, so they are the queueAction case the Field Updater rule allows.
  const saveFragmentData = async (
    editing: { combatantId: string; slot: CznFragmentSlot },
    piece: CznEquippedFragment,
  ) => {
    const { combatantId, slot } = editing;
    setTrackedCombatants((prev) =>
      prev.map((c) =>
        c.id === combatantId ? { ...c, fragments: { ...c.fragments, [slot]: piece } } : c,
      ),
    );
    const combatant = trackedCombatantsRef.current.find((c) => c.id === combatantId);
    if (combatant?.dbId) {
      const dbId = combatant.dbId;
      queueAction(`${dbId}-frag-${slot}`, () => upsertFragment(dbId, slot, piece));
    }
  };

  // Removal writes null — matching what a reload yields after the row delete,
  // so the scorer never sees an in-session-only empty-piece sentinel.
  const removeFragmentData = async (editing: { combatantId: string; slot: CznFragmentSlot }) => {
    const { combatantId, slot } = editing;
    setTrackedCombatants((prev) =>
      prev.map((c) =>
        c.id === combatantId ? { ...c, fragments: { ...c.fragments, [slot]: null } } : c,
      ),
    );
    const combatant = trackedCombatantsRef.current.find((c) => c.id === combatantId);
    if (combatant?.dbId) {
      const dbId = combatant.dbId;
      queueAction(`${dbId}-frag-${slot}-delete`, () => deleteFragment(dbId, slot));
    }
  };

  const saveFragmentPreferences = (
    combatantId: string,
    newPreferences: CznFragmentBuildPreferences,
  ) => {
    setTrackedCombatants((prev) =>
      prev.map((c) => (c.id === combatantId ? { ...c, fragmentPreferences: newPreferences } : c)),
    );
    const combatant = trackedCombatantsRef.current.find((c) => c.id === combatantId);
    if (combatant?.dbId) {
      const dbId = combatant.dbId;
      queueAction(`${dbId}-fragprefs`, () => saveFragmentPreferencesToDB(dbId, newPreferences));
    }
  };

  const getFilteredRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL' | 'SCORE',
      scoreFor?: (c: CznTrackedCombatant) => number,
      predicate?: (c: CznTrackedCombatant) => boolean,
      entities?: CznTrackedCombatant[],
    ) => {
      const sorted = filterRoster(
        searchTerm,
        sortBy === 'LEVEL'
          ? (a, b) => b.level - a.level
          : sortBy === 'SCORE' && scoreFor
            ? (a, b) => scoreFor(b) - scoreFor(a)
            : undefined,
        entities,
      );
      return predicate ? sorted.filter(predicate) : sorted;
    },
    [filterRoster],
  );

  return {
    availableCombatants,
    trackedCombatants,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCombatant,
    removeCombatant,
    updateLevel,
    updateEgo,
    togglePotential,
    updatePartner,
    updatePartnerPreferences,
    toggleFavorite,
    saveFragmentData,
    removeFragmentData,
    saveFragmentPreferences,
    getFilteredRoster,
  };
}
