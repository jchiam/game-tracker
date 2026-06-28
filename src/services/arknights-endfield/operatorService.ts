import { supabase } from '@/lib/supabase';
import type { AeOperatorPatch, AeTrackedOperator } from '@/types';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

const OPERATOR_COLUMNS: Record<keyof AeOperatorPatch, string> = {
  level: 'level',
  phase: 'phase',
  skillsMaxed: 'skills_maxed',
  weaponName: 'weapon_name',
  weaponLevel: 'weapon_level',
  weaponPreferences: 'weapon_preferences',
  isFavorited: 'is_favorited',
};

export async function loadOperatorsFromDB(userId: string): Promise<AeTrackedOperator[]> {
  if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

  const { data, error } = await supabase
    .from('ae_tracked_operators')
    .select(
      'id, operator_id, level, phase, skills_maxed, weapon_name, weapon_level, weapon_preferences, is_favorited',
    )
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  return data
    .map((row: any) => {
      const base = ALL_OPERATORS.find((o) => o.id === row.operator_id);
      if (!base) return null;
      return {
        ...base,
        dbId: row.id,
        isFavorited: !!row.is_favorited,
        level: row.level,
        phase: row.phase ?? 0,
        skillsMaxed: !!row.skills_maxed,
        weaponName: row.weapon_name ?? null,
        weaponLevel: row.weapon_level ?? 1,
        weaponPreferences: row.weapon_preferences ?? [],
      };
    })
    .filter(Boolean) as AeTrackedOperator[];
}

export async function insertOperator(userId: string, operatorId: string): Promise<string | null> {
  if (!DB_ENABLED) return null;
  await supabase.from('user_profiles').upsert({ id: userId, updated_at: new Date().toISOString() });
  const { data, error } = await supabase
    .from('ae_tracked_operators')
    .insert({
      profile_id: userId,
      operator_id: operatorId,
      level: 1,
      phase: 0,
      skills_maxed: false,
      weapon_level: 1,
    })
    .select('id')
    .single();
  if (error) {
    console.error('DB Insert Failed:', error);
    throw error;
  }
  return data?.id ?? null;
}

export async function deleteOperator(dbId: string): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase.from('ae_tracked_operators').delete().eq('id', dbId);
  if (error) {
    console.error('DB Delete Failed:', error);
    throw error;
  }
}

export async function updateOperator(dbId: string, patch: AeOperatorPatch): Promise<void> {
  if (!DB_ENABLED) return;
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as (keyof AeOperatorPatch)[]) {
    row[OPERATOR_COLUMNS[key]] = patch[key];
  }
  const { error } = await supabase.from('ae_tracked_operators').update(row).eq('id', dbId);
  if (error) {
    console.error('DB Update Failed:', error);
    throw error;
  }
}
