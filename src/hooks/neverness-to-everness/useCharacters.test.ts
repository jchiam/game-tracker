import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/neverness-to-everness/characterService', () => ({
  loadCharactersFromDB: vi.fn(),
  insertCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  updateCharacter: vi.fn(),
  saveCartridgePreferences: vi.fn(),
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

import { useCharacters } from '@/hooks/neverness-to-everness/useCharacters';
import { ALL_CHARACTERS } from '@/data/neverness-to-everness/characters';
import * as characterService from '@/services/neverness-to-everness/characterService';
import * as toastUtils from '@/utils/toast';

const mockLoadCharactersFromDB = vi.mocked(characterService.loadCharactersFromDB);
const mockInsertCharacter = vi.mocked(characterService.insertCharacter);
const mockDeleteCharacter = vi.mocked(characterService.deleteCharacter);
const mockAddToast = vi.mocked(toastUtils.addToast);

const mockSession = createMockSession();
const firstChar = ALL_CHARACTERS[0];
const secondChar = ALL_CHARACTERS[1];

describe('useCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadCharactersFromDB.mockResolvedValue([]);
    mockInsertCharacter.mockResolvedValue('new-db-id');
    mockDeleteCharacter.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useCharacters(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithChar() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addCharacter(firstChar);
    });
    return hook;
  }

  it('starts with empty tracked characters', async () => {
    const { result } = await setup();
    expect(result.current.trackedCharacters).toEqual([]);
  });

  it('exposes all available characters', async () => {
    const { result } = await setup();
    expect(result.current.availableCharacters.length).toBeGreaterThan(0);
    expect(result.current.availableCharacters[0]).toHaveProperty('id');
    expect(result.current.availableCharacters[0]).toHaveProperty('esperType');
  });

  it('returns empty roster when no session', async () => {
    const { result } = await setup(null);
    expect(result.current.trackedCharacters).toEqual([]);
  });

  it('addCharacter adds to local state', async () => {
    const { result } = await setupWithChar();
    expect(result.current.trackedCharacters).toHaveLength(1);
    expect(result.current.trackedCharacters[0].id).toBe(firstChar.id);
    expect(result.current.trackedCharacters[0].level).toBe(1);
    expect(result.current.trackedCharacters[0].awakening).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('addCharacter shows warning toast when no session', async () => {
    const { result } = await setup(null);

    await act(async () => {
      await result.current.addCharacter(firstChar);
    });

    expect(mockAddToast).toHaveBeenCalledWith('Please log in to add characters.', 'warning');
    expect(result.current.trackedCharacters).toEqual([]);
  });

  it('addCharacter prevents duplicate inserts', async () => {
    const { result } = await setupWithChar();

    mockInsertCharacter.mockClear();
    await act(async () => {
      await result.current.addCharacter(firstChar);
    });

    expect(result.current.trackedCharacters).toHaveLength(1);
    expect(mockInsertCharacter).not.toHaveBeenCalled();
  });

  it('addCharacter reverts state on insert failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsertCharacter.mockRejectedValueOnce(new Error('DB error'));

    const { result } = await setup();
    await act(async () => {
      await result.current.addCharacter(firstChar);
    });

    expect(result.current.trackedCharacters).toEqual([]);
    spy.mockRestore();
  });

  it('removeCharacter removes from local state', async () => {
    const { result } = await setupWithChar();
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.removeCharacter(result.current.trackedCharacters[0].id, fakeEvent);
    });

    expect(result.current.trackedCharacters).toEqual([]);
  });

  it('removeCharacter reverts on DB error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsertCharacter.mockResolvedValueOnce('db-1');

    const { result } = await setup();
    await act(async () => {
      await result.current.addCharacter(firstChar);
    });

    mockDeleteCharacter.mockRejectedValueOnce(new Error('delete fail'));
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.removeCharacter(firstChar.id, fakeEvent);
    });

    expect(result.current.trackedCharacters).toHaveLength(1);
    spy.mockRestore();
  });

  it('updateCharacterLevel updates state and clamps', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => result.current.updateCharacterLevel(id, 95));
    expect(result.current.trackedCharacters[0].level).toBe(90);

    act(() => result.current.updateCharacterLevel(id, 0));
    expect(result.current.trackedCharacters[0].level).toBe(1);

    act(() => result.current.updateCharacterLevel(id, 45));
    expect(result.current.trackedCharacters[0].level).toBe(45);
  });

  it('toggleAwakeningSlot toggles individual slot', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => result.current.toggleAwakeningSlot(id, 2));
    expect(result.current.trackedCharacters[0].awakening[2]).toBe(true);

    act(() => result.current.toggleAwakeningSlot(id, 2));
    expect(result.current.trackedCharacters[0].awakening[2]).toBe(false);
  });

  it('updateArc sets arcId, arcLevel, and arcTier', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => result.current.updateArc(id, 'arc-1', 40, 3));
    expect(result.current.trackedCharacters[0].arcId).toBe('arc-1');
    expect(result.current.trackedCharacters[0].arcLevel).toBe(40);
    expect(result.current.trackedCharacters[0].arcTier).toBe(3);
  });

  it('updateCartridge sets all cartridge fields', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() =>
      result.current.updateCartridge(id, 'Cosmos_orange', 'S', 15, 'ATK %', [
        'CRIT Rate %',
        'CRIT DMG %',
      ]),
    );
    const char = result.current.trackedCharacters[0];
    expect(char.cartridgeId).toBe('Cosmos_orange');
    expect(char.cartridgeRarity).toBe('S');
    expect(char.cartridgeLevel).toBe(15);
    expect(char.cartridgeMainStat).toBe('ATK %');
    expect(char.cartridgeSubStats).toEqual(['CRIT Rate %', 'CRIT DMG %']);
  });

  it('toggleFavoriteCharacter updates isFavorited', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => result.current.toggleFavoriteCharacter(id, true));
    expect(result.current.trackedCharacters[0].isFavorited).toBe(true);

    act(() => result.current.toggleFavoriteCharacter(id, false));
    expect(result.current.trackedCharacters[0].isFavorited).toBe(false);
  });

  it('saveCartridgePreferences updates preferences', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;
    const prefs = {
      cartridgeId: null,
      mainStats: [{ stat: 'ATK %', operator: null, orderIndex: 0 }],
      subStats: [],
      comments: 'Test',
    };

    await act(async () => {
      await result.current.saveCartridgePreferences(id, prefs);
    });

    expect(result.current.trackedCharacters[0].cartridgePreferences).toEqual(prefs);
  });

  it('getFilteredRoster returns alphabetical sort by default', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.addCharacter(secondChar);
    });
    await act(async () => {
      await result.current.addCharacter(firstChar);
    });

    const sorted = result.current.getFilteredRoster('', 'ALPHA');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].name.localeCompare(sorted[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it('getFilteredRoster sorts favorites first', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.addCharacter(firstChar);
    });
    await act(async () => {
      await result.current.addCharacter(secondChar);
    });

    act(() => result.current.toggleFavoriteCharacter(secondChar.id, true));

    const sorted = result.current.getFilteredRoster('', 'ALPHA');
    expect(sorted[0].id).toBe(secondChar.id);
  });

  it('getFilteredRoster LEVEL sort orders by level descending', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.addCharacter(firstChar);
    });
    await act(async () => {
      await result.current.addCharacter(secondChar);
    });

    act(() => {
      result.current.updateCharacterLevel(firstChar.id, 80);
      result.current.updateCharacterLevel(secondChar.id, 30);
    });

    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].level).toBeGreaterThanOrEqual(sorted[1].level);
  });

  it('isLoadError is set on DB failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadCharactersFromDB.mockRejectedValue(new Error('DB down'));

    const { result } = renderHook(() => useCharacters(mockSession, false));

    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });

  it('retryLoad clears error and reloads', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadCharactersFromDB.mockRejectedValueOnce(new Error('DB down')).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCharacters(mockSession, false));

    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);

    act(() => result.current.retryLoad());

    await waitFor(() => {
      expect(result.current.isLoadError).toBe(false);
      expect(result.current.isInitialLoad).toBe(false);
    });
    spy.mockRestore();
  });
});
