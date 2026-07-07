import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('p5x partyService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/persona-5-phantom-x/partyService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());
    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/persona-5-phantom-x/partyService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadParties queries p5x tables with tier/is_favorited and maps entity_id', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Party One',
          notes: null,
          tier: 'S',
          is_favorited: 1,
          created_at: '2024-01-01T00:00:00Z',
          p5x_party_members: [
            { entity_id: 'ann-takamaki', slot_index: 4, member_type: 'thief' },
            { entity_id: 'arsene', slot_index: 1, member_type: 'persona' },
          ],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');

    expect(mockFrom).toHaveBeenCalledWith('p5x_parties');
    expect(builder.select).toHaveBeenCalledWith(
      'id, profile_id, name, notes, created_at, tier, is_favorited, p5x_party_members ( * )',
    );
    expect(result[0].tier).toBe('S');
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].members).toEqual([
      { entityId: 'arsene', slotIndex: 1 },
      { entityId: 'ann-takamaki', slotIndex: 4 },
    ]);
  });

  it('saveParty writes members with entity_id and derives member_type from slot range', async () => {
    const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
    const memberBuilder = createBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) =>
      table === 'p5x_parties' ? partyBuilder : memberBuilder,
    );

    await service.saveParty('user-1', {
      tier: 'A',
      members: [
        { entityId: 'arsene', slotIndex: 1 },
        { entityId: 'ann-takamaki', slotIndex: 4 },
      ],
    });

    expect(partyBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      name: 'New Party',
      notes: null,
      tier: 'A',
    });
    expect(memberBuilder.insert).toHaveBeenCalledWith([
      { party_id: 'new-party-id', entity_id: 'arsene', slot_index: 1, member_type: 'persona' },
      { party_id: 'new-party-id', entity_id: 'ann-takamaki', slot_index: 4, member_type: 'thief' },
    ]);
  });

  it('toggleFavoriteParty updates is_favorited on p5x_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.toggleFavoriteParty('party-1', true)).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('p5x_parties');
    expect(builder.update).toHaveBeenCalledWith({ is_favorited: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });

  it('deleteParty targets p5x_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('p5x_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
