import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/zenless-zone-zero/agentService', () => ({
  loadAgentsFromDB: vi.fn(),
  insertAgent: vi.fn(),
  deleteAgent: vi.fn(),
  updateAgent: vi.fn(),
  upsertDisc: vi.fn(),
  deleteDisc: vi.fn(),
  saveDiscPreferences: vi.fn(),
}));

vi.mock('@/hooks/usePendingSaves', () => ({
  usePendingSaves: (_delay?: number, _onFlushError?: unknown) => ({
    pendingSaveCount: 0,
    queueUpdate: vi.fn(
      (
        _key: string,
        updates: Record<string, any>,
        flushFn: (p: Record<string, any>) => Promise<void>,
      ) => flushFn(updates),
    ),
    queueAction: vi.fn((_key: string, action: () => Promise<void>) => action()),
  }),
}));

vi.mock('@/utils/toast', () => ({
  addToast: vi.fn(),
}));

import { useAgents } from '@/hooks/zenless-zone-zero/useAgents';
import { ALL_ZZZ_AGENTS } from '@/data/zenless-zone-zero/agents';
import * as agentService from '@/services/zenless-zone-zero/agentService';
import * as toastUtils from '@/utils/toast';

const mockLoadAgentsFromDB = vi.mocked(agentService.loadAgentsFromDB);
const mockInsertAgent = vi.mocked(agentService.insertAgent);
const mockDeleteAgent = vi.mocked(agentService.deleteAgent);
const mockUpdateAgent = vi.mocked(agentService.updateAgent);
const mockUpsertDisc = vi.mocked(agentService.upsertDisc);
const mockDeleteDisc = vi.mocked(agentService.deleteDisc);
const mockSaveDiscPreferences = vi.mocked(agentService.saveDiscPreferences);
const mockAddToast = vi.mocked(toastUtils.addToast);

const mockSession = createMockSession();
const firstAgent = ALL_ZZZ_AGENTS[0];

const emptyDiscs = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null } as const;
const emptyPrefs = { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] };

function trackedFixture(index: number, overrides: Record<string, unknown>) {
  return {
    ...ALL_ZZZ_AGENTS[index],
    isFavorited: false,
    level: 1,
    mindscape: 0,
    coreSkill: 0,
    skillBasicMaxed: false,
    skillDodgeMaxed: false,
    skillAssistMaxed: false,
    skillSpecialMaxed: false,
    skillChainMaxed: false,
    discs: { ...emptyDiscs },
    buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
    wEngineId: null,
    wEngineLevel: 0,
    wEnginePhase: 1,
    wEnginePreferences: [],
    ...overrides,
  };
}

