import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

describe('useCharacters', () => {
  const mockSession = createMockSession();

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/services/neverness-to-everness/characterService', () => ({
      loadCharactersFromDB: vi.fn().mockResolvedValue([]),
      insertCharacter: vi.fn().mockResolvedValue('new-id'),
      deleteCharacter: vi.fn().mockResolvedValue(undefined),
      updateCharacter: vi.fn().mockResolvedValue(undefined),
      saveCartridgePreferences: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@/utils/toast', () => ({
      addToast: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup(session: Session | null = mockSession) {
    const { useCharacters } = await import('@/hooks/neverness-to-everness/useCharacters');
    const { ALL_CHARACTERS } = await import('@/data/neverness-to-everness/characters');
    const hook = renderHook(() => useCharacters(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return { ...hook, ALL_CHARACTERS };
  }

  async function setupWithChar() {
    const ctx = await setup();
    await act(async () => {
      await ctx.result.current.addCharacter(ctx.ALL_CHARACTERS[0]);
    });
    return ctx;
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
    const { result, ALL_CHARACTERS } = await setupWithChar();
    expect(result.current.trackedCharacters).toHaveLength(1);
    expect(result.current.trackedCharacters[0].id).toBe(ALL_CHARACTERS[0].id);
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
    const { addToast } = await import('@/utils/toast');

    await act(async () => {
      const { ALL_CHARACTERS } = await import('@/data/neverness-to-everness/characters');
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });

    expect(addToast).toHaveBeenCalledWith('Please log in to add characters.', 'warning');
    expect(result.current.trackedCharacters).toEqual([]);
  });

  it('addCharacter prevents duplicate inserts', async () => {
    const { result, ALL_CHARACTERS } = await setupWithChar();
    const service = await import('@/services/neverness-to-everness/characterService');

    vi.mocked(service.insertCharacter).mockClear();
    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });

    expect(result.current.trackedCharacters).toHaveLength(1);
    expect(service.insertCharacter).not.toHaveBeenCalled();
  });

  it('addCharacter reverts state on insert failure', async () => {
    const service = await import('@/services/neverness-to-everness/characterService');
    vi.mocked(service.insertCharacter).mockRejectedValueOnce(new Error('DB error'));

    const { result, ALL_CHARACTERS } = await setup();
    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });

    expect(result.current.trackedCharacters).toEqual([]);
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
    const service = await import('@/services/neverness-to-everness/characterService');

    const { result, ALL_CHARACTERS } = await setup();
    vi.mocked(service.insertCharacter).mockResolvedValueOnce('db-1');

    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });

    vi.mocked(service.deleteCharacter).mockRejectedValueOnce(new Error('delete fail'));
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.removeCharacter(ALL_CHARACTERS[0].id, fakeEvent);
    });

    expect(result.current.trackedCharacters).toHaveLength(1);
  });

  it('updateCharacterLevel updates state and clamps', async () => {
    const { result } = await setupWithChar();

    act(() => {
      result.current.updateCharacterLevel(result.current.trackedCharacters[0].id, 95);
    });
    expect(result.current.trackedCharacters[0].level).toBe(90);

    act(() => {
      result.current.updateCharacterLevel(result.current.trackedCharacters[0].id, 0);
    });
    expect(result.current.trackedCharacters[0].level).toBe(1);

    act(() => {
      result.current.updateCharacterLevel(result.current.trackedCharacters[0].id, 45);
    });
    expect(result.current.trackedCharacters[0].level).toBe(45);
  });

  it('toggleAwakeningSlot toggles individual slot', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => {
      result.current.toggleAwakeningSlot(id, 2);
    });
    expect(result.current.trackedCharacters[0].awakening[2]).toBe(true);

    act(() => {
      result.current.toggleAwakeningSlot(id, 2);
    });
    expect(result.current.trackedCharacters[0].awakening[2]).toBe(false);
  });

  it('updateResonanceCount updates and clamps', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => {
      result.current.updateResonanceCount(id, 4);
    });
    expect(result.current.trackedCharacters[0].resonanceCount).toBe(4);

    act(() => {
      result.current.updateResonanceCount(id, 10);
    });
    expect(result.current.trackedCharacters[0].resonanceCount).toBe(6);

    act(() => {
      result.current.updateResonanceCount(id, -1);
    });
    expect(result.current.trackedCharacters[0].resonanceCount).toBe(0);
  });

  it('updateArc sets arcId, arcLevel, and arcTier', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => {
      result.current.updateArc(id, 'arc-1', 40, 3);
    });
    expect(result.current.trackedCharacters[0].arcId).toBe('arc-1');
    expect(result.current.trackedCharacters[0].arcLevel).toBe(40);
    expect(result.current.trackedCharacters[0].arcTier).toBe(3);
  });

  it('updateCartridge sets all cartridge fields', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => {
      result.current.updateCartridge(id, 'S', 15, 'ATK %', ['CRIT Rate %', 'CRIT DMG %']);
    });
    const char = result.current.trackedCharacters[0];
    expect(char.cartridgeRarity).toBe('S');
    expect(char.cartridgeLevel).toBe(15);
    expect(char.cartridgeMainStat).toBe('ATK %');
    expect(char.cartridgeSubStats).toEqual(['CRIT Rate %', 'CRIT DMG %']);
  });

  it('toggleFavoriteCharacter updates isFavorited', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;

    act(() => {
      result.current.toggleFavoriteCharacter(id, true);
    });
    expect(result.current.trackedCharacters[0].isFavorited).toBe(true);

    act(() => {
      result.current.toggleFavoriteCharacter(id, false);
    });
    expect(result.current.trackedCharacters[0].isFavorited).toBe(false);
  });

  it('saveCartridgePreferences updates preferences', async () => {
    const { result } = await setupWithChar();
    const id = result.current.trackedCharacters[0].id;
    const prefs = {
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
    const { result, ALL_CHARACTERS } = await setup();

    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[1]);
    });
    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });

    const sorted = result.current.getFilteredRoster('', 'ALPHA');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].name.localeCompare(sorted[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it('getFilteredRoster sorts favorites first', async () => {
    const { result, ALL_CHARACTERS } = await setup();

    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });
    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[1]);
    });

    act(() => {
      result.current.toggleFavoriteCharacter(ALL_CHARACTERS[1].id, true);
    });

    const sorted = result.current.getFilteredRoster('', 'ALPHA');
    expect(sorted[0].id).toBe(ALL_CHARACTERS[1].id);
  });

  it('getFilteredRoster LEVEL sort orders by level descending', async () => {
    const { result, ALL_CHARACTERS } = await setup();

    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[0]);
    });
    await act(async () => {
      await result.current.addCharacter(ALL_CHARACTERS[1]);
    });

    act(() => {
      result.current.updateCharacterLevel(ALL_CHARACTERS[0].id, 80);
      result.current.updateCharacterLevel(ALL_CHARACTERS[1].id, 30);
    });

    const sorted = result.current.getFilteredRoster('', 'LEVEL');
    expect(sorted[0].level).toBeGreaterThanOrEqual(sorted[1].level);
  });

  it('isLoadError is set on DB failure', async () => {
    vi.resetModules();
    vi.doMock('@/services/neverness-to-everness/characterService', () => ({
      loadCharactersFromDB: vi.fn().mockRejectedValue(new Error('DB down')),
      insertCharacter: vi.fn(),
      deleteCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      saveCartridgePreferences: vi.fn(),
    }));
    vi.doMock('@/utils/toast', () => ({
      addToast: vi.fn(),
    }));

    const { useCharacters } = await import('@/hooks/neverness-to-everness/useCharacters');
    const { result } = renderHook(() => useCharacters(mockSession, false));

    await waitFor(
      () => {
        expect(result.current.isLoadError).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('retryLoad clears error and reloads', async () => {
    vi.resetModules();
    let callCount = 0;
    vi.doMock('@/services/neverness-to-everness/characterService', () => ({
      loadCharactersFromDB: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('DB down'));
        return Promise.resolve([]);
      }),
      insertCharacter: vi.fn(),
      deleteCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      saveCartridgePreferences: vi.fn(),
    }));
    vi.doMock('@/utils/toast', () => ({
      addToast: vi.fn(),
    }));

    const { useCharacters } = await import('@/hooks/neverness-to-everness/useCharacters');
    const { result } = renderHook(() => useCharacters(mockSession, false));

    await waitFor(
      () => {
        expect(result.current.isLoadError).toBe(true);
      },
      { timeout: 3000 },
    );

    await act(async () => {
      result.current.retryLoad();
    });

    await waitFor(() => {
      expect(result.current.isLoadError).toBe(false);
      expect(result.current.isInitialLoad).toBe(false);
    });
  });
});
