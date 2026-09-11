import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { useParties, makeFavoriteToggle, type PartyConfig } from '@/hooks/useParties';
import type { PartySaveResult } from '@/types';
import { addToast } from '@/utils/toast';

vi.mock('@/utils/toast', () => ({ addToast: vi.fn() }));

interface TestParty {
  id: string;
  name: string;
  isFavorited?: boolean;
}
interface TestMember {
  entityId: string;
  slotIndex: number;
}

const session = { user: { id: 'user-1' } } as unknown as Session;

function party(id: string, name = `Party ${id}`): TestParty {
  return { id, name, isFavorited: false };
}

describe('useParties', () => {
  let loadParties: Mock<(userId: string) => Promise<TestParty[]>>;
  let saveParty: Mock<
    (
      userId: string,
      party: Partial<TestParty> & { members: TestMember[] },
    ) => Promise<PartySaveResult>
  >;
  let deleteParty: Mock<(partyId: string) => Promise<boolean>>;
  let config: PartyConfig<TestParty, TestMember>;

  beforeEach(() => {
    vi.clearAllMocks();
    loadParties = vi.fn<(userId: string) => Promise<TestParty[]>>().mockResolvedValue([]);
    saveParty = vi
      .fn<
        (
          userId: string,
          party: Partial<TestParty> & { members: TestMember[] },
        ) => Promise<PartySaveResult>
      >()
      .mockResolvedValue({ partyId: 'p1' });
    deleteParty = vi.fn<(partyId: string) => Promise<boolean>>().mockResolvedValue(true);
    config = {
      loadParties,
      saveParty,
      deleteParty,
      nouns: { party: 'lineup', parties: 'lineups' },
    };
  });

  describe('initial load', () => {
    it('loads parties for a session and clears the loading flag', async () => {
      loadParties.mockResolvedValue([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      expect(result.current.isInitialLoad).toBe(true);
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
      expect(result.current.parties).toEqual([party('p1')]);
      expect(result.current.isLoadError).toBe(false);
    });

    it('clears parties without a session', async () => {
      const { result } = renderHook(() => useParties(null, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
      expect(result.current.parties).toEqual([]);
      expect(loadParties).not.toHaveBeenCalled();
    });

    it('flags a load error instead of resolving to an empty list', async () => {
      loadParties.mockRejectedValue(new Error('500'));
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
      expect(result.current.isLoadError).toBe(true);
      expect(result.current.parties).toEqual([]);
    });

    it('retryLoad clears the error, reloads, and recovers', async () => {
      loadParties.mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.isLoadError).toBe(true));

      act(() => {
        result.current.retryLoad();
      });
      expect(result.current.isLoadError).toBe(false);
      expect(result.current.isInitialLoad).toBe(true);

      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
      expect(result.current.parties).toEqual([party('p1')]);
      expect(loadParties).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveParty', () => {
    it('reloads after a full success and shows no toast', async () => {
      loadParties.mockResolvedValueOnce([]).mockResolvedValueOnce([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      let outcome: PartySaveResult | undefined;
      await act(async () => {
        outcome = await result.current.saveParty({ name: 'New', members: [] });
      });

      expect(outcome).toEqual({ partyId: 'p1' });
      expect(result.current.parties).toEqual([party('p1')]);
      expect(addToast).not.toHaveBeenCalled();
    });

    it('resolves a null partyId without a session', async () => {
      const { result } = renderHook(() => useParties(null, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
      let outcome: PartySaveResult | undefined;
      await act(async () => {
        outcome = await result.current.saveParty({ name: 'New', members: [] });
      });
      expect(outcome).toEqual({ partyId: null });
      expect(saveParty).not.toHaveBeenCalled();
    });

    it('toasts an error and skips the reload when the party row failed', async () => {
      saveParty.mockResolvedValue({ partyId: null });
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      let outcome: PartySaveResult | undefined;
      await act(async () => {
        outcome = await result.current.saveParty({ name: 'New', members: [] });
      });

      expect(outcome).toEqual({ partyId: null });
      expect(addToast).toHaveBeenCalledWith("Couldn't save lineup. Please try again.", 'error');
      expect(loadParties).toHaveBeenCalledTimes(1);
    });

    it('keeps the id, toasts, and flags a load error when the post-save reload fails', async () => {
      loadParties.mockResolvedValueOnce([party('old')]).mockRejectedValueOnce(new Error('500'));
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      let outcome: PartySaveResult | undefined;
      await act(async () => {
        outcome = await result.current.saveParty({ name: 'New', members: [] });
      });

      expect(outcome).toEqual({ partyId: 'p1' });
      expect(addToast).toHaveBeenCalledWith("Saved, but couldn't refresh your lineups.", 'error');
      expect(result.current.isLoadError).toBe(true);
      // Existing list is kept rather than wiped.
      expect(result.current.parties).toEqual([party('old')]);
    });
  });

  describe('deleteParty', () => {
    it('removes the party from state on success', async () => {
      loadParties.mockResolvedValue([party('p1'), party('p2')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.parties).toHaveLength(2));

      await act(async () => {
        await result.current.deleteParty('p1');
      });

      expect(result.current.parties).toEqual([party('p2')]);
      expect(addToast).not.toHaveBeenCalled();
    });

    it('keeps the party and toasts an error when the delete fails', async () => {
      deleteParty.mockResolvedValue(false);
      loadParties.mockResolvedValue([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.deleteParty('p1');
      });

      expect(ok).toBe(false);
      expect(result.current.parties).toEqual([party('p1')]);
      expect(addToast).toHaveBeenCalledWith("Couldn't delete lineup. Please try again.", 'error');
    });
  });

  describe('refreshParties', () => {
    it('reloads on demand', async () => {
      loadParties.mockResolvedValueOnce([]).mockResolvedValueOnce([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

      await act(async () => {
        await result.current.refreshParties();
      });

      expect(result.current.parties).toEqual([party('p1')]);
    });

    it('keeps existing parties, toasts, and flags a load error when the refresh fails', async () => {
      loadParties.mockResolvedValueOnce([party('p1')]).mockRejectedValueOnce(new Error('500'));
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));

      await act(async () => {
        await result.current.refreshParties();
      });

      expect(result.current.parties).toEqual([party('p1')]);
      expect(result.current.isLoadError).toBe(true);
      expect(addToast).toHaveBeenCalledWith("Couldn't refresh your lineups.", 'error');
    });
  });

  describe('makeFavoriteToggle', () => {
    it('applies optimistically and keeps the value on success', async () => {
      loadParties.mockResolvedValue([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));
      const persist = vi.fn().mockResolvedValue(true);
      const toggle = makeFavoriteToggle(
        result.current.setParties,
        result.current.partiesRef,
        persist,
      );

      await act(async () => {
        await toggle('p1', true);
      });

      expect(result.current.parties[0].isFavorited).toBe(true);
      expect(persist).toHaveBeenCalledWith('p1', true);
      expect(addToast).not.toHaveBeenCalled();
    });

    it('reverts and toasts when the persist reports failure', async () => {
      loadParties.mockResolvedValue([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));
      const persist = vi.fn().mockResolvedValue(false);
      const toggle = makeFavoriteToggle(
        result.current.setParties,
        result.current.partiesRef,
        persist,
      );

      await act(async () => {
        await toggle('p1', true);
      });

      expect(result.current.parties[0].isFavorited).toBe(false);
      expect(addToast).toHaveBeenCalledWith("Couldn't update favorite. Please try again.", 'error');
    });

    it('reverts and toasts when the persist rejects', async () => {
      loadParties.mockResolvedValue([party('p1')]);
      const { result } = renderHook(() => useParties(session, config));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));
      const persist = vi.fn().mockRejectedValue(new Error('500'));
      const toggle = makeFavoriteToggle(
        result.current.setParties,
        result.current.partiesRef,
        persist,
      );

      await act(async () => {
        await toggle('p1', true);
      });

      expect(result.current.parties[0].isFavorited).toBe(false);
      expect(addToast).toHaveBeenCalledWith("Couldn't update favorite. Please try again.", 'error');
    });
  });
});
