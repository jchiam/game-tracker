import { supabase } from '@/lib/supabase';
import {
  chainToRows,
  createRosterPersistence,
  rowsToChain,
  savePreferenceRows,
} from '@/services/rosterPersistence';
import type { EquippedRelic } from '@/data/honkai-star-rail/relics';
import type { HsrCharacterPatch, HsrTrackedCharacter } from '@/types';
import { ALL_CHARACTERS, type Character } from '@/data/honkai-star-rail/characters';

const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

const MAIN_STAT_SLOTS = ['body', 'feet', 'sphere', 'rope'] as const;

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const CHARACTER_COLUMNS: Record<keyof HsrCharacterPatch, string> = {
  level: 'level',
  tracesAttained: 'traces_attained',
  isFavorited: 'is_favorited',
  lightConeId: 'light_cone_id',
  lightConeLevel: 'light_cone_level',
  lightConeSuperimposition: 'light_cone_superimposition',
  lightConePreferences: 'light_cone_preferences',
  useAltPortrait: 'use_alt_portrait',
};

const svc = createRosterPersistence<Character, HsrTrackedCharacter, HsrCharacterPatch>({
  table: 'hsr_tracked_characters',
  entityIdColumn: 'character_id',
  catalog: ALL_CHARACTERS,
  columns: CHARACTER_COLUMNS,
  insertDefaults: {
    level: 1,
    traces_attained: false,
    use_alt_portrait: false,
    light_cone_id: null,
    light_cone_level: 1,
    light_cone_superimposition: 1,
  },
  select:
    'id, character_id, level, traces_attained, use_alt_portrait, is_favorited, build_comments, relic_set_id, planar_set_id, light_cone_id, light_cone_level, light_cone_superimposition, light_cone_preferences',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    tracesAttained: row.traces_attained,
    useAltPortrait: !!row.use_alt_portrait,
    lightConeId: row.light_cone_id ?? null,
    lightConeLevel: row.light_cone_level ?? 1,
    lightConeSuperimposition: row.light_cone_superimposition ?? 1,
    lightConePreferences: row.light_cone_preferences ?? [],
    relics: { ...defaultRelics },
    buildPreferences: {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [],
      relicSetId: null,
      planarSetId: null,
      comments: '',
    },
  }),
  extras: {
    selectFragment: `hsr_equipped_relics ( id, slot, set_id, main_stat, hsr_relic_substats ( stat_type ) ),
      hsr_build_preference_main_stats ( id, slot, stat, operator_to_next, order_index ),
      hsr_build_preference_sub_stats ( id, stat, operator_to_next, order_index )`,
    mapRow: (row, tracked) => {
      const structuredRelics: any = { ...defaultRelics };
      for (const r of row.hsr_equipped_relics || []) {
        structuredRelics[r.slot] = {
          setId: r.set_id,
          mainStat: r.main_stat,
          subStats: (r.hsr_relic_substats || []).map((sub: any) => sub.stat_type),
        };
      }

      const rawMainPrefs = row.hsr_build_preference_main_stats || [];
      const mainStats = {} as HsrTrackedCharacter['buildPreferences']['mainStats'];
      for (const slot of MAIN_STAT_SLOTS) {
        mainStats[slot] = rowsToChain(rawMainPrefs.filter((p: any) => p.slot === slot));
      }

      return {
        ...tracked,
        relics: structuredRelics,
        buildPreferences: {
          mainStats,
          subStats: rowsToChain(row.hsr_build_preference_sub_stats || []),
          relicSetId: row.relic_set_id ?? null,
          planarSetId: row.planar_set_id ?? null,
          comments: row.build_comments || '',
        },
      };
    },
  },
});

export const loadCharactersFromDB = svc.load;
export const insertCharacter = svc.insert;
export const deleteCharacter = svc.remove;
export const updateCharacter = svc.update;

export async function upsertRelic(
  dbId: string,
  slot: string,
  relicData: EquippedRelic,
): Promise<void> {
  if (!DB_ENABLED) return;
  const { data: relicRow, error: relicErr } = await supabase
    .from('hsr_equipped_relics')
    .upsert(
      {
        tracked_character_id: dbId,
        slot,
        set_id: relicData.setId,
        main_stat: relicData.mainStat,
      },
      { onConflict: 'tracked_character_id,slot' },
    )
    .select('id')
    .single();

  if (relicErr) {
    console.error('Relic Upsert Error:', relicErr);
    throw relicErr;
  }
  await supabase.from('hsr_relic_substats').delete().eq('relic_id', relicRow.id);
  if (relicData.subStats.length > 0) {
    const { error: substatErr } = await supabase.from('hsr_relic_substats').insert(
      relicData.subStats.map((s) => ({
        relic_id: relicRow.id,
        stat_type: s,
      })),
    );
    if (substatErr) {
      console.error('Relic Substat Insert Error:', substatErr);
      throw substatErr;
    }
  }
}

export async function deleteRelic(dbId: string, slot: string): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase.from('hsr_equipped_relics').delete().match({ tracked_character_id: dbId, slot });
}

export async function saveBuildPrefs(
  dbId: string,
  prefs: HsrTrackedCharacter['buildPreferences'],
): Promise<void> {
  const fkColumn = 'tracked_character_id';
  const mainInserts = MAIN_STAT_SLOTS.flatMap((slot) =>
    chainToRows(prefs.mainStats[slot], { dbId, fkColumn, extra: { slot } }),
  );

  await savePreferenceRows({
    dbId,
    deleteFrom: [
      { table: 'hsr_build_preference_main_stats', fkColumn: 'tracked_character_id' },
      { table: 'hsr_build_preference_sub_stats', fkColumn: 'tracked_character_id' },
    ],
    parentUpdate: {
      table: 'hsr_tracked_characters',
      row: {
        build_comments: prefs.comments,
        relic_set_id: prefs.relicSetId ?? null,
        planar_set_id: prefs.planarSetId ?? null,
      },
    },
    inserts: [
      { table: 'hsr_build_preference_main_stats', rows: mainInserts },
      {
        table: 'hsr_build_preference_sub_stats',
        rows: chainToRows(prefs.subStats, { dbId, fkColumn }),
      },
    ],
  });
}
