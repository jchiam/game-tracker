import {
  chainToRows,
  createRosterPersistence,
  rowsToChain,
  savePreferenceRows,
} from '@/services/rosterPersistence';
import { supabase } from '@/lib/supabase';
import type { P5xThiefPatch, P5xTrackedThief, P5xRevelationPreferences } from '@/types';
import { ALL_THIEVES, type P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { EquippedRevelation, RevelationSlot } from '@/data/persona-5-phantom-x/revelations';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const THIEF_COLUMNS: Record<keyof P5xThiefPatch, string> = {
  level: 'level',
  awareness: 'awareness',
  isFavorited: 'is_favorited',
  skillProgress: 'skill_progress',
  mindscapeProgress: 'mindscape_progress',
  weaponRarity: 'weapon_rarity',
  weaponLevel: 'weapon_level',
  weaponForge: 'weapon_forge',
};

const defaultRevelations: P5xTrackedThief['revelations'] = {
  sun: null,
  moon: null,
  star: null,
  sky: null,
  space: null,
};

const defaultRevelationPreferences: P5xRevelationPreferences = {
  heavensSetId: null,
  spaceSetId: null,
  mainStats: { moon: [], star: [], sky: [] },
  subStats: [],
  comments: '',
};

const svc = createRosterPersistence<P5xThief, P5xTrackedThief, P5xThiefPatch>({
  table: 'p5x_tracked_thieves',
  entityIdColumn: 'thief_id',
  catalog: ALL_THIEVES,
  columns: THIEF_COLUMNS,
  insertDefaults: {
    level: 1,
    awareness: 0,
    skill_progress: 0,
    mindscape_progress: 0,
    weapon_rarity: 2,
    weapon_level: 1,
    weapon_forge: 0,
  },
  select:
    'id, thief_id, level, awareness, is_favorited, skill_progress, mindscape_progress, weapon_rarity, weapon_level, weapon_forge, build_comments',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    awareness: row.awareness ?? 0,
    skillProgress: row.skill_progress ?? 0,
    mindscapeProgress: row.mindscape_progress ?? 0,
    weaponRarity: row.weapon_rarity ?? 2,
    weaponLevel: row.weapon_level ?? 1,
    weaponForge: row.weapon_forge ?? 0,
    revelations: { ...defaultRevelations },
    // Fresh arrays — a bare spread aliases defaultRevelationPreferences' arrays by reference.
    revelationPreferences: {
      ...defaultRevelationPreferences,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
    },
  }),
  extras: {
    selectFragment: `p5x_revelation_cards ( slot, set_id, main_stat, sub_stats ),
      p5x_revelation_preferences ( category, stat, operator_to_next, order_index )`,
    mapRow: (row: any, tracked: P5xTrackedThief) => {
      const revelations: P5xTrackedThief['revelations'] = { ...defaultRevelations };
      for (const r of row.p5x_revelation_cards || []) {
        const slot = r.slot as RevelationSlot;
        revelations[slot] = {
          setId: r.set_id,
          mainStat: r.main_stat,
          subStats: r.sub_stats ?? [],
        };
      }

      const prefRows: any[] = row.p5x_revelation_preferences || [];
      const byCategory = (category: string) =>
        rowsToChain(prefRows.filter((p) => p.category === category));
      // Chains reconstruct through the shared codec (fresh arrays, so no aliasing of the
      // module-level default); the set-id scalars are single rows, not chains.
      const prefs: P5xRevelationPreferences = {
        ...defaultRevelationPreferences,
        heavensSetId: prefRows.find((p) => p.category === 'heavens_set')?.stat ?? null,
        spaceSetId: prefRows.find((p) => p.category === 'space_set')?.stat ?? null,
        mainStats: {
          moon: byCategory('moon_main'),
          star: byCategory('star_main'),
          sky: byCategory('sky_main'),
        },
        subStats: byCategory('sub_stats'),
        comments: row.build_comments || '',
      };

      return { ...tracked, revelations, revelationPreferences: prefs };
    },
  },
});

export const loadThievesFromDB = svc.load;
export const insertThief = svc.insert;
export const deleteThief = svc.remove;
export const updateThief = svc.update;

// --- Revelation Cards ---
// Loading happens through the roster `extras` seam above; only the per-slot
// write functions live here.

export async function upsertRevelationCard(
  thiefDbId: string,
  slot: RevelationSlot,
  data: EquippedRevelation,
): Promise<void> {
  if (!DB_ENABLED) return;

  const { error } = await supabase.from('p5x_revelation_cards').upsert(
    {
      thief_row_id: thiefDbId,
      slot,
      set_id: data.setId,
      main_stat: data.mainStat,
      sub_stats: data.subStats,
    },
    { onConflict: 'thief_row_id,slot' },
  );

  if (error) {
    console.error('upsertRevelationCard error:', error);
    throw error;
  }
}

export async function deleteRevelationCard(thiefDbId: string, slot: RevelationSlot): Promise<void> {
  if (!DB_ENABLED) return;

  const { error } = await supabase
    .from('p5x_revelation_cards')
    .delete()
    .eq('thief_row_id', thiefDbId)
    .eq('slot', slot);

  if (error) {
    console.error('deleteRevelationCard error:', error);
    throw error;
  }
}

// --- Revelation Preferences ---
// Loading happens through the roster `extras` seam above (comments load from
// the parent row's build_comments); only the save function lives here.

export async function saveRevelationPreferences(
  thiefDbId: string,
  prefs: P5xRevelationPreferences,
): Promise<void> {
  const fkColumn = 'thief_row_id';
  const rows: Record<string, unknown>[] = [];

  // Set-id scalars: single rows, not chains — outside the codec by design.
  if (prefs.heavensSetId) {
    rows.push({
      thief_row_id: thiefDbId,
      category: 'heavens_set',
      stat: prefs.heavensSetId,
      operator_to_next: null,
      order_index: 0,
    });
  }
  if (prefs.spaceSetId) {
    rows.push({
      thief_row_id: thiefDbId,
      category: 'space_set',
      stat: prefs.spaceSetId,
      operator_to_next: null,
      order_index: 0,
    });
  }

  rows.push(
    ...chainToRows(prefs.mainStats.moon, {
      dbId: thiefDbId,
      fkColumn,
      extra: { category: 'moon_main' },
    }),
    ...chainToRows(prefs.mainStats.star, {
      dbId: thiefDbId,
      fkColumn,
      extra: { category: 'star_main' },
    }),
    ...chainToRows(prefs.mainStats.sky, {
      dbId: thiefDbId,
      fkColumn,
      extra: { category: 'sky_main' },
    }),
    ...chainToRows(prefs.subStats, { dbId: thiefDbId, fkColumn, extra: { category: 'sub_stats' } }),
  );

  await savePreferenceRows({
    dbId: thiefDbId,
    deleteFrom: [{ table: 'p5x_revelation_preferences', fkColumn: 'thief_row_id' }],
    parentUpdate: {
      table: 'p5x_tracked_thieves',
      row: { build_comments: prefs.comments },
    },
    inserts: rows.length > 0 ? [{ table: 'p5x_revelation_preferences', rows }] : [],
  });
}
