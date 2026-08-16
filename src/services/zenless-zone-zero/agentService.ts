import { supabase } from '@/lib/supabase';
import {
  chainToRows,
  createRosterPersistence,
  rowsToChain,
  savePreferenceRows,
} from '@/services/rosterPersistence';
import type { ZzzAgentPatch, ZzzDiscBuildPreferences, ZzzTrackedAgent } from '@/types';
import { ALL_ZZZ_AGENTS, type ZzzAgent } from '@/data/zenless-zone-zero/agents';
import {
  ZZZ_VARIABLE_MAIN_SLOTS,
  type ZzzDiscSlot,
  type ZzzEquippedDisc,
} from '@/data/zenless-zone-zero/discs';

const defaultDiscs: ZzzTrackedAgent['discs'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

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
  select:
    'id, agent_id, level, mindscape, core_skill, is_favorited, disc_suit_4_id, disc_suit_2_id, disc_comments',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    mindscape: row.mindscape ?? 0,
    coreSkill: row.core_skill ?? 0,
    discs: { ...defaultDiscs },
    buildPreferences: {
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      discSuit4Id: null,
      discSuit2Id: null,
      comments: '',
    },
  }),
  extras: {
    selectFragment: `zzz_equipped_discs ( id, slot, suit_id, main_stat, zzz_disc_substats ( stat_type ) ),
      zzz_disc_preferences ( id, category, stat, operator_to_next, order_index )`,
    mapRow: (row, tracked) => {
      const discs: ZzzTrackedAgent['discs'] = { ...defaultDiscs };
      for (const d of row.zzz_equipped_discs || []) {
        discs[d.slot as ZzzDiscSlot] = {
          suitId: d.suit_id,
          mainStat: d.main_stat,
          subStats: (d.zzz_disc_substats || []).map((sub: any) => sub.stat_type),
        };
      }

      const prefRows: any[] = row.zzz_disc_preferences || [];
      const mainStats = {} as ZzzDiscBuildPreferences['mainStats'];
      for (const slot of ZZZ_VARIABLE_MAIN_SLOTS) {
        mainStats[slot] = rowsToChain(prefRows.filter((p) => p.category === `slot${slot}_main`));
      }

      return {
        ...tracked,
        discs,
        buildPreferences: {
          mainStats,
          subStats: rowsToChain(prefRows.filter((p) => p.category === 'sub_stats')),
          discSuit4Id: row.disc_suit_4_id ?? null,
          discSuit2Id: row.disc_suit_2_id ?? null,
          comments: row.disc_comments || '',
        },
      };
    },
  },
});

export const loadAgentsFromDB = svc.load;
export const insertAgent = svc.insert;
export const deleteAgent = svc.remove;
export const updateAgent = svc.update;

// --- Equipped Drive Discs ---
// Loading happens through the roster `extras` seam above; only the per-slot
// write functions live here.

export async function upsertDisc(
  dbId: string,
  slot: ZzzDiscSlot,
  discData: ZzzEquippedDisc,
): Promise<void> {
  if (!DB_ENABLED) return;
  const { data: discRow, error: discErr } = await supabase
    .from('zzz_equipped_discs')
    .upsert(
      {
        tracked_agent_id: dbId,
        slot,
        suit_id: discData.suitId,
        main_stat: discData.mainStat,
      },
      { onConflict: 'tracked_agent_id,slot' },
    )
    .select('id')
    .single();

  if (discErr) {
    console.error('Disc Upsert Error:', discErr);
    throw discErr;
  }
  await supabase.from('zzz_disc_substats').delete().eq('disc_id', discRow.id);
  if (discData.subStats.length > 0) {
    const { error: substatErr } = await supabase.from('zzz_disc_substats').insert(
      discData.subStats.map((s) => ({
        disc_id: discRow.id,
        stat_type: s,
      })),
    );
    if (substatErr) {
      console.error('Disc Substat Insert Error:', substatErr);
      throw substatErr;
    }
  }
}

export async function deleteDisc(dbId: string, slot: ZzzDiscSlot): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase.from('zzz_equipped_discs').delete().match({ tracked_agent_id: dbId, slot });
}

// --- Disc Build Preferences ---
// Suit picks and comments persist as parent columns; the chains persist as
// category rows in zzz_disc_preferences via the shared preference-row helper.

export async function saveDiscPreferences(
  dbId: string,
  prefs: ZzzDiscBuildPreferences,
): Promise<void> {
  const fkColumn = 'tracked_agent_id';
  const rows = [
    ...ZZZ_VARIABLE_MAIN_SLOTS.flatMap((slot) =>
      chainToRows(prefs.mainStats[slot], {
        dbId,
        fkColumn,
        extra: { category: `slot${slot}_main` },
      }),
    ),
    ...chainToRows(prefs.subStats, { dbId, fkColumn, extra: { category: 'sub_stats' } }),
  ];

  await savePreferenceRows({
    dbId,
    deleteFrom: [{ table: 'zzz_disc_preferences', fkColumn }],
    parentUpdate: {
      table: 'zzz_tracked_agents',
      row: {
        disc_suit_4_id: prefs.discSuit4Id ?? null,
        disc_suit_2_id: prefs.discSuit2Id ?? null,
        disc_comments: prefs.comments,
      },
    },
    inserts: rows.length > 0 ? [{ table: 'zzz_disc_preferences', rows }] : [],
  });
}
