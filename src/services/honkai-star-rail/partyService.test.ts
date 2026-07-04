import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('hsr partyService', () => {
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

  it('loadParties queries hsr tables and maps character_id to entityId', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Alpha Team',
          notes: 'Some notes',
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
      'id, profile_id, name, notes, created_at, hsr_party_members ( * )',
    );
    expect(result[0].members).toEqual([
      { entityId: 'acheron', slotIndex: 0 },
      { entityId: 'blade', slotIndex: 1 },
    ]);
  });

  it('saveParty inserts hsr member columns and the HSR default name', async () => {
    const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
    const memberBuilder = createBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) =>
      table === 'hsr_parties' ? partyBuilder : memberBuilder,
    );

    await service.saveParty('user-1', {
      members: [{ entityId: 'acheron', slotIndex: 0 }],
    });

    expect(partyBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      name: 'New Party',
      notes: null,
    });
    expect(memberBuilder.insert).toHaveBeenCalledWith([
      { party_id: 'new-party-id', character_id: 'acheron', slot_index: 0 },
    ]);
  });

  it('deleteParty targets hsr_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('hsr_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
