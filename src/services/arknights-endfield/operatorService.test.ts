import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('operatorService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/arknights-endfield/operatorService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/arknights-endfield/operatorService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadOperatorsFromDB transforms DB rows into AeTrackedOperator objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      operator_id: 'ember',
      level: 45,
      phase: 3,
      skills_maxed: true,
      weapon_name: 'Exemplar',
      weapon_level: 60,
      weapon_preferences: ['exemplar', 'standard-issue'],
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadOperatorsFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('ae_tracked_operators');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ember');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(45);
    expect(result[0].phase).toBe(3);
    expect(result[0].skillsMaxed).toBe(true);
    expect(result[0].weaponName).toBe('Exemplar');
    expect(result[0].weaponLevel).toBe(60);
    expect(result[0].weaponPreferences).toEqual(['exemplar', 'standard-issue']);
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].name).toBe('Ember');
    expect(result[0].class).toBe('Defender');
  });

  it('loadOperatorsFromDB defaults weaponPreferences to [] when column is null', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      operator_id: 'ember',
      level: 1,
      phase: 0,
      weapon_preferences: null,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));
    const result = await service.loadOperatorsFromDB('user-1');
    expect(result[0].weaponPreferences).toEqual([]);
  });

  it('insertOperator inserts the entity FK column and configured defaults', async () => {
    const opBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'ae_tracked_operators' ? opBuilder : profileBuilder,
    );

    const result = await service.insertOperator('user-1', 'ember');

    expect(opBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      operator_id: 'ember',
      level: 1,
      phase: 0,
      skills_maxed: false,
      weapon_level: 1,
    });
    expect(result).toBe('new-db-id');
  });

  it('updateOperator maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateOperator('db-uuid-1', {
      level: 40,
      phase: 3,
      skillsMaxed: true,
      weaponName: 'Exemplar',
      weaponLevel: 60,
      weaponPreferences: ['exemplar', 'standard-issue'],
      isFavorited: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('ae_tracked_operators');
    expect(builder.update).toHaveBeenCalledWith({
      level: 40,
      phase: 3,
      skills_maxed: true,
      weapon_name: 'Exemplar',
      weapon_level: 60,
      weapon_preferences: ['exemplar', 'standard-issue'],
      is_favorited: true,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });
});
