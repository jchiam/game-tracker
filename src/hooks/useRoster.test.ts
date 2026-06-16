import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useRoster,
  type RosterBase,
  type RosterTracked,
  type RosterConfig,
} from '@/hooks/useRoster';
import type { Session } from '@supabase/supabase-js';
import * as toastUtils from '@/utils/toast';

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

interface TestBase extends RosterBase {
  id: string;
  name: string;
}

interface TestTracked extends RosterTracked {
  id: string;
  dbId?: string;
  name: string;
  isFavorited: boolean;
  extraValue?: number;
}

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

describe('useRoster', () => {
  let mockLoadFromDB: ReturnType<typeof vi.fn>;
  let mockInsertEntity: ReturnType<typeof vi.fn>;
  let mockDeleteEntity: ReturnType<typeof vi.fn>;
  let config: RosterConfig<TestBase, TestTracked>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFromDB = vi.fn().mockResolvedValue([]);
    mockInsertEntity = vi.fn().mockResolvedValue('generated-db-id');
    mockDeleteEntity = vi.fn().mockResolvedValue(undefined);

    config = {
      allEntities: [
        { id: 'char-1', name: 'Char One' },
        { id: 'char-2', name: 'Char Two' },
      ],
      loadFromDB: mockLoadFromDB,
      insertEntity: mockInsertEntity,
      deleteEntity: mockDeleteEntity,
      createTracked: (base) => ({
        id: base.id,
        name: base.name,
        isFavorited: false,
        extraValue: 0,
      }),
      nounSingular: 'test item',
      nounPlural: 'test items',
      fuseKeys: ['name'],
    };
  });

  describe('initial load', () => {
    it('loads roster from DB when session is present', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Char One', isFavorited: true, dbId: 'db-id-1' },
      ]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      expect(mockLoadFromDB).toHaveBeenCalledWith('test-user-123');
      expect(result.current.trackedEntities).toHaveLength(1);
      expect(result.current.trackedEntities[0]).toEqual({
        id: 'char-1',
        name: 'Char One',
        isFavorited: true,
        dbId: 'db-id-1',
      });
    });

    it('clears state when session is null', async () => {
      const { result, rerender } = renderHook(({ session }) => useRoster(session, false, config), {
        initialProps: { session: mockSession as Session | null },
      });

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      rerender({ session: null });

      expect(result.current.trackedEntities).toHaveLength(0);
    });

    it('does not load while auth loading', () => {
      renderHook(() => useRoster(mockSession, true, config));
      expect(mockLoadFromDB).not.toHaveBeenCalled();
    });

    it('sets isLoadError on DB fetch throw', async () => {
      mockLoadFromDB.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      expect(result.current.isLoadError).toBe(true);
      expect(result.current.trackedEntities).toHaveLength(0);
    });

    it('clears load error and reloads on retryLoad', async () => {
      mockLoadFromDB
        .mockRejectedValueOnce(new Error('Fetch failed'))
        .mockResolvedValueOnce([{ id: 'char-1', name: 'Char One', isFavorited: false }]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isLoadError).toBe(true);
      });

      act(() => {
        result.current.retryLoad();
      });

      await waitFor(() => {
        expect(result.current.isLoadError).toBe(false);
        expect(result.current.trackedEntities).toHaveLength(1);
      });
    });
  });

  describe('addEntity', () => {
    beforeEach(() => {
      vi.spyOn(toastUtils, 'addToast').mockImplementation(() => 'toast-id');
    });

    it('adds entity optimistically and resolves DB insert', async () => {
      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addEntity({ id: 'char-1', name: 'Char One' });
      });

      expect(result.current.trackedEntities).toHaveLength(1);
      expect(result.current.trackedEntities[0]).toEqual({
        id: 'char-1',
        name: 'Char One',
        isFavorited: false,
        dbId: 'generated-db-id',
        extraValue: 0,
      });
      expect(mockInsertEntity).toHaveBeenCalledWith('test-user-123', 'char-1');
    });

    it('does not add duplicate entity already in state', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Char One', isFavorited: false, dbId: 'db-1' },
      ]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addEntity({ id: 'char-1', name: 'Char One' });
      });

      expect(result.current.trackedEntities).toHaveLength(1);
      expect(mockInsertEntity).not.toHaveBeenCalled();
    });

    it('prevents concurrent double adds on same entity (race condition guard)', async () => {
      mockInsertEntity.mockImplementation(
        () => new Promise<string>((resolve) => setTimeout(() => resolve('gen-db-id'), 100)),
      );

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        const promise1 = result.current.addEntity({ id: 'char-1', name: 'Char One' });
        const promise2 = result.current.addEntity({ id: 'char-1', name: 'Char One' });
        await Promise.all([promise1, promise2]);
      });

      expect(result.current.trackedEntities).toHaveLength(1);
      expect(mockInsertEntity).toHaveBeenCalledTimes(1);
    });

    it('shows toast when session is null', async () => {
      const { result } = renderHook(() => useRoster(null, false, config));

      await act(async () => {
        await result.current.addEntity({ id: 'char-1', name: 'Char One' });
      });

      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Please log in to add test items.',
        'warning',
      );
    });

    it('reverts optimistic add on DB error', async () => {
      mockInsertEntity.mockRejectedValue(new Error('Insert error'));

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.addEntity({ id: 'char-1', name: 'Char One' });
      });

      expect(result.current.trackedEntities).toHaveLength(0);
      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Failed to add test item. Please try again.',
        'error',
      );
    });
  });

  describe('removeEntity', () => {
    beforeEach(() => {
      vi.spyOn(toastUtils, 'addToast').mockImplementation(() => 'toast-id');
    });

    it('removes entity optimistically and invokes DB delete', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Char One', isFavorited: false, dbId: 'db-id-1' },
      ]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.removeEntity('char-1', {
          stopPropagation: vi.fn(),
        } as any);
      });

      expect(result.current.trackedEntities).toHaveLength(0);
      expect(mockDeleteEntity).toHaveBeenCalledWith('db-id-1');
    });

    it('reverts optimistic remove on DB delete error', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Char One', isFavorited: false, dbId: 'db-id-1' },
      ]);
      mockDeleteEntity.mockRejectedValue(new Error('Delete error'));

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      await act(async () => {
        await result.current.removeEntity('char-1', {
          stopPropagation: vi.fn(),
        } as any);
      });

      expect(result.current.trackedEntities).toHaveLength(1);
      expect(toastUtils.addToast).toHaveBeenCalledWith(
        'Failed to remove test item. Please try again.',
        'error',
      );
    });
  });

  describe('filterRoster', () => {
    it('filters elements via Fuse.js search', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Char One', isFavorited: false },
        { id: 'char-2', name: 'Char Two', isFavorited: false },
      ]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      const filtered = result.current.filterRoster('Two');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('char-2');
    });

    it('sorts favorited items first, then alphabetically', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Beta', isFavorited: false },
        { id: 'char-2', name: 'Gamma', isFavorited: true },
        { id: 'char-3', name: 'Alpha', isFavorited: false },
      ]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      const sorted = result.current.filterRoster('');
      expect(sorted[0].name).toBe('Gamma'); // Favorited
      expect(sorted[1].name).toBe('Alpha'); // Alphabetical tiebreak
      expect(sorted[2].name).toBe('Beta');
    });

    it('respects secondary sorting compare function', async () => {
      mockLoadFromDB.mockResolvedValue([
        { id: 'char-1', name: 'Beta', isFavorited: false, extraValue: 10 },
        { id: 'char-2', name: 'Alpha', isFavorited: false, extraValue: 20 },
      ]);

      const { result } = renderHook(() => useRoster(mockSession, false, config));

      await waitFor(() => {
        expect(result.current.isInitialLoad).toBe(false);
      });

      // Sort by extraValue descending
      const sorted = result.current.filterRoster(
        '',
        (a, b) => (b.extraValue ?? 0) - (a.extraValue ?? 0),
      );
      expect(sorted[0].name).toBe('Alpha'); // 20
      expect(sorted[1].name).toBe('Beta'); // 10
    });
  });
});
