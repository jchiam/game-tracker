import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('zzz partyService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/zenless-zone-zero/partyService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom, rpc: mockRpc },
    }));

    service = await import('@/services/zenless-zone-zero/partyService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadParties queries zzz tables with tier/is_favorited/bangboo_id and maps agent_id', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Shiyu Squad',
          notes: null,
          tier: 'S',
          is_favorited: 1,
          bangboo_id: '912',
          created_at: '2024-01-01T00:00:00Z',
          zzz_party_members: [{ agent_id: '1011', slot_index: 0 }],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');

    expect(mockFrom).toHaveBeenCalledWith('zzz_parties');
    expect(builder.select).toHaveBeenCalledWith(
      'id, profile_id, name, notes, created_at, tier, is_favorited, bangboo_id, zzz_party_members ( * )',
    );
    expect(result[0].tier).toBe('S');
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].companionId).toBe('912');
    expect(result[0].members).toEqual([{ entityId: '1011', slotIndex: 0 }]);
  });

  it('loadParties maps a null bangboo_id to companionId null', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'No Bangboo',
          notes: null,
          tier: null,
          is_favorited: 0,
          bangboo_id: null,
          created_at: '2024-01-01T00:00:00Z',
          zzz_party_members: [],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');
    expect(result[0].companionId).toBeNull();
  });

  it('saveParty writes tier and bangboo_id (but not is_favorited) with the ZZZ default name', async () => {
    mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

    const result = await service.saveParty('user-1', {
      tier: 'A',
      companionId: '912',
      members: [{ entityId: '1011', slotIndex: 0 }],
    });

    expect(mockRpc).toHaveBeenCalledWith('save_party', {
      p_parties_table: 'zzz_parties',
      p_members_table: 'zzz_party_members',
      p_profile_id: 'user-1',
      p_party_id: null,
      p_party_row: { name: 'New Party', notes: null, tier: 'A', bangboo_id: '912' },
      p_members: [{ agent_id: '1011', slot_index: 0 }],
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ partyId: 'new-party-id' });
  });

  it('saveParty writes bangboo_id null when the companion is unset', async () => {
    mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

    await service.saveParty('user-1', { tier: 'A', members: [] });

    expect(mockRpc.mock.calls[0][1].p_party_row).toEqual({
      name: 'New Party',
      notes: null,
      tier: 'A',
      bangboo_id: null,
    });
  });

  it('toggleFavoriteParty updates is_favorited on zzz_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.toggleFavoriteParty('party-1', true)).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('zzz_parties');
    expect(builder.update).toHaveBeenCalledWith({ is_favorited: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });

  it('deleteParty targets zzz_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('zzz_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
