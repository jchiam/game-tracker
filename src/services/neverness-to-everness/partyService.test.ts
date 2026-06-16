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

    it('loadParties transforms DB rows into N2EParty objects', async () => {
      const dbRows = [
        {
          id: 'party-uuid-1',
          profile_id: 'user-1',
          name: 'Alpha Team',
          notes: 'Some notes',
          tier: 'S',
          is_favorited: true,
          created_at: '2024-01-01T00:00:00Z',
          n2e_party_members: [
            { character_id: 'baicang', slot_index: 0 },
            { character_id: 'nanami', slot_index: 1 },
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
      expect(result[0].tier).toBe('S');
      expect(result[0].isFavorited).toBe(true);
      expect(result[0].members).toHaveLength(2);
      expect(result[0].members[0]).toEqual({ characterId: 'baicang', slotIndex: 0 });
      expect(result[0].members[1]).toEqual({ characterId: 'nanami', slotIndex: 1 });
    });

    it('loadParties sorts members by slot_index', async () => {
      const dbRows = [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Team',
          notes: null,
          tier: null,
          is_favorited: false,
          created_at: '2024-01-01T00:00:00Z',
          n2e_party_members: [
            { character_id: 'nanami', slot_index: 1 },
            { character_id: 'baicang', slot_index: 0 },
          ],
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadParties('user-1');

      expect(result[0].members[0].characterId).toBe('baicang');
      expect(result[0].members[1].characterId).toBe('nanami');
    });

    it('loadParties handles a party with no members', async () => {
      const dbRows = [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Solo Team',
          notes: null,
          tier: null,
          is_favorited: false,
          created_at: '2024-01-01T00:00:00Z',
          n2e_party_members: [],
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadParties('user-1');
      expect(result[0].members).toEqual([]);
    });

    it('saveParty creates a new party when no id is provided', async () => {
      const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_parties') return partyBuilder;
        return memberBuilder;
      });

      const result = await service.saveParty('user-1', {
        name: 'New Team',
        notes: 'Lineup notes',
        tier: 'S',
        members: [{ characterId: 'baicang', slotIndex: 0 }],
      });

      expect(partyBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: 'user-1',
          name: 'New Team',
          notes: 'Lineup notes',
          tier: 'S',
        }),
      );
      expect(memberBuilder.insert).toHaveBeenCalledWith([
        { party_id: 'new-party-id', character_id: 'baicang', slot_index: 0 },
      ]);
      expect(result).toBe('new-party-id');
    });

    it('saveParty updates an existing party when id is provided', async () => {
      const partyBuilder = createBuilder({ data: null, error: null });
      const memberBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_parties') return partyBuilder;
        return memberBuilder;
      });

      const result = await service.saveParty('user-1', {
        id: 'existing-party-id',
        name: 'Updated Name',
        notes: 'Updated notes',
        tier: 'A',
        members: [{ characterId: 'baicang', slotIndex: 0 }],
      });

      expect(partyBuilder.update).toHaveBeenCalledWith({
        name: 'Updated Name',
        notes: 'Updated notes',
        tier: 'A',
      });
      expect(partyBuilder.eq).toHaveBeenCalledWith('id', 'existing-party-id');
      expect(memberBuilder.delete).toHaveBeenCalled();
      expect(memberBuilder.eq).toHaveBeenCalledWith('party_id', 'existing-party-id');
      expect(memberBuilder.insert).toHaveBeenCalledWith([
        { party_id: 'existing-party-id', character_id: 'baicang', slot_index: 0 },
      ]);
      expect(result).toBe('existing-party-id');
    });

    it('saveParty defaults parameters and returns null/throws on error', async () => {
      const partyBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(partyBuilder);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.saveParty('user-1', {
          members: [],
        }),
      ).rejects.toEqual({ message: 'Insert failed' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveParty throws on update error', async () => {
      const partyBuilder = createBuilder({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(partyBuilder);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.saveParty('user-1', {
          id: 'existing-id',
          name: 'Name',
          members: [],
        }),
      ).rejects.toEqual({ message: 'Update failed' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveParty throws on member insert error during update', async () => {
      const partyBuilder = createBuilder({ data: null, error: null });
      const memberBuilder = createBuilder({ data: null, error: { message: 'Member insert failed' } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_parties') return partyBuilder;
        return memberBuilder;
      });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.saveParty('user-1', {
          id: 'existing-id',
          name: 'Updated Name',
          members: [{ characterId: 'baicang', slotIndex: 0 }],
        }),
      ).rejects.toEqual({ message: 'Member insert failed' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveParty throws on member insert error', async () => {
      const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
      const memberBuilder = createBuilder({ data: null, error: { message: 'Member insert failed' } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_parties') return partyBuilder;
        return memberBuilder;
      });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.saveParty('user-1', {
          name: 'Team',
          members: [{ characterId: 'baicang', slotIndex: 0 }],
        }),
      ).rejects.toEqual({ message: 'Member insert failed' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('deleteParty calls delete on the correct table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.deleteParty('party-uuid');

      expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
      expect(builder.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('deleteParty returns false on DB error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Delete failed' } });
      mockFrom.mockReturnValue(builder);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await service.deleteParty('party-uuid');

      expect(result).toBe(false);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('toggleFavoriteParty calls update and returns true', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.toggleFavoriteParty('party-uuid', true);

      expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
      expect(builder.update).toHaveBeenCalledWith({ is_favorited: true });
      expect(builder.eq).toHaveBeenCalledWith('id', 'party-uuid');
      expect(result).toBe(true);
    });

    it('toggleFavoriteParty returns false on DB error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(builder);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await service.toggleFavoriteParty('party-uuid', false);

      expect(result).toBe(false);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
