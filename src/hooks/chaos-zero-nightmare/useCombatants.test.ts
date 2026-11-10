import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/chaos-zero-nightmare/combatantService', () => ({
  loadCombatantsFromDB: vi.fn(),
  insertCombatant: vi.fn(),
  deleteCombatant: vi.fn(),
  updateCombatant: vi.fn(),
  upsertFragment: vi.fn(),
  deleteFragment: vi.fn(),
  saveFragmentPreferences: vi.fn(),
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

import {
  useCombatants,
  CZN_MAX_LEVEL,
  CZN_PARTNER_MAX_EGO,
  CZN_PARTNER_MAX_LEVEL,
} from '@/hooks/chaos-zero-nightmare/useCombatants';
import { ALL_CZN_COMBATANTS } from '@/data/chaos-zero-nightmare/combatants';
import * as combatantService from '@/services/chaos-zero-nightmare/combatantService';
import * as toastUtils from '@/utils/toast';

const mockLoad = vi.mocked(combatantService.loadCombatantsFromDB);
const mockInsert = vi.mocked(combatantService.insertCombatant);
const mockDelete = vi.mocked(combatantService.deleteCombatant);
const mockUpdate = vi.mocked(combatantService.updateCombatant);
const mockUpsertFragment = vi.mocked(combatantService.upsertFragment);
const mockDeleteFragment = vi.mocked(combatantService.deleteFragment);
const mockSaveFragmentPreferences = vi.mocked(combatantService.saveFragmentPreferences);
const mockAddToast = vi.mocked(toastUtils.addToast);

const mockSession = createMockSession();
const first = ALL_CZN_COMBATANTS[0];

const emptyFragments = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null } as const;
const emptyPrefs = { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] };

function trackedFixture(index: number, overrides: Record<string, unknown>) {
  return {
    ...ALL_CZN_COMBATANTS[index],
    isFavorited: false,
    level: 1,
    ego: 0,
    potentialAttained: false,
    partnerId: null,
    partnerLevel: 1,
    partnerEgo: 0,
    partnerPreferences: [],
    fragments: { ...emptyFragments },
    fragmentPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
    ...overrides,
  };
}

