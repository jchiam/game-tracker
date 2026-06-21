import { supabase } from '@/lib/supabase';
import type { EndfieldOperatorPatch, EndfieldTrackedOperator } from '@/types';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

const OPERATOR_COLUMNS: Record<keyof EndfieldOperatorPatch, string> = {
  level: 'level',
  potential: 'potential',
  isFavorited: 'is_favorited',
};

export async function loadOperatorsFromDB(userId: string): Promise<EndfieldTrackedOperator[]> {
  if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

  const { data, error } = await supabase
    .from('endfield_tracked_operators')
    .select('id, operator_id, level, potential, is_favorited')
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
        potential: row.potential ?? 0,
      };
    })
    .filter(Boolean) as EndfieldTrackedOperator[];
}

export async function insertOperator(userId: string, operatorId: string): Promise<string | null> {
  if (!DB_ENABLED) return null;
  await supabase.from('user_profiles').upsert({ id: userId, updated_at: new Date().toISOString() });
  const { data, error } = await supabase
    .from('endfield_tracked_operators')
    .insert({
      profile_id: userId,
      operator_id: operatorId,
      level: 1,
      potential: 0,
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
  const { error } = await supabase.from('endfield_tracked_operators').delete().eq('id', dbId);
  if (error) {
    console.error('DB Delete Failed:', error);
    throw error;
  }
}

export async function updateOperator(dbId: string, patch: EndfieldOperatorPatch): Promise<void> {
  if (!DB_ENABLED) return;
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as (keyof EndfieldOperatorPatch)[]) {
    row[OPERATOR_COLUMNS[key]] = patch[key];
  }
  const { error } = await supabase.from('endfield_tracked_operators').update(row).eq('id', dbId);
  if (error) {
    console.error('DB Update Failed:', error);
    throw error;
  }
}
