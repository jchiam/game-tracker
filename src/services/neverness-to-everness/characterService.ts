import { supabase } from '@/lib/supabase';
import type { N2ETrackedCharacter } from '@/types';
import { ALL_CHARACTERS } from '@/data/neverness-to-everness/characters';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

export async function loadCharactersFromDB(userId: string): Promise<N2ETrackedCharacter[]> {
  if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

  const { data: dbData, error } = await supabase
    .from('n2e_tracked_characters')
    .select(
      `id, character_id, level, awakening_slots, resonance_count, arc_id, arc_level, arc_tier,
      cartridge_rarity, cartridge_level, cartridge_main_stat, cartridge_sub_stats, cartridge_comments, is_favorited,
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
        resonanceCount: row.resonance_count ?? 0,
        arcId: row.arc_id ?? null,
        arcLevel: row.arc_level ?? 1,
        arcTier: row.arc_tier ?? 1,
        cartridgeRarity: row.cartridge_rarity ?? null,
        cartridgeLevel: row.cartridge_level ?? 0,
        cartridgeMainStat: row.cartridge_main_stat ?? null,
        cartridgeSubStats: row.cartridge_sub_stats ?? [],
        cartridgePreferences: {
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
      resonance_count: 0,
      arc_id: null,
      arc_level: 1,
      arc_tier: 1,
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

export async function updateCharacter(dbId: string, updates: Record<string, any>): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase.from('n2e_tracked_characters').update(updates).eq('id', dbId);
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
    .update({ cartridge_comments: prefs.comments })
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
