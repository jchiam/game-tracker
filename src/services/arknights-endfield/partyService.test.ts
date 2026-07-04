import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic party CRUD behaviour (DB-disabled paths,
// create/update flows, error semantics) is covered by rosterPersistence.test.ts.

describe('ae partyService', () => {
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

  it('loadParties queries ae tables and maps operator_id to entityId', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'party-1',
          profile_id: 'user-1',
          name: 'Squad One',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          ae_party_members: [
            { operator_id: 'ardelia', slot_index: 1 },
            { operator_id: 'ember', slot_index: 0 },
          ],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const result = await service.loadParties('user-1');

    expect(mockFrom).toHaveBeenCalledWith('ae_parties');
    expect(builder.select).toHaveBeenCalledWith(
      'id, profile_id, name, notes, created_at, ae_party_members ( * )',
    );
    expect(result[0].members).toEqual([
      { entityId: 'ember', slotIndex: 0 },
      { entityId: 'ardelia', slotIndex: 1 },
    ]);
  });

  it('saveParty inserts ae member columns and the AE default name', async () => {
    const partyBuilder = createBuilder({ data: { id: 'new-party-id' }, error: null });
    const memberBuilder = createBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) =>
      table === 'ae_parties' ? partyBuilder : memberBuilder,
    );

    await service.saveParty('user-1', {
      members: [{ entityId: 'ember', slotIndex: 0 }],
    });

    expect(partyBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      name: 'New Squad',
      notes: null,
    });
    expect(memberBuilder.insert).toHaveBeenCalledWith([
      { party_id: 'new-party-id', operator_id: 'ember', slot_index: 0 },
    ]);
  });

  it('deleteParty targets ae_parties', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    expect(await service.deleteParty('party-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('ae_parties');
    expect(builder.eq).toHaveBeenCalledWith('id', 'party-1');
  });
});
