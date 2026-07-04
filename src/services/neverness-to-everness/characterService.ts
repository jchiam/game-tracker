import { createRosterPersistence, savePreferenceRows } from '@/services/rosterPersistence';
import type { N2ECharacterPatch, N2ETrackedCharacter, StatPreference } from '@/types';
import { ALL_CHARACTERS, type N2ECharacter } from '@/data/neverness-to-everness/characters';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const CHARACTER_COLUMNS: Record<keyof N2ECharacterPatch, string> = {
  level: 'level',
  awakening: 'awakening_slots',
  arcId: 'arc_id',
  arcLevel: 'arc_level',
  arcTier: 'arc_tier',
  cartridgeId: 'cartridge_id',
  cartridgeRarity: 'cartridge_rarity',
  cartridgeLevel: 'cartridge_level',
  cartridgeMainStat: 'cartridge_main_stat',
  cartridgeSubStats: 'cartridge_sub_stats',
  isFavorited: 'is_favorited',
};

function toStatPreferences(raw: any[]): StatPreference[] {
  return raw
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((p: any) => ({
      stat: p.stat,
      operator: p.operator_to_next,
      orderIndex: p.order_index,
    }));
}

const svc = createRosterPersistence<N2ECharacter, N2ETrackedCharacter, N2ECharacterPatch>({
  table: 'n2e_tracked_characters',
  entityIdColumn: 'character_id',
  catalog: ALL_CHARACTERS,
  columns: CHARACTER_COLUMNS,
  insertDefaults: {
    level: 1,
    awakening_slots: [false, false, false, false, false, false],
    arc_id: null,
    arc_level: 1,
    arc_tier: 1,
    cartridge_id: null,
    cartridge_preference_id: null,
    cartridge_rarity: null,
    cartridge_level: 0,
    cartridge_main_stat: null,
    cartridge_sub_stats: [],
  },
  select: `id, character_id, level, awakening_slots, arc_id, arc_level, arc_tier,
      cartridge_id, cartridge_preference_id, cartridge_rarity, cartridge_level, cartridge_main_stat, cartridge_sub_stats, cartridge_comments, is_favorited`,
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    awakening: row.awakening_slots ?? [false, false, false, false, false, false],
    arcId: row.arc_id ?? null,
    arcLevel: row.arc_level ?? 1,
    arcTier: row.arc_tier ?? 1,
    cartridgeId: row.cartridge_id ?? null,
    cartridgeRarity: row.cartridge_rarity ?? null,
    cartridgeLevel: row.cartridge_level ?? 0,
    cartridgeMainStat: row.cartridge_main_stat ?? null,
    cartridgeSubStats: row.cartridge_sub_stats ?? [],
    cartridgePreferences: { cartridgeId: null, mainStats: [], subStats: [], comments: '' },
  }),
  extras: {
    selectFragment: `n2e_cartridge_preference_main_stats ( id, stat, operator_to_next, order_index ),
      n2e_cartridge_preference_sub_stats ( id, stat, operator_to_next, order_index )`,
    mapRow: (row, tracked) => ({
      ...tracked,
      cartridgePreferences: {
        cartridgeId: row.cartridge_preference_id ?? null,
        mainStats: toStatPreferences(row.n2e_cartridge_preference_main_stats || []),
        subStats: toStatPreferences(row.n2e_cartridge_preference_sub_stats || []),
        comments: row.cartridge_comments || '',
      },
    }),
  },
});

export const loadCharactersFromDB = svc.load;
export const insertCharacter = svc.insert;
export const deleteCharacter = svc.remove;
export const updateCharacter = svc.update;

export async function saveCartridgePreferences(
  dbId: string,
  prefs: N2ETrackedCharacter['cartridgePreferences'],
): Promise<void> {
  await savePreferenceRows({
    dbId,
    deleteFrom: [
      { table: 'n2e_cartridge_preference_main_stats', fkColumn: 'tracked_character_id' },
      { table: 'n2e_cartridge_preference_sub_stats', fkColumn: 'tracked_character_id' },
    ],
    parentUpdate: {
      table: 'n2e_tracked_characters',
      row: {
        cartridge_comments: prefs.comments,
        cartridge_preference_id: prefs.cartridgeId ?? null,
      },
    },
    inserts: [
      {
        table: 'n2e_cartridge_preference_main_stats',
        rows: prefs.mainStats.map((pref, idx) => ({
          tracked_character_id: dbId,
          stat: pref.stat,
          operator_to_next: pref.operator,
          order_index: idx,
        })),
      },
      {
        table: 'n2e_cartridge_preference_sub_stats',
        rows: prefs.subStats.map((pref, idx) => ({
          tracked_character_id: dbId,
          stat: pref.stat,
          operator_to_next: pref.operator,
          order_index: idx,
        })),
      },
    ],
  });
}
