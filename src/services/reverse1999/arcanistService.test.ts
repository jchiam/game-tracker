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

describe('arcanistService', () => {
  describe('DB disabled (no VITE_SUPABASE_URL)', () => {
    it('loadArcanistsFromDB returns empty array', async () => {
      const { loadArcanistsFromDB } = await import('@/services/reverse1999/arcanistService');
      expect(await loadArcanistsFromDB('user-1')).toEqual([]);
    });

    it('insertArcanist returns null', async () => {
      const { insertArcanist } = await import('@/services/reverse1999/arcanistService');
      expect(await insertArcanist('user-1', '37')).toBeNull();
    });

    it('deleteArcanist resolves without calling supabase', async () => {
      const { deleteArcanist } = await import('@/services/reverse1999/arcanistService');
      await expect(deleteArcanist('db-id')).resolves.toBeUndefined();
    });

    it('updateArcanist resolves without calling supabase', async () => {
      const { updateArcanist } = await import('@/services/reverse1999/arcanistService');
      await expect(updateArcanist('db-id', { level: 40 })).resolves.toBeUndefined();
    });
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/reverse1999/arcanistService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/reverse1999/arcanistService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadArcanistsFromDB queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));

      await service.loadArcanistsFromDB('user-1');

      expect(mockFrom).toHaveBeenCalledWith('r1999_tracked_arcanists');
    });

    it('loadArcanistsFromDB returns empty array when data is null', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: null }));

      const result = await service.loadArcanistsFromDB('user-1');
      expect(result).toEqual([]);
    });

    it('loadArcanistsFromDB returns empty array on error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));

      const result = await service.loadArcanistsFromDB('user-1');
      expect(result).toEqual([]);
    });

    it('loadArcanistsFromDB transforms DB rows into R1999TrackedArcanist objects', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        arcanist_id: '37', // must match ALL_ARCANISTS
        level: 40,
        insight_level: 2,
        is_favorited: true,
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadArcanistsFromDB('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('37');
      expect(result[0].dbId).toBe('db-uuid-1');
      expect(result[0].level).toBe(40);
      expect(result[0].insightLevel).toBe(2);
      expect(result[0].isFavorited).toBe(true);
      expect(result[0].name).toBe('37');
    });

    it('loadArcanistsFromDB skips rows with unknown arcanist_id', async () => {
      const dbRows = [
        {
          id: 'db-uuid-1',
          arcanist_id: 'unknown-arcanist',
          level: 1,
          insight_level: 0,
          is_favorited: false,
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadArcanistsFromDB('user-1');
      expect(result).toHaveLength(0);
    });

    it('insertArcanist upserts user_profiles and inserts into r1999_tracked_arcanists', async () => {
      const arcanistBuilder = createBuilder({ data: { id: 'new-arcanist-db-id' }, error: null });
      const profileBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'r1999_tracked_arcanists') return arcanistBuilder;
        return profileBuilder;
      });

      const result = await service.insertArcanist('user-1', '37');

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockFrom).toHaveBeenCalledWith('r1999_tracked_arcanists');
      expect(result).toBe('new-arcanist-db-id');
    });

    it('insertArcanist returns null on DB error', async () => {
      const arcanistBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(arcanistBuilder);

      const result = await service.insertArcanist('user-1', '37');
      expect(result).toBeNull();
    });

    it('deleteArcanist calls delete on the correct table with correct id', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.deleteArcanist('db-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('r1999_tracked_arcanists');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('updateArcanist calls update on the correct table with provided updates', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.updateArcanist('db-uuid-1', { level: 40, insight_level: 2 });

      expect(mockFrom).toHaveBeenCalledWith('r1999_tracked_arcanists');
      expect(builder.update).toHaveBeenCalledWith({ level: 40, insight_level: 2 });
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });
  });
});
