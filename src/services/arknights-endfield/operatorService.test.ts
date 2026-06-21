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

describe('operatorService', () => {
  describe('DB disabled (no VITE_SUPABASE_URL)', () => {
    beforeEach(async () => {
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

    it('loadOperatorsFromDB returns empty array', async () => {
      const { loadOperatorsFromDB } = await import('@/services/arknights-endfield/operatorService');
      expect(await loadOperatorsFromDB('user-1')).toEqual([]);
    });

    it('insertOperator returns null', async () => {
      const { insertOperator } = await import('@/services/arknights-endfield/operatorService');
      expect(await insertOperator('user-1', 'ember')).toBeNull();
    });

    it('deleteOperator resolves without calling supabase', async () => {
      const { deleteOperator } = await import('@/services/arknights-endfield/operatorService');
      await expect(deleteOperator('db-id')).resolves.toBeUndefined();
    });

    it('updateOperator resolves without calling supabase', async () => {
      const { updateOperator } = await import('@/services/arknights-endfield/operatorService');
      await expect(updateOperator('db-id', { level: 40 })).resolves.toBeUndefined();
    });
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/arknights-endfield/operatorService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/arknights-endfield/operatorService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadOperatorsFromDB queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));
      await service.loadOperatorsFromDB('user-1');
      expect(mockFrom).toHaveBeenCalledWith('endfield_tracked_operators');
    });

    it('loadOperatorsFromDB returns empty array when data is null', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: null }));
      const result = await service.loadOperatorsFromDB('user-1');
      expect(result).toEqual([]);
    });

    it('loadOperatorsFromDB throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));
      await expect(service.loadOperatorsFromDB('user-1')).rejects.toEqual({
        message: 'DB error',
      });
    });

    it('loadOperatorsFromDB transforms DB rows into EndfieldTrackedOperator objects', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        operator_id: 'ember',
        level: 45,
        potential: 3,
        is_favorited: true,
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadOperatorsFromDB('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ember');
      expect(result[0].dbId).toBe('db-uuid-1');
      expect(result[0].level).toBe(45);
      expect(result[0].potential).toBe(3);
      expect(result[0].isFavorited).toBe(true);
      expect(result[0].name).toBe('Ember');
      expect(result[0].class).toBe('Defender');
    });

    it('loadOperatorsFromDB skips rows with unknown operator_id', async () => {
      const dbRows = [
        { id: 'db-uuid-1', operator_id: 'unknown-op', level: 1, is_favorited: false },
      ];
      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));
      const result = await service.loadOperatorsFromDB('user-1');
      expect(result).toHaveLength(0);
    });

    it('insertOperator upserts user_profiles and inserts into endfield_tracked_operators', async () => {
      const opBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
      const profileBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'endfield_tracked_operators') return opBuilder;
        return profileBuilder;
      });

      const result = await service.insertOperator('user-1', 'ember');

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockFrom).toHaveBeenCalledWith('endfield_tracked_operators');
      expect(result).toBe('new-db-id');
    });

    it('insertOperator throws on DB error', async () => {
      const opBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(opBuilder);
      await expect(service.insertOperator('user-1', 'ember')).rejects.toEqual({
        message: 'Insert failed',
      });
    });

    it('deleteOperator calls delete on the correct table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);
      await service.deleteOperator('db-uuid-1');
      expect(mockFrom).toHaveBeenCalledWith('endfield_tracked_operators');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('deleteOperator throws on DB error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Delete failed' } });
      mockFrom.mockReturnValue(builder);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(service.deleteOperator('db-uuid-1')).rejects.toEqual({
        message: 'Delete failed',
      });
      spy.mockRestore();
    });

    it('updateOperator maps camelCase patch to snake_case columns', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.updateOperator('db-uuid-1', {
        level: 40,
        potential: 3,
        isFavorited: true,
      });

      expect(mockFrom).toHaveBeenCalledWith('endfield_tracked_operators');
      expect(builder.update).toHaveBeenCalledWith({
        level: 40,
        potential: 3,
        is_favorited: true,
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('updateOperator throws on DB error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(builder);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(service.updateOperator('db-uuid-1', { level: 50 })).rejects.toEqual({
        message: 'Update failed',
      });
      spy.mockRestore();
    });
  });
});
