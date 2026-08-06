import {
  chainToRows,
  createRosterPersistence,
  rowsToChain,
  savePreferenceRows,
} from '@/services/rosterPersistence';
import type { N2ECharacterPatch, N2ETrackedCharacter } from '@/types';
import { type N2ECharacter } from '@/data/neverness-to-everness/characters';
import { ALL_CHARACTERS } from '@/data/neverness-to-everness/characterOverrides';
import { renameN2EStatLabel } from '@/data/neverness-to-everness/statLabelRename';

/** Remap a loaded preference chain's stat labels to their in-game form (back-compat). */
function renameChainStats<T extends { stat: string }>(chain: T[]): T[] {
  return chain.map((entry) => ({ ...entry, stat: renameN2EStatLabel(entry.stat) }));
}

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const CHARACTER_COLUMNS: Record<keyof N2ECharacterPatch, string> = {
  level: 'level',
  modulesConfigured: 'modules_configured',
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

const svc = createRosterPersistence<N2ECharacter, N2ETrackedCharacter, N2ECharacterPatch>({
  table: 'n2e_tracked_characters',
  entityIdColumn: 'character_id',
  catalog: ALL_CHARACTERS,
  columns: CHARACTER_COLUMNS,
  insertDefaults: {
    level: 1,
    modules_configured: false,
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
  select: `id, character_id, level, modules_configured, awakening_slots, arc_id, arc_level, arc_tier,
      cartridge_id, cartridge_preference_id, cartridge_rarity, cartridge_level, cartridge_main_stat, cartridge_sub_stats, cartridge_comments, is_favorited`,
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    modulesConfigured: !!row.modules_configured,
    awakening: row.awakening_slots ?? [false, false, false, false, false, false],
    arcId: row.arc_id ?? null,
    arcLevel: row.arc_level ?? 1,
    arcTier: row.arc_tier ?? 1,
    cartridgeId: row.cartridge_id ?? null,
    cartridgeRarity: row.cartridge_rarity ?? null,
    cartridgeLevel: row.cartridge_level ?? 0,
    cartridgeMainStat: row.cartridge_main_stat ? renameN2EStatLabel(row.cartridge_main_stat) : null,
    cartridgeSubStats: (row.cartridge_sub_stats ?? []).map(renameN2EStatLabel),
    cartridgePreferences: { cartridgeId: null, mainStats: [], subStats: [], comments: '' },
  }),
  extras: {
    selectFragment: `n2e_cartridge_preference_main_stats ( id, stat, operator_to_next, order_index ),
      n2e_cartridge_preference_sub_stats ( id, stat, operator_to_next, order_index )`,
    mapRow: (row, tracked) => ({
      ...tracked,
      cartridgePreferences: {
        cartridgeId: row.cartridge_preference_id ?? null,
        mainStats: renameChainStats(rowsToChain(row.n2e_cartridge_preference_main_stats || [])),
        subStats: renameChainStats(rowsToChain(row.n2e_cartridge_preference_sub_stats || [])),
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
        rows: chainToRows(prefs.mainStats, { dbId, fkColumn: 'tracked_character_id' }),
      },
      {
        table: 'n2e_cartridge_preference_sub_stats',
        rows: chainToRows(prefs.subStats, { dbId, fkColumn: 'tracked_character_id' }),
      },
    ],
  });
}
