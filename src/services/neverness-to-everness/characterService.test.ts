import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring + game-specific write tests only — generic CRUD behaviour and
// savePreferenceRows failure/DB-disabled paths are covered by rosterPersistence.test.ts.
describe('characterService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/neverness-to-everness/characterService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());
    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom, rpc: mockRpc },
    }));

    service = await import('@/services/neverness-to-everness/characterService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadCharactersFromDB transforms DB rows into N2ETrackedCharacter objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      character_id: 'baicang',
      level: 45,
      modules_configured: true,
      awakening_slots: [true, true, false, false, false, false],
      arc_id: 1,
      arc_level: 30,
      arc_tier: 2,
      cartridge_id: 'Cosmos_orange',
      cartridge_preference_id: null,
      cartridge_rarity: 'S',
      cartridge_level: 15,
      cartridge_main_stat: 'CRIT Rate',
      cartridge_sub_stats: ['ATK%', 'CRIT DMG', 'HP%', 'DEF%'],
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadCharactersFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('baicang');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(45);
    expect(result[0].modulesConfigured).toBe(true);
    expect(result[0].awakening).toEqual([true, true, false, false, false, false]);
    expect(result[0].arcId).toBe(1);
    expect(result[0].arcTier).toBe(2);
    expect(result[0].cartridgeId).toBe('Cosmos_orange');
    expect(result[0].cartridgeRarity).toBe('S');
    expect(result[0].cartridgeSubStats).toEqual(['ATK%', 'CRIT DMG', 'HP%', 'DEF%']);
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].name).toBe('Baicang');
  });

  it('loadCharactersFromDB remaps legacy everness.info stat labels to in-game form', async () => {
    const dbRow = {
      id: 'db-uuid-legacy',
      character_id: 'baicang',
      level: 45,
      cartridge_id: 'Cosmos_orange',
      cartridge_rarity: 'S',
      cartridge_main_stat: 'Cosmos DMG Bonus %',
      cartridge_sub_stats: ['HP %', 'CRIT DMG %', 'ATK %', 'Break Intensity'],
      n2e_cartridge_preference_main_stats: [
        { stat: 'CRIT Rate %', operator_to_next: null, order_index: 0 },
      ],
      n2e_cartridge_preference_sub_stats: [
        { stat: 'Universal DMG Bonus %', operator_to_next: null, order_index: 0 },
      ],
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadCharactersFromDB('user-1');

    expect(result[0].cartridgeMainStat).toBe('Cosmos DMG Bonus');
    // 'Break Intensity' is unchanged (identity); the rest are remapped.
    expect(result[0].cartridgeSubStats).toEqual(['HP%', 'CRIT DMG', 'ATK%', 'Break Intensity']);
    expect(result[0].cartridgePreferences.mainStats).toEqual([
      { stat: 'CRIT Rate', operator: null, orderIndex: 0 },
    ]);
    expect(result[0].cartridgePreferences.subStats).toEqual([
      { stat: 'DMG%', operator: null, orderIndex: 0 },
    ]);
  });

  it('loadCharactersFromDB maps cartridge preference main and sub stats correctly', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      character_id: 'baicang',
      level: 45,
      n2e_cartridge_preference_main_stats: [
        { stat: 'HP', operator_to_next: '<', order_index: 1 },
        { stat: 'ATK', operator_to_next: '>', order_index: 0 },
      ],
      n2e_cartridge_preference_sub_stats: [
        { stat: 'CRIT DMG', operator_to_next: null, order_index: 1 },
        { stat: 'CRIT Rate', operator_to_next: '>', order_index: 0 },
      ],
      cartridge_comments: 'Target CRIT/ATK',
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadCharactersFromDB('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].cartridgePreferences.mainStats).toEqual([
      { stat: 'ATK', operator: '>', orderIndex: 0 },
      { stat: 'HP', operator: '<', orderIndex: 1 },
    ]);
    expect(result[0].cartridgePreferences.subStats).toEqual([
      { stat: 'CRIT Rate', operator: '>', orderIndex: 0 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
    ]);
    expect(result[0].cartridgePreferences.comments).toBe('Target CRIT/ATK');
  });

  it('insertCharacter inserts the entity FK column and configured defaults', async () => {
    const charBuilder = createBuilder({ data: { id: 'new-char-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'n2e_tracked_characters' ? charBuilder : profileBuilder,
    );

    const result = await service.insertCharacter('user-1', 'baicang');

    expect(charBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      character_id: 'baicang',
      level: 1,
      modules_configured: false,
      awakening_slots: [false, false, false, false, false, false],
      arc_id: null,
      arc_level: 1,
      arc_tier: 1,
      cartridge_id: null,
      cartridge_preference_id: null,
      cartridge_rarity: null,
      cartridge_level: 0,
      cartridge_main_stat: null,
      cartridge_sub_stats: [],
    });
    expect(result).toBe('new-char-db-id');
  });

  it('updateCharacter maps a camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateCharacter('db-uuid-1', {
      level: 40,
      modulesConfigured: true,
      awakening: [true, true, true, false, false, false],
      arcId: 'arc-1',
      cartridgeSubStats: ['ATK%', 'CRIT DMG'],
      isFavorited: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
    expect(builder.update).toHaveBeenCalledWith({
      level: 40,
      modules_configured: true,
      awakening_slots: [true, true, true, false, false, false],
      arc_id: 'arc-1',
      cartridge_sub_stats: ['ATK%', 'CRIT DMG'],
      is_favorited: true,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });

  describe('saveCartridgePreferences', () => {
    const rpcPayload = () => mockRpc.mock.calls[0][1];

    it('replaces both preference tables and the parent columns in one replace_preference_rows RPC', async () => {
      await service.saveCartridgePreferences('db-uuid-1', {
        cartridgeId: null,
        mainStats: [],
        subStats: [],
        comments: 'New comments',
      });

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
        p_parent_id: 'db-uuid-1',
        p_delete_from: [
          { table: 'n2e_cartridge_preference_main_stats', fk_column: 'tracked_character_id' },
          { table: 'n2e_cartridge_preference_sub_stats', fk_column: 'tracked_character_id' },
        ],
        p_parent_update: {
          table: 'n2e_tracked_characters',
          row: { cartridge_comments: 'New comments', cartridge_preference_id: null },
        },
        p_inserts: [],
      });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('inserts main stat preferences when present', async () => {
      await service.saveCartridgePreferences('db-uuid-1', {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK', operator: '>', orderIndex: 0 }],
        subStats: [],
        comments: '',
      });

      expect(rpcPayload().p_inserts).toEqual([
        {
          table: 'n2e_cartridge_preference_main_stats',
          rows: [
            {
              tracked_character_id: 'db-uuid-1',
              stat: 'ATK',
              operator_to_next: '>',
              order_index: 0,
            },
          ],
        },
      ]);
    });

    it('inserts sub stat preferences when present', async () => {
      await service.saveCartridgePreferences('db-uuid-1', {
        cartridgeId: null,
        mainStats: [],
        subStats: [{ stat: 'CRIT DMG', operator: '>', orderIndex: 0 }],
        comments: '',
      });

      expect(rpcPayload().p_inserts).toEqual([
        {
          table: 'n2e_cartridge_preference_sub_stats',
          rows: [
            {
              tracked_character_id: 'db-uuid-1',
              stat: 'CRIT DMG',
              operator_to_next: '>',
              order_index: 0,
            },
          ],
        },
      ]);
    });
  });
});
