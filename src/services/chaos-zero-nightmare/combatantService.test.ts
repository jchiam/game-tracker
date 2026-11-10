import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';
import { ALL_CZN_COMBATANTS } from '@/data/chaos-zero-nightmare/combatants';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('combatantService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/chaos-zero-nightmare/combatantService');

  const first = ALL_CZN_COMBATANTS[0];

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());
    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom, rpc: mockRpc },
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

  it('loadCombatantsFromDB selects the fragment child tables through the extras seam', async () => {
    const builder = createBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    await service.loadCombatantsFromDB('user-1');

    const selected = String(builder.select.mock.calls[0][0]);
    expect(selected).toContain(
      'czn_equipped_fragments ( id, slot, set_id, main_stat, czn_fragment_substats ( stat_type ) )',
    );
    expect(selected).toContain(
      'czn_fragment_preferences ( id, category, stat, operator_to_next, order_index )',
    );
  });

  it('loadCombatantsFromDB pivots equipped fragments and preference categories', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      combatant_id: first.id,
      level: 60,
      ego: 0,
      potential_attained: false,
      is_favorited: false,
      fragment_set_4_id: 'spark-of-passion',
      fragment_set_2_id: 'black-wing',
      fragment_comments: 'crit build',
      czn_equipped_fragments: [
        {
          id: 'frag-1',
          slot: 4,
          set_id: 'spark-of-passion',
          main_stat: 'Critical Chance%',
          czn_fragment_substats: [{ stat_type: 'ATK%' }, { stat_type: 'Critical Damage%' }],
        },
        {
          id: 'frag-2',
          slot: 1,
          set_id: 'black-wing',
          main_stat: 'Flat ATK',
          czn_fragment_substats: [],
        },
      ],
      czn_fragment_preferences: [
        {
          id: 'p2',
          category: 'slot4_main',
          stat: 'Critical Damage%',
          operator_to_next: null,
          order_index: 1,
        },
        {
          id: 'p1',
          category: 'slot4_main',
          stat: 'Critical Chance%',
          operator_to_next: 'OR',
          order_index: 0,
        },
        { id: 'p3', category: 'sub_stats', stat: 'ATK%', operator_to_next: null, order_index: 0 },
      ],
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const [combatant] = await service.loadCombatantsFromDB('user-1');

    expect(combatant.fragments[4]).toEqual({
      setId: 'spark-of-passion',
      mainStat: 'Critical Chance%',
      subStats: ['ATK%', 'Critical Damage%'],
    });
    expect(combatant.fragments[1]).toEqual({
      setId: 'black-wing',
      mainStat: 'Flat ATK',
      subStats: [],
    });
    expect(combatant.fragments[2]).toBeNull();
    // Chain reconstructs in order_index order regardless of row order.
    expect(combatant.fragmentPreferences.mainStats[4]).toEqual([
      { stat: 'Critical Chance%', operator: 'OR', orderIndex: 0 },
      { stat: 'Critical Damage%', operator: null, orderIndex: 1 },
    ]);
    expect(combatant.fragmentPreferences.mainStats[5]).toEqual([]);
    expect(combatant.fragmentPreferences.subStats).toEqual([
      { stat: 'ATK%', operator: null, orderIndex: 0 },
    ]);
    expect(combatant.fragmentPreferences.set4Id).toBe('spark-of-passion');
    expect(combatant.fragmentPreferences.set2Id).toBe('black-wing');
    expect(combatant.fragmentPreferences.comments).toBe('crit build');
  });

  it('loadCombatantsFromDB defaults fragments and preferences when no child rows exist', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      combatant_id: first.id,
      level: 1,
      ego: 0,
      potential_attained: false,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const [combatant] = await service.loadCombatantsFromDB('user-1');

    expect(combatant.fragments).toEqual({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    expect(combatant.fragmentPreferences).toEqual({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      set4Id: null,
      set2Id: null,
      comments: '',
    });
  });

  it('upsertFragment upserts the piece row and replaces its substats in one upsert_equipment_slot RPC', async () => {
    await service.upsertFragment('db-uuid-1', 4, {
      setId: 'spark-of-passion',
      mainStat: 'Critical Chance%',
      subStats: ['ATK%', 'Flat HP'],
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('upsert_equipment_slot', {
      p_table: 'czn_equipped_fragments',
      p_row: {
        tracked_combatant_id: 'db-uuid-1',
        slot: 4,
        set_id: 'spark-of-passion',
        main_stat: 'Critical Chance%',
      },
      p_conflict_columns: ['tracked_combatant_id', 'slot'],
      p_substat_table: 'czn_fragment_substats',
      p_substat_fk: 'fragment_id',
      p_substats: [{ stat_type: 'ATK%' }, { stat_type: 'Flat HP' }],
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('upsertFragment rethrows when the RPC fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: new Error('upsert down') });

    await expect(
      service.upsertFragment('db-uuid-1', 4, { setId: 'black-wing', mainStat: null, subStats: [] }),
    ).rejects.toThrow('upsert down');
    spy.mockRestore();
  });

  it('deleteFragment deletes by combatant row id and slot', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.deleteFragment('db-uuid-1', 5);

    expect(mockFrom).toHaveBeenCalledWith('czn_equipped_fragments');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.match).toHaveBeenCalledWith({ tracked_combatant_id: 'db-uuid-1', slot: 5 });
  });

  it('saveFragmentPreferences replaces category rows and updates parent columns in one RPC', async () => {
    await service.saveFragmentPreferences('db-uuid-1', {
      mainStats: {
        4: [
          { stat: 'Critical Chance%', operator: 'OR', orderIndex: 5 },
          { stat: 'Critical Damage%', operator: null, orderIndex: 9 },
        ],
        5: [],
        6: [{ stat: 'Ego Recovery', operator: null, orderIndex: 0 }],
      },
      subStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
      set4Id: 'spark-of-passion',
      set2Id: 'black-wing',
      comments: 'crit build',
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
      p_parent_id: 'db-uuid-1',
      p_delete_from: [{ table: 'czn_fragment_preferences', fk_column: 'tracked_combatant_id' }],
      p_parent_update: {
        table: 'czn_tracked_combatants',
        row: {
          fragment_set_4_id: 'spark-of-passion',
          fragment_set_2_id: 'black-wing',
          fragment_comments: 'crit build',
        },
      },
      p_inserts: [
        {
          table: 'czn_fragment_preferences',
          rows: [
            // order_index is re-derived from array position, not the stale stored value.
            {
              tracked_combatant_id: 'db-uuid-1',
              category: 'slot4_main',
              stat: 'Critical Chance%',
              operator_to_next: 'OR',
              order_index: 0,
            },
            {
              tracked_combatant_id: 'db-uuid-1',
              category: 'slot4_main',
              stat: 'Critical Damage%',
              operator_to_next: null,
              order_index: 1,
            },
            {
              tracked_combatant_id: 'db-uuid-1',
              category: 'slot6_main',
              stat: 'Ego Recovery',
              operator_to_next: null,
              order_index: 0,
            },
            {
              tracked_combatant_id: 'db-uuid-1',
              category: 'sub_stats',
              stat: 'ATK%',
              operator_to_next: null,
              order_index: 0,
            },
          ],
        },
      ],
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('saveFragmentPreferences with empty chains still clears rows and saves parent columns', async () => {
    await service.saveFragmentPreferences('db-uuid-1', {
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      set4Id: null,
      set2Id: null,
    });

    expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
      p_parent_id: 'db-uuid-1',
      p_delete_from: [{ table: 'czn_fragment_preferences', fk_column: 'tracked_combatant_id' }],
      p_parent_update: {
        table: 'czn_tracked_combatants',
        row: { fragment_set_4_id: null, fragment_set_2_id: null, fragment_comments: '' },
      },
      p_inserts: [],
    });
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
