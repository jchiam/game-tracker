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

describe('partyService', () => {
  describe('DB disabled', () => {
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

    it('loadParties returns empty array', async () => {
      const { loadParties } = await import('@/services/neverness-to-everness/partyService');
      expect(await loadParties('user-1')).toEqual([]);
    });

    it('saveParty returns null', async () => {
      const { saveParty } = await import('@/services/neverness-to-everness/partyService');
      expect(await saveParty('user-1', { name: 'Test', members: [] })).toBeNull();
    });

    it('deleteParty returns false', async () => {
      const { deleteParty } = await import('@/services/neverness-to-everness/partyService');
      expect(await deleteParty('party-1')).toBe(false);
    });

    it('toggleFavoriteParty returns false when DB is disabled', async () => {
      const { toggleFavoriteParty } = await import('@/services/neverness-to-everness/partyService');
      await expect(toggleFavoriteParty('party-1', true)).resolves.toBe(false);
    });
  });

  describe('DB enabled', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/neverness-to-everness/partyService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/neverness-to-everness/partyService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadParties queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));

      await service.loadParties('user-1');

      expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
    });

    it('loadParties throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));

      await expect(service.loadParties('user-1')).rejects.toEqual({ message: 'DB error' });
    });

    it('deleteParty calls delete on the correct table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.deleteParty('party-uuid');

      expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
      expect(builder.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
