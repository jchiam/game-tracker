import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/persona-5-phantom-x/thiefService', () => ({
  loadThievesFromDB: vi.fn(),
  insertThief: vi.fn(),
  deleteThief: vi.fn(),
  updateThief: vi.fn(),
  upsertRevelationCard: vi.fn(),
  deleteRevelationCard: vi.fn(),
  saveRevelationPreferences: vi.fn(),
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

vi.mock('@/utils/revelationScoring', () => ({
  calculateRevelationScore: vi.fn().mockReturnValue(-1),
}));

import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { ALL_THIEVES } from '@/data/persona-5-phantom-x/thieves';
import * as thiefService from '@/services/persona-5-phantom-x/thiefService';
import * as revelationScoring from '@/utils/revelationScoring';
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
    expect(result.current.trackedThieves[0].skillProgress).toBe(0);
    expect(result.current.trackedThieves[0].mindscapeProgress).toBe(0);
    expect(result.current.trackedThieves[0].weaponRarity).toBe(2); // lowest-tier weapon from day one
    expect(result.current.trackedThieves[0].weaponLevel).toBe(1);
    expect(result.current.trackedThieves[0].weaponForge).toBe(0);
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

  it('updateMindscapeProgress sets each milestone', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateMindscapeProgress(firstThief.id, 1));
    expect(result.current.trackedThieves[0].mindscapeProgress).toBe(1);
    expect(mockUpdateThief).toHaveBeenCalledWith('new-db-id', { mindscapeProgress: 1 });

    act(() => result.current.updateMindscapeProgress(firstThief.id, 2));
    expect(result.current.trackedThieves[0].mindscapeProgress).toBe(2);

    act(() => result.current.updateMindscapeProgress(firstThief.id, 0));
    expect(result.current.trackedThieves[0].mindscapeProgress).toBe(0);
  });

  it('updateMindscapeProgress clamps out-of-range values', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateMindscapeProgress(firstThief.id, 5));
    expect(result.current.trackedThieves[0].mindscapeProgress).toBe(2);

    act(() => result.current.updateMindscapeProgress(firstThief.id, -1));
    expect(result.current.trackedThieves[0].mindscapeProgress).toBe(0);
  });

  it('updateWeaponRarity sets rarity', async () => {
    const { result } = await setupWithThief();
    expect(result.current.trackedThieves[0].weaponRarity).toBe(2); // default 2★ on add
    act(() => result.current.updateWeaponRarity(firstThief.id, 5));
    expect(result.current.trackedThieves[0].weaponRarity).toBe(5);
    expect(mockUpdateThief).toHaveBeenCalledWith('new-db-id', { weaponRarity: 5 });

    act(() => result.current.updateWeaponRarity(firstThief.id, 3));
    expect(result.current.trackedThieves[0].weaponRarity).toBe(3);
  });

  it('updateWeaponLevel clamps to 1–80', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateWeaponLevel(firstThief.id, 100));
    expect(result.current.trackedThieves[0].weaponLevel).toBe(80);

    act(() => result.current.updateWeaponLevel(firstThief.id, -5));
    expect(result.current.trackedThieves[0].weaponLevel).toBe(1);
  });

  it('updateWeaponForge clamps to 0–6', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateWeaponForge(firstThief.id, 10));
    expect(result.current.trackedThieves[0].weaponForge).toBe(6);

    act(() => result.current.updateWeaponForge(firstThief.id, -1));
    expect(result.current.trackedThieves[0].weaponForge).toBe(0);
  });

  it('updateSkillProgress sets each milestone', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateSkillProgress(firstThief.id, 1));
    expect(result.current.trackedThieves[0].skillProgress).toBe(1);
    expect(mockUpdateThief).toHaveBeenCalledWith('new-db-id', { skillProgress: 1 });

    act(() => result.current.updateSkillProgress(firstThief.id, 2));
    expect(result.current.trackedThieves[0].skillProgress).toBe(2);

    act(() => result.current.updateSkillProgress(firstThief.id, 0));
    expect(result.current.trackedThieves[0].skillProgress).toBe(0);
  });

  it('updateSkillProgress clamps out-of-range values', async () => {
    const { result } = await setupWithThief();
    act(() => result.current.updateSkillProgress(firstThief.id, 5));
    expect(result.current.trackedThieves[0].skillProgress).toBe(2);

    act(() => result.current.updateSkillProgress(firstThief.id, -1));
    expect(result.current.trackedThieves[0].skillProgress).toBe(0);
  });

  it('getFilteredRoster returns favorited-first sorted results', async () => {
    mockLoadThievesFromDB.mockResolvedValue([
      {
        ...ALL_THIEVES[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 50,
        awareness: 2,
        skillProgress: 0,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
      {
        ...ALL_THIEVES[1],
        dbId: 'db-2',
        isFavorited: true,
        level: 30,
        awareness: 1,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
    ]);
    const { result } = await setup();
    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].isFavorited).toBe(true);
  });

  it('getFilteredRoster SCORE sort orders by revelation score descending', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.addThief(ALL_THIEVES[0]);
    });
    await act(async () => {
      await result.current.addThief(ALL_THIEVES[1]);
    });

    vi.mocked(revelationScoring.calculateRevelationScore).mockImplementation((t) =>
      t.id === ALL_THIEVES[1].id ? 90 : 10,
    );

    const sorted = result.current.getFilteredRoster('', 'SCORE');
    expect(sorted[0].id).toBe(ALL_THIEVES[1].id);
  });

  it('getFilteredRoster SCORE sort places insufficient-data (-1) last among non-favorites', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.addThief(ALL_THIEVES[0]);
    });
    await act(async () => {
      await result.current.addThief(ALL_THIEVES[1]);
    });

    // ALL_THIEVES[0] has no match data (-1); ALL_THIEVES[1] scores 40.
    vi.mocked(revelationScoring.calculateRevelationScore).mockImplementation((t) =>
      t.id === ALL_THIEVES[0].id ? -1 : 40,
    );

    const sorted = result.current.getFilteredRoster('', 'SCORE');
    expect(sorted[0].id).toBe(ALL_THIEVES[1].id);
    expect(sorted[sorted.length - 1].id).toBe(ALL_THIEVES[0].id);
  });

  it('getFilteredRoster with predicate returns only matching entities', async () => {
    mockLoadThievesFromDB.mockResolvedValue([
      {
        ...ALL_THIEVES[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 50,
        awareness: 2,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
      {
        ...ALL_THIEVES[1],
        dbId: 'db-2',
        isFavorited: false,
        level: 30,
        awareness: 1,
        skillProgress: 0,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
    ]);
    const { result } = await setup();
    const filtered = result.current.getFilteredRoster('', 'ALPHA', (t) => t.skillProgress === 1);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(ALL_THIEVES[0].id);
  });

  it('getFilteredRoster predicate composes with LEVEL sort', async () => {
    mockLoadThievesFromDB.mockResolvedValue([
      {
        ...ALL_THIEVES[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 30,
        awareness: 2,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
      {
        ...ALL_THIEVES[1],
        dbId: 'db-2',
        isFavorited: false,
        level: 70,
        awareness: 1,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
      {
        ...ALL_THIEVES[2],
        dbId: 'db-3',
        isFavorited: false,
        level: 80,
        awareness: 3,
        skillProgress: 0,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
    ]);
    const { result } = await setup();
    const filtered = result.current.getFilteredRoster('', 'LEVEL', (t) => t.skillProgress === 1);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].level).toBe(70);
    expect(filtered[1].level).toBe(30);
  });

  it('getFilteredRoster predicate composes with search', async () => {
    mockLoadThievesFromDB.mockResolvedValue([
      {
        ...ALL_THIEVES[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 50,
        awareness: 2,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
      {
        ...ALL_THIEVES[1],
        dbId: 'db-2',
        isFavorited: false,
        level: 30,
        awareness: 1,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
    ]);
    const { result } = await setup();
    const filtered = result.current.getFilteredRoster(
      ALL_THIEVES[0].name,
      'ALPHA',
      (t) => t.skillProgress === 1,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(ALL_THIEVES[0].id);
  });

  it('getFilteredRoster without predicate returns all', async () => {
    mockLoadThievesFromDB.mockResolvedValue([
      {
        ...ALL_THIEVES[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 50,
        awareness: 2,
        skillProgress: 1,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
      {
        ...ALL_THIEVES[1],
        dbId: 'db-2',
        isFavorited: false,
        level: 30,
        awareness: 1,
        skillProgress: 0,
        mindscapeProgress: 0,
        weaponRarity: 2,
        weaponLevel: 1,
        weaponForge: 0,
        revelations: { sun: null, moon: null, star: null, sky: null, space: null },
        revelationPreferences: {
          heavensSetId: null,
          spaceSetId: null,
          mainStats: { moon: [], star: [], sky: [] },
          subStats: [],
          comments: '',
        },
      },
    ]);
    const { result } = await setup();
    const all = result.current.getFilteredRoster('', 'ALPHA');
    expect(all).toHaveLength(2);
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

  // --- Revelation updaters ---

  it('updateRevelationSlot optimistically updates a slot and calls upsert', async () => {
    const tracked = {
      ...firstThief,
      dbId: 'db-1',
      isFavorited: false,
      level: 1,
      awareness: 0,
      skillProgress: 0,
      mindscapeProgress: 0,
      weaponRarity: 2,
      weaponLevel: 1,
      weaponForge: 0,
      revelations: { sun: null, moon: null, star: null, sky: null, space: null },
      revelationPreferences: {
        heavensSetId: null,
        spaceSetId: null,
        mainStats: { moon: [], star: [], sky: [] },
        subStats: [],
        comments: '',
      },
    };
    mockLoadThievesFromDB.mockResolvedValue([tracked]);
    const mockUpsert = vi.mocked(thiefService.upsertRevelationCard);
    mockUpsert.mockResolvedValue(undefined);

    const { result } = await setup();

    const cardData = { setId: 'strife', mainStat: 'ATK%', subStats: [] };
    await act(async () => {
      result.current.updateRevelationSlot(firstThief.id, 'moon', cardData);
    });

    expect(result.current.trackedThieves[0].revelations.moon).toEqual(cardData);
    expect(mockUpsert).toHaveBeenCalledWith('db-1', 'moon', cardData);
  });

  it('updateRevelationSlot with null calls delete', async () => {
    const tracked = {
      ...firstThief,
      dbId: 'db-1',
      isFavorited: false,
      level: 1,
      awareness: 0,
      skillProgress: 0,
      mindscapeProgress: 0,
      weaponRarity: 2,
      weaponLevel: 1,
      weaponForge: 0,
      revelations: {
        sun: null,
        moon: { setId: 'strife', mainStat: 'ATK%', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
      revelationPreferences: {
        heavensSetId: null,
        spaceSetId: null,
        mainStats: { moon: [], star: [], sky: [] },
        subStats: [],
        comments: '',
      },
    };
    mockLoadThievesFromDB.mockResolvedValue([tracked]);
    const mockDelete = vi.mocked(thiefService.deleteRevelationCard);
    mockDelete.mockResolvedValue(undefined);

    const { result } = await setup();

    await act(async () => {
      result.current.updateRevelationSlot(firstThief.id, 'moon', null);
    });

    expect(result.current.trackedThieves[0].revelations.moon).toBeNull();
    expect(mockDelete).toHaveBeenCalledWith('db-1', 'moon');
  });

  it('updateRevelationPreferences optimistically updates and calls save', async () => {
    const tracked = {
      ...firstThief,
      dbId: 'db-1',
      isFavorited: false,
      level: 1,
      awareness: 0,
      skillProgress: 0,
      mindscapeProgress: 0,
      weaponRarity: 2,
      weaponLevel: 1,
      weaponForge: 0,
      revelations: { sun: null, moon: null, star: null, sky: null, space: null },
      revelationPreferences: {
        heavensSetId: null,
        spaceSetId: null,
        mainStats: { moon: [], star: [], sky: [] },
        subStats: [],
        comments: '',
      },
    };
    mockLoadThievesFromDB.mockResolvedValue([tracked]);
    const mockSave = vi.mocked(thiefService.saveRevelationPreferences);
    mockSave.mockResolvedValue(undefined);

    const { result } = await setup();

    const newPrefs = {
      heavensSetId: 'strife',
      spaceSetId: 'meditation',
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [{ stat: 'Crit Rate%', operator: null, orderIndex: 0 }],
      comments: 'Focus crit',
    };

    await act(async () => {
      result.current.updateRevelationPreferences(firstThief.id, newPrefs);
    });

    expect(result.current.trackedThieves[0].revelationPreferences).toEqual(newPrefs);
    expect(mockSave).toHaveBeenCalledWith('db-1', newPrefs);
  });
});
