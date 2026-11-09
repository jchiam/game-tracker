import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';
import { ALL_CZN_COMBATANTS } from '@/data/chaos-zero-nightmare/combatants';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('combatantService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/chaos-zero-nightmare/combatantService');

  const first = ALL_CZN_COMBATANTS[0];

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/chaos-zero-nightmare/combatantService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadCombatantsFromDB transforms DB rows into CznTrackedCombatant objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      combatant_id: first.id,
      level: 62,
      ego: 6,
      potential_attained: true,
      partner_id: 'akad',
      partner_level: 60,
      partner_ego: 4,
      partner_preferences: ['akad', 'zeta'],
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadCombatantsFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('czn_tracked_combatants');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(first.id);
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(62);
    expect(result[0].ego).toBe(6);
    expect(result[0].potentialAttained).toBe(true);
    expect(result[0].partnerId).toBe('akad');
    expect(result[0].partnerLevel).toBe(60);
    expect(result[0].partnerEgo).toBe(4);
    expect(result[0].partnerPreferences).toEqual(['akad', 'zeta']);
    expect(result[0].isFavorited).toBe(true);
    // Catalog fields merged from ALL_CZN_COMBATANTS.
    expect(result[0].name).toBe(first.name);
    expect(result[0].class).toBe(first.class);
    expect(result[0].element).toBe(first.element);
  });

  it('loadCombatantsFromDB defaults ego to 0 and booleans to false when columns are null', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      combatant_id: first.id,
      level: 1,
      ego: null,
      potential_attained: null,
      is_favorited: null,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadCombatantsFromDB('user-1');

    expect(result[0].ego).toBe(0);
    expect(result[0].potentialAttained).toBe(false);
    expect(result[0].isFavorited).toBe(false);
  });

  it('loadCombatantsFromDB defaults the Partner fields for a row saved before Phase 2', async () => {
    const legacyRow = {
      id: 'db-uuid-1',
      combatant_id: first.id,
      level: 10,
      ego: 1,
      potential_attained: false,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [legacyRow], error: null }));

    const result = await service.loadCombatantsFromDB('user-1');

    expect(result[0].partnerId).toBeNull();
    expect(result[0].partnerLevel).toBe(1);
    expect(result[0].partnerEgo).toBe(0);
    expect(result[0].partnerPreferences).toEqual([]);
  });

  it('insertCombatant inserts the entity FK column and configured defaults', async () => {
    const combatantBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'czn_tracked_combatants' ? combatantBuilder : profileBuilder,
    );

    const result = await service.insertCombatant('user-1', first.id);

    expect(combatantBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      combatant_id: first.id,
      level: 1,
      ego: 0,
      potential_attained: false,
      partner_level: 1,
      partner_ego: 0,
    });
    expect(result).toBe('new-db-id');
  });

  it('updateCombatant maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateCombatant('db-uuid-1', {
      level: 50,
      ego: 2,
      potentialAttained: true,
      partnerId: 'akad',
      partnerLevel: 30,
      partnerEgo: 2,
      partnerPreferences: ['akad'],
      isFavorited: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('czn_tracked_combatants');
    expect(builder.update).toHaveBeenCalledWith({
      level: 50,
      ego: 2,
      potential_attained: true,
      partner_id: 'akad',
      partner_level: 30,
      partner_ego: 2,
      partner_preferences: ['akad'],
      is_favorited: true,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });

  it('deleteCombatant targets czn_tracked_combatants by row id', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.deleteCombatant('db-uuid-1');

    expect(mockFrom).toHaveBeenCalledWith('czn_tracked_combatants');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });
});
