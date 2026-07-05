import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/persona-5-phantom-x/thiefService', () => ({
  loadThievesFromDB: vi.fn(),
  insertThief: vi.fn(),
  deleteThief: vi.fn(),
  updateThief: vi.fn(),
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

import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { ALL_THIEVES } from '@/data/persona-5-phantom-x/thieves';
import * as thiefService from '@/services/persona-5-phantom-x/thiefService';
import * as toastUtils from '@/utils/toast';

const mockLoadThievesFromDB = vi.mocked(thiefService.loadThievesFromDB);
const mockInsertThief = vi.mocked(thiefService.insertThief);
const mockDeleteThief = vi.mocked(thiefService.deleteThief);
const mockUpdateThief = vi.mocked(thiefService.updateThief);
const mockAddToast = vi.mocked(toastUtils.addToast);

const mockSession = createMockSession();
const firstThief = ALL_THIEVES[0];

describe('useThieves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadThievesFromDB.mockResolvedValue([]);
    mockInsertThief.mockResolvedValue('new-db-id');
    mockDeleteThief.mockResolvedValue(undefined);
    mockUpdateThief.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useThieves(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithThief() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addThief(firstThief);
    });
    return hook;
  }

  it('starts with empty tracked thieves', async () => {
    const { result } = await setup();
    expect(result.current.trackedThieves).toEqual([]);
  });

  it('exposes all available thieves', async () => {
    const { result } = await setup();
    expect(result.current.availableThieves.length).toBe(ALL_THIEVES.length);
  });

  it('adds a thief optimistically with defaults', async () => {
    const { result } = await setupWithThief();
    expect(result.current.trackedThieves).toHaveLength(1);
    expect(result.current.trackedThieves[0].id).toBe(firstThief.id);
    expect(result.current.trackedThieves[0].level).toBe(1);
    expect(result.current.trackedThieves[0].awareness).toBe(0);
    expect(result.current.trackedThieves[0].isFavorited).toBe(false);
  });

  it('removes a thief', async () => {
    const { result } = await setupWithThief();
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
    await act(async () => {
      await result.current.removeThief(firstThief.id, fakeEvent);
    });
    expect(result.current.trackedThieves).toHaveLength(0);
  });

  it('updateLevel clamps to 1–80', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateLevel(firstThief.id, 100));
    expect(result.current.trackedThieves[0].level).toBe(80);

    act(() => result.current.updateLevel(firstThief.id, -5));
    expect(result.current.trackedThieves[0].level).toBe(1);
  });

  it('updateAwareness clamps to 0–6', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateAwareness(firstThief.id, 10));
    expect(result.current.trackedThieves[0].awareness).toBe(6);

    act(() => result.current.updateAwareness(firstThief.id, -1));
    expect(result.current.trackedThieves[0].awareness).toBe(0);
  });

  it('updateLevel queues a DB write for the tracked row', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateLevel(firstThief.id, 42));
    expect(mockUpdateThief).toHaveBeenCalledWith('new-db-id', { level: 42 });
  });

  it('toggleFavorite updates isFavorited', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.toggleFavorite(firstThief.id, true));
    expect(result.current.trackedThieves[0].isFavorited).toBe(true);
  });

  it('getFilteredRoster returns favorited-first sorted results', async () => {
    mockLoadThievesFromDB.mockResolvedValue([
      { ...ALL_THIEVES[0], dbId: 'db-1', isFavorited: false, level: 50, awareness: 2 },
      { ...ALL_THIEVES[1], dbId: 'db-2', isFavorited: true, level: 30, awareness: 1 },
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].isFavorited).toBe(true);
  });

  it('shows error toast when add fails', async () => {
    mockInsertThief.mockRejectedValue(new Error('fail'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await setup();
    await act(async () => {
      await result.current.addThief(firstThief);
    });
    expect(result.current.trackedThieves).toHaveLength(0);
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Failed'), 'error');
    spy.mockRestore();
  });

  it('sets error on DB load failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadThievesFromDB.mockRejectedValue(new Error('DB down'));
    const { result } = renderHook(() => useThieves(mockSession, false));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });

  it('returns empty when no session', async () => {
    const { result } = await setup(null);
    expect(result.current.trackedThieves).toEqual([]);
  });
});
