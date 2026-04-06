import { supabase } from '@/lib/supabase';
import type { R1999TrackedArcanist } from '@/types';
import { ALL_ARCANISTS } from '@/data/reverse1999/arcanists';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

export async function loadArcanistsFromDB(userId: string): Promise<R1999TrackedArcanist[]> {
  if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

  const { data: dbData, error } = await supabase
    .from('r1999_tracked_arcanists')
    .select('id, arcanist_id, level, insight_level, is_favorited')
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching arcanists:', error);
    return [];
  }

  if (!dbData || dbData.length === 0) return [];

  return dbData
    .map((row: any) => {
      const baseArcanist = ALL_ARCANISTS.find((a) => a.id === row.arcanist_id);
      if (!baseArcanist) return null;
      return {
        ...baseArcanist,
        dbId: row.id,
        isFavorited: !!row.is_favorited,
        level: row.level,
        insightLevel: row.insight_level as 0 | 1 | 2 | 3,
      };
    })
    .filter(Boolean) as R1999TrackedArcanist[];
}

export async function insertArcanist(userId: string, arcanistId: string): Promise<string | null> {
  if (!DB_ENABLED) return null;
  await supabase.from('user_profiles').upsert({ id: userId, updated_at: new Date().toISOString() });
  const { data, error } = await supabase
    .from('r1999_tracked_arcanists')
    .insert({
      profile_id: userId,
      arcanist_id: arcanistId,
      level: 1,
      insight_level: 0,
    })
    .select('id')
    .single();
  if (error) {
    console.error('DB Insert Failed:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function deleteArcanist(dbId: string): Promise<void> {
  if (!DB_ENABLED) return;
  await supabase.from('tracked_arcanists').delete().eq('id', dbId);
}

export async function updateArcanist(dbId: string, updates: Record<string, any>): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase.from('tracked_arcanists').update(updates).eq('id', dbId);
  if (error) console.error('DB Update Failed:', error);
}
