import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useParties } from '@/hooks/reverse1999/useParties';
import type { Session } from '@supabase/supabase-js';
import type { R1999Party } from '@/types';

vi.mock('@/services/reverse1999/partyService', () => ({
  loadParties: vi.fn(),
  saveParty: vi.fn(),
  deleteParty: vi.fn(),
  toggleFavoriteParty: vi.fn(),
}));

import * as partyService from '@/services/reverse1999/partyService';

const mockLoadParties = vi.mocked(partyService.loadParties);
const mockSaveParty = vi.mocked(partyService.saveParty);
const mockDeleteParty = vi.mocked(partyService.deleteParty);

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

function makeParty(id: string, name: string, overrides: Partial<R1999Party> = {}): R1999Party {
  return {
    id,
    profileId: 'test-user-123',
    name,
    notes: null,
    tier: null,
    isFavorited: false,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('useParties (R1999)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadParties.mockResolvedValue([]);
    mockSaveParty.mockResolvedValue('new-party-id');
    mockDeleteParty.mockResolvedValue(true);
  });

  describe('initial load', () => {
    it('loads parties from DB when session is present', async () => {
      mockLoadParties.mockResolvedValue([makeParty('p1', 'Limbo Team')]);

      const { result } = renderHook(() => useParties(mockSession));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockLoadParties).toHaveBeenCalledWith('test-user-123');
      expect(result.current.parties).toHaveLength(1);
      expect(result.current.parties[0].name).toBe('Limbo Team');
    });

    it('starts with empty parties and not loading when session is null', () => {
      const { result } = renderHook(() => useParties(null));

      expect(result.current.parties).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(mockLoadParties).not.toHaveBeenCalled();
    });

    it('clears parties when session becomes null', async () => {
      mockLoadParties.mockResolvedValue([makeParty('p1', 'Alpha')]);

      const { result, rerender } = renderHook(
        ({ session }: { session: Session | null }) => useParties(session),
        { initialProps: { session: mockSession as Session | null } },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.parties).toHaveLength(1);

      rerender({ session: null });

      expect(result.current.parties).toHaveLength(0);
    });
  });

  describe('saveParty', () => {
    it('creates a new party and refreshes the list', async () => {
      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockLoadParties.mockResolvedValueOnce([makeParty('new-party-id', 'New Lineup')]);

      await act(async () => {
        await result.current.saveParty({ name: 'New Lineup', members: [] });
      });

      expect(mockSaveParty).toHaveBeenCalledWith('test-user-123', {
        name: 'New Lineup',
        members: [],
      });
      expect(result.current.parties).toHaveLength(1);
      expect(result.current.parties[0].name).toBe('New Lineup');
    });

    it('returns the new partyId on success', async () => {
      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let partyId: string | null = null;
      await act(async () => {
        partyId = await result.current.saveParty({ name: 'My Lineup', members: [] });
      });

      expect(partyId).toBe('new-party-id');
    });

    it('returns null and does not call DB when session is absent', async () => {
      const { result } = renderHook(() => useParties(null));

      let returned: string | null = 'sentinel' as any;
      await act(async () => {
        returned = await result.current.saveParty({ name: 'Lineup', members: [] });
      });

      expect(returned).toBeNull();
      expect(mockSaveParty).not.toHaveBeenCalled();
    });

    it('updates an existing party when party.id is provided', async () => {
      mockLoadParties.mockResolvedValue([makeParty('p1', 'Alpha')]);

      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockLoadParties.mockResolvedValueOnce([makeParty('p1', 'Alpha Renamed')]);

      await act(async () => {
        await result.current.saveParty({ id: 'p1', name: 'Alpha Renamed', members: [] });
      });

      expect(mockSaveParty).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ id: 'p1', name: 'Alpha Renamed' }),
      );
    });
  });

  describe('deleteParty', () => {
    it('removes the party from local state on success', async () => {
      mockLoadParties.mockResolvedValue([makeParty('p1', 'Alpha'), makeParty('p2', 'Beta')]);

      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteParty('p1');
      });

      expect(mockDeleteParty).toHaveBeenCalledWith('p1');
      expect(result.current.parties).toHaveLength(1);
      expect(result.current.parties[0].id).toBe('p2');
    });

    it('returns false and does not modify state when session is absent', async () => {
      const { result } = renderHook(() => useParties(null));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.deleteParty('p1');
      });

      expect(success).toBe(false);
      expect(mockDeleteParty).not.toHaveBeenCalled();
    });

    it('does not remove party from state when delete returns false', async () => {
      mockDeleteParty.mockResolvedValue(false);
      mockLoadParties.mockResolvedValue([makeParty('p1', 'Alpha')]);

      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteParty('p1');
      });

      expect(result.current.parties).toHaveLength(1);
    });
  });

  describe('refreshParties', () => {
    it('reloads all parties from DB', async () => {
      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockLoadParties.mockResolvedValueOnce([makeParty('p1', 'Alpha'), makeParty('p2', 'Beta')]);

      await act(async () => {
        await result.current.refreshParties();
      });

      expect(mockLoadParties).toHaveBeenCalledTimes(2); // initial load + refresh
      expect(result.current.parties).toHaveLength(2);
    });

    it('does nothing when session is null', async () => {
      const { result } = renderHook(() => useParties(null));

      await act(async () => {
        await result.current.refreshParties();
      });

      expect(mockLoadParties).not.toHaveBeenCalled();
    });
  });
});
