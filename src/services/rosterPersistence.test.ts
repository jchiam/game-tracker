import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

interface TestBase {
  id: string;
  name: string;
}

interface TestTracked extends TestBase {
  dbId?: string;
  isFavorited: boolean;
  level: number;
}

interface TestPatch {
  level?: number;
  isFavorited?: boolean;
}

const CATALOG: TestBase[] = [
  { id: 'alpha', name: 'Alpha' },
  { id: 'beta', name: 'Beta' },
];

interface TestMember {
  entityId: string;
  slotIndex: number;
}

interface TestParty {
  id: string;
  profileId: string;
  name: string;
  notes: string | null;
  tier?: string | null;
  isFavorited?: boolean;
  members: TestMember[];
  createdAt: string;
}

function partyConfig() {
  return {
    partiesTable: 'test_parties',
    membersTable: 'test_party_members',
    defaultName: 'New Party',
    memberFromRow: (row: any): TestMember => ({
      entityId: row.entity_id,
      slotIndex: row.slot_index,
    }),
    memberToRow: (member: TestMember) => ({
      entity_id: member.entityId,
      slot_index: member.slotIndex,
    }),
  };
}

function baseConfig() {
  return {
    table: 'test_tracked_entities',
    entityIdColumn: 'entity_id',
    catalog: CATALOG,
    columns: { level: 'level', isFavorited: 'is_favorited' },
    insertDefaults: { level: 1 },
    select: 'id, entity_id, level, is_favorited',
    fromRow: (row: any, base: TestBase): TestTracked => ({
      ...base,
      dbId: row.id,
      isFavorited: !!row.is_favorited,
      level: row.level,
    }),
  };
}

