import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createBuilder(result: { data: any; error: any } = { data: null, error: null }) {
  const builder: Record<string, any> = {};
  for (const method of ['select', 'eq', 'insert', 'update', 'delete', 'order']) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

describe('partyService', () => {
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

    it('loadParties returns empty array', async () => {
      const { loadParties } = await import('@/services/honkai-star-rail/partyService');
      expect(await loadParties('user-1')).toEqual([]);
    });

    it('saveParty returns null', async () => {
      const { saveParty } = await import('@/services/honkai-star-rail/partyService');
      expect(await saveParty('user-1', { name: 'My Team', members: [] })).toBeNull();
    });

    it('deleteParty returns false', async () => {
      const { deleteParty } = await import('@/services/honkai-star-rail/partyService');
      expect(await deleteParty('party-1')).toBe(false);
    });
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/honkai-star-rail/partyService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/honkai-star-rail/partyService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadParties queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));

      await service.loadParties('user-1');

      expect(mockFrom).toHaveBeenCalledWith('hsr_parties');
    });

    it('loadParties returns empty array on error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));

      const result = await service.loadParties('user-1');
      expect(result).toEqual([]);
    });

    it('loadParties transforms DB rows into HsrParty objects', async () => {
      const dbRows = [
        {
          id: 'party-uuid-1',
          profile_id: 'user-1',
          name: 'Alpha Team',
          notes: 'Some notes',
          created_at: '2024-01-01T00:00:00Z',
          hsr_party_members: [
            { character_id: 'acheron', slot_index: 0 },
            { character_id: 'blade', slot_index: 1 },
          ],
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadParties('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('party-uuid-1');
      expect(result[0].profileId).toBe('user-1');
      expect(result[0].name).toBe('Alpha Team');
      expect(result[0].notes).toBe('Some notes');
      expect(result[0].members).toHaveLength(2);
      expect(result[0].members[0]).toEqual({ characterId: 'acheron', slotIndex: 0 });
      expect(result[0].members[1]).toEqual({ characterId: 'blade', slotIndex: 1 });
    });

    it('loadParties sorts members by slot_index', async () => {
      const dbRows = [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Team',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          hsr_party_members: [
            { character_id: 'blade', slot_index: 1 },
            { character_id: 'acheron', slot_index: 0 },
          ],
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadParties('user-1');

      expect(result[0].members[0].characterId).toBe('acheron');
      expect(result[0].members[1].characterId).toBe('blade');
    });

    it('saveParty creates a new party when no id provided', async () => {
      const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_parties') return partyBuilder;
        return memberBuilder;
      });

      const result = await service.saveParty('user-1', {
        name: 'New Team',
        notes: null,
        members: [{ characterId: 'acheron', slotIndex: 0 }],
      });

      expect(partyBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: 'user-1',
          name: 'New Team',
        }),
      );
      expect(result).toBe('new-party-id');
    });

    it('saveParty inserts members with correct structure', async () => {
      const partyBuilder = createBuilder({ data: { id: 'party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_parties') return partyBuilder;
        return memberBuilder;
      });

      await service.saveParty('user-1', {
        name: 'Team',
        notes: null,
        members: [
          { characterId: 'acheron', slotIndex: 0 },
          { characterId: 'blade', slotIndex: 1 },
        ],
      });

      expect(memberBuilder.insert).toHaveBeenCalledWith([
        { party_id: 'party-id', character_id: 'acheron', slot_index: 0 },
        { party_id: 'party-id', character_id: 'blade', slot_index: 1 },
      ]);
    });

    it('saveParty updates an existing party when id is provided', async () => {
      const partyBuilder = createBuilder({ data: null, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_parties') return partyBuilder;
        return memberBuilder;
      });

      const result = await service.saveParty('user-1', {
        id: 'existing-party-id',
        name: 'Updated Name',
        notes: null,
        members: [],
      });

      expect(partyBuilder.update).toHaveBeenCalled();
      expect(partyBuilder.eq).toHaveBeenCalledWith('id', 'existing-party-id');
      expect(result).toBe('existing-party-id');
    });

    it('saveParty clears old members before inserting new ones on update', async () => {
      const partyBuilder = createBuilder({ data: null, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_parties') return partyBuilder;
        return memberBuilder;
      });

      await service.saveParty('user-1', {
        id: 'existing-party-id',
        name: 'Updated Name',
        notes: null,
        members: [{ characterId: 'acheron', slotIndex: 0 }],
      });

      // hsr_party_members should have delete called (to clear old members)
      expect(memberBuilder.delete).toHaveBeenCalled();
      expect(memberBuilder.eq).toHaveBeenCalledWith('party_id', 'existing-party-id');
    });

    it('saveParty returns null on create error', async () => {
      const partyBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(partyBuilder);

      const result = await service.saveParty('user-1', { name: 'Team', members: [] });
      expect(result).toBeNull();
    });

    it('deleteParty calls delete on the correct table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.deleteParty('party-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('hsr_parties');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'party-uuid-1');
      expect(result).toBe(true);
    });

    it('deleteParty returns false on error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Delete failed' } });
      mockFrom.mockReturnValue(builder);

      const result = await service.deleteParty('party-uuid-1');
      expect(result).toBe(false);
    });

    it('loadParties returns empty array when data is null', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: null }));

      const result = await service.loadParties('user-1');
      expect(result).toEqual([]);
    });

    it('loadParties handles a party with no members', async () => {
      const dbRows = [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Solo Team',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          hsr_party_members: [],
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadParties('user-1');
      expect(result[0].members).toEqual([]);
    });

    it('saveParty returns null on update error', async () => {
      const partyBuilder = createBuilder({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(partyBuilder);

      const result = await service.saveParty('user-1', {
        id: 'existing-id',
        name: 'Updated Name',
        members: [],
      });

      expect(result).toBeNull();
    });

    it('saveParty skips member insert when members array is empty', async () => {
      const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_parties') return partyBuilder;
        return memberBuilder;
      });

      await service.saveParty('user-1', { name: 'Empty Team', members: [] });

      expect(memberBuilder.insert).not.toHaveBeenCalled();
    });

    it('saveParty defaults notes to empty string when not provided', async () => {
      const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_parties') return partyBuilder;
        return memberBuilder;
      });

      await service.saveParty('user-1', { name: 'No Notes Team', members: [] });

      expect(partyBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ notes: '' }));
    });
  });
});
