import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('n2e partyService', () => {
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

  it('loadParties queries n2e tables with tier/is_favorited and maps character_id', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Party',
          notes: null,
          tier: 'S',
          is_favorited: 1,
          created_at: '2024-01-01T00:00:00Z',
          n2e_party_members: [{ character_id: 'baicang', slot_index: 0 }],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');

    expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
    expect(builder.select).toHaveBeenCalledWith(
      'id, profile_id, name, notes, created_at, tier, is_favorited, n2e_party_members ( * )',
    );
    expect(result[0].tier).toBe('S');
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].members).toEqual([{ entityId: 'baicang', slotIndex: 0 }]);
  });

  it('saveParty writes tier (but not is_favorited) with the N2E default name', async () => {
    const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
    const memberBuilder = createBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) =>
      table === 'n2e_parties' ? partyBuilder : memberBuilder,
    );

    await service.saveParty('user-1', {
      tier: 'A',
      members: [{ entityId: 'baicang', slotIndex: 0 }],
    });

    expect(partyBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      name: 'New Party',
      notes: null,
      tier: 'A',
    });
    expect(memberBuilder.insert).toHaveBeenCalledWith([
      { party_id: 'new-party-id', character_id: 'baicang', slot_index: 0 },
    ]);
  });

  it('toggleFavoriteParty updates is_favorited on n2e_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.toggleFavoriteParty('party-1', true)).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
    expect(builder.update).toHaveBeenCalledWith({ is_favorited: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });

  it('deleteParty targets n2e_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('n2e_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
