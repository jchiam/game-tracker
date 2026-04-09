import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacters } from '@/hooks/honkai-star-rail/useCharacters';
import type { Session } from '@supabase/supabase-js';
import type { HsrTrackedCharacter } from '@/types';
import * as toastUtils from '@/utils/toast';

vi.mock('@/services/honkai-star-rail/characterService', () => ({
  loadCharactersFromDB: vi.fn(),
  insertCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  updateCharacter: vi.fn(),
  upsertRelic: vi.fn(),
  deleteRelic: vi.fn(),
  saveBuildPrefs: vi.fn(),
}));

vi.mock('@/hooks/usePendingSaves', () => ({
  usePendingSaves: () => ({
    pendingSaveCount: 0,
    queueUpdate: vi.fn((_key: string, updates: Record<string, any>, flushFn: (p: Record<string, any>) => Promise<void>) => flushFn(updates)),
    queueAction: vi.fn((_key: string, action: () => Promise<void>) => action()),
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

import * as characterService from '@/services/honkai-star-rail/characterService';

const mockLoadCharactersFromDB = vi.mocked(characterService.loadCharactersFromDB);
const mockInsertCharacter = vi.mocked(characterService.insertCharacter);
const mockDeleteCharacter = vi.mocked(characterService.deleteCharacter);
const mockUpdateCharacter = vi.mocked(characterService.updateCharacter);
const mockUpsertRelic = vi.mocked(characterService.upsertRelic);
const mockDeleteRelic = vi.mocked(characterService.deleteRelic);
const mockSaveBuildPrefs = vi.mocked(characterService.saveBuildPrefs);

const mockSession: Session = {
  user: {
    id: 'test-user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: '',
    phone: '',
    confirmation_sent_at: '',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
} as Session;

const defaultRelics: HsrTrackedCharacter['relics'] = {
  head: null,
  hands: null,
  body: null,
  feet: null,
  sphere: null,
  rope: null,
};

const defaultBuildPrefs: HsrTrackedCharacter['buildPreferences'] = {
  mainStats: { body: [], feet: [], sphere: [], rope: [] },
  subStats: [],
};

function trackedChar(
  id: string,
  name: string,
  overrides: Partial<HsrTrackedCharacter> = {},
): HsrTrackedCharacter {
  return {
    id,
    name,
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: `/assets/${id}.webp`,
    dbId: 'db-uuid',
    isFavorited: false,
    level: 1,
    tracesAttained: false,
    relics: { ...defaultRelics },
    buildPreferences: defaultBuildPrefs,
    ...overrides,
  };
}

const baseChar = {
  id: 'acheron',
  name: 'Acheron',
  element: 'Thunder',
  path: 'Nihility',
  imageUrl: '/acheron.webp',
};

describe('useCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockLoadCharactersFromDB.mockResolvedValue([]);
    mockInsertCharacter.mockResolvedValue('new-db-id');
    mockDeleteCharacter.mockResolvedValue(undefined);
    mockUpdateCharacter.mockResolvedValue(undefined);
    mockUpsertRelic.mockResolvedValue(undefined);
    mockDeleteRelic.mockResolvedValue(undefined);
    mockSaveBuildPrefs.mockResolvedValue(undefined);
  });

  describe('initial load', () => {
    it('loads characters from DB when session is present', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { level: 60, tracesAttained: true }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));

      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      expect(mockLoadCharactersFromDB).toHaveBeenCalledWith('test-user-123');
      expect(result.current.trackedCharacters).toHaveLength(1);
      expect(result.current.trackedCharacters[0].name).toBe('Acheron');
      expect(result.current.trackedCharacters[0].level).toBe(60);
      expect(result.current.trackedCharacters[0].tracesAttained).toBe(true);
    });

    it('clears characters when session becomes null', async () => {
      const { result, rerender } = renderHook(
        ({ session }: { session: Session | null }) => useCharacters(session, false),
        { initialProps: { session: mockSession as Session | null } },
      );

      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      rerender({ session: null });

      expect(result.current.trackedCharacters).toHaveLength(0);
    });

    it('does not load while auth is still loading', () => {
      renderHook(() => useCharacters(mockSession, true));
      expect(mockLoadCharactersFromDB).not.toHaveBeenCalled();
    });

    it('exposes availableCharacters and availableRelicSets', async () => {
      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      expect(result.current.availableCharacters.length).toBeGreaterThan(0);
      expect(result.current.availableRelicSets.length).toBeGreaterThan(0);
    });
  });

  describe('addCharacter', () => {
    beforeEach(() => {
      vi.spyOn(toastUtils, 'addToast').mockImplementation(() => 'test-id');
    });

    it('adds a character to local state and DB', async () => {
      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await result.current.addCharacter(baseChar);
      });

      expect(result.current.trackedCharacters).toHaveLength(1);
      expect(result.current.trackedCharacters[0].id).toBe('acheron');
      expect(result.current.trackedCharacters[0].level).toBe(1);
      expect(result.current.trackedCharacters[0].tracesAttained).toBe(false);
      expect(mockInsertCharacter).toHaveBeenCalledWith('test-user-123', 'acheron');
    });

    it('does not add a duplicate character already in state', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([trackedChar('acheron', 'Acheron')]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await result.current.addCharacter(baseChar);
      });

      expect(result.current.trackedCharacters).toHaveLength(1);
      expect(mockInsertCharacter).not.toHaveBeenCalled();
    });

    it('prevents duplicate adds during race conditions', async () => {
      mockInsertCharacter.mockImplementation(
        () => new Promise<string>((resolve) => setTimeout(() => resolve('db-id'), 100)),
      );

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await Promise.all([
          result.current.addCharacter(baseChar),
          result.current.addCharacter(baseChar),
        ]);
      });

      expect(result.current.trackedCharacters).toHaveLength(1);
      expect(mockInsertCharacter).toHaveBeenCalledTimes(1);
    });

    it('allows adding different characters sequentially', async () => {
      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await result.current.addCharacter(baseChar);
      });
      await act(async () => {
        await result.current.addCharacter({
          id: 'blade',
          name: 'Blade',
          element: 'Wind',
          path: 'Destruction',
          imageUrl: '/blade.webp',
        });
      });

      expect(result.current.trackedCharacters).toHaveLength(2);
      expect(mockInsertCharacter).toHaveBeenCalledTimes(2);
    });

    it('shows warning toast and does not call DB when session is null', async () => {
      const { result } = renderHook(() => useCharacters(null, false));

      await act(async () => {
        await result.current.addCharacter(baseChar);
      });

      expect(result.current.trackedCharacters).toHaveLength(0);
      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Please log in to add characters.',
        'warning',
      );
      expect(mockInsertCharacter).not.toHaveBeenCalled();
    });
  });

  describe('removeCharacter', () => {
    it('removes character from local state and calls DB delete', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'existing-db-id' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await result.current.removeCharacter('acheron', {
          stopPropagation: vi.fn(),
        } as any);
      });

      expect(result.current.trackedCharacters).toHaveLength(0);
      expect(mockDeleteCharacter).toHaveBeenCalledWith('existing-db-id');
    });
  });

  describe('updateCharacterLevel', () => {
    it('updates level in local state and queues DB update', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'db-id', level: 1 }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        result.current.updateCharacterLevel('acheron', 60);
      });

      expect(result.current.trackedCharacters[0].level).toBe(60);
      expect(mockUpdateCharacter).toHaveBeenCalledWith('db-id', { level: 60 });
    });

    it('clamps level to valid range (1-80)', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'db-id', level: 40 }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        result.current.updateCharacterLevel('acheron', -10);
      });
      expect(result.current.trackedCharacters[0].level).toBe(1);

      await act(async () => {
        result.current.updateCharacterLevel('acheron', 999);
      });
      expect(result.current.trackedCharacters[0].level).toBe(80);
    });
  });

  describe('toggleCharacterTraces', () => {
    it('toggles traces and queues DB update', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'db-id', tracesAttained: false }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        result.current.toggleCharacterTraces('acheron', true);
      });

      expect(result.current.trackedCharacters[0].tracesAttained).toBe(true);
      expect(mockUpdateCharacter).toHaveBeenCalledWith('db-id', { traces_attained: true });
    });
  });

  describe('toggleFavoriteCharacter', () => {
    it('toggles favorite and queues DB update', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'db-id', isFavorited: false }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        result.current.toggleFavoriteCharacter('acheron', true);
      });

      expect(result.current.trackedCharacters[0].isFavorited).toBe(true);
      expect(mockUpdateCharacter).toHaveBeenCalledWith('db-id', { is_favorited: true });
    });
  });

  describe('saveRelicData', () => {
    it('updates relic in local state and queues DB upsert', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'db-id' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const relicData = { setId: '101', mainStat: 'HP', subStats: [] };

      await act(async () => {
        await result.current.saveRelicData({ charId: 'acheron', slot: 'head' }, relicData);
      });

      expect(result.current.trackedCharacters[0].relics.head).toEqual(relicData);
      expect(mockUpsertRelic).toHaveBeenCalledWith('db-id', 'head', relicData);
    });
  });

  describe('removeRelicData', () => {
    it('resets relic slot to empty and queues DB delete', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', {
          dbId: 'db-id',
          relics: {
            head: { setId: '101', mainStat: 'HP', subStats: [] },
            hands: null,
            body: null,
            feet: null,
            sphere: null,
            rope: null,
          },
        }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await result.current.removeRelicData({ charId: 'acheron', slot: 'head' });
      });

      expect(result.current.trackedCharacters[0].relics.head).toEqual({
        setId: null,
        mainStat: null,
        subStats: [],
      });
      expect(mockDeleteRelic).toHaveBeenCalledWith('db-id', 'head');
    });
  });

  describe('saveBuildPreferences', () => {
    it('updates build preferences in local state and calls DB', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'db-id' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const newPrefs = {
        mainStats: {
          body: [{ stat: 'CRIT Rate', operator: 'AND', orderIndex: 0 }],
          feet: [],
          sphere: [],
          rope: [],
        },
        subStats: [{ stat: 'CRIT DMG', operator: 'AND', orderIndex: 0 }],
      };

      await act(async () => {
        await result.current.saveBuildPreferences('acheron', newPrefs as any);
      });

      expect(result.current.trackedCharacters[0].buildPreferences).toEqual(newPrefs);
      expect(mockSaveBuildPrefs).toHaveBeenCalledWith('db-id', newPrefs);
    });
  });

  describe('getFilteredRoster', () => {
    beforeEach(async () => {
      // Set up two characters for filter/sort tests
    });

    it('returns all characters when search term is empty', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'id-1' }),
        trackedChar('blade', 'Blade', { dbId: 'id-2' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const filtered = result.current.getFilteredRoster('', 'ALPHA', () => 0);
      expect(filtered).toHaveLength(2);
    });

    it('filters by search term', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'id-1' }),
        trackedChar('blade', 'Blade', { dbId: 'id-2' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const filtered = result.current.getFilteredRoster('Acheron', 'ALPHA', () => 0);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Acheron');
    });

    it('sorts favorites first regardless of sort mode', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'id-1', isFavorited: false }),
        trackedChar('blade', 'Blade', { dbId: 'id-2', isFavorited: true }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const filtered = result.current.getFilteredRoster('', 'ALPHA', () => 0);
      expect(filtered[0].name).toBe('Blade');
      expect(filtered[1].name).toBe('Acheron');
    });

    it('sorts by score when SCORE mode selected', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('acheron', 'Acheron', { dbId: 'id-1' }),
        trackedChar('blade', 'Blade', { dbId: 'id-2' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const scoreMap: Record<string, number> = { acheron: 100, blade: 200 };
      const filtered = result.current.getFilteredRoster('', 'SCORE', (c) => scoreMap[c.id] ?? 0);
      expect(filtered[0].name).toBe('Blade');
      expect(filtered[1].name).toBe('Acheron');
    });

    it('falls back to alphabetical within same score tier', async () => {
      mockLoadCharactersFromDB.mockResolvedValue([
        trackedChar('blade', 'Blade', { dbId: 'id-2' }),
        trackedChar('acheron', 'Acheron', { dbId: 'id-1' }),
      ]);

      const { result } = renderHook(() => useCharacters(mockSession, false));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      const filtered = result.current.getFilteredRoster('', 'ALPHA', () => 0);
      expect(filtered[0].name).toBe('Acheron');
      expect(filtered[1].name).toBe('Blade');
    });
  });
});