describe('useAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAgentsFromDB.mockResolvedValue([]);
    mockInsertAgent.mockResolvedValue('new-db-id');
    mockDeleteAgent.mockResolvedValue(undefined);
    mockUpdateAgent.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useAgents(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithAgent() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addAgent(firstAgent);
    });
    return hook;
  }

  it('starts with empty tracked agents', async () => {
    const { result } = await setup();
    expect(result.current.trackedAgents).toEqual([]);
  });

  it('exposes all available agents', async () => {
    const { result } = await setup();
    expect(result.current.availableAgents.length).toBe(ALL_ZZZ_AGENTS.length);
  });

  it('adds an agent optimistically with tracked defaults', async () => {
    const { result } = await setupWithAgent();
    expect(result.current.trackedAgents).toHaveLength(1);
    expect(result.current.trackedAgents[0].id).toBe(firstAgent.id);
    expect(result.current.trackedAgents[0].level).toBe(1);
    expect(result.current.trackedAgents[0].mindscape).toBe(0);
    expect(result.current.trackedAgents[0].coreSkill).toBe(0);
    expect(result.current.trackedAgents[0].isFavorited).toBe(false);
  });

  it('removes an agent', async () => {
    const { result } = await setupWithAgent();
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
    await act(async () => {
      await result.current.removeAgent(firstAgent.id, fakeEvent);
    });
    expect(result.current.trackedAgents).toHaveLength(0);
  });

  it('updateLevel clamps to 1–60', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateLevel(firstAgent.id, 100));
    expect(result.current.trackedAgents[0].level).toBe(60);

    act(() => result.current.updateLevel(firstAgent.id, -5));
    expect(result.current.trackedAgents[0].level).toBe(1);
  });

  it('updateMindscape clamps to 0–6', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateMindscape(firstAgent.id, 10));
    expect(result.current.trackedAgents[0].mindscape).toBe(6);

    act(() => result.current.updateMindscape(firstAgent.id, -1));
    expect(result.current.trackedAgents[0].mindscape).toBe(0);
  });

  it('updateCoreSkill clamps to 0–6', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateCoreSkill(firstAgent.id, 10));
    expect(result.current.trackedAgents[0].coreSkill).toBe(6);

    act(() => result.current.updateCoreSkill(firstAgent.id, -1));
    expect(result.current.trackedAgents[0].coreSkill).toBe(0);
  });

  it('toggles one combat skill flag without disturbing the other four', async () => {
    const { result } = await setupWithAgent();

    act(() => result.current.toggleSkillSpecialMaxed(firstAgent.id, true));
    expect(result.current.trackedAgents[0].skillSpecialMaxed).toBe(true);
    expect(result.current.trackedAgents[0].skillBasicMaxed).toBe(false);
    expect(result.current.trackedAgents[0].skillDodgeMaxed).toBe(false);
    expect(result.current.trackedAgents[0].skillAssistMaxed).toBe(false);
    expect(result.current.trackedAgents[0].skillChainMaxed).toBe(false);

    act(() => result.current.toggleSkillChainMaxed(firstAgent.id, true));
    expect(result.current.trackedAgents[0].skillChainMaxed).toBe(true);
    expect(result.current.trackedAgents[0].skillSpecialMaxed).toBe(true);

    act(() => result.current.toggleSkillSpecialMaxed(firstAgent.id, false));
    expect(result.current.trackedAgents[0].skillSpecialMaxed).toBe(false);
    expect(result.current.trackedAgents[0].skillChainMaxed).toBe(true);
  });

  it('queues a DB write for a combat skill flag toggle', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.toggleSkillBasicMaxed(firstAgent.id, true));
    expect(mockUpdateAgent).toHaveBeenCalledWith('new-db-id', { skillBasicMaxed: true });
  });

  it('queues a DB write for field updates', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateMindscape(firstAgent.id, 3));
    expect(mockUpdateAgent).toHaveBeenCalledWith('new-db-id', { mindscape: 3 });
  });

  it('toggleFavorite updates isFavorited', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.toggleFavorite(firstAgent.id, true));
    expect(result.current.trackedAgents[0].isFavorited).toBe(true);
  });

  it('getFilteredRoster returns favorites first in level sort', async () => {
    mockLoadAgentsFromDB.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1', level: 50 }),
      trackedFixture(1, { dbId: 'db-2', isFavorited: true, level: 30 }),
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].isFavorited).toBe(true);
  });

  it('getFilteredRoster level sort orders non-favorited agents by level descending', async () => {
    mockLoadAgentsFromDB.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1', level: 20 }),
      trackedFixture(1, { dbId: 'db-2', level: 55 }),
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted.map((a) => a.level)).toEqual([55, 20]);
  });

  it('getFilteredRoster score sort orders by score descending, sentinel last', async () => {
    mockLoadAgentsFromDB.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1' }),
      trackedFixture(1, { dbId: 'db-2' }),
      trackedFixture(2, { dbId: 'db-3' }),
    ]);
    const { result } = await setup();
    const scores: Record<string, number> = {
      [ALL_ZZZ_AGENTS[0].id]: 42,
      [ALL_ZZZ_AGENTS[1].id]: -1,
      [ALL_ZZZ_AGENTS[2].id]: 88,
    };
    const sorted = result.current.getFilteredRoster('', 'SCORE', (a) => scores[a.id]);
    expect(sorted.map((a) => scores[a.id])).toEqual([88, 42, -1]);
  });

  it('saveDiscData updates the slot optimistically and queues the upsert', async () => {
    const { result } = await setupWithAgent();
    const disc = { suitId: '31000', mainStat: 'CRIT Rate', subStats: ['ATK%'] };
    await act(async () => {
      await result.current.saveDiscData({ agentId: firstAgent.id, slot: 4 }, disc);
    });
    expect(result.current.trackedAgents[0].discs[4]).toEqual(disc);
    expect(result.current.trackedAgents[0].discs[1]).toBeNull();
    expect(mockUpsertDisc).toHaveBeenCalledWith('new-db-id', 4, disc);
  });

  it('removeDiscData writes null into the slot and queues the delete', async () => {
    const { result } = await setupWithAgent();
    const disc = { suitId: '31000', mainStat: 'CRIT Rate', subStats: [] };
    await act(async () => {
      await result.current.saveDiscData({ agentId: firstAgent.id, slot: 4 }, disc);
    });
    await act(async () => {
      await result.current.removeDiscData({ agentId: firstAgent.id, slot: 4 });
    });
    // Null, not an empty-disc sentinel — in-session state matches a reload.
    expect(result.current.trackedAgents[0].discs[4]).toBeNull();
    expect(mockDeleteDisc).toHaveBeenCalledWith('new-db-id', 4);
  });

  it('saveDiscPreferences replaces the whole preferences object and queues the save', async () => {
    const { result } = await setupWithAgent();
    const prefs = {
      mainStats: {
        4: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
        5: [],
        6: [],
      },
      subStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
      discSuit4Id: '31000',
      discSuit2Id: null,
      comments: 'notes',
    };
    act(() => result.current.saveDiscPreferences(firstAgent.id, prefs));
    expect(result.current.trackedAgents[0].buildPreferences).toEqual(prefs);
    expect(mockSaveDiscPreferences).toHaveBeenCalledWith('new-db-id', prefs);
  });

  it('adds an agent with empty discs and default preferences', async () => {
    const { result } = await setupWithAgent();
    expect(result.current.trackedAgents[0].discs).toEqual(emptyDiscs);
    expect(result.current.trackedAgents[0].buildPreferences).toEqual(emptyPrefs);
  });

  it('adds an agent with W-Engine defaults', async () => {
    const { result } = await setupWithAgent();
    expect(result.current.trackedAgents[0].wEngineId).toBeNull();
    expect(result.current.trackedAgents[0].wEngineLevel).toBe(0);
    expect(result.current.trackedAgents[0].wEnginePhase).toBe(1);
    expect(result.current.trackedAgents[0].wEnginePreferences).toEqual([]);
  });

  it('updateWEngine sets the engine id and queues the patch', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateWEngine(firstAgent.id, '14110'));
    expect(result.current.trackedAgents[0].wEngineId).toBe('14110');
    expect(mockUpdateAgent).toHaveBeenCalledWith('new-db-id', { wEngineId: '14110' });
  });

  it('updateWEngineLevel clamps to 0–60', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateWEngineLevel(firstAgent.id, 100));
    expect(result.current.trackedAgents[0].wEngineLevel).toBe(60);

    act(() => result.current.updateWEngineLevel(firstAgent.id, -5));
    expect(result.current.trackedAgents[0].wEngineLevel).toBe(0);
  });

  it('updateWEnginePhase clamps to 1–5', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateWEnginePhase(firstAgent.id, 9));
    expect(result.current.trackedAgents[0].wEnginePhase).toBe(5);

    act(() => result.current.updateWEnginePhase(firstAgent.id, 0));
    expect(result.current.trackedAgents[0].wEnginePhase).toBe(1);
  });

  it('updateWEnginePreferences writes the whole ranked array atomically', async () => {
    const { result } = await setupWithAgent();
    act(() => result.current.updateWEnginePreferences(firstAgent.id, ['14110', '13005']));
    expect(result.current.trackedAgents[0].wEnginePreferences).toEqual(['14110', '13005']);
    expect(mockUpdateAgent).toHaveBeenCalledWith('new-db-id', {
      wEnginePreferences: ['14110', '13005'],
    });
  });

  it('shows error toast when add fails', async () => {
    mockInsertAgent.mockRejectedValue(new Error('fail'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await setup();
    await act(async () => {
      await result.current.addAgent(firstAgent);
    });
    expect(result.current.trackedAgents).toHaveLength(0);
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Failed'), 'error');
    spy.mockRestore();
  });

  it('sets error on DB load failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadAgentsFromDB.mockRejectedValue(new Error('DB down'));
    const { result } = renderHook(() => useAgents(mockSession, false));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });

  it('returns empty when no session', async () => {
    const { result } = await setup(null);
    expect(result.current.trackedAgents).toEqual([]);
  });
});
