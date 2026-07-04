import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createBuilder(result: { data: any; error: any } = { data: null, error: null }) {
  const builder: Record<string, any> = {};
  for (const method of ['select', 'eq', 'insert', 'update', 'delete', 'upsert', 'order']) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

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
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let mod: typeof import('@/services/rosterPersistence');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
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
      it('deletes by FK, updates parent, and inserts non-empty sets', async () => {
        const mainBuilder = createBuilder({ data: null, error: null });
        const subBuilder = createBuilder({ data: null, error: null });
        const parentBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) => {
          if (table === 'test_pref_main') return mainBuilder;
          if (table === 'test_pref_sub') return subBuilder;
          return parentBuilder;
        });

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

        expect(mainBuilder.delete).toHaveBeenCalled();
        expect(mainBuilder.eq).toHaveBeenCalledWith('tracked_id', 'db-uuid-1');
        expect(subBuilder.delete).toHaveBeenCalled();
        expect(parentBuilder.update).toHaveBeenCalledWith({ comments: 'note' });
        expect(parentBuilder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
        expect(mainBuilder.insert).toHaveBeenCalledWith([{ stat: 'ATK', order_index: 0 }]);
        expect(subBuilder.insert).not.toHaveBeenCalled();
      });

      it('throws on insert failure', async () => {
        const failBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
        mockFrom.mockReturnValue(failBuilder);

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
          mod.savePreferenceRows({
            dbId: 'db-uuid-1',
            deleteFrom: [],
            inserts: [{ table: 'test_pref_main', rows: [{ stat: 'ATK' }] }],
          }),
        ).rejects.toEqual({ message: 'Insert failed' });
        spy.mockRestore();
      });
    });
  });
});
