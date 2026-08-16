import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_ZZZ_AGENTS, type ZzzAgent } from '@/data/zenless-zone-zero/agents';
import type { ZzzAgentPatch, ZzzTrackedAgent } from '@/types';
import {
  loadAgentsFromDB,
  insertAgent,
  deleteAgent,
  updateAgent,
} from '@/services/zenless-zone-zero/agentService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedAgent(agent: ZzzAgent): ZzzTrackedAgent {
  return {
    ...agent,
    isFavorited: false,
    level: 1,
    mindscape: 0,
    coreSkill: 0,
  };
}

export function useAgents(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableAgents,
    trackedEntities: trackedAgents,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
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

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
      filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined),
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
    getFilteredRoster,
  };
}
