import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('thiefService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/persona-5-phantom-x/thiefService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/persona-5-phantom-x/thiefService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadThievesFromDB transforms DB rows into P5xTrackedThief objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      thief_id: 'ann-takamaki',
      level: 65,
      awareness: 3,
      is_favorited: true,
      skills_leveled: true,
      rose_maxed: true,
      weapon_rarity: 5,
      weapon_level: 60,
      weapon_forge: 4,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadThievesFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('p5x_tracked_thieves');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ann-takamaki');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(65);
    expect(result[0].awareness).toBe(3);
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].skillsLeveled).toBe(true);
    expect(result[0].roseMaxed).toBe(true);
    expect(result[0].weaponRarity).toBe(5);
    expect(result[0].weaponLevel).toBe(60);
    expect(result[0].weaponForge).toBe(4);
    expect(result[0].name).toBe('Ann Takamaki');
    expect(result[0].codename).toBe('Panther');
    expect(result[0].personaName).toBe('Carmen');
  });

  it('loadThievesFromDB defaults awareness to 0 when column is null', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      thief_id: 'ann-takamaki',
      level: 1,
      awareness: null,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));
    const result = await service.loadThievesFromDB('user-1');
    expect(result[0].awareness).toBe(0);
    expect(result[0].skillsLeveled).toBe(false);
    expect(result[0].roseMaxed).toBe(false);
    expect(result[0].weaponRarity).toBeNull();
    expect(result[0].weaponLevel).toBe(1);
    expect(result[0].weaponForge).toBe(0);
  });

  it('insertThief inserts the entity FK column and configured defaults', async () => {
    const thiefBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'p5x_tracked_thieves' ? thiefBuilder : profileBuilder,
    );

    const result = await service.insertThief('user-1', 'ann-takamaki');

    expect(thiefBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      thief_id: 'ann-takamaki',
      level: 1,
      awareness: 0,
      skills_leveled: false,
      rose_maxed: false,
      mindscape_maxed: false,
      weapon_rarity: null,
      weapon_level: 1,
      weapon_forge: 0,
    });
    expect(result).toBe('new-db-id');
  });

  it('updateThief maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateThief('db-uuid-1', {
      level: 72,
      awareness: 6,
      isFavorited: true,
      skillsLeveled: true,
      roseMaxed: true,
      weaponRarity: 5,
      weaponLevel: 60,
      weaponForge: 4,
    });

    expect(mockFrom).toHaveBeenCalledWith('p5x_tracked_thieves');
    expect(builder.update).toHaveBeenCalledWith({
      level: 72,
      awareness: 6,
      is_favorited: true,
      skills_leveled: true,
      rose_maxed: true,
      weapon_rarity: 5,
      weapon_level: 60,
      weapon_forge: 4,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });
});
