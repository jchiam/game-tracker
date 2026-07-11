import { supabase } from '@/lib/supabase';
import type { StatPreference } from '@/types';

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
 * Config for one game's party persistence. Everything that varies between
 * games is data here; the CRUD behaviour lives in the factory below.
 */
export interface PartyPersistenceConfig<TParty, TMember> {
  /** Parties table, e.g. 'hsr_parties'. */
  partiesTable: string;
  /** Party-members table, e.g. 'hsr_party_members'. */
  membersTable: string;
  /** Name applied when a party is saved without one. */
  defaultName: string;
  /** Builds the camelCase member from a member DB row. */
  memberFromRow: (row: any) => TMember;
  /** Maps a member to its DB columns; `party_id` is added by the factory. */
  memberToRow: (member: TMember) => Record<string, unknown>;
  /** Extra party columns beyond id/profile_id/name/notes/created_at, e.g. 'tier, is_favorited'. */
  extraSelect?: string;
  /** Maps the extra columns onto the party on load. */
  extraFromRow?: (row: any) => Partial<TParty>;
  /** Maps extra party fields to their DB columns for insert and update. */
  extraToRow?: (party: Partial<TParty>) => Record<string, unknown>;
}

/**
 * Error semantics are deliberately asymmetric: `loadParties` throws (the shared
 * party hook catches), but `saveParty` resolves to null on failure — nothing in
 * the save call chain catches, so a rejection would surface unhandled. A member
 * insert failing after the party row is persisted still returns the id, so the
 * hook's reload shows the true DB state instead of inviting a duplicate retry.
 * Member replacement is delete-then-reinsert with no transaction (see CLAUDE.md
 * Known Limitations, same pattern as savePreferenceRows).
 */
export function createPartyPersistence<
  TParty extends { id: string; name: string; notes: string | null },
  TMember,
>(config: PartyPersistenceConfig<TParty, TMember>) {
  const selectStatement = `id, profile_id, name, notes, created_at${
    config.extraSelect ? `, ${config.extraSelect}` : ''
  }, ${config.membersTable} ( * )`;

  async function loadParties(userId: string): Promise<TParty[]> {
    if (!DB_ENABLED) return [];

    const { data, error } = await supabase
      .from(config.partiesTable)
      .select(selectStatement)
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Party Load Failed:', error);
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      profileId: row.profile_id,
      name: row.name,
      notes: row.notes,
      createdAt: row.created_at,
      ...(config.extraFromRow ? config.extraFromRow(row) : {}),
      members: (row[config.membersTable] ?? [])
        .sort((a: any, b: any) => a.slot_index - b.slot_index)
        .map(config.memberFromRow),
    })) as unknown as TParty[];
  }

  async function saveParty(
    userId: string,
    party: Partial<TParty> & { members: TMember[] },
  ): Promise<string | null> {
    if (!DB_ENABLED) return null;

    const partyRow = {
      name: party.name || config.defaultName,
      notes: party.notes ?? null,
      ...(config.extraToRow ? config.extraToRow(party) : {}),
    };

    let partyId = party.id;

    if (partyId) {
      const { error } = await supabase.from(config.partiesTable).update(partyRow).eq('id', partyId);
      if (error) {
        console.error('Party Update Failed:', error);
        return null;
      }
      await supabase.from(config.membersTable).delete().eq('party_id', partyId);
    } else {
      const { data, error } = await supabase
        .from(config.partiesTable)
        .insert({ profile_id: userId, ...partyRow })
        .select('id')
        .single();
      if (error || !data) {
        console.error('Party Create Failed:', error);
        return null;
      }
      partyId = data.id;
    }

    if (party.members.length > 0) {
      const { error } = await supabase
        .from(config.membersTable)
        .insert(party.members.map((m) => ({ party_id: partyId, ...config.memberToRow(m) })));
      if (error) console.error('Party Members Save Failed:', error);
    }

    return partyId ?? null;
  }

  async function deleteParty(partyId: string): Promise<boolean> {
    if (!DB_ENABLED) return false;
    const { error } = await supabase.from(config.partiesTable).delete().eq('id', partyId);
    if (error) {
      console.error('Party Delete Failed:', error);
      return false;
    }
    return true;
  }

  async function toggleFavoriteParty(partyId: string, value: boolean): Promise<boolean> {
    if (!DB_ENABLED) return false;
    const { error } = await supabase
      .from(config.partiesTable)
      .update({ is_favorited: value })
      .eq('id', partyId);
    if (error) {
      console.error('Party Favorite Toggle Failed:', error);
      return false;
    }
    return true;
  }

  return { loadParties, saveParty, deleteParty, toggleFavoriteParty };
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

/**
 * The chain↔rows codec for preference chains — intentionally the only
 * implementation of chain serialization/reconstruction, living beside
 * `savePreferenceRows` so the whole Preference Rows pattern has one home.
 * All preference tables share the column vocabulary `stat` / `operator_to_next`
 * / `order_index`. Non-chain scalars (parent-column updates, single-row set
 * categories) are per-game glue and stay outside the codec.
 */

/** Reconstruct an ordered chain from DB rows: sort by `order_index`, map columns. */
export function rowsToChain(raw: any[]): StatPreference[] {
  return [...raw]
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((p: any) => ({
      stat: p.stat,
      operator: p.operator_to_next,
      orderIndex: p.order_index,
    }));
}

/**
 * Serialize a chain to insert rows. `order_index` is re-derived from array
 * position (`0..n-1`) — never taken from the entries' stored `orderIndex`,
 * which the shared chain editor lets go stale (gaps/duplicates after
 * mid-chain deletes). Array order is the order the user saw.
 */
export function chainToRows(
  chain: StatPreference[],
  opts: { dbId: string; fkColumn: string; extra?: Record<string, unknown> },
): Record<string, unknown>[] {
  return chain.map((pref, idx) => ({
    [opts.fkColumn]: opts.dbId,
    ...opts.extra,
    stat: pref.stat,
    operator_to_next: pref.operator,
    order_index: idx,
  }));
}
