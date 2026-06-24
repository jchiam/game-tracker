import { supabase } from '@/lib/supabase';
import type { N2ECharacterPatch, N2ETrackedCharacter } from '@/types';
import { ALL_CHARACTERS } from '@/data/neverness-to-everness/characters';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

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

export async function loadCharactersFromDB(userId: string): Promise<N2ETrackedCharacter[]> {
  if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

  const { data: dbData, error } = await supabase
    .from('n2e_tracked_characters')
    .select(
      `id, character_id, level, awakening_slots, arc_id, arc_level, arc_tier,
      cartridge_id, cartridge_preference_id, cartridge_rarity, cartridge_level, cartridge_main_stat, cartridge_sub_stats, cartridge_comments, is_favorited,
      n2e_cartridge_preference_main_stats ( id, stat, operator_to_next, order_index ),
      n2e_cartridge_preference_sub_stats ( id, stat, operator_to_next, order_index )`,
    )
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }

  if (!dbData || dbData.length === 0) return [];

  return dbData
    .map((row: any) => {
      const baseChar = ALL_CHARACTERS.find((c) => c.id === row.character_id);
      if (!baseChar) return null;

      const rawMainPrefs = row.n2e_cartridge_preference_main_stats || [];
      const rawSubPrefs = row.n2e_cartridge_preference_sub_stats || [];

      return {
        ...baseChar,
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
        cartridgePreferences: {
          cartridgeId: row.cartridge_preference_id ?? null,
          mainStats: rawMainPrefs
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((p: any) => ({
              stat: p.stat,
              operator: p.operator_to_next,
              orderIndex: p.order_index,
            })),
          subStats: rawSubPrefs
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((p: any) => ({
              stat: p.stat,
              operator: p.operator_to_next,
              orderIndex: p.order_index,
            })),
          comments: row.cartridge_comments || '',
        },
      };
    })
    .filter(Boolean) as N2ETrackedCharacter[];
}

export async function insertCharacter(userId: string, characterId: string): Promise<string | null> {
  if (!DB_ENABLED) return null;
  await supabase.from('user_profiles').upsert({ id: userId, updated_at: new Date().toISOString() });
  const { data, error } = await supabase
    .from('n2e_tracked_characters')
    .insert({
      profile_id: userId,
      character_id: characterId,
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
    })
    .select('id')
    .single();
  if (error) {
    console.error('DB Insert Failed:', error);
    throw error;
  }
  return data?.id ?? null;
}

export async function deleteCharacter(dbId: string): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase.from('n2e_tracked_characters').delete().eq('id', dbId);
  if (error) {
    console.error('DB Delete Failed:', error);
    throw error;
  }
}

export async function updateCharacter(dbId: string, patch: N2ECharacterPatch): Promise<void> {
  if (!DB_ENABLED) return;
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as (keyof N2ECharacterPatch)[]) {
    row[CHARACTER_COLUMNS[key]] = patch[key];
  }
  const { error } = await supabase.from('n2e_tracked_characters').update(row).eq('id', dbId);
  if (error) {
    console.error('DB Update Failed:', error);
    throw error;
  }
}

export async function saveCartridgePreferences(
  dbId: string,
  prefs: N2ETrackedCharacter['cartridgePreferences'],
): Promise<void> {
  if (!DB_ENABLED) return;

  await supabase
    .from('n2e_cartridge_preference_main_stats')
    .delete()
    .eq('tracked_character_id', dbId);
  await supabase
    .from('n2e_cartridge_preference_sub_stats')
    .delete()
    .eq('tracked_character_id', dbId);

  await supabase
    .from('n2e_tracked_characters')
    .update({
      cartridge_comments: prefs.comments,
      cartridge_preference_id: prefs.cartridgeId ?? null,
    })
    .eq('id', dbId);

  const mainInserts = prefs.mainStats.map((pref, idx) => ({
    tracked_character_id: dbId,
    stat: pref.stat,
    operator_to_next: pref.operator,
    order_index: idx,
  }));

  const subInserts = prefs.subStats.map((pref, idx) => ({
    tracked_character_id: dbId,
    stat: pref.stat,
    operator_to_next: pref.operator,
    order_index: idx,
  }));

  if (mainInserts.length > 0) {
    const { error } = await supabase
      .from('n2e_cartridge_preference_main_stats')
      .insert(mainInserts);
    if (error) {
      console.error('Error saving main stat prefs:', error);
      throw error;
    }
  }
  if (subInserts.length > 0) {
    const { error } = await supabase.from('n2e_cartridge_preference_sub_stats').insert(subInserts);
    if (error) {
      console.error('Error saving sub stat prefs:', error);
      throw error;
    }
  }
}
