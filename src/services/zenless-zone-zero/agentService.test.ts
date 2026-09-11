import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge, profile upsert) is covered by rosterPersistence.test.ts.
describe('agentService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/zenless-zone-zero/agentService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());
    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom, rpc: mockRpc },
    }));

    service = await import('@/services/zenless-zone-zero/agentService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadAgentsFromDB transforms DB rows into ZzzTrackedAgent objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 60,
      mindscape: 6,
      core_skill: 5,
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadAgentsFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('zzz_tracked_agents');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1011');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].level).toBe(60);
    expect(result[0].mindscape).toBe(6);
    expect(result[0].coreSkill).toBe(5);
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].name).toBe('Anby');
    expect(result[0].specialty).toBe('Stun');
    expect(result[0].element).toBe('Elec');
    // No joined rows in this fixture — discs empty, prefs default.
    expect(result[0].discs).toEqual({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    expect(result[0].buildPreferences).toEqual({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      discSuit4Id: null,
      discSuit2Id: null,
      comments: '',
    });
    // W-Engine columns absent — defaults.
    expect(result[0].wEngineId).toBeNull();
    expect(result[0].wEngineLevel).toBe(0);
    expect(result[0].wEnginePhase).toBe(1);
    expect(result[0].wEnginePreferences).toEqual([]);
    // Skill progress column absent — not started.
    expect(result[0].skillProgress).toBe(0);
  });

  it('loadAgentsFromDB maps the skill progress column', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 60,
      mindscape: 0,
      core_skill: 0,
      skill_progress: 1,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadAgentsFromDB('user-1');

    expect(result[0].skillProgress).toBe(1);
  });

  it('loadAgentsFromDB maps W-Engine columns', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 60,
      mindscape: 0,
      core_skill: 0,
      is_favorited: false,
      wengine_id: '14110',
      wengine_level: 60,
      wengine_phase: 5,
      wengine_preferences: ['14110', '13005'],
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));
    const result = await service.loadAgentsFromDB('user-1');
    expect(result[0].wEngineId).toBe('14110');
    expect(result[0].wEngineLevel).toBe(60);
    expect(result[0].wEnginePhase).toBe(5);
    expect(result[0].wEnginePreferences).toEqual(['14110', '13005']);
  });

  it('loadAgentsFromDB pivots equipped discs and preference categories', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 60,
      mindscape: 0,
      core_skill: 0,
      is_favorited: false,
      disc_suit_4_id: '31000',
      disc_suit_2_id: '31600',
      disc_comments: 'crit build',
      zzz_equipped_discs: [
        {
          id: 'disc-1',
          slot: 4,
          suit_id: '31000',
          main_stat: 'CRIT Rate',
          zzz_disc_substats: [{ stat_type: 'ATK%' }, { stat_type: 'CRIT DMG' }],
        },
        { id: 'disc-2', slot: 1, suit_id: '31600', main_stat: 'HP', zzz_disc_substats: [] },
      ],
      zzz_disc_preferences: [
        {
          id: 'p2',
          category: 'slot4_main',
          stat: 'CRIT DMG',
          operator_to_next: null,
          order_index: 1,
        },
        {
          id: 'p1',
          category: 'slot4_main',
          stat: 'CRIT Rate',
          operator_to_next: 'OR',
          order_index: 0,
        },
        { id: 'p3', category: 'sub_stats', stat: 'ATK%', operator_to_next: null, order_index: 0 },
      ],
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadAgentsFromDB('user-1');
    const agent = result[0];

    expect(agent.discs[4]).toEqual({
      suitId: '31000',
      mainStat: 'CRIT Rate',
      subStats: ['ATK%', 'CRIT DMG'],
    });
    expect(agent.discs[1]).toEqual({ suitId: '31600', mainStat: 'HP', subStats: [] });
    expect(agent.discs[2]).toBeNull();
    // Chain reconstructs in order_index order regardless of row order.
    expect(agent.buildPreferences.mainStats[4]).toEqual([
      { stat: 'CRIT Rate', operator: 'OR', orderIndex: 0 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
    ]);
    expect(agent.buildPreferences.mainStats[5]).toEqual([]);
    expect(agent.buildPreferences.subStats).toEqual([
      { stat: 'ATK%', operator: null, orderIndex: 0 },
    ]);
    expect(agent.buildPreferences.discSuit4Id).toBe('31000');
    expect(agent.buildPreferences.discSuit2Id).toBe('31600');
    expect(agent.buildPreferences.comments).toBe('crit build');
  });

  it('loadAgentsFromDB defaults mindscape and coreSkill to 0 when columns are null', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      agent_id: '1011',
      level: 1,
      mindscape: null,
      core_skill: null,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));
    const result = await service.loadAgentsFromDB('user-1');
    expect(result[0].mindscape).toBe(0);
    expect(result[0].coreSkill).toBe(0);
  });

  it('insertAgent inserts the entity FK column and configured defaults', async () => {
    const agentBuilder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    const profileBuilder = createBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === 'zzz_tracked_agents' ? agentBuilder : profileBuilder,
    );

    const result = await service.insertAgent('user-1', '1011');

    expect(agentBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      agent_id: '1011',
      level: 1,
      mindscape: 0,
      core_skill: 0,
      skill_progress: 0,
      wengine_id: null,
      wengine_level: 0,
      wengine_phase: 1,
    });
    expect(result).toBe('new-db-id');
  });

  it('updateAgent maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateAgent('db-uuid-1', {
      level: 50,
      mindscape: 2,
      coreSkill: 4,
      skillProgress: 2,
      isFavorited: true,
      wEngineId: '14110',
      wEngineLevel: 45,
      wEnginePhase: 3,
      wEnginePreferences: ['14110'],
    });

    expect(mockFrom).toHaveBeenCalledWith('zzz_tracked_agents');
    expect(builder.update).toHaveBeenCalledWith({
      level: 50,
      mindscape: 2,
      core_skill: 4,
      skill_progress: 2,
      is_favorited: true,
      wengine_id: '14110',
      wengine_level: 45,
      wengine_phase: 3,
      wengine_preferences: ['14110'],
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });

  it('upsertDisc upserts the disc row and replaces its substats in one upsert_equipment_slot RPC', async () => {
    await service.upsertDisc('db-uuid-1', 4, {
      suitId: '31000',
      mainStat: 'CRIT Rate',
      subStats: ['ATK%', 'PEN'],
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('upsert_equipment_slot', {
      p_table: 'zzz_equipped_discs',
      p_row: {
        tracked_agent_id: 'db-uuid-1',
        slot: 4,
        suit_id: '31000',
        main_stat: 'CRIT Rate',
      },
      p_conflict_columns: ['tracked_agent_id', 'slot'],
      p_substat_table: 'zzz_disc_substats',
      p_substat_fk: 'disc_id',
      p_substats: [{ stat_type: 'ATK%' }, { stat_type: 'PEN' }],
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('upsertDisc rethrows when the RPC fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: new Error('upsert down') });

    await expect(
      service.upsertDisc('db-uuid-1', 4, { suitId: '31000', mainStat: null, subStats: [] }),
    ).rejects.toThrow('upsert down');
    spy.mockRestore();
  });

  it('upsertDisc sends an empty substat list when the list is empty', async () => {
    await service.upsertDisc('db-uuid-1', 1, { suitId: '31600', mainStat: 'HP', subStats: [] });

    expect(mockRpc.mock.calls[0][1].p_substats).toEqual([]);
  });

  it('deleteDisc deletes by agent row id and slot', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.deleteDisc('db-uuid-1', 5);

    expect(mockFrom).toHaveBeenCalledWith('zzz_equipped_discs');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.match).toHaveBeenCalledWith({ tracked_agent_id: 'db-uuid-1', slot: 5 });
  });

  it('saveDiscPreferences replaces category rows and updates parent columns in one RPC', async () => {
    await service.saveDiscPreferences('db-uuid-1', {
      mainStats: {
        4: [
          { stat: 'CRIT Rate', operator: 'OR', orderIndex: 5 },
          { stat: 'CRIT DMG', operator: null, orderIndex: 9 },
        ],
        5: [],
        6: [{ stat: 'Impact', operator: null, orderIndex: 0 }],
      },
      subStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
      discSuit4Id: '31000',
      discSuit2Id: '31600',
      comments: 'stun build',
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
      p_parent_id: 'db-uuid-1',
      p_delete_from: [{ table: 'zzz_disc_preferences', fk_column: 'tracked_agent_id' }],
      p_parent_update: {
        table: 'zzz_tracked_agents',
        row: {
          disc_suit_4_id: '31000',
          disc_suit_2_id: '31600',
          disc_comments: 'stun build',
        },
      },
      // order_index re-derived from array position, not the stale orderIndex values.
      p_inserts: [
        {
          table: 'zzz_disc_preferences',
          rows: [
            {
              tracked_agent_id: 'db-uuid-1',
              category: 'slot4_main',
              stat: 'CRIT Rate',
              operator_to_next: 'OR',
              order_index: 0,
            },
            {
              tracked_agent_id: 'db-uuid-1',
              category: 'slot4_main',
              stat: 'CRIT DMG',
              operator_to_next: null,
              order_index: 1,
            },
            {
              tracked_agent_id: 'db-uuid-1',
              category: 'slot6_main',
              stat: 'Impact',
              operator_to_next: null,
              order_index: 0,
            },
            {
              tracked_agent_id: 'db-uuid-1',
              category: 'sub_stats',
              stat: 'ATK%',
              operator_to_next: null,
              order_index: 0,
            },
          ],
        },
      ],
    });
  });

  it('saveDiscPreferences with empty chains still clears rows and saves parent columns', async () => {
    await service.saveDiscPreferences('db-uuid-1', {
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      discSuit4Id: null,
      discSuit2Id: null,
      comments: '',
    });

    expect(mockRpc).toHaveBeenCalledWith('replace_preference_rows', {
      p_parent_id: 'db-uuid-1',
      p_delete_from: [{ table: 'zzz_disc_preferences', fk_column: 'tracked_agent_id' }],
      p_parent_update: {
        table: 'zzz_tracked_agents',
        row: { disc_suit_4_id: null, disc_suit_2_id: null, disc_comments: '' },
      },
      p_inserts: [],
    });
  });
});