describe('rosterPersistence', () => {
  describe('DB disabled (no VITE_SUPABASE_URL)', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
      }));
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('load returns empty array', async () => {
      const { createRosterPersistence } = await import('@/services/rosterPersistence');
      const svc = createRosterPersistence<TestBase, TestTracked, TestPatch>(baseConfig());
      expect(await svc.load('user-1')).toEqual([]);
    });

    it('insert returns null', async () => {
      const { createRosterPersistence } = await import('@/services/rosterPersistence');
      const svc = createRosterPersistence<TestBase, TestTracked, TestPatch>(baseConfig());
      expect(await svc.insert('user-1', 'alpha')).toBeNull();
    });

    it('remove resolves without calling supabase', async () => {
      const { createRosterPersistence } = await import('@/services/rosterPersistence');
      const svc = createRosterPersistence<TestBase, TestTracked, TestPatch>(baseConfig());
      await expect(svc.remove('db-id')).resolves.toBeUndefined();
    });

    it('update resolves without calling supabase', async () => {
      const { createRosterPersistence } = await import('@/services/rosterPersistence');
      const svc = createRosterPersistence<TestBase, TestTracked, TestPatch>(baseConfig());
      await expect(svc.update('db-id', { level: 10 })).resolves.toBeUndefined();
    });

    it('savePreferenceRows resolves without calling supabase', async () => {
      const { savePreferenceRows } = await import('@/services/rosterPersistence');
      await expect(
        savePreferenceRows({
          dbId: 'db-id',
          deleteFrom: [{ table: 'test_prefs', fkColumn: 'tracked_id' }],
          inserts: [{ table: 'test_prefs', rows: [{ stat: 'ATK' }] }],
        }),
      ).resolves.toBeUndefined();
    });

    it('party functions return their disabled defaults', async () => {
      const { createPartyPersistence } = await import('@/services/rosterPersistence');
      const svc = createPartyPersistence<TestParty, TestMember>(partyConfig());
      expect(await svc.loadParties('user-1')).toEqual([]);
      expect(await svc.saveParty('user-1', { name: 'Team', members: [] })).toEqual({
        partyId: null,
      });
      expect(await svc.deleteParty('party-1')).toBe(false);
      expect(await svc.toggleFavoriteParty('party-1', true)).toBe(false);
    });
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let mockRpc: ReturnType<typeof vi.fn>;
    let mod: typeof import('@/services/rosterPersistence');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());
      mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom, rpc: mockRpc },
      }));

      mod = await import('@/services/rosterPersistence');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    function makeService(extras?: {
      selectFragment: string;
      mapRow: (row: any, tracked: TestTracked) => TestTracked;
    }) {
      return mod.createRosterPersistence<TestBase, TestTracked, TestPatch>({
        ...baseConfig(),
        extras,
      });
    }

    it('load queries the configured table filtered by profile_id', async () => {
      const builder = createBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      await makeService().load('user-1');

      expect(mockFrom).toHaveBeenCalledWith('test_tracked_entities');
      expect(builder.select).toHaveBeenCalledWith('id, entity_id, level, is_favorited');
      expect(builder.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    });

    it('load returns empty array when data is null', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: null }));
      expect(await makeService().load('user-1')).toEqual([]);
    });

    it('load merges rows with the catalog via fromRow', async () => {
      const dbRow = { id: 'db-uuid-1', entity_id: 'alpha', level: 42, is_favorited: true };
      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await makeService().load('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'alpha',
        name: 'Alpha',
        dbId: 'db-uuid-1',
        isFavorited: true,
        level: 42,
      });
    });

    it('load drops rows without a catalog match', async () => {
      const dbRow = { id: 'db-uuid-1', entity_id: 'unknown', level: 1, is_favorited: false };
      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      expect(await makeService().load('user-1')).toHaveLength(0);
    });

    it('load throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(makeService().load('user-1')).rejects.toEqual({ message: 'DB error' });
      spy.mockRestore();
    });

    it('load appends the extras select fragment and applies mapRow', async () => {
      const builder = createBuilder({
        data: [
          {
            id: 'db-uuid-1',
            entity_id: 'alpha',
            level: 5,
            is_favorited: false,
            test_extra_rows: [{ value: 7 }],
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const mapRow = vi.fn((row: any, tracked: TestTracked) => ({
        ...tracked,
        level: tracked.level + row.test_extra_rows.length,
      }));

      const result = await makeService({
        selectFragment: 'test_extra_rows ( value )',
        mapRow,
      }).load('user-1');

      expect(builder.select).toHaveBeenCalledWith(
        'id, entity_id, level, is_favorited, test_extra_rows ( value )',
      );
      expect(mapRow).toHaveBeenCalledTimes(1);
      expect(result[0].level).toBe(6);
    });

    it('insert upserts user_profiles then inserts defaults and returns the new id', async () => {
      const entityBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
      const profileBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) =>
        table === 'test_tracked_entities' ? entityBuilder : profileBuilder,
      );

      const result = await makeService().insert('user-1', 'alpha');

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(profileBuilder.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
      expect(entityBuilder.insert).toHaveBeenCalledWith({
        profile_id: 'user-1',
        entity_id: 'alpha',
        level: 1,
      });
      expect(result).toBe('new-db-id');
    });

    it('insert throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'Insert failed' } }));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(makeService().insert('user-1', 'alpha')).rejects.toEqual({
        message: 'Insert failed',
      });
      spy.mockRestore();
    });

    it('remove deletes by dbId on the configured table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await makeService().remove('db-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('test_tracked_entities');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('remove throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'Delete failed' } }));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(makeService().remove('db-uuid-1')).rejects.toEqual({
        message: 'Delete failed',
      });
      spy.mockRestore();
    });

    it('update maps camelCase patch keys through the column map', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await makeService().update('db-uuid-1', { level: 10, isFavorited: true });

      expect(builder.update).toHaveBeenCalledWith({ level: 10, is_favorited: true });
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('update throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'Update failed' } }));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(makeService().update('db-uuid-1', { level: 10 })).rejects.toEqual({
        message: 'Update failed',
      });
      spy.mockRestore();
    });

    describe('savePreferenceRows', () => {
      it('sends deletes, parent update, and non-empty inserts as one replace_preference_rows RPC', async () => {
        await mod.savePreferenceRows({
          dbId: 'db-uuid-1',
          deleteFrom: [
            { table: 'test_pref_main', fkColumn: 'tracked_id' },
            { table: 'test_pref_sub', fkColumn: 'tracked_id' },
          ],
          parentUpdate: { table: 'test_parent', row: { comments: 'note' } },
          inserts: [
            { table: 'test_pref_main', rows: [{ stat: 'ATK', order_index: 0 }] },
            { table: 'test_pref_sub', rows: [] },
          ],
        });

        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
          p_parent_id: 'db-uuid-1',
          p_delete_from: [
            { table: 'test_pref_main', fk_column: 'tracked_id' },
            { table: 'test_pref_sub', fk_column: 'tracked_id' },
          ],
          p_parent_update: { table: 'test_parent', row: { comments: 'note' } },
          p_inserts: [{ table: 'test_pref_main', rows: [{ stat: 'ATK', order_index: 0 }] }],
        });
        expect(mockFrom).not.toHaveBeenCalled();
      });

      it('sends a null parent update and no inserts when none are given', async () => {
        await mod.savePreferenceRows({
          dbId: 'db-uuid-1',
          deleteFrom: [{ table: 'test_pref_main', fkColumn: 'tracked_id' }],
          inserts: [{ table: 'test_pref_main', rows: [] }],
        });

        expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
          p_parent_id: 'db-uuid-1',
          p_delete_from: [{ table: 'test_pref_main', fk_column: 'tracked_id' }],
          p_parent_update: null,
          p_inserts: [],
        });
      });

      it('throws on RPC error', async () => {
        mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
          mod.savePreferenceRows({
            dbId: 'db-uuid-1',
            deleteFrom: [],
            inserts: [{ table: 'test_pref_main', rows: [{ stat: 'ATK' }] }],
          }),
        ).rejects.toEqual({ message: 'RPC failed' });
        spy.mockRestore();
      });
    });

    describe('preference-chain codec (chainToRows / rowsToChain)', () => {
      it('round-trips a chain preserving stats and operators in order', () => {
        const chain = [
          { stat: 'attack-pct', operator: '>' as const, orderIndex: 0 },
          { stat: 'crit-rate', operator: '>=' as const, orderIndex: 1 },
          { stat: 'speed', operator: null, orderIndex: 2 },
        ];
        const rows = mod.chainToRows(chain, { dbId: 'db-1', fkColumn: 'tracked_id' });
        const back = mod.rowsToChain(rows);
        expect(back.map((p: any) => [p.stat, p.operator])).toEqual([
          ['attack-pct', '>'],
          ['crit-rate', '>='],
          ['speed', null],
        ]);
      });

      it('re-derives order_index 0..n-1 from array position, ignoring stale orderIndex', () => {
        // Mid-chain delete then add in the shared chain editor produces gaps and
        // duplicates (here: 0, 2, 2). Written rows must follow array order.
        const degenerate = [
          { stat: 'a', operator: '>' as const, orderIndex: 0 },
          { stat: 'c', operator: '>' as const, orderIndex: 2 },
          { stat: 'd', operator: null, orderIndex: 2 },
        ];
        const rows = mod.chainToRows(degenerate, { dbId: 'db-1', fkColumn: 'tracked_id' });
        expect(rows.map((r: any) => [r.stat, r.order_index])).toEqual([
          ['a', 0],
          ['c', 1],
          ['d', 2],
        ]);
      });

      it('stamps fkColumn and extra static columns on every row', () => {
        const chain = [
          { stat: 'a', operator: '>' as const, orderIndex: 0 },
          { stat: 'b', operator: null, orderIndex: 1 },
        ];
        const rows = mod.chainToRows(chain, {
          dbId: 'db-9',
          fkColumn: 'thief_row_id',
          extra: { category: 'moon_main' },
        });
        for (const r of rows) {
          expect(r.thief_row_id).toBe('db-9');
          expect(r.category).toBe('moon_main');
        }
        expect(rows[0].operator_to_next).toBe('>');
        expect(rows[1].operator_to_next).toBeNull();
      });

      it('rowsToChain sorts arbitrary row order by order_index without mutating input', () => {
        const raw = [
          { stat: 'c', operator_to_next: null, order_index: 2 },
          { stat: 'a', operator_to_next: '>', order_index: 0 },
          { stat: 'b', operator_to_next: '>=', order_index: 1 },
        ];
        const chain = mod.rowsToChain(raw);
        expect(chain.map((p: any) => p.stat)).toEqual(['a', 'b', 'c']);
        // Input order untouched (sort works on a copy).
        expect(raw[0].stat).toBe('c');
      });
    });

    describe('createPartyPersistence', () => {
      function makePartyService(extras?: {
        extraSelect: string;
        extraFromRow: (row: any) => Partial<TestParty>;
        extraToRow: (party: Partial<TestParty>) => Record<string, unknown>;
      }) {
        return mod.createPartyPersistence<TestParty, TestMember>({
          ...partyConfig(),
          ...extras,
        });
      }

      it('loadParties queries with the members join ordered by created_at desc', async () => {
        const builder = createBuilder({ data: [], error: null });
        mockFrom.mockReturnValue(builder);

        await makePartyService().loadParties('user-1');

        expect(mockFrom).toHaveBeenCalledWith('test_parties');
        expect(builder.select).toHaveBeenCalledWith(
          'id, profile_id, name, notes, created_at, test_party_members ( * )',
        );
        expect(builder.eq).toHaveBeenCalledWith('profile_id', 'user-1');
        expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });

      it('loadParties maps rows and sorts members by slot_index', async () => {
        const dbRow = {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Team',
          notes: 'Notes',
          created_at: '2024-01-01T00:00:00Z',
          test_party_members: [
            { entity_id: 'beta', slot_index: 1 },
            { entity_id: 'alpha', slot_index: 0 },
          ],
        };
        mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

        const result = await makePartyService().loadParties('user-1');

        expect(result).toEqual([
          {
            id: 'party-1',
            profileId: 'user-1',
            name: 'Team',
            notes: 'Notes',
            createdAt: '2024-01-01T00:00:00Z',
            members: [
              { entityId: 'alpha', slotIndex: 0 },
              { entityId: 'beta', slotIndex: 1 },
            ],
          },
        ]);
      });

      it('loadParties appends the extras select and merges extraFromRow', async () => {
        const builder = createBuilder({
          data: [
            {
              id: 'party-1',
              profile_id: 'user-1',
              name: 'Team',
              notes: null,
              tier: 'S',
              is_favorited: 1,
              created_at: '2024-01-01T00:00:00Z',
              test_party_members: [],
            },
          ],
          error: null,
        });
        mockFrom.mockReturnValue(builder);

        const result = await makePartyService({
          extraSelect: 'tier, is_favorited',
          extraFromRow: (row) => ({ tier: row.tier, isFavorited: !!row.is_favorited }),
          extraToRow: () => ({}),
        }).loadParties('user-1');

        expect(builder.select).toHaveBeenCalledWith(
          'id, profile_id, name, notes, created_at, tier, is_favorited, test_party_members ( * )',
        );
        expect(result[0].tier).toBe('S');
        expect(result[0].isFavorited).toBe(true);
      });

      it('loadParties throws on DB error', async () => {
        mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(makePartyService().loadParties('user-1')).rejects.toEqual({
          message: 'DB error',
        });
        spy.mockRestore();
      });

      it('saveParty creates a party through one save_party RPC and returns the id', async () => {
        mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

        const result = await makePartyService().saveParty('user-1', {
          name: 'Team',
          notes: 'Notes',
          members: [{ entityId: 'alpha', slotIndex: 0 }],
        });

        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('save_party', {
          p_parties_table: 'test_parties',
          p_members_table: 'test_party_members',
          p_profile_id: 'user-1',
          p_party_id: null,
          p_party_row: { name: 'Team', notes: 'Notes' },
          p_members: [{ entity_id: 'alpha', slot_index: 0 }],
        });
        expect(mockFrom).not.toHaveBeenCalled();
        expect(result).toEqual({ partyId: 'new-party-id' });
      });

      it('saveParty defaults name and notes on create', async () => {
        mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

        await makePartyService().saveParty('user-1', { members: [] });

        expect(mockRpc.mock.calls[0][1].p_party_row).toEqual({ name: 'New Party', notes: null });
        expect(mockRpc.mock.calls[0][1].p_members).toEqual([]);
      });

      it('saveParty spreads extraToRow into the party row', async () => {
        mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

        await makePartyService({
          extraSelect: 'tier, is_favorited',
          extraFromRow: () => ({}),
          extraToRow: (party) => ({ tier: party.tier ?? null }),
        }).saveParty('user-1', { name: 'Team', tier: 'S', members: [] });

        expect(mockRpc.mock.calls[0][1].p_party_row).toEqual(
          expect.objectContaining({ tier: 'S' }),
        );
      });

      it('saveParty passes the existing id and mapped members on update', async () => {
        mockRpc.mockResolvedValue({ data: 'existing-id', error: null });

        const result = await makePartyService().saveParty('user-1', {
          id: 'existing-id',
          name: 'Renamed',
          notes: null,
          members: [{ entityId: 'beta', slotIndex: 1 }],
        });

        expect(mockRpc).toHaveBeenCalledWith('save_party', {
          p_parties_table: 'test_parties',
          p_members_table: 'test_party_members',
          p_profile_id: 'user-1',
          p_party_id: 'existing-id',
          p_party_row: { name: 'Renamed', notes: null },
          p_members: [{ entity_id: 'beta', slot_index: 1 }],
        });
        expect(result).toEqual({ partyId: 'existing-id' });
      });

      it('saveParty resolves a null partyId (no rejection) on RPC error', async () => {
        mockRpc.mockResolvedValue({ data: null, error: { message: 'Save failed' } });
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = await makePartyService().saveParty('user-1', { name: 'T', members: [] });
        expect(result).toEqual({ partyId: null });
        spy.mockRestore();
      });

      it('saveParty resolves a null partyId when the RPC returns no id', async () => {
        mockRpc.mockResolvedValue({ data: null, error: null });
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = await makePartyService().saveParty('user-1', {
          id: 'existing-id',
          name: 'T',
          members: [],
        });
        expect(result).toEqual({ partyId: null });
        spy.mockRestore();
      });

      it('deleteParty deletes by id and returns false on error', async () => {
        const okBuilder = createBuilder({ data: null, error: null });
        mockFrom.mockReturnValue(okBuilder);
        expect(await makePartyService().deleteParty('party-1')).toBe(true);
        expect(mockFrom).toHaveBeenCalledWith('test_parties');
        expect(okBuilder.delete).toHaveBeenCalled();
        expect(okBuilder.eq).toHaveBeenCalledWith('id', 'party-1');

        mockFrom.mockReturnValue(
          createBuilder({ data: null, error: { message: 'Delete failed' } }),
        );
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await makePartyService().deleteParty('party-1')).toBe(false);
        spy.mockRestore();
      });

      it('toggleFavoriteParty updates is_favorited and returns false on error', async () => {
        const okBuilder = createBuilder({ data: null, error: null });
        mockFrom.mockReturnValue(okBuilder);
        expect(await makePartyService().toggleFavoriteParty('party-1', true)).toBe(true);
        expect(okBuilder.update).toHaveBeenCalledWith({ is_favorited: true });
        expect(okBuilder.eq).toHaveBeenCalledWith('id', 'party-1');

        mockFrom.mockReturnValue(
          createBuilder({ data: null, error: { message: 'Update failed' } }),
        );
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await makePartyService().toggleFavoriteParty('party-1', false)).toBe(false);
        spy.mockRestore();
      });
    });
  });
});
