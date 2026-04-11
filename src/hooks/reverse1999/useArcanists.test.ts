import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import type { Session } from '@supabase/supabase-js';
import type { R1999TrackedArcanist } from '@/types';
import * as toastUtils from '@/utils/toast';

// Mock the service layer
vi.mock('@/services/reverse1999/arcanistService', () => ({
  loadArcanistsFromDB: vi.fn(),
  insertArcanist: vi.fn(),
  deleteArcanist: vi.fn(),
  updateArcanist: vi.fn(),
}));

// Mock usePendingSaves to execute actions immediately (no debounce in tests)
vi.mock('@/hooks/usePendingSaves', () => ({
  usePendingSaves: (_delay?: number, _onFlushError?: unknown) => ({
    pendingSaveCount: 0,
    queueUpdate: vi.fn((_key: unknown, updates: unknown, flushFn: (p: unknown) => unknown) =>
      flushFn(updates),
    ),
    queueAction: vi.fn(),
  }),
}));

// Mock supabase module to prevent real network calls
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    },
  },
}));

// Import mocked modules
import * as arcanistService from '@/services/reverse1999/arcanistService';

const mockLoadArcanistsFromDB = vi.mocked(arcanistService.loadArcanistsFromDB);
const mockInsertArcanist = vi.mocked(arcanistService.insertArcanist);
const mockDeleteArcanist = vi.mocked(arcanistService.deleteArcanist);
const mockUpdateArcanist = vi.mocked(arcanistService.updateArcanist);

// Test fixtures - use real arcanist IDs from ALL_ARCANISTS
const mockArcanist = {
  id: '37',
  name: '37',
  afflatus: 'Star',
  damageType: 'Mental',
  imageUrl: '/assets/reverse-1999/arcanists-mugshots/37.webp',
};

const mockArcanist2 = {
  id: '6',
  name: '6',
  afflatus: 'Intellect',
  damageType: 'Mental',
  imageUrl: '/assets/reverse-1999/arcanists-mugshots/6.webp',
};

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

// Helper to create a tracked arcanist fixture
function trackedArcanist(
  arcanistId: string,
  name: string,
  overrides: Partial<R1999TrackedArcanist> = {},
): R1999TrackedArcanist {
  return {
    id: arcanistId,
    name,
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: `/assets/reverse-1999/arcanists-mugshots/${arcanistId}.webp`,
    dbId: 'db-uuid',
    isFavorited: false,
    level: 1,
    insightLevel: 0,
    portraitLevel: 0,
    resonanceLevel: 0,
    psychubeId: null,
    psychubeLevel: 0,
    ...overrides,
  };
}

