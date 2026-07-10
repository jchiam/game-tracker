import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring + game-specific write tests only — generic CRUD behaviour and
// savePreferenceRows failure/DB-disabled paths are covered by rosterPersistence.test.ts.
// upsertRelic/deleteRelic own their DB_ENABLED gate, so they keep DB-disabled tests here.
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

      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acheron');
      expect(result[0].dbId).toBe('db-uuid-1');
      expect(result[0].level).toBe(60);
      expect(result[0].tracesAttained).toBe(true);
      expect(result[0].isFavorited).toBe(false);
      expect(result[0].name).toBe('Acheron');
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
            hsr_relic_substats: [{ stat_type: 'CRIT Rate' }],
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
        subStats: ['CRIT Rate'],
      });
    });

    it('loadCharactersFromDB maps build preferences and comments correctly', async () => {
      const dbRow = {
        id: 'db-uuid-1',
        character_id: 'acheron',
        level: 60,
        traces_attained: false,
        is_favorited: false,
        build_comments: 'Rush CRIT stats',
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
      expect(result[0].buildPreferences.comments).toBe('Rush CRIT stats');
    });

    it('insertCharacter inserts the entity FK column and configured defaults', async () => {
      const charBuilder = createBuilder({ data: { id: 'new-char-db-id' }, error: null });
      const profileBuilder = createBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) =>
        table === 'hsr_tracked_characters' ? charBuilder : profileBuilder,
      );

      const result = await service.insertCharacter('user-1', 'acheron');

      expect(charBuilder.insert).toHaveBeenCalledWith({
        profile_id: 'user-1',
        character_id: 'acheron',
        level: 1,
        traces_attained: false,
      });
      expect(result).toBe('new-char-db-id');
    });

    it('updateCharacter maps a camelCase patch to snake_case columns', async () => {
      const builder = createBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await service.updateCharacter('db-uuid-1', {
        level: 80,
        tracesAttained: true,
        isFavorited: true,
      });

      expect(mockFrom).toHaveBeenCalledWith('hsr_tracked_characters');
      expect(builder.update).toHaveBeenCalledWith({
        level: 80,
        traces_attained: true,
        is_favorited: true,
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
    });

    describe('upsertRelic', () => {
      it('upserts relic and manages substats', async () => {
        const relicBuilder = createBuilder({ data: { id: 'relic-db-id' }, error: null });
        const substatBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) =>
          table === 'hsr_equipped_relics' ? relicBuilder : substatBuilder,
        );

        await service.upsertRelic('db-uuid-1', 'head', {
          setId: '101',
          mainStat: 'HP',
          subStats: ['CRIT Rate'],
        });

        expect(mockFrom).toHaveBeenCalledWith('hsr_equipped_relics');
        expect(mockFrom).toHaveBeenCalledWith('hsr_relic_substats');
      });

      it('deletes existing substats before inserting new ones', async () => {
        const relicBuilder = createBuilder({ data: { id: 'relic-db-id' }, error: null });
        const substatBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) =>
          table === 'hsr_equipped_relics' ? relicBuilder : substatBuilder,
        );

        await service.upsertRelic('db-uuid-1', 'head', {
          setId: '101',
          mainStat: 'HP',
          subStats: ['CRIT Rate'],
        });

        expect(substatBuilder.delete).toHaveBeenCalled();
        expect(substatBuilder.eq).toHaveBeenCalledWith('relic_id', 'relic-db-id');
        expect(substatBuilder.insert).toHaveBeenCalledWith([
          { relic_id: 'relic-db-id', stat_type: 'CRIT Rate' },
        ]);
      });

      it('skips substat insert when subStats is empty', async () => {
        const relicBuilder = createBuilder({ data: { id: 'relic-db-id' }, error: null });
        const substatBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) =>
          table === 'hsr_equipped_relics' ? relicBuilder : substatBuilder,
        );

        await service.upsertRelic('db-uuid-1', 'head', {
          setId: '101',
          mainStat: 'HP',
          subStats: [],
        });

        expect(substatBuilder.delete).toHaveBeenCalled();
        expect(substatBuilder.insert).not.toHaveBeenCalled();
      });

      it('throws and skips substats when relic upsert fails', async () => {
        const relicBuilder = createBuilder({ data: null, error: { message: 'Upsert failed' } });
        const substatBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) =>
          table === 'hsr_equipped_relics' ? relicBuilder : substatBuilder,
        );

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
          service.upsertRelic('db-uuid-1', 'head', { setId: '101', mainStat: 'HP', subStats: [] }),
        ).rejects.toEqual({ message: 'Upsert failed' });
        expect(substatBuilder.delete).not.toHaveBeenCalled();
        spy.mockRestore();
      });
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

    describe('saveBuildPrefs', () => {
      it('deletes old prefs and updates build_comments', async () => {
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

      it('inserts main stat prefs across slots when present', async () => {
        const mainBuilder = createBuilder({ data: null, error: null });
        const otherBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) =>
          table === 'hsr_build_preference_main_stats' ? mainBuilder : otherBuilder,
        );

        await service.saveBuildPrefs('db-uuid-1', {
          mainStats: {
            body: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
            feet: [],
            sphere: [],
            rope: [{ stat: 'Energy Regen', operator: null, orderIndex: 0 }],
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
          expect.objectContaining({
            tracked_character_id: 'db-uuid-1',
            slot: 'rope',
            stat: 'Energy Regen',
            operator_to_next: null,
            order_index: 0,
          }),
        ]);
      });

      it('inserts sub stat prefs when present', async () => {
        const subBuilder = createBuilder({ data: null, error: null });
        const otherBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) =>
          table === 'hsr_build_preference_sub_stats' ? subBuilder : otherBuilder,
        );

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

      it('skips inserts when all preference sets are empty', async () => {
        const mainBuilder = createBuilder({ data: null, error: null });
        const subBuilder = createBuilder({ data: null, error: null });
        const otherBuilder = createBuilder({ data: null, error: null });

        mockFrom.mockImplementation((table: string) => {
          if (table === 'hsr_build_preference_main_stats') return mainBuilder;
          if (table === 'hsr_build_preference_sub_stats') return subBuilder;
          return otherBuilder;
        });

        await service.saveBuildPrefs('db-uuid-1', {
          mainStats: { body: [], feet: [], sphere: [], rope: [] },
          subStats: [],
        });

        expect(mainBuilder.insert).not.toHaveBeenCalled();
        expect(subBuilder.insert).not.toHaveBeenCalled();
      });
    });
  });
});
