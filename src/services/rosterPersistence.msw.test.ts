import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { createSupabaseRestErrorHandlers } from '@/test/mocks/handlers';

/**
 * The one test that exercises the real `@supabase/supabase-js` client against
 * an HTTP 500. Every other persistence test mocks the client; this proves the
 * assumption they rest on — that PostgREST error responses reach the factory
 * as `{ error }` and are rethrown, never swallowed into an empty result.
 *
 * `DB_ENABLED` is evaluated at module load, so the env is stubbed before the
 * dynamic import of the service module.
 */

const server = setupServer(
  ...createSupabaseRestErrorHandlers(['test_tracked', 'test_parties']),
);

vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});

interface TestBase {
  id: string;
  name: string;
}
interface TestTracked extends TestBase {
  dbId?: string;
  isFavorited: boolean;
}
interface TestParty {
  id: string;
  name: string;
  notes: string | null;
}
interface TestMember {
  entityId: string;
  slotIndex: number;
}

async function loadModule() {
  vi.resetModules();
  return import('@/services/rosterPersistence');
}

describe('rosterPersistence against an HTTP 500 (real client, MSW)', () => {
  it('roster load rejects with the PostgREST error instead of resolving empty', async () => {
    const mod = await loadModule();
    const svc = mod.createRosterPersistence<TestBase, TestTracked, Partial<TestTracked>>({
      table: 'test_tracked',
      entityIdColumn: 'entity_id',
      catalog: [{ id: 'alpha', name: 'Alpha' }],
      columns: { isFavorited: 'is_favorited' } as Record<keyof Partial<TestTracked>, string>,
      insertDefaults: {},
      select: 'id, entity_id, is_favorited',
      fromRow: (row: any, base) => ({ ...base, dbId: row.id, isFavorited: !!row.is_favorited }),
    });

    await expect(svc.load('user-1')).rejects.toMatchObject({
      message: 'Simulated 500 for test_tracked',
    });
  });

  it('roster remove rejects on a 500', async () => {
    const mod = await loadModule();
    const svc = mod.createRosterPersistence<TestBase, TestTracked, Partial<TestTracked>>({
      table: 'test_tracked',
      entityIdColumn: 'entity_id',
      catalog: [],
      columns: {} as Record<keyof Partial<TestTracked>, string>,
      insertDefaults: {},
      select: 'id',
      fromRow: (_row: any, base) => ({ ...base, isFavorited: false }),
    });

    await expect(svc.remove('db-1')).rejects.toMatchObject({
      message: 'Simulated 500 for test_tracked',
    });
  });

  it('parties load rejects with the PostgREST error instead of resolving empty', async () => {
    const mod = await loadModule();
    const svc = mod.createPartyPersistence<TestParty, TestMember>({
      partiesTable: 'test_parties',
      membersTable: 'test_party_members',
      defaultName: 'New Party',
      memberFromRow: (row: any) => ({ entityId: row.entity_id, slotIndex: row.slot_index }),
      memberToRow: (m) => ({ entity_id: m.entityId, slot_index: m.slotIndex }),
    });

    await expect(svc.loadParties('user-1')).rejects.toMatchObject({
      message: 'Simulated 500 for test_parties',
    });
  });

  it('saveParty resolves a null partyId (never rejects) on a 500', async () => {
    const mod = await loadModule();
    const svc = mod.createPartyPersistence<TestParty, TestMember>({
      partiesTable: 'test_parties',
      membersTable: 'test_party_members',
      defaultName: 'New Party',
      memberFromRow: (row: any) => ({ entityId: row.entity_id, slotIndex: row.slot_index }),
      memberToRow: (m) => ({ entity_id: m.entityId, slot_index: m.slotIndex }),
    });

    await expect(svc.saveParty('user-1', { name: 'Doomed', members: [] })).resolves.toEqual({
      partyId: null,
    });
  });
});
