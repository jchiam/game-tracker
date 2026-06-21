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
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
      }));
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadParties returns empty array', async () => {
      const { loadParties } = await import('@/services/arknights-endfield/partyService');
      expect(await loadParties('user-1')).toEqual([]);
    });

    it('saveParty returns null', async () => {
      const { saveParty } = await import('@/services/arknights-endfield/partyService');
      expect(await saveParty('user-1', { members: [] })).toBeNull();
    });

    it('deleteParty returns false', async () => {
      const { deleteParty } = await import('@/services/arknights-endfield/partyService');
      expect(await deleteParty('party-1')).toBe(false);
    });
  });

  describe('DB enabled', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/arknights-endfield/partyService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/arknights-endfield/partyService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadParties queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));
      await service.loadParties('user-1');
      expect(mockFrom).toHaveBeenCalledWith('endfield_parties');
    });

    it('loadParties throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));
      await expect(service.loadParties('user-1')).rejects.toEqual({ message: 'DB error' });
    });

    it('loadParties transforms rows with members sorted by slot_index', async () => {
      const dbRow = {
        id: 'party-1',
        profile_id: 'user-1',
        name: 'Squad A',
        notes: null,
        created_at: '2026-01-01',
        endfield_party_members: [
          { operator_id: 'ember', slot_index: 1 },
          { operator_id: 'rossi', slot_index: 0 },
        ],
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadParties('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Squad A');
      expect(result[0].members[0].operatorId).toBe('rossi');
      expect(result[0].members[1].operatorId).toBe('ember');
    });

    it('saveParty creates new party and inserts members', async () => {
      const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'endfield_party_members') return memberBuilder;
        return partyBuilder;
      });

      const result = await service.saveParty('user-1', {
        name: 'My Squad',
        members: [{ operatorId: 'ember', slotIndex: 0 }],
      });

      expect(result).toBe('new-party-id');
      expect(mockFrom).toHaveBeenCalledWith('endfield_parties');
      expect(mockFrom).toHaveBeenCalledWith('endfield_party_members');
    });

    it('saveParty updates existing party when id is present', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.saveParty('user-1', {
        id: 'existing-id',
        name: 'Updated',
        members: [],
      });

      expect(builder.update).toHaveBeenCalledWith({ name: 'Updated', notes: undefined });
    });

    it('deleteParty calls delete on the correct table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.deleteParty('party-1');
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('endfield_parties');
      expect(builder.delete).toHaveBeenCalled();
    });

    it('deleteParty returns false on error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'fail' } });
      mockFrom.mockReturnValue(builder);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await service.deleteParty('party-1');
      expect(result).toBe(false);
      spy.mockRestore();
    });
  });
});
