import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_ZZZ_AGENTS, type ZzzAgent } from '@/data/zenless-zone-zero/agents';
import { type ZzzDiscSlot, type ZzzEquippedDisc } from '@/data/zenless-zone-zero/discs';
import type { ZzzAgentPatch, ZzzDiscBuildPreferences, ZzzTrackedAgent } from '@/types';
import {
  loadAgentsFromDB,
  insertAgent,
  deleteAgent,
  updateAgent,
  upsertDisc,
  deleteDisc,
  saveDiscPreferences as saveDiscPreferencesToDB,
} from '@/services/zenless-zone-zero/agentService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedAgent(agent: ZzzAgent): ZzzTrackedAgent {
  return {
    ...agent,
    isFavorited: false,
    level: 1,
    mindscape: 0,
    coreSkill: 0,
    // Fresh objects per agent — a module-level default assigned directly would
    // share one identity across every added agent (P5X aliasing bug class).
    discs: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
  };
}

export function useAgents(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableAgents,
    trackedEntities: trackedAgents,
    setTrackedEntities: setTrackedAgents,
    trackedRef: trackedAgentsRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueAction,
    addEntity: addAgent,
    removeEntity: removeAgent,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<ZzzAgent, ZzzTrackedAgent, ZzzAgentPatch>(session, isAuthLoading, {
    allEntities: ALL_ZZZ_AGENTS,
    loadFromDB: loadAgentsFromDB,
    insertEntity: insertAgent,
    deleteEntity: deleteAgent,
    updateEntity: updateAgent,
    createTracked: createTrackedAgent,
    nounSingular: 'agent',
    nounPlural: 'agents',
    fuseKeys: ['name', 'specialty', 'element'],
  });

  const updateLevel = makeFieldUpdater('level', { clamp: [1, 60] });
  const updateMindscape = makeFieldUpdater('mindscape', { clamp: [0, 6] });
  const updateCoreSkill = makeFieldUpdater('coreSkill', { clamp: [0, 6] });
  const toggleFavorite = makeFieldUpdater('isFavorited');

  const saveDiscData = async (
    editingDisc: { agentId: string; slot: ZzzDiscSlot },
    discData: ZzzEquippedDisc,
  ) => {
    const { agentId, slot } = editingDisc;
    setTrackedAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, discs: { ...a.discs, [slot]: discData } } : a)),
    );
    const agent = trackedAgentsRef.current.find((a) => a.id === agentId);
    if (agent?.dbId)
      queueAction(`${agent.dbId}-${slot}`, () => upsertDisc(agent.dbId!, slot, discData));
  };

  // Removal writes null — matching what a reload yields after the row delete,
  // so the scorer never sees an in-session-only empty-disc sentinel.
  const removeDiscData = async (editingDisc: { agentId: string; slot: ZzzDiscSlot }) => {
    const { agentId, slot } = editingDisc;
    setTrackedAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, discs: { ...a.discs, [slot]: null } } : a)),
    );
    const agent = trackedAgentsRef.current.find((a) => a.id === agentId);
    if (agent?.dbId)
      queueAction(`${agent.dbId}-${slot}-delete`, () => deleteDisc(agent.dbId!, slot));
  };

  const saveDiscPreferences = (agentId: string, newPreferences: ZzzDiscBuildPreferences) => {
    setTrackedAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, buildPreferences: newPreferences } : a)),
    );
    const agent = trackedAgentsRef.current.find((a) => a.id === agentId);
    if (agent?.dbId) {
      const dbId = agent.dbId;
      queueAction(`${dbId}-discprefs`, () => saveDiscPreferencesToDB(dbId, newPreferences));
    }
  };

  const getFilteredRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL' | 'SCORE',
      scoreFor?: (a: ZzzTrackedAgent) => number,
    ) =>
      filterRoster(
        searchTerm,
        sortBy === 'LEVEL'
          ? (a, b) => b.level - a.level
          : sortBy === 'SCORE' && scoreFor
            ? (a, b) => scoreFor(b) - scoreFor(a)
            : undefined,
      ),
    [filterRoster],
  );

  return {
    availableAgents,
    trackedAgents,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addAgent,
    removeAgent,
    updateLevel,
    updateMindscape,
    updateCoreSkill,
    toggleFavorite,
    saveDiscData,
    removeDiscData,
    saveDiscPreferences,
    getFilteredRoster,
  };
}
