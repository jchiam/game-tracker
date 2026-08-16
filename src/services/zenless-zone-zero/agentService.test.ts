import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('agentService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/zenless-zone-zero/agentService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/zenless-zone-zero/agentService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadAgentsFromDB transforms DB rows into ZzzTrackedAgent objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 60,
      mindscape: 6,
      core_skill: 5,
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadAgentsFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('zzz_tracked_agents');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1011');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(60);
    expect(result[0].mindscape).toBe(6);
    expect(result[0].coreSkill).toBe(5);
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].name).toBe('Anby');
    expect(result[0].specialty).toBe('Stun');
    expect(result[0].element).toBe('Elec');
  });

  it('loadAgentsFromDB defaults mindscape and coreSkill to 0 when columns are null', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 1,
      mindscape: null,
      core_skill: null,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));
    const result = await service.loadAgentsFromDB('user-1');
    expect(result[0].mindscape).toBe(0);
    expect(result[0].coreSkill).toBe(0);
  });

  it('insertAgent inserts the entity FK column and configured defaults', async () => {
    const agentBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'zzz_tracked_agents' ? agentBuilder : profileBuilder,
    );

    const result = await service.insertAgent('user-1', '1011');

    expect(agentBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      agent_id: '1011',
      level: 1,
      mindscape: 0,
      core_skill: 0,
    });
    expect(result).toBe('new-db-id');
  });

  it('updateAgent maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateAgent('db-uuid-1', {
      level: 50,
      mindscape: 2,
      coreSkill: 4,
      isFavorited: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('zzz_tracked_agents');
    expect(builder.update).toHaveBeenCalledWith({
      level: 50,
      mindscape: 2,
      core_skill: 4,
      is_favorited: true,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });
});
