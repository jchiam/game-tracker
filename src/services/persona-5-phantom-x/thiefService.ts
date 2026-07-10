import { createRosterPersistence, savePreferenceRows } from '@/services/rosterPersistence';
import { supabase } from '@/lib/supabase';
import type {
  P5xThiefPatch,
  P5xTrackedThief,
  P5xRevelationPreferences,
  StatPreference,
} from '@/types';
import { ALL_THIEVES, type P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { EquippedRevelation, RevelationSlot } from '@/data/persona-5-phantom-x/revelations';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const THIEF_COLUMNS: Record<keyof P5xThiefPatch, string> = {
  level: 'level',
  awareness: 'awareness',
  isFavorited: 'is_favorited',
  skillsLeveled: 'skills_leveled',
  roseMaxed: 'rose_maxed',
  mindscapeMaxed: 'mindscape_maxed',
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
    skills_leveled: false,
    rose_maxed: false,
    mindscape_maxed: false,
    weapon_rarity: null,
    weapon_level: 1,
    weapon_forge: 0,
  },
  select:
    'id, thief_id, level, awareness, is_favorited, skills_leveled, rose_maxed, mindscape_maxed, weapon_rarity, weapon_level, weapon_forge, build_comments',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    awareness: row.awareness ?? 0,
    skillsLeveled: !!row.skills_leveled,
    roseMaxed: !!row.rose_maxed,
    mindscapeMaxed: !!row.mindscape_maxed,
    weaponRarity: row.weapon_rarity ?? null,
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
      p5x_revelation_preferences ( category, stat, operator, order_index )`,
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

      const prefRows = row.p5x_revelation_preferences || [];
      // Re-own every array (mainStats + subStats) so prefs never aliases the module-level
      // default; a bare spread copies the default's arrays by reference and push()es below
      // would then mutate shared state across thieves and reloads.
      const prefs: P5xRevelationPreferences = {
        ...defaultRevelationPreferences,
        mainStats: { moon: [], star: [], sky: [] },
        subStats: [],
        comments: row.build_comments || '',
      };
      for (const p of prefRows) {
        switch (p.category) {
          case 'heavens_set':
            prefs.heavensSetId = p.stat;
            break;
          case 'space_set':
            prefs.spaceSetId = p.stat;
            break;
          case 'moon_main':
            prefs.mainStats.moon.push({
              stat: p.stat,
              operator: p.operator,
              orderIndex: p.order_index,
            });
            break;
          case 'star_main':
            prefs.mainStats.star.push({
              stat: p.stat,
              operator: p.operator,
              orderIndex: p.order_index,
            });
            break;
          case 'sky_main':
            prefs.mainStats.sky.push({
              stat: p.stat,
              operator: p.operator,
              orderIndex: p.order_index,
            });
            break;
          case 'sub_stats':
            prefs.subStats.push({ stat: p.stat, operator: p.operator, orderIndex: p.order_index });
            break;
        }
      }
      prefs.mainStats.moon.sort((a, b) => a.orderIndex - b.orderIndex);
      prefs.mainStats.star.sort((a, b) => a.orderIndex - b.orderIndex);
      prefs.mainStats.sky.sort((a, b) => a.orderIndex - b.orderIndex);
      prefs.subStats.sort((a, b) => a.orderIndex - b.orderIndex);

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
  const rows: Record<string, unknown>[] = [];

  if (prefs.heavensSetId) {
    rows.push({
      thief_row_id: thiefDbId,
      category: 'heavens_set',
      stat: prefs.heavensSetId,
      operator: null,
      order_index: 0,
    });
  }
  if (prefs.spaceSetId) {
    rows.push({
      thief_row_id: thiefDbId,
      category: 'space_set',
      stat: prefs.spaceSetId,
      operator: null,
      order_index: 0,
    });
  }

  const addChain = (category: string, chain: StatPreference[]) => {
    for (const p of chain) {
      rows.push({
        thief_row_id: thiefDbId,
        category,
        stat: p.stat,
        operator: p.operator,
        order_index: p.orderIndex,
      });
    }
  };
  addChain('moon_main', prefs.mainStats.moon);
  addChain('star_main', prefs.mainStats.star);
  addChain('sky_main', prefs.mainStats.sky);
  addChain('sub_stats', prefs.subStats);

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
