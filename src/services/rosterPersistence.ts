import { supabase } from '@/lib/supabase';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

/**
 * Config for one game's tracked-entity persistence. Everything that varies
 * between games is data here; the CRUD behaviour lives in the factory below.
 */
export interface RosterPersistenceConfig<TBase extends { id: string }, TTracked, TPatch> {
  /** Tracked-entity table, e.g. 'hsr_tracked_characters'. */
  table: string;
  /** FK column linking a row to its catalog entry, e.g. 'character_id'. */
  entityIdColumn: string;
  /** Static catalog array the DB rows are merged with on load. */
  catalog: readonly TBase[];
  /** Maps each camelCase patch key to its DB column. Schema stays service-private. */
  columns: Record<keyof TPatch, string>;
  /** Snake_case column defaults for a freshly tracked entity. */
  insertDefaults: Record<string, unknown>;
  /** Own-table select columns. Extras join fragments are appended automatically. */
  select: string;
  /** Builds the tracked entity from a DB row and its catalog entry. */
  fromRow: (row: any, base: TBase) => TTracked;
  /** Optional game-specific reconstruction from joined tables (relics, cartridge prefs). */
  extras?: {
    selectFragment: string;
    mapRow: (row: any, tracked: TTracked) => TTracked;
  };
}

export function createRosterPersistence<
  TBase extends { id: string },
  TTracked,
  TPatch extends object,
>(config: RosterPersistenceConfig<TBase, TTracked, TPatch>) {
  const selectStatement = config.extras
    ? `${config.select}, ${config.extras.selectFragment}`
    : config.select;

  async function load(userId: string): Promise<TTracked[]> {
    if (!DB_ENABLED || !import.meta.env.VITE_SUPABASE_ANON_KEY) return [];

    const { data, error } = await supabase
      .from(config.table)
      .select(selectStatement)
      .eq('profile_id', userId);

    if (error) {
      console.error('DB Load Failed:', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    return data
      .map((row: any) => {
        const base = config.catalog.find((entry) => entry.id === row[config.entityIdColumn]);
        if (!base) return null;
        const tracked = config.fromRow(row, base);
        return config.extras ? config.extras.mapRow(row, tracked) : tracked;
      })
      .filter(Boolean) as TTracked[];
  }

  async function insert(userId: string, entityId: string): Promise<string | null> {
    if (!DB_ENABLED) return null;
    await supabase
      .from('user_profiles')
      .upsert({ id: userId, updated_at: new Date().toISOString() });
    const { data, error } = await supabase
      .from(config.table)
      .insert({
        profile_id: userId,
        [config.entityIdColumn]: entityId,
        ...config.insertDefaults,
      })
      .select('id')
      .single();
    if (error) {
      console.error('DB Insert Failed:', error);
      throw error;
    }
    return data?.id ?? null;
  }

  async function remove(dbId: string): Promise<void> {
    if (!DB_ENABLED) return;
    const { error } = await supabase.from(config.table).delete().eq('id', dbId);
    if (error) {
      console.error('DB Delete Failed:', error);
      throw error;
    }
  }

  async function update(dbId: string, patch: TPatch): Promise<void> {
    if (!DB_ENABLED) return;
    const row: Record<string, unknown> = {};
    for (const key of Object.keys(patch) as (keyof TPatch)[]) {
      row[config.columns[key]] = patch[key];
    }
    const { error } = await supabase.from(config.table).update(row).eq('id', dbId);
    if (error) {
      console.error('DB Update Failed:', error);
      throw error;
    }
  }

  return { load, insert, remove, update };
}

/**
 * Replaces a variable-length set of preference rows: delete existing rows by FK,
 * optionally update the parent row, then insert the new ordered rows.
 *
 * NOT atomic — these are separate Supabase calls with no transaction (see
 * CLAUDE.md Known Limitations). This helper is intentionally the only
 * implementation of the pattern, so a future plpgsql RPC fix has one call site.
 */
export async function savePreferenceRows(opts: {
  dbId: string;
  deleteFrom: { table: string; fkColumn: string }[];
  parentUpdate?: { table: string; row: Record<string, unknown> };
  inserts: { table: string; rows: Record<string, unknown>[] }[];
}): Promise<void> {
  if (!DB_ENABLED) return;

  for (const target of opts.deleteFrom) {
    await supabase.from(target.table).delete().eq(target.fkColumn, opts.dbId);
  }

  if (opts.parentUpdate) {
    await supabase.from(opts.parentUpdate.table).update(opts.parentUpdate.row).eq('id', opts.dbId);
  }

  for (const insertSet of opts.inserts) {
    if (insertSet.rows.length === 0) continue;
    const { error } = await supabase.from(insertSet.table).insert(insertSet.rows);
    if (error) {
      console.error('Preference Rows Save Failed:', error);
      throw error;
    }
  }
}
