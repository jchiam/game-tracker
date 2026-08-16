import { createRosterPersistence } from '@/services/rosterPersistence';
import type { ZzzAgentPatch, ZzzTrackedAgent } from '@/types';
import { ALL_ZZZ_AGENTS, type ZzzAgent } from '@/data/zenless-zone-zero/agents';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const AGENT_COLUMNS: Record<keyof ZzzAgentPatch, string> = {
  level: 'level',
  mindscape: 'mindscape',
  coreSkill: 'core_skill',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<ZzzAgent, ZzzTrackedAgent, ZzzAgentPatch>({
  table: 'zzz_tracked_agents',
  entityIdColumn: 'agent_id',
  catalog: ALL_ZZZ_AGENTS,
  columns: AGENT_COLUMNS,
  insertDefaults: {
    level: 1,
    mindscape: 0,
    core_skill: 0,
  },
  select: 'id, agent_id, level, mindscape, core_skill, is_favorited',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    mindscape: row.mindscape ?? 0,
    coreSkill: row.core_skill ?? 0,
  }),
});

export const loadAgentsFromDB = svc.load;
export const insertAgent = svc.insert;
export const deleteAgent = svc.remove;
export const updateAgent = svc.update;
