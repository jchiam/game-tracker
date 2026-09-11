import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('hsr partyService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/honkai-star-rail/partyService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom, rpc: mockRpc },
    }));

    service = await import('@/services/honkai-star-rail/partyService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadParties queries hsr tables with tier/is_favorited and maps character_id', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Alpha Team',
          notes: 'Some notes',
          tier: 'S',
          is_favorited: 1,
          created_at: '2024-01-01T00:00:00Z',
          hsr_party_members: [
            { character_id: 'blade', slot_index: 1 },
            { character_id: 'acheron', slot_index: 0 },
          ],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');

    expect(mockFrom).toHaveBeenCalledWith('hsr_parties');
    expect(builder.select).toHaveBeenCalledWith(
      'id, profile_id, name, notes, created_at, tier, is_favorited, hsr_party_members ( * )',
    );
    expect(result[0].tier).toBe('S');
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].members).toEqual([
      { entityId: 'acheron', slotIndex: 0 },
      { entityId: 'blade', slotIndex: 1 },
    ]);
  });

  it('saveParty writes tier with the HSR default name and never touches is_favorited', async () => {
    mockRpc.mockResolvedValue({ data: 'new-party-id', error: null });

    const result = await service.saveParty('user-1', {
      tier: 'A',
      members: [{ entityId: 'acheron', slotIndex: 0 }],
    });

    expect(mockRpc).toHaveBeenCalledWith('save_party', {
      p_parties_table: 'hsr_parties',
      p_members_table: 'hsr_party_members',
      p_profile_id: 'user-1',
      p_party_id: null,
      p_party_row: { name: 'New Party', notes: null, tier: 'A' },
      p_members: [{ character_id: 'acheron', slot_index: 0 }],
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ partyId: 'new-party-id' });
  });

  it('toggleFavoriteParty updates is_favorited on hsr_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.toggleFavoriteParty('party-1', true)).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('hsr_parties');
    expect(builder.update).toHaveBeenCalledWith({ is_favorited: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });

  it('deleteParty targets hsr_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('hsr_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
