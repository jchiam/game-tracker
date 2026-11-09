import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('czn partyService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/chaos-zero-nightmare/partyService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom, rpc: mockRpc },
    }));

    service = await import('@/services/chaos-zero-nightmare/partyService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadParties queries czn tables with tier/is_favorited and maps combatant_id', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Nightmare Team',
          notes: null,
          tier: 'S',
          is_favorited: 1,
          created_at: '2026-01-01T00:00:00Z',
          czn_party_members: [{ combatant_id: 'mei-lin', slot_index: 0 }],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');

    expect(mockFrom).toHaveBeenCalledWith('czn_parties');
    expect(builder.select).toHaveBeenCalledWith(
      'id, profile_id, name, notes, created_at, tier, is_favorited, czn_party_members ( * )',
    );
    expect(result[0].tier).toBe('S');
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].companionId).toBeUndefined();
    expect(result[0].members).toEqual([{ entityId: 'mei-lin', slotIndex: 0 }]);
  });

  it('saveParty sends the czn tables and member rows through the save_party RPC', async () => {
    mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

    const result = await service.saveParty('user-1', {
      tier: 'A',
      members: [
        { entityId: 'mei-lin', slotIndex: 0 },
        { entityId: 'haru', slotIndex: 2 },
      ],
    });

    expect(mockRpc).toHaveBeenCalledWith('save_party', {
      p_parties_table: 'czn_parties',
      p_members_table: 'czn_party_members',
      p_profile_id: 'user-1',
      p_party_id: null,
      p_party_row: { name: 'New Party', notes: null, tier: 'A' },
      p_members: [
        { combatant_id: 'mei-lin', slot_index: 0 },
        { combatant_id: 'haru', slot_index: 2 },
      ],
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ partyId: 'new-party-id' });
  });

  it('saveParty writes tier null when unset and never a companion column', async () => {
    mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

    await service.saveParty('user-1', { members: [] });

    expect(mockRpc.mock.calls[0][1].p_party_row).toEqual({
      name: 'New Party',
      notes: null,
      tier: null,
    });
  });

  it('toggleFavoriteParty updates is_favorited on czn_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.toggleFavoriteParty('party-1', true)).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('czn_parties');
    expect(builder.update).toHaveBeenCalledWith({ is_favorited: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });

  it('deleteParty targets czn_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('czn_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
