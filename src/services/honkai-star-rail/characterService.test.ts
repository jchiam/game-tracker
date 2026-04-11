import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Creates a chainable Supabase query builder mock.
 * Methods like .select(), .eq(), .update() etc. all return the same builder (for chaining).
 * The builder is also directly awaitable via .then (resolves to the provided result).
 * .single() returns a Promise resolving to the same result.
 */
function createBuilder(result: { data: any; error: any } = { data: null, error: null }) {
  const builder: Record<string, any> = {};
  for (const method of [
    'select',
    'eq',
    'insert',
    'update',
    'delete',
    'upsert',
    'match',
    'order',
    'filter',
    'gte',
    'lte',
  ]) {
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
      const { loadCharactersFromDB } = await import('@/services/honkai-star-rail/characterService');
      expect(await loadCharactersFromDB('user-1')).toEqual([]);
    });

    it('insertCharacter returns null', async () => {
      const { insertCharacter } = await import('@/services/honkai-star-rail/characterService');
      expect(await insertCharacter('user-1', 'acheron')).toBeNull();
    });

    it('deleteCharacter resolves without calling supabase', async () => {
      const { deleteCharacter } = await import('@/services/honkai-star-rail/characterService');
      await expect(deleteCharacter('db-id')).resolves.toBeUndefined();
    });

    it('updateCharacter resolves without calling supabase', async () => {
      const { updateCharacter } = await import('@/services/honkai-star-rail/characterService');
      await expect(updateCharacter('db-id', { level: 60 })).resolves.toBeUndefined();
    });

    it('upsertRelic resolves without calling supabase', async () => {
      const { upsertRelic } = await import('@/services/honkai-star-rail/characterService');
      await expect(
        upsertRelic('db-id', 'head', { setId: '101', mainStat: 'HP', subStats: [] }),
      ).resolves.toBeUndefined();
    });

    it('deleteRelic resolves without calling supabase', async () => {
      const { deleteRelic } = await import('@/services/honkai-star-rail/characterService');
      await expect(deleteRelic('db-id', 'head')).resolves.toBeUndefined();
    });

    it('saveBuildPrefs resolves without calling supabase', async () => {
      const { saveBuildPrefs } = await import('@/services/honkai-star-rail/characterService');
      await expect(
        saveBuildPrefs('db-id', {
          mainStats: { body: [], feet: [], sphere: [], rope: [] },
          subStats: [],
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('DB enabled (VITE_SUPABASE_URL set)', () => {
    let mockFrom: ReturnType<typeof vi.fn>;
    let service: typeof import('@/services/honkai-star-rail/characterService');

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

      mockFrom = vi.fn().mockReturnValue(createBuilder());

      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));

      service = await import('@/services/honkai-star-rail/characterService');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loadCharactersFromDB queries the correct table', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: [], error: null }));

      await service.loadCharactersFromDB('user-1');

      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
    });

    it('loadCharactersFromDB returns empty array when data is null', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: null }));

      const result = await service.loadCharactersFromDB('user-1');
      expect(result).toEqual([]);
    });

    it('loadCharactersFromDB throws on DB error', async () => {
      mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'DB error' } }));

      await expect(service.loadCharactersFromDB('user-1')).rejects.toEqual({ message: 'DB error' });
    });

    it('loadCharactersFromDB transforms DB rows into HsrTrackedCharacter objects', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        character_id: 'acheron', // must match ALL_CHARACTERS
        level: 60,
        traces_attained: true,
        is_favorited: false,
        build_comments: '',
        hsr_equipped_relics: [],
        hsr_build_preference_main_stats: [],
        hsr_build_preference_sub_stats: [],
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadCharactersFromDB('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acheron');
      expect(result[0].dbId).toBe('db-uuid-1');
      expect(result[0].level).toBe(60);
      expect(result[0].tracesAttained).toBe(true);
      expect(result[0].isFavorited).toBe(false);
      expect(result[0].name).toBe('Acheron');
    });

    it('loadCharactersFromDB skips rows with unknown character_id', async () => {
      const dbRows = [
        {
          id: 'db-uuid-1',
          character_id: 'unknown-char-id',
          level: 1,
          traces_attained: false,
          is_favorited: false,
          build_comments: '',
          hsr_equipped_relics: [],
          hsr_build_preference_main_stats: [],
          hsr_build_preference_sub_stats: [],
        },
      ];

      mockFrom.mockReturnValue(createBuilder({ data: dbRows, error: null }));

      const result = await service.loadCharactersFromDB('user-1');
      expect(result).toHaveLength(0);
    });

    it('loadCharactersFromDB maps equipped relics correctly', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        character_id: 'acheron',
        level: 60,
        traces_attained: false,
        is_favorited: false,
        build_comments: '',
        hsr_equipped_relics: [
          {
            id: 'relic-1',
            slot: 'head',
            set_id: '101',
            main_stat: 'HP',
            hsr_relic_substats: [{ stat_type: 'CRIT Rate', stat_value: '5.8' }],
          },
        ],
        hsr_build_preference_main_stats: [],
        hsr_build_preference_sub_stats: [],
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadCharactersFromDB('user-1');

      expect(result[0].relics.head).toEqual({
        setId: '101',
        mainStat: 'HP',
        subStats: [{ type: 'CRIT Rate', value: '5.8' }],
      });
    });

    it('insertCharacter upserts user_profiles and inserts into hsr_tracked_characters', async () => {
      const charBuilder = createBuilder({ data: { id: 'new-char-db-id' }, error: null });
      const profileBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_tracked_characters') return charBuilder;
        return profileBuilder;
      });

      const result = await service.insertCharacter('user-1', 'acheron');

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
      expect(result).toBe('new-char-db-id');
    });

    it('insertCharacter throws on DB error', async () => {
      const charBuilder = createBuilder({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(charBuilder);

      await expect(service.insertCharacter('user-1', 'acheron')).rejects.toEqual({
        message: 'Insert failed',
      });
    });

    it('deleteCharacter calls delete on the correct table and id', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.deleteCharacter('db-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('updateCharacter calls update on the correct table with provided updates', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.updateCharacter('db-uuid-1', { level: 80, is_favorited: true });

      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
      expect(builder.update).toHaveBeenCalledWith({ level: 80, is_favorited: true });
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    it('upsertRelic upserts relic and manages substats', async () => {
      const relicBuilder = createBuilder({ data: { id: 'relic-db-id' }, error: null });
      const substatBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_equipped_relics') return relicBuilder;
        return substatBuilder;
      });

      const relicData = {
        setId: '101',
        mainStat: 'HP',
        subStats: [{ type: 'CRIT Rate', value: '5.8' }],
      };

      await service.upsertRelic('db-uuid-1', 'head', relicData);

      expect(mockFrom).toHaveBeenCalledWith('hsr_equipped_relics');
      expect(mockFrom).toHaveBeenCalledWith('hsr_relic_substats');
    });

    it('upsertRelic deletes existing substats before inserting new ones', async () => {
      const relicBuilder = createBuilder({ data: { id: 'relic-db-id' }, error: null });
      const substatBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_equipped_relics') return relicBuilder;
        return substatBuilder;
      });

      await service.upsertRelic('db-uuid-1', 'head', {
        setId: '101',
        mainStat: 'HP',
        subStats: [{ type: 'CRIT Rate', value: '5.8' }],
      });

      expect(substatBuilder.delete).toHaveBeenCalled();
      expect(substatBuilder.eq).toHaveBeenCalledWith('relic_id', 'relic-db-id');
      expect(substatBuilder.insert).toHaveBeenCalledWith([
        { relic_id: 'relic-db-id', stat_type: 'CRIT Rate', stat_value: '5.8' },
      ]);
    });

    it('upsertRelic skips substat insert when subStats is empty', async () => {
      const relicBuilder = createBuilder({ data: { id: 'relic-db-id' }, error: null });
      const substatBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_equipped_relics') return relicBuilder;
        return substatBuilder;
      });

      await service.upsertRelic('db-uuid-1', 'head', {
        setId: '101',
        mainStat: 'HP',
        subStats: [],
      });

      expect(substatBuilder.delete).toHaveBeenCalled();
      expect(substatBuilder.insert).not.toHaveBeenCalled();
    });

    it('upsertRelic throws and skips substats when relic upsert fails', async () => {
      const relicBuilder = createBuilder({ data: null, error: { message: 'Upsert failed' } });
      const substatBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_equipped_relics') return relicBuilder;
        return substatBuilder;
      });

      await expect(
        service.upsertRelic('db-uuid-1', 'head', { setId: '101', mainStat: 'HP', subStats: [] }),
      ).rejects.toEqual({ message: 'Upsert failed' });
      expect(substatBuilder.delete).not.toHaveBeenCalled();
    });

    it('deleteRelic calls delete on hsr_equipped_relics with correct match', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.deleteRelic('db-uuid-1', 'head');

      expect(mockFrom).toHaveBeenCalledWith('hsr_equipped_relics');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.match).toHaveBeenCalledWith({
        tracked_character_id: 'db-uuid-1',
        slot: 'head',
      });
    });

    it('updateCharacter throws when DB update fails', async () => {
      const builder = createBuilder({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(builder);

      await expect(service.updateCharacter('db-uuid-1', { level: 80 })).rejects.toEqual({
        message: 'Update failed',
      });
    });

    it('loadCharactersFromDB maps build_preference_main_stats and sub_stats correctly', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        character_id: 'acheron',
        level: 60,
        traces_attained: false,
        is_favorited: false,
        build_comments: '',
        hsr_equipped_relics: [],
        hsr_build_preference_main_stats: [
          { id: 'pref-1', slot: 'body', stat: 'CRIT Rate', operator_to_next: null, order_index: 0 },
        ],
        hsr_build_preference_sub_stats: [
          { id: 'pref-2', stat: 'CRIT DMG', operator_to_next: '>', order_index: 0 },
        ],
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadCharactersFromDB('user-1');

      expect(result[0].buildPreferences.mainStats.body).toEqual([
        { stat: 'CRIT Rate', operator: null, orderIndex: 0 },
      ]);
      expect(result[0].buildPreferences.subStats).toEqual([
        { stat: 'CRIT DMG', operator: '>', orderIndex: 0 },
      ]);
    });

    it('loadCharactersFromDB maps is_favorited and build_comments correctly', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        character_id: 'acheron',
        level: 60,
        traces_attained: false,
        is_favorited: true,
        build_comments: 'Rush CRIT stats',
        hsr_equipped_relics: [],
        hsr_build_preference_main_stats: [],
        hsr_build_preference_sub_stats: [],
      };

      mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

      const result = await service.loadCharactersFromDB('user-1');

      expect(result[0].isFavorited).toBe(true);
      expect(result[0].buildPreferences.comments).toBe('Rush CRIT stats');
    });

    it('saveBuildPrefs deletes old prefs and updates build_comments', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.saveBuildPrefs('db-uuid-1', {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [],
        comments: 'My build notes',
      });

      expect(mockFrom).toHaveBeenCalledWith('hsr_build_preference_main_stats');
      expect(mockFrom).toHaveBeenCalledWith('hsr_build_preference_sub_stats');
      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
      expect(builder.update).toHaveBeenCalledWith({ build_comments: 'My build notes' });
    });

    it('saveBuildPrefs inserts main stat prefs when present', async () => {
      const mainBuilder = createBuilder({ data: null, error: null });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_build_preference_main_stats') return mainBuilder;
        return otherBuilder;
      });

      await service.saveBuildPrefs('db-uuid-1', {
        mainStats: {
          body: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
          feet: [],
          sphere: [],
          rope: [],
        },
        subStats: [],
      });

      expect(mainBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          tracked_character_id: 'db-uuid-1',
          slot: 'body',
          stat: 'CRIT Rate',
          operator_to_next: null,
          order_index: 0,
        }),
      ]);
    });

    it('saveBuildPrefs inserts sub stat prefs when present', async () => {
      const subBuilder = createBuilder({ data: null, error: null });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_build_preference_sub_stats') return subBuilder;
        return otherBuilder;
      });

      await service.saveBuildPrefs('db-uuid-1', {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [{ stat: 'CRIT DMG', operator: '>', orderIndex: 0 }],
      });

      expect(subBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          tracked_character_id: 'db-uuid-1',
          stat: 'CRIT DMG',
          operator_to_next: '>',
          order_index: 0,
        }),
      ]);
    });

    it('saveBuildPrefs skips main stat insert when all slots are empty', async () => {
      const mainBuilder = createBuilder({ data: null, error: null });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_build_preference_main_stats') return mainBuilder;
        return otherBuilder;
      });

      await service.saveBuildPrefs('db-uuid-1', {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [],
      });

      expect(mainBuilder.insert).not.toHaveBeenCalled();
    });

    it('saveBuildPrefs skips sub stat insert when subStats is empty', async () => {
      const subBuilder = createBuilder({ data: null, error: null });
      const otherBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'hsr_build_preference_sub_stats') return subBuilder;
        return otherBuilder;
      });

      await service.saveBuildPrefs('db-uuid-1', {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [],
      });

      expect(subBuilder.insert).not.toHaveBeenCalled();
    });
  });
});