describe('useCombatants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue([]);
    mockInsert.mockResolvedValue('new-db-id');
    mockDelete.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useCombatants(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithCombatant() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addCombatant(first);
    });
    return hook;
  }

  it('starts with empty tracked combatants', async () => {
    const { result } = await setup();
    expect(result.current.trackedCombatants).toEqual([]);
  });

  it('exposes all available combatants', async () => {
    const { result } = await setup();
    expect(result.current.availableCombatants.length).toBe(ALL_CZN_COMBATANTS.length);
  });

  it('adds a combatant optimistically with tracked defaults', async () => {
    const { result } = await setupWithCombatant();
    expect(result.current.trackedCombatants).toHaveLength(1);
    const tracked = result.current.trackedCombatants[0];
    expect(tracked.id).toBe(first.id);
    expect(tracked.level).toBe(1);
    expect(tracked.ego).toBe(0);
    expect(tracked.potentialAttained).toBe(false);
    expect(tracked.partnerId).toBeNull();
    expect(tracked.partnerLevel).toBe(1);
    expect(tracked.partnerEgo).toBe(0);
    expect(tracked.partnerPreferences).toEqual([]);
    expect(tracked.fragments).toEqual(emptyFragments);
    expect(tracked.fragmentPreferences).toEqual(emptyPrefs);
    expect(tracked.isFavorited).toBe(false);
    expect(mockInsert).toHaveBeenCalledWith(mockSession.user.id, first.id);
  });

  it('saveFragmentData updates the slot optimistically and queues the upsert', async () => {
    const { result } = await setupWithCombatant();
    const piece = { setId: 'spark-of-passion', mainStat: 'Critical Chance%', subStats: ['ATK%'] };
    await act(async () => {
      await result.current.saveFragmentData({ combatantId: first.id, slot: 4 }, piece);
    });
    expect(result.current.trackedCombatants[0].fragments[4]).toEqual(piece);
    expect(result.current.trackedCombatants[0].fragments[1]).toBeNull();
    expect(mockUpsertFragment).toHaveBeenCalledWith('new-db-id', 4, piece);
  });

  it('removeFragmentData writes null into the slot and queues the delete', async () => {
    const { result } = await setupWithCombatant();
    const piece = { setId: 'spark-of-passion', mainStat: 'Critical Chance%', subStats: [] };
    await act(async () => {
      await result.current.saveFragmentData({ combatantId: first.id, slot: 4 }, piece);
    });
    await act(async () => {
      await result.current.removeFragmentData({ combatantId: first.id, slot: 4 });
    });
    // Null, not an empty-piece sentinel — in-session state matches a reload.
    expect(result.current.trackedCombatants[0].fragments[4]).toBeNull();
    expect(mockDeleteFragment).toHaveBeenCalledWith('new-db-id', 4);
  });

  it('saveFragmentPreferences replaces the whole preferences object and queues the save', async () => {
    const { result } = await setupWithCombatant();
    const prefs = {
      mainStats: {
        4: [{ stat: 'Critical Chance%', operator: null, orderIndex: 0 }],
        5: [],
        6: [],
      },
      subStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
      set4Id: 'spark-of-passion',
      set2Id: null,
      comments: 'notes',
    };
    act(() => result.current.saveFragmentPreferences(first.id, prefs));
    expect(result.current.trackedCombatants[0].fragmentPreferences).toEqual(prefs);
    expect(mockSaveFragmentPreferences).toHaveBeenCalledWith('new-db-id', prefs);
  });

  it('fragment writes are no-ops against the DB for a combatant without a dbId', async () => {
    mockLoad.mockResolvedValue([trackedFixture(0, {})]); // no dbId
    const { result } = await setup();
    const piece = { setId: 'black-wing', mainStat: 'Flat ATK', subStats: [] };
    await act(async () => {
      await result.current.saveFragmentData({ combatantId: first.id, slot: 1 }, piece);
    });
    act(() => result.current.saveFragmentPreferences(first.id, emptyPrefs));
    expect(result.current.trackedCombatants[0].fragments[1]).toEqual(piece);
    expect(mockUpsertFragment).not.toHaveBeenCalled();
    expect(mockSaveFragmentPreferences).not.toHaveBeenCalled();
  });

  it('getFilteredRoster score sort orders by the supplied scorer descending', async () => {
    mockLoad.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1' }),
      trackedFixture(1, { dbId: 'db-2' }),
    ]);
    const { result } = await setup();
    const scoreFor = (c: { id: string }) => (c.id === ALL_CZN_COMBATANTS[1].id ? 90 : -1);
    const sorted = result.current.getFilteredRoster('', 'SCORE', scoreFor);
    expect(sorted.map((c) => c.id)).toEqual([ALL_CZN_COMBATANTS[1].id, ALL_CZN_COMBATANTS[0].id]);
  });

  it('removes a combatant', async () => {
    const { result } = await setupWithCombatant();
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
    await act(async () => {
      await result.current.removeCombatant(first.id, fakeEvent);
    });
    expect(result.current.trackedCombatants).toHaveLength(0);
    expect(mockDelete).toHaveBeenCalledWith('new-db-id');
  });

  it('updateLevel clamps to 1–62', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.updateLevel(first.id, 100));
    expect(result.current.trackedCombatants[0].level).toBe(CZN_MAX_LEVEL);
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', { level: 62 });

    act(() => result.current.updateLevel(first.id, -5));
    expect(result.current.trackedCombatants[0].level).toBe(1);
  });

  it('updateEgo clamps to 0–6 and queues the patch', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.updateEgo(first.id, 10));
    expect(result.current.trackedCombatants[0].ego).toBe(6);

    act(() => result.current.updateEgo(first.id, -1));
    expect(result.current.trackedCombatants[0].ego).toBe(0);

    act(() => result.current.updateEgo(first.id, 3));
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', { ego: 3 });
  });

  it('togglePotential writes the boolean and queues the patch', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.togglePotential(first.id, true));
    expect(result.current.trackedCombatants[0].potentialAttained).toBe(true);
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', { potentialAttained: true });

    act(() => result.current.togglePotential(first.id, false));
    expect(result.current.trackedCombatants[0].potentialAttained).toBe(false);
  });

  it('updatePartner equips by id and queues a single patch', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.updatePartner(first.id, { partnerId: 'zeta' }));
    expect(result.current.trackedCombatants[0].partnerId).toBe('zeta');
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', { partnerId: 'zeta' });
  });

  it('updatePartner unequips with null and keeps level and Ego', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.updatePartner(first.id, { partnerId: 'zeta', partnerLevel: 40 }));
    act(() => result.current.updatePartner(first.id, { partnerEgo: 3 }));
    act(() => result.current.updatePartner(first.id, { partnerId: null }));
    const tracked = result.current.trackedCombatants[0];
    expect(tracked.partnerId).toBeNull();
    expect(tracked.partnerLevel).toBe(40);
    expect(tracked.partnerEgo).toBe(3);
  });

  it('updatePartner clamps level to 1–60 and Ego to 0–4', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.updatePartner(first.id, { partnerLevel: 99, partnerEgo: 9 }));
    expect(result.current.trackedCombatants[0].partnerLevel).toBe(CZN_PARTNER_MAX_LEVEL);
    expect(result.current.trackedCombatants[0].partnerEgo).toBe(CZN_PARTNER_MAX_EGO);
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', { partnerLevel: 60, partnerEgo: 4 });

    act(() => result.current.updatePartner(first.id, { partnerLevel: 0, partnerEgo: -2 }));
    expect(result.current.trackedCombatants[0].partnerLevel).toBe(1);
    expect(result.current.trackedCombatants[0].partnerEgo).toBe(0);
  });

  it('updatePartnerPreferences dedupes while preserving first-occurrence order', async () => {
    const { result } = await setupWithCombatant();
    act(() =>
      result.current.updatePartnerPreferences(first.id, ['zeta', 'akad', 'zeta', 'janet', 'akad']),
    );
    expect(result.current.trackedCombatants[0].partnerPreferences).toEqual([
      'zeta',
      'akad',
      'janet',
    ]);
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', {
      partnerPreferences: ['zeta', 'akad', 'janet'],
    });
  });

  it('updatePartnerPreferences reorders the ranking', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.updatePartnerPreferences(first.id, ['zeta', 'akad']));
    act(() => result.current.updatePartnerPreferences(first.id, ['akad', 'zeta']));
    expect(result.current.trackedCombatants[0].partnerPreferences).toEqual(['akad', 'zeta']);
  });

  it('toggleFavorite updates isFavorited', async () => {
    const { result } = await setupWithCombatant();
    act(() => result.current.toggleFavorite(first.id, true));
    expect(result.current.trackedCombatants[0].isFavorited).toBe(true);
    expect(mockUpdate).toHaveBeenLastCalledWith('new-db-id', { isFavorited: true });
  });

  it('getFilteredRoster returns favorites first in level sort', async () => {
    mockLoad.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1', level: 50 }),
      trackedFixture(1, { dbId: 'db-2', isFavorited: true, level: 30 }),
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].isFavorited).toBe(true);
  });

  it('getFilteredRoster level sort orders non-favorited combatants by level descending', async () => {
    mockLoad.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1', level: 20 }),
      trackedFixture(1, { dbId: 'db-2', level: 55 }),
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted.map((c) => c.level)).toEqual([55, 20]);
  });

  it('getFilteredRoster searches by class and element', async () => {
    mockLoad.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1' }),
      trackedFixture(1, { dbId: 'db-2' }),
    ]);
    const { result } = await setup();
    const byClass = result.current.getFilteredRoster(ALL_CZN_COMBATANTS[0].class, 'ALPHA');
    expect(byClass.some((c) => c.class === ALL_CZN_COMBATANTS[0].class)).toBe(true);
    const byElement = result.current.getFilteredRoster(ALL_CZN_COMBATANTS[1].element, 'ALPHA');
    expect(byElement.some((c) => c.element === ALL_CZN_COMBATANTS[1].element)).toBe(true);
  });

  it('getFilteredRoster applies the optional predicate after search and sort', async () => {
    mockLoad.mockResolvedValue([
      trackedFixture(0, { dbId: 'db-1', potentialAttained: true }),
      trackedFixture(1, { dbId: 'db-2', potentialAttained: false }),
    ]);
    const { result } = await setup();
    const attained = result.current.getFilteredRoster(
      '',
      'ALPHA',
      undefined,
      (c) => c.potentialAttained,
    );
    expect(attained.map((c) => c.potentialAttained)).toEqual([true]);
  });

  it('shows error toast when add fails', async () => {
    mockInsert.mockRejectedValue(new Error('fail'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await setup();
    await act(async () => {
      await result.current.addCombatant(first);
    });
    expect(result.current.trackedCombatants).toHaveLength(0);
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Failed'), 'error');
    spy.mockRestore();
  });

  it('sets error on DB load failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoad.mockRejectedValue(new Error('DB down'));
    const { result } = renderHook(() => useCombatants(mockSession, false));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });

  it('returns empty when no session', async () => {
    const { result } = await setup(null);
    expect(result.current.trackedCombatants).toEqual([]);
  });
});
