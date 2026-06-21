import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/arknights-endfield/operatorService', () => ({
  loadOperatorsFromDB: vi.fn(),
  insertOperator: vi.fn(),
  deleteOperator: vi.fn(),
  updateOperator: vi.fn(),
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

import { useOperators } from '@/hooks/arknights-endfield/useOperators';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';
import * as operatorService from '@/services/arknights-endfield/operatorService';
import * as toastUtils from '@/utils/toast';

const mockLoadOperatorsFromDB = vi.mocked(operatorService.loadOperatorsFromDB);
const mockInsertOperator = vi.mocked(operatorService.insertOperator);
const mockDeleteOperator = vi.mocked(operatorService.deleteOperator);
const mockUpdateOperator = vi.mocked(operatorService.updateOperator);
const mockAddToast = vi.mocked(toastUtils.addToast);

const mockSession = createMockSession();
const firstOp = ALL_OPERATORS[0];

describe('useOperators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadOperatorsFromDB.mockResolvedValue([]);
    mockInsertOperator.mockResolvedValue('new-db-id');
    mockDeleteOperator.mockResolvedValue(undefined);
    mockUpdateOperator.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useOperators(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithOp() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addOperator(firstOp);
    });
    return hook;
  }

  it('starts with empty tracked operators', async () => {
    const { result } = await setup();
    expect(result.current.trackedOperators).toEqual([]);
  });

  it('exposes all available operators', async () => {
    const { result } = await setup();
    expect(result.current.availableOperators.length).toBe(ALL_OPERATORS.length);
  });

  it('adds an operator optimistically', async () => {
    const { result } = await setupWithOp();
    expect(result.current.trackedOperators).toHaveLength(1);
    expect(result.current.trackedOperators[0].id).toBe(firstOp.id);
    expect(result.current.trackedOperators[0].level).toBe(1);
    expect(result.current.trackedOperators[0].potential).toBe(0);
  });

  it('removes an operator', async () => {
    const { result } = await setupWithOp();
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
    await act(async () => {
      await result.current.removeOperator(firstOp.id, fakeEvent);
    });
    expect(result.current.trackedOperators).toHaveLength(0);
  });

  it('updateLevel clamps to 1–90', async () => {
    const { result } = await setupWithOp();
    act(() => result.current.updateLevel(firstOp.id, 100));
    expect(result.current.trackedOperators[0].level).toBe(90);

    act(() => result.current.updateLevel(firstOp.id, -5));
    expect(result.current.trackedOperators[0].level).toBe(1);
  });

  it('updatePotential clamps to 0–5', async () => {
    const { result } = await setupWithOp();
    act(() => result.current.updatePotential(firstOp.id, 10));
    expect(result.current.trackedOperators[0].potential).toBe(5);

    act(() => result.current.updatePotential(firstOp.id, -1));
    expect(result.current.trackedOperators[0].potential).toBe(0);
  });

  it('toggleFavorite updates isFavorited', async () => {
    const { result } = await setupWithOp();
    act(() => result.current.toggleFavorite(firstOp.id, true));
    expect(result.current.trackedOperators[0].isFavorited).toBe(true);
  });

  it('getFilteredRoster returns sorted results', async () => {
    mockLoadOperatorsFromDB.mockResolvedValue([
      { ...ALL_OPERATORS[0], dbId: 'db-1', isFavorited: false, level: 50, potential: 2 },
      { ...ALL_OPERATORS[1], dbId: 'db-2', isFavorited: true, level: 30, potential: 1 },
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].isFavorited).toBe(true);
  });

  it('shows error toast when add fails', async () => {
    mockInsertOperator.mockRejectedValue(new Error('fail'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await setup();
    await act(async () => {
      await result.current.addOperator(firstOp);
    });
    expect(result.current.trackedOperators).toHaveLength(0);
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Failed'), 'error');
    spy.mockRestore();
  });

  it('sets error on DB load failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadOperatorsFromDB.mockRejectedValue(new Error('DB down'));
    const { result } = renderHook(() => useOperators(mockSession, false));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });

  it('returns empty when no session', async () => {
    const { result } = await setup(null);
    expect(result.current.trackedOperators).toEqual([]);
  });
});
