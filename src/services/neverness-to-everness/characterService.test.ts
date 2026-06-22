import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createBuilder(result: { data: any; error: any } = { data: null, error: null }) {
  const builder: Record<string, any> = {};
  for (const method of ['select', 'eq', 'insert', 'update', 'delete', 'upsert', 'order']) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

describe('characterService', () => {
  describe('DB disabled (no VITE_SUPABASE_URL)', () => {
    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
      }));
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadCharactersFromDB returns empty array', async () => {
      const { loadCharactersFromDB } =
        await import('@/services/neverness-to-everness/characterService');
      expect(await loadCharactersFromDB('user-1')).toEqual([]);
    });

    it('insertCharacter returns null', async () => {
      const { insertCharacter } = await import('@/services/neverness-to-everness/characterService');
      expect(await insertCharacter('user-1', 'baicang')).toBeNull();
    });

    it('deleteCharacter resolves without calling supabase', async () => {
      const { deleteCharacter } = await import('@/services/neverness-to-everness/characterService');
      await expect(deleteCharacter('db-id')).resolves.toBeUndefined();
    });

    it('updateCharacter resolves without calling supabase', async () => {
      const { updateCharacter } = await import('@/services/neverness-to-everness/characterService');
      await expect(updateCharacter('db-id', { level: 40 })).resolves.toBeUndefined();
    });
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/neverness-to-everness/characterService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/neverness-to-everness/characterService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadCharactersFromDB queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));

      await service.loadCharactersFromDB('user-1');

      expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
    });

    it('loadCharactersFromDB returns empty array when data is null', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: null }));

      const result = await service.loadCharactersFromDB('user-1');
      expect(result).toEqual([]);
    });

    it('loadCharactersFromDB throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));

      await expect(service.loadCharactersFromDB('user-1')).rejects.toEqual({
        message: 'DB error',
      });
    });

    it('loadCharactersFromDB transforms DB rows into N2ETrackedCharacter objects', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        character_id: 'baicang',
        level: 45,
        awakening_slots: [true, true, false, false, false, false],
        resonance_count: 3,
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

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('baicang');
      expect(result[0].dbId).toBe('db-uuid-1');
      expect(result[0].level).toBe(45);
      expect(result[0].awakening).toEqual([true, true, false, false, false, false]);
      expect(result[0].resonanceCount).toBe(3);
      expect(result[0].arcId).toBe(1);
      expect(result[0].arcTier).toBe(2);
      expect(result[0].cartridgeId).toBe('Cosmos_orange');
      expect(result[0].cartridgeRarity).toBe('S');
      expect(result[0].cartridgeSubStats).toEqual(['ATK%', 'CRIT DMG', 'HP%', 'DEF%']);
      expect(result[0].isFavorited).toBe(true);
      expect(result[0].name).toBe('Baicang');
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

    it('loadCharactersFromDB skips rows with unknown character_id', async () => {
      const dbRows = [
        {
          id: 'db-uuid-1',
          character_id: 'unknown-char',
          level: 1,
          is_favorited: false,
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadCharactersFromDB('user-1');
      expect(result).toHaveLength(0);
    });

    it('insertCharacter upserts user_profiles and inserts into n2e_tracked_characters', async () => {
      const charBuilder = createBuilder({ data: { id: 'new-char-db-id' }, error: null });
      const profileBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_tracked_characters') return charBuilder;
        return profileBuilder;
      });

      const result = await service.insertCharacter('user-1', 'baicang');

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
      expect(result).toBe('new-char-db-id');
    });

    it('insertCharacter throws on DB error', async () => {
      const charBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(charBuilder);

      await expect(service.insertCharacter('user-1', 'baicang')).rejects.toEqual({
        message: 'Insert failed',
      });
    });

    it('deleteCharacter calls delete on the correct table', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.deleteCharacter('db-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('updateCharacter maps a camelCase patch to snake_case columns', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.updateCharacter('db-uuid-1', {
        level: 40,
        awakening: [true, true, true, false, false, false],
        arcId: 'arc-1',
        cartridgeSubStats: ['ATK%', 'CRIT DMG'],
        isFavorited: true,
      });

      expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
      expect(builder.update).toHaveBeenCalledWith({
        level: 40,
        awakening_slots: [true, true, true, false, false, false],
        arc_id: 'arc-1',
        cartridge_sub_stats: ['ATK%', 'CRIT DMG'],
        is_favorited: true,
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('deleteCharacter throws on DB error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Delete failed' } });
      mockFrom.mockReturnValue(builder);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(service.deleteCharacter('db-uuid-1')).rejects.toEqual({
        message: 'Delete failed',
      });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('updateCharacter throws on DB error', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(builder);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(service.updateCharacter('db-uuid-1', { level: 50 })).rejects.toEqual({
        message: 'Update failed',
      });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveCartridgePreferences deletes old preferences and updates comments', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.saveCartridgePreferences('db-uuid-1', {
        cartridgeId: null,
        mainStats: [],
        subStats: [],
        comments: 'New comments',
      });

      expect(mockFrom).toHaveBeenCalledWith('n2e_cartridge_preference_main_stats');
      expect(mockFrom).toHaveBeenCalledWith('n2e_cartridge_preference_sub_stats');
      expect(mockFrom).toHaveBeenCalledWith('n2e_tracked_characters');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.update).toHaveBeenCalledWith({
        cartridge_comments: 'New comments',
        cartridge_preference_id: null,
      });
    });

    it('saveCartridgePreferences inserts main stat preferences when present', async () => {
      const mainBuilder = createBuilder({ data: null, error: null });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_cartridge_preference_main_stats') return mainBuilder;
        return otherBuilder;
      });

      await service.saveCartridgePreferences('db-uuid-1', {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK', operator: '>', orderIndex: 0 }],
        subStats: [],
        comments: '',
      });

      expect(mainBuilder.insert).toHaveBeenCalledWith([
        {
          tracked_character_id: 'db-uuid-1',
          stat: 'ATK',
          operator_to_next: '>',
          order_index: 0,
        },
      ]);
    });

    it('saveCartridgePreferences inserts sub stat preferences when present', async () => {
      const subBuilder = createBuilder({ data: null, error: null });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_cartridge_preference_sub_stats') return subBuilder;
        return otherBuilder;
      });

      await service.saveCartridgePreferences('db-uuid-1', {
        cartridgeId: null,
        mainStats: [],
        subStats: [{ stat: 'CRIT DMG', operator: '>', orderIndex: 0 }],
        comments: '',
      });

      expect(subBuilder.insert).toHaveBeenCalledWith([
        {
          tracked_character_id: 'db-uuid-1',
          stat: 'CRIT DMG',
          operator_to_next: '>',
          order_index: 0,
        },
      ]);
    });

    it('saveCartridgePreferences throws on main stats insert failure', async () => {
      const mainBuilder = createBuilder({ data: null, error: { message: 'Insert main failed' } });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_cartridge_preference_main_stats') return mainBuilder;
        return otherBuilder;
      });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.saveCartridgePreferences('db-uuid-1', {
          cartridgeId: null,
          mainStats: [{ stat: 'ATK', operator: null, orderIndex: 0 }],
          subStats: [],
          comments: '',
        }),
      ).rejects.toEqual({ message: 'Insert main failed' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveCartridgePreferences throws on sub stats insert failure', async () => {
      const subBuilder = createBuilder({ data: null, error: { message: 'Insert sub failed' } });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'n2e_cartridge_preference_sub_stats') return subBuilder;
        return otherBuilder;
      });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.saveCartridgePreferences('db-uuid-1', {
          cartridgeId: null,
          mainStats: [],
          subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
          comments: '',
        }),
      ).rejects.toEqual({ message: 'Insert sub failed' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