describe('useArcanists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockLoadArcanistsFromDB.mockResolvedValue([]);
    mockInsertArcanist.mockResolvedValue('new-db-id');
    mockDeleteArcanist.mockResolvedValue(undefined);
    mockUpdateArcanist.mockResolvedValue(undefined);
  });

  describe('initial load', () => {
    it('loads arcanists from DB when session is present', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { level: 30, insightLevel: 2, isFavorited: true }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      expect(mockLoadArcanistsFromDB).toHaveBeenCalledWith('test-user-123');
      expect(result.current.trackedArcanists).toHaveLength(1);
      expect(result.current.trackedArcanists[0].name).toBe('37');
      expect(result.current.trackedArcanists[0].level).toBe(30);
      expect(result.current.trackedArcanists[0].insightLevel).toBe(2);
      expect(result.current.trackedArcanists[0].isFavorited).toBe(true);
    });

    it('clears arcanists when session is null', async () => {
      const { result, rerender } = renderHook(
        ({ session }: { session: Session | null }) => useArcanists(session, false),
        { initialProps: { session: mockSession as Session | null } },
      );

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      rerender({ session: null });

      expect(result.current.trackedArcanists).toHaveLength(0);
    });

    it('does not load while auth is still loading', () => {
      renderHook(() => useArcanists(mockSession, true));

      expect(mockLoadArcanistsFromDB).not.toHaveBeenCalled();
    });

    it('sets isLoadError when DB fetch throws', async () => {
      mockLoadArcanistsFromDB.mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      expect(result.current.isLoadError).toBe(true);
      expect(result.current.trackedArcanists).toHaveLength(0);
    });

    it('clears isLoadError and reloads on retryLoad', async () => {
      mockLoadArcanistsFromDB
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce([trackedArcanist('37', '37')]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isLoadError).toBe(true);
      });

      act(() => {
        result.current.retryLoad();
      });

      await waitFor(() => {
        expect(result.current.isLoadError).toBe(false);
        expect(result.current.trackedArcanists).toHaveLength(1);
      });
    });
  });

  describe('addArcanist', () => {
    beforeEach(() => {
      vi.spyOn(toastUtils, 'addToast').mockImplementation(() => 'test-id');
    });

    it('adds an arcanist to local state and DB', async () => {
      const { result } = renderHook(() => useArcanists(mockSession, false));

      // The hook's effect runs async; wait for initial load to settle
      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addArcanist(mockArcanist);
      });

      expect(result.current.trackedArcanists).toHaveLength(1);
      expect(result.current.trackedArcanists[0].id).toBe('37');
      expect(result.current.trackedArcanists[0].level).toBe(1);
      expect(result.current.trackedArcanists[0].insightLevel).toBe(0);
      expect(result.current.trackedArcanists[0].portraitLevel).toBe(0);
      expect(result.current.trackedArcanists[0].resonanceLevel).toBe(0);
      expect(result.current.trackedArcanists[0].psychubeId).toBeNull();
      expect(result.current.trackedArcanists[0].psychubeLevel).toBe(0);
      expect(mockInsertArcanist).toHaveBeenCalledWith('test-user-123', '37');
    });

    it('does not add a duplicate arcanist already in local state', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([trackedArcanist('37', '37')]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addArcanist(mockArcanist);
      });

      // Still only 1, not duplicated
      expect(result.current.trackedArcanists).toHaveLength(1);
      expect(mockInsertArcanist).toHaveBeenCalledTimes(0);
    });

    it('does not add duplicate arcanist when rapid-fire called (race condition fix)', async () => {
      // Simulate slow DB insert to create race window
      mockInsertArcanist.mockImplementation(
        () => new Promise<string>((resolve) => setTimeout(() => resolve('generated-db-id'), 100)),
      );

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      // Fire two adds concurrently before the first resolves
      await act(async () => {
        const promise1 = result.current.addArcanist(mockArcanist);
        const promise2 = result.current.addArcanist(mockArcanist);
        await Promise.all([promise1, promise2]);
      });

      // Only one should have been added
      expect(result.current.trackedArcanists).toHaveLength(1);
      // insertArcanist should only have been called once
      expect(mockInsertArcanist).toHaveBeenCalledTimes(1);
    });

    it('allows adding different arcanists sequentially', async () => {
      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addArcanist(mockArcanist);
      });

      expect(result.current.trackedArcanists).toHaveLength(1);

      // Add a different arcanist after the first one resolves
      await act(async () => {
        await result.current.addArcanist(mockArcanist2);
      });

      expect(result.current.trackedArcanists).toHaveLength(2);
      expect(mockInsertArcanist).toHaveBeenCalledTimes(2);
    });

    it('does not add arcanist when session is null', async () => {
      const { result } = renderHook(() => useArcanists(null, false));

      await act(async () => {
        await result.current.addArcanist(mockArcanist);
      });

      expect(result.current.trackedArcanists).toHaveLength(0);
      expect(mockInsertArcanist).not.toHaveBeenCalled();
      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Please log in to add arcanists.',
        'warning',
      );
    });

    it('reverts optimistic add and shows error toast when insertArcanist throws', async () => {
      mockInsertArcanist.mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addArcanist(mockArcanist);
      });

      expect(result.current.trackedArcanists).toHaveLength(0);
      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Failed to add arcanist. Please try again.',
        'error',
      );
    });
  });

  describe('removeArcanist', () => {
    it('removes arcanist from local state and DB', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id' }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.removeArcanist('37', {
          stopPropagation: vi.fn(),
        } as any);
      });

      expect(result.current.trackedArcanists).toHaveLength(0);
      expect(mockDeleteArcanist).toHaveBeenCalledWith('existing-db-id');
    });

    it('reverts optimistic remove and shows error toast when deleteArcanist throws', async () => {
      vi.spyOn(toastUtils, 'addToast').mockImplementation(() => 'test-id');
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id' }),
      ]);
      mockDeleteArcanist.mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.removeArcanist('37', {
          stopPropagation: vi.fn(),
        } as any);
      });

      expect(result.current.trackedArcanists).toHaveLength(1);
      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Failed to remove arcanist. Please try again.',
        'error',
      );
    });
  });

  describe('updateArcanistLevel', () => {
    it('updates level in local state and queues DB update', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', level: 1 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updateArcanistLevel('37', 30);
      });

      expect(result.current.trackedArcanists[0].level).toBe(30);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        level: 30,
      });
    });

    it('clamps level to valid range (1-60)', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', level: 30 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updateArcanistLevel('37', -5);
      });

      expect(result.current.trackedArcanists[0].level).toBe(1);

      await act(async () => {
        result.current.updateArcanistLevel('37', 999);
      });

      expect(result.current.trackedArcanists[0].level).toBe(60);
    });
  });

  describe('updateInsightLevel', () => {
    it('updates insight level in local state and queues DB update', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', insightLevel: 0 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updateInsightLevel('37', 2);
      });

      expect(result.current.trackedArcanists[0].insightLevel).toBe(2);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        insight_level: 2,
      });
    });
  });

  describe('updatePortraitLevel', () => {
    it('updates portrait level in local state and queues DB update', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', portraitLevel: 0 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updatePortraitLevel('37', 3);
      });

      expect(result.current.trackedArcanists[0].portraitLevel).toBe(3);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        portrait_level: 3,
      });
    });

    it('can reset portrait level to 0', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', portraitLevel: 4 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updatePortraitLevel('37', 0);
      });

      expect(result.current.trackedArcanists[0].portraitLevel).toBe(0);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        portrait_level: 0,
      });
    });
  });

  describe('updateResonanceLevel', () => {
    it('updates resonance level in local state and queues DB update', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', resonanceLevel: 0 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updateResonanceLevel('37', 10);
      });

      expect(result.current.trackedArcanists[0].resonanceLevel).toBe(10);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        resonance_level: 10,
      });
    });

    it('clamps resonance level to valid range (0-15)', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', resonanceLevel: 5 }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updateResonanceLevel('37', -1);
      });

      expect(result.current.trackedArcanists[0].resonanceLevel).toBe(0);

      await act(async () => {
        result.current.updateResonanceLevel('37', 999);
      });

      expect(result.current.trackedArcanists[0].resonanceLevel).toBe(15);
    });
  });

  describe('updatePsychube', () => {
    it('updates psychube in local state and queues DB update', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', {
          dbId: 'existing-db-id',
          psychubeId: null,
          psychubeLevel: 0,
        }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updatePsychube('37', 28, 10);
      });

      expect(result.current.trackedArcanists[0].psychubeId).toBe(28);
      expect(result.current.trackedArcanists[0].psychubeLevel).toBe(10);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        psychube_id: 28,
        psychube_level: 10,
      });
    });

    it('can clear psychube by setting id to null', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', {
          dbId: 'existing-db-id',
          psychubeId: 2,
          psychubeLevel: 5,
        }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.updatePsychube('37', null, 0);
      });

      expect(result.current.trackedArcanists[0].psychubeId).toBeNull();
      expect(result.current.trackedArcanists[0].psychubeLevel).toBe(0);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        psychube_id: null,
        psychube_level: 0,
      });
    });
  });

  describe('toggleFavoriteArcanist', () => {
    it('toggles favorite in local state and queues DB update', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'existing-db-id', isFavorited: false }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        result.current.toggleFavoriteArcanist('37', true);
      });

      expect(result.current.trackedArcanists[0].isFavorited).toBe(true);
      expect(mockUpdateArcanist).toHaveBeenCalledWith('existing-db-id', {
        is_favorited: true,
      });
    });
  });

  describe('getFilteredRoster', () => {
    it('filters arcanists by search term', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'id-1' }),
        trackedArcanist('6', '6', { dbId: 'id-2' }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      const filtered = result.current.getFilteredRoster('6', 'ALPHA');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('6');
    });

    it('sorts favorites first', async () => {
      mockLoadArcanistsFromDB.mockResolvedValue([
        trackedArcanist('37', '37', { dbId: 'id-1', isFavorited: false }),
        trackedArcanist('6', '6', { dbId: 'id-2', isFavorited: true }),
      ]);

      const { result } = renderHook(() => useArcanists(mockSession, false));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      const filtered = result.current.getFilteredRoster('', 'ALPHA');

      expect(filtered[0].name).toBe('6');
      expect(filtered[1].name).toBe('37');
    });
  });
});
