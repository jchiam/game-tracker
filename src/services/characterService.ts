import { supabase } from '../lib/supabase';
import type { EquippedRelic } from '../data/relics';
import type { TrackedCharacter } from '../types';
import { ALL_CHARACTERS } from '../data/characters';

const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

// Load all tracked characters for a user from DB and rebuild TrackedCharacter objects
export async function loadCharactersFromDB(userId: string): Promise<TrackedCharacter[]> {
  if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

  const { data: dbData, error } = await supabase
    .from('tracked_characters')
    .select(`
      id, character_id, level, traces_attained, is_favorited,
      equipped_relics ( id, slot, set_id, main_stat, relic_substats ( stat_type, stat_value ) ),
      build_preference_main_stats ( id, slot, stat, operator_to_next, order_index ),
      build_preference_sub_stats ( id, stat, operator_to_next, order_index )
    `)
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching data:', error);
    return [];
  }

  if (!dbData || dbData.length === 0) return [];

  return dbData.map((row: any) => {
    const baseChar = ALL_CHARACTERS.find(c => c.id === row.character_id);
    if (!baseChar) return null;

    const structuredRelics: any = { ...defaultRelics };
    for (const r of row.equipped_relics || []) {
      structuredRelics[r.slot] = {
        setId: r.set_id,
        mainStat: r.main_stat,
        subStats: (r.relic_substats || []).map((sub: any) => ({ type: sub.stat_type, value: sub.stat_value }))
      };
    }

    const rawMainPrefs = row.build_preference_main_stats || [];
    const rawSubPrefs = row.build_preference_sub_stats || [];
    const prefs = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] } as Record<string, any>,
      subStats: [] as any[]
    };

    ['body', 'feet', 'sphere', 'rope'].forEach(part => {
      prefs.mainStats[part] = rawMainPrefs
        .filter((p: any) => p.slot === part)
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((p: any) => ({ stat: p.stat, operator: p.operator_to_next, orderIndex: p.order_index }));
    });

    prefs.subStats = rawSubPrefs
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((p: any) => ({ stat: p.stat, operator: p.operator_to_next, orderIndex: p.order_index }));

    return {
      ...baseChar,
      dbId: row.id,
      isFavorited: !!row.is_favorited,
      level: row.level,
      tracesAttained: row.traces_attained,
      relics: structuredRelics,
      buildPreferences: prefs as any
    };
  }).filter(Boolean) as TrackedCharacter[];
}

export async function insertCharacter(userId: string, charId: string): Promise<string | null> {
  if (!DB_ENABLED) return null;
  await supabase.from('user_profiles').upsert({ id: userId, updated_at: new Date().toISOString() });
  const { data, error } = await supabase.from('tracked_characters').insert({
    profile_id: userId,
    character_id: charId,
    level: 1,
    traces_attained: false
  }).select('id').single();
  if (error) { console.error('DB Insert Failed:', error); return null; }
  return data?.id ?? null;
}

export async function deleteCharacter(dbId: string): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase.from('tracked_characters').delete().eq('id', dbId);
}

export async function updateCharacter(dbId: string, updates: Record<string, any>): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase.from('tracked_characters').update(updates).eq('id', dbId);
  if (error) console.error('DB Update Failed:', error);
}

export async function upsertRelic(dbId: string, slot: string, relicData: EquippedRelic): Promise<void> {
  if (!DB_ENABLED) return;
  const { data: relicRow, error: relicErr } = await supabase.from('equipped_relics').upsert({
    tracked_character_id: dbId,
    slot,
    set_id: relicData.setId,
    main_stat: relicData.mainStat
  }, { onConflict: 'tracked_character_id,slot' }).select('id').single();

  if (relicRow && !relicErr) {
    await supabase.from('relic_substats').delete().eq('relic_id', relicRow.id);
    if (relicData.subStats.length > 0) {
      await supabase.from('relic_substats').insert(
        relicData.subStats.map(s => ({ relic_id: relicRow.id, stat_type: s.type, stat_value: s.value }))
      );
    }
  } else {
    console.error('Relic Upsert Error:', relicErr);
  }
}

export async function deleteRelic(dbId: string, slot: string): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase.from('equipped_relics').delete().match({ tracked_character_id: dbId, slot });
}

export async function saveBuildPrefs(dbId: string, prefs: TrackedCharacter['buildPreferences']): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase.from('build_preference_main_stats').delete().eq('tracked_character_id', dbId);
  await supabase.from('build_preference_sub_stats').delete().eq('tracked_character_id', dbId);

  const mainInserts: any[] = [];
  (['body', 'feet', 'sphere', 'rope'] as const).forEach(slot => {
    prefs.mainStats[slot].forEach((pref, idx) => {
      mainInserts.push({ tracked_character_id: dbId, slot, stat: pref.stat, operator_to_next: pref.operator, order_index: idx });
    });
  });

  const subInserts = prefs.subStats.map((pref, idx) => ({
    tracked_character_id: dbId, stat: pref.stat, operator_to_next: pref.operator, order_index: idx
  }));

  if (mainInserts.length > 0) {
    const { error } = await supabase.from('build_preference_main_stats').insert(mainInserts);
    if (error) console.error('Error saving main stat prefs:', error);
  }
  if (subInserts.length > 0) {
    const { error } = await supabase.from('build_preference_sub_stats').insert(subInserts);
    if (error) console.error('Error saving sub stat prefs:', error);
  }
}
