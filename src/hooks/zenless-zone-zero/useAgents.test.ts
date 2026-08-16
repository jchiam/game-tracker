import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/zenless-zone-zero/agentService', () => ({
  loadAgentsFromDB: vi.fn(),
  insertAgent: vi.fn(),
  deleteAgent: vi.fn(),
  updateAgent: vi.fn(),
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
const mockAddToast = vi.mocked(toastUtils.addToast);

const mockSession = createMockSession();
const firstAgent = ALL_ZZZ_AGENTS[0];

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
      {
        ...ALL_ZZZ_AGENTS[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 50,
        mindscape: 0,
        coreSkill: 0,
      },
      {
        ...ALL_ZZZ_AGENTS[1],
        dbId: 'db-2',
        isFavorited: true,
        level: 30,
        mindscape: 0,
        coreSkill: 0,
      },
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].isFavorited).toBe(true);
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
