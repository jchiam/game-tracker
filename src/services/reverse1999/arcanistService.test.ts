import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('arcanistService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/reverse1999/arcanistService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/reverse1999/arcanistService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadArcanistsFromDB transforms DB rows into R1999TrackedArcanist objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      arcanist_id: '37', // must match ALL_ARCANISTS
      level: 40,
      portrait_level: 2,
      resonance_level: 7,
      euphoria_stage: 1,
      psychube_name: 'Hopscotch',
      psychube_level: 50,
      psychube_amplification: 3,
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadArcanistsFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('r1999_tracked_arcanists');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('37');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(40);
    expect(result[0].portraitLevel).toBe(2);
    expect(result[0].resonanceLevel).toBe(7);
    expect(result[0].euphoriaStage).toBe(1);
    expect(result[0].psychubeName).toBe('Hopscotch');
    expect(result[0].psychubeLevel).toBe(50);
    expect(result[0].psychubeAmplification).toBe(3);
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].name).toBe('37');
  });

  it('loadArcanistsFromDB null-coalesces optional columns', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      arcanist_id: '37',
      level: 1,
      portrait_level: null,
      resonance_level: null,
      euphoria_stage: null,
      psychube_name: null,
      psychube_level: null,
      psychube_amplification: null,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadArcanistsFromDB('user-1');

    expect(result[0].portraitLevel).toBe(0);
    expect(result[0].resonanceLevel).toBe(0);
    expect(result[0].euphoriaStage).toBe(0);
    expect(result[0].psychubeName).toBeNull();
    expect(result[0].psychubeLevel).toBe(1);
    expect(result[0].psychubeAmplification).toBe(1);
  });

  it('insertArcanist inserts the entity FK column and configured defaults', async () => {
    const arcanistBuilder = createBuilder({ data: { id: 'new-arcanist-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'r1999_tracked_arcanists' ? arcanistBuilder : profileBuilder,
    );

    const result = await service.insertArcanist('user-1', '37');

    expect(arcanistBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      arcanist_id: '37',
      level: 1,
      portrait_level: 0,
      resonance_level: 0,
      euphoria_stage: 0,
      psychube_name: null,
      psychube_level: 1,
      psychube_amplification: 1,
    });
    expect(result).toBe('new-arcanist-db-id');
  });

  it('updateArcanist maps a camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateArcanist('db-uuid-1', {
      level: 40,
      euphoriaStage: 2,
      portraitLevel: 3,
      psychubeName: 'Hopscotch',
      isFavorited: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('r1999_tracked_arcanists');
    expect(builder.update).toHaveBeenCalledWith({
      level: 40,
      euphoria_stage: 2,
      portrait_level: 3,
      psychube_name: 'Hopscotch',
      is_favorited: true,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });
});
