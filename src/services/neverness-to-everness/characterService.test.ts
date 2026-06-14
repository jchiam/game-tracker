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
      expect(result[0].cartridgeRarity).toBe('S');
      expect(result[0].cartridgeSubStats).toEqual(['ATK%', 'CRIT DMG', 'HP%', 'DEF%']);
      expect(result[0].isFavorited).toBe(true);
      expect(result[0].name).toBe('Baicang');
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
  });
});
