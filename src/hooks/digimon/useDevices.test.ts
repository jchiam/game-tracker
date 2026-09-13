import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/digimon/deviceService', () => ({
  loadDevicesFromDB: vi.fn(),
  insertDevice: vi.fn(),
  deleteDevice: vi.fn(),
  updateDevice: vi.fn(),
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

import { useDevices } from '@/hooks/digimon/useDevices';
import { ALL_DEVICES } from '@/data/digimon/devices';
import * as deviceService from '@/services/digimon/deviceService';

const mockLoad = vi.mocked(deviceService.loadDevicesFromDB);
const mockInsert = vi.mocked(deviceService.insertDevice);
const mockDelete = vi.mocked(deviceService.deleteDevice);
const mockUpdate = vi.mocked(deviceService.updateDevice);

const mockSession = createMockSession();
const firstDevice = ALL_DEVICES[0];

describe('useDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue([]);
    mockInsert.mockResolvedValue('new-db-id');
    mockDelete.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useDevices(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithDevice() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addDevice(firstDevice);
    });
    await waitFor(() => expect(hook.result.current.trackedDevices[0].dbId).toBe('new-db-id'));
    return hook;
  }

  it('exposes the full catalog as available devices', async () => {
    const { result } = await setup();
    expect(result.current.availableDevices.length).toBe(ALL_DEVICES.length);
  });

  it('adds a device optimistically with collection defaults', async () => {
    const { result } = await setup();
    await act(async () => {
      await result.current.addDevice(firstDevice);
    });
    const tracked = result.current.trackedDevices[0];
    expect(tracked.id).toBe(firstDevice.id);
    expect(tracked.status).toBe('owned');
    expect(tracked.condition).toBeNull();
    expect(tracked.acquiredOn).toBeNull();
    expect(tracked.notes).toBe('');
    expect(tracked.isFavorited).toBe(false);
    expect(mockInsert).toHaveBeenCalledWith(mockSession.user.id, firstDevice.id);
  });

  it.each([
    ['updateStatus', 'wishlist', { status: 'wishlist' }],
    ['updateCondition', 'boxed', { condition: 'boxed' }],
    ['updateCondition', null, { condition: null }],
    ['updateAcquiredOn', '2024-05-01', { acquiredOn: '2024-05-01' }],
    ['updateNotes', 'Gift', { notes: 'Gift' }],
    ['toggleFavorite', true, { isFavorited: true }],
  ] as const)('%s writes its field optimistically and to the DB', async (fn, value, patch) => {
    const { result } = await setupWithDevice();
    await act(async () => {
      (result.current[fn] as (id: string, v: unknown) => void)(firstDevice.id, value);
    });
    const key = Object.keys(patch)[0] as keyof typeof patch;
    expect(result.current.trackedDevices[0][key]).toBe(value);
    expect(mockUpdate).toHaveBeenCalledWith('new-db-id', patch);
  });

  it('sorts by release year ascending under YEAR, favorites first', async () => {
    const early = ALL_DEVICES.find((d) => d.releaseYear === 2010)!;
    const late = ALL_DEVICES.find((d) => d.releaseYear >= 2024)!;
    const mid = ALL_DEVICES.find((d) => d.releaseYear === 2017)!;
    mockLoad.mockResolvedValue([
      {
        ...late,
        isFavorited: false,
        status: 'owned',
        condition: null,
        acquiredOn: null,
        notes: '',
      },
      {
        ...early,
        isFavorited: false,
        status: 'owned',
        condition: null,
        acquiredOn: null,
        notes: '',
      },
      { ...mid, isFavorited: true, status: 'owned', condition: null, acquiredOn: null, notes: '' },
    ]);
    const { result } = await setup();
    const ids = result.current.getFilteredRoster('', 'YEAR').map((d) => d.id);
    expect(ids).toEqual([mid.id, early.id, late.id]);
  });

  it('sets isLoadError when the load fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoad.mockRejectedValue(new Error('DB down'));
    const { result } = renderHook(() => useDevices(mockSession, false));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });
});
