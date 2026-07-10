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

  describe('preference-state isolation on load', () => {
    // Two thieves, each carrying a sub_stats preference row. The loader must give each
    // thief a freshly-allocated subStats array that never aliases the module-level default
    // or the other thief — otherwise push()es in mapRow mutate shared state (the aliasing bug).
    const twoThiefRows = () => [
      {
        id: 'db-1',
        thief_id: 'ann-takamaki',
        level: 1,
        awareness: 0,
        is_favorited: false,
        p5x_revelation_preferences: [
          { category: 'sub_stats', stat: 'crit-rate', operator: null, order_index: 0 },
          { category: 'moon_main', stat: 'attack-pct', operator: null, order_index: 0 },
        ],
      },
      {
        id: 'db-2',
        thief_id: 'ryuji-sakamoto',
        level: 1,
        awareness: 0,
        is_favorited: false,
        p5x_revelation_preferences: [
          { category: 'sub_stats', stat: 'attack-pct', operator: null, order_index: 0 },
          { category: 'moon_main', stat: 'defense-pct', operator: null, order_index: 0 },
        ],
      },
    ];

    it('gives each thief a distinct subStats array reference', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: twoThiefRows(), error: null }));
      const result = await service.loadThievesFromDB('user-1');

      expect(result[0].revelationPreferences.subStats).toHaveLength(1);
      expect(result[1].revelationPreferences.subStats).toHaveLength(1);
      expect(result[0].revelationPreferences.subStats[0].stat).toBe('crit-rate');
      expect(result[1].revelationPreferences.subStats[0].stat).toBe('attack-pct');
      // Distinct references — the crux of the aliasing bug.
      expect(result[0].revelationPreferences.subStats).not.toBe(
        result[1].revelationPreferences.subStats,
      );
      // mainStats arrays are re-owned too — assert the same isolation.
      expect(result[0].revelationPreferences.mainStats.moon[0].stat).toBe('attack-pct');
      expect(result[1].revelationPreferences.mainStats.moon[0].stat).toBe('defense-pct');
      expect(result[0].revelationPreferences.mainStats.moon).not.toBe(
        result[1].revelationPreferences.mainStats.moon,
      );
    });

    it('does not accumulate substats across repeated loads', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: twoThiefRows(), error: null }));

      const first = await service.loadThievesFromDB('user-1');
      const second = await service.loadThievesFromDB('user-1');

      // A thief with one stored substat row reports exactly one after each load — never 2N.
      expect(first[0].revelationPreferences.subStats).toHaveLength(1);
      expect(second[0].revelationPreferences.subStats).toHaveLength(1);
    });

    it('mutating one thief substats does not bleed into another', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: twoThiefRows(), error: null }));
      const result = await service.loadThievesFromDB('user-1');

      result[0].revelationPreferences.subStats.push({
        stat: 'speed',
        operator: null,
        orderIndex: 1,
      });

      expect(result[0].revelationPreferences.subStats).toHaveLength(2);
      expect(result[1].revelationPreferences.subStats).toHaveLength(1);
    });
  });

  describe('upsertRevelationCard', () => {
    it('upserts with thief_row_id, slot, and JSONB sub_stats', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.upsertRevelationCard('db-uuid-1', 'moon', {
        setId: 'strife',
        mainStat: 'ATK%',
        subStats: ['Crit Rate%', 'Speed'],
      });

      expect(mockFrom).toHaveBeenCalledWith('p5x_revelation_cards');
      expect(builder.upsert).toHaveBeenCalledWith(
        {
          thief_row_id: 'db-uuid-1',
          slot: 'moon',
          set_id: 'strife',
          main_stat: 'ATK%',
          sub_stats: ['Crit Rate%', 'Speed'],
        },
        { onConflict: 'thief_row_id,slot' },
      );
    });
  });

  describe('deleteRevelationCard', () => {
    it('deletes by thief_row_id and slot', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.deleteRevelationCard('db-uuid-1', 'star');

      expect(mockFrom).toHaveBeenCalledWith('p5x_revelation_cards');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('thief_row_id', 'db-uuid-1');
      expect(builder.eq).toHaveBeenCalledWith('slot', 'star');
    });
  });

  describe('saveRevelationPreferences', () => {
    it('deletes existing rows then inserts new preference rows', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.saveRevelationPreferences('db-uuid-1', {
        heavensSetId: 'strife',
        spaceSetId: 'meditation',
        mainStats: {
          moon: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
          star: [],
          sky: [],
        },
        subStats: [
          { stat: 'Crit Rate%', operator: '>', orderIndex: 0 },
          { stat: 'ATK%', operator: null, orderIndex: 1 },
        ],
      });

      expect(mockFrom).toHaveBeenCalledWith('p5x_revelation_preferences');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.insert).toHaveBeenCalled();

      const insertedRows = builder.insert.mock.calls[0][0];
      expect(insertedRows).toContainEqual(
        expect.objectContaining({ category: 'heavens_set', stat: 'strife' }),
      );
      expect(insertedRows).toContainEqual(
        expect.objectContaining({ category: 'space_set', stat: 'meditation' }),
      );
      expect(insertedRows).toContainEqual(
        expect.objectContaining({ category: 'moon_main', stat: 'ATK%', order_index: 0 }),
      );
      expect(insertedRows).toContainEqual(
        expect.objectContaining({ category: 'sub_stats', stat: 'Crit Rate%', operator: '>' }),
      );
    });
  });
});
