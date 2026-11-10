import { supabase } from '@/lib/supabase';
import {
  chainToRows,
  createRosterPersistence,
  rowsToChain,
  savePreferenceRows,
  upsertEquipmentSlot,
} from '@/services/rosterPersistence';
import type { CznCombatantPatch, CznFragmentBuildPreferences, CznTrackedCombatant } from '@/types';
import { ALL_CZN_COMBATANTS, type CznCombatant } from '@/data/chaos-zero-nightmare/combatants';
import {
  CZN_VARIABLE_MAIN_SLOTS,
  type CznEquippedFragment,
  type CznFragmentSlot,
} from '@/data/chaos-zero-nightmare/fragments';

const defaultFragments: CznTrackedCombatant['fragments'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const COMBATANT_COLUMNS: Record<keyof CznCombatantPatch, string> = {
  level: 'level',
  ego: 'ego',
  potentialAttained: 'potential_attained',
  partnerId: 'partner_id',
  partnerLevel: 'partner_level',
  partnerEgo: 'partner_ego',
  partnerPreferences: 'partner_preferences',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<CznCombatant, CznTrackedCombatant, CznCombatantPatch>({
  table: 'czn_tracked_combatants',
  entityIdColumn: 'combatant_id',
  catalog: ALL_CZN_COMBATANTS,
  columns: COMBATANT_COLUMNS,
  insertDefaults: {
    level: 1,
    ego: 0,
    potential_attained: false,
    partner_level: 1,
    partner_ego: 0,
  },
  select:
    'id, combatant_id, level, ego, potential_attained, partner_id, partner_level, partner_ego, partner_preferences, is_favorited, fragment_set_4_id, fragment_set_2_id, fragment_comments',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    ego: row.ego ?? 0,
    potentialAttained: !!row.potential_attained,
    partnerId: row.partner_id ?? null,
    partnerLevel: row.partner_level ?? 1,
    partnerEgo: row.partner_ego ?? 0,
    partnerPreferences: row.partner_preferences ?? [],
    fragments: { ...defaultFragments },
    fragmentPreferences: {
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      set4Id: null,
      set2Id: null,
      comments: '',
    },
  }),
  extras: {
    selectFragment: `czn_equipped_fragments ( id, slot, set_id, main_stat, czn_fragment_substats ( stat_type ) ),
      czn_fragment_preferences ( id, category, stat, operator_to_next, order_index )`,
    mapRow: (row, tracked) => {
      const fragments: CznTrackedCombatant['fragments'] = { ...defaultFragments };
      for (const f of row.czn_equipped_fragments || []) {
        fragments[f.slot as CznFragmentSlot] = {
          setId: f.set_id,
          mainStat: f.main_stat,
          subStats: (f.czn_fragment_substats || []).map((sub: any) => sub.stat_type),
        };
      }

      const prefRows: any[] = row.czn_fragment_preferences || [];
      const mainStats = {} as CznFragmentBuildPreferences['mainStats'];
      for (const slot of CZN_VARIABLE_MAIN_SLOTS) {
        mainStats[slot] = rowsToChain(prefRows.filter((p) => p.category === `slot${slot}_main`));
      }

      return {
        ...tracked,
        fragments,
        fragmentPreferences: {
          mainStats,
          subStats: rowsToChain(prefRows.filter((p) => p.category === 'sub_stats')),
          set4Id: row.fragment_set_4_id ?? null,
          set2Id: row.fragment_set_2_id ?? null,
          comments: row.fragment_comments || '',
        },
      };
    },
  },
});

export const loadCombatantsFromDB = svc.load;
export const insertCombatant = svc.insert;
export const deleteCombatant = svc.remove;
export const updateCombatant = svc.update;

// --- Equipped Memory Fragments ---
// Loading happens through the roster `extras` seam above; only the per-slot
// write functions live here.

export async function upsertFragment(
  dbId: string,
  slot: CznFragmentSlot,
  piece: CznEquippedFragment,
): Promise<void> {
  await upsertEquipmentSlot({
    table: 'czn_equipped_fragments',
    row: {
      tracked_combatant_id: dbId,
      slot,
      set_id: piece.setId,
      main_stat: piece.mainStat,
    },
    conflictColumns: ['tracked_combatant_id', 'slot'],
    substats: {
      table: 'czn_fragment_substats',
      fkColumn: 'fragment_id',
      rows: piece.subStats.map((s) => ({ stat_type: s })),
    },
  });
}

export async function deleteFragment(dbId: string, slot: CznFragmentSlot): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase
    .from('czn_equipped_fragments')
    .delete()
    .match({ tracked_combatant_id: dbId, slot });
}

// --- Fragment Build Preferences ---
// Set picks and comments persist as parent columns; the chains persist as
// category rows in czn_fragment_preferences via the shared preference-row helper.

export async function saveFragmentPreferences(
  dbId: string,
  prefs: CznFragmentBuildPreferences,
): Promise<void> {
  const fkColumn = 'tracked_combatant_id';
  const rows = [
    ...CZN_VARIABLE_MAIN_SLOTS.flatMap((slot) =>
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
    deleteFrom: [{ table: 'czn_fragment_preferences', fkColumn }],
    parentUpdate: {
      table: 'czn_tracked_combatants',
      row: {
        fragment_set_4_id: prefs.set4Id ?? null,
        fragment_set_2_id: prefs.set2Id ?? null,
        fragment_comments: prefs.comments ?? '',
      },
    },
    inserts: rows.length > 0 ? [{ table: 'czn_fragment_preferences', rows }] : [],
  });
}
