import {
  useState,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { type Session } from '@supabase/supabase-js';
import type { PartySaveResult } from '@/types';
import { addToast } from '@/utils/toast';

export interface PartyConfig<TParty, TMember> {
  loadParties: (userId: string) => Promise<TParty[]>;
  saveParty: (
    userId: string,
    party: Partial<TParty> & { members: TMember[] },
  ) => Promise<PartySaveResult>;
  deleteParty: (partyId: string) => Promise<boolean>;
  /** Lowercase nouns for toast copy, e.g. { party: 'lineup', parties: 'lineups' }. */
  nouns: { party: string; parties: string };
}

/**
 * Shared party-lineup lifecycle for the per-game party hooks. Concentrates the
 * load-on-session effect (with load-error state and retry, mirroring
 * `useRoster`), the save-then-reload flow, confirmed delete, and the manual
 * refresh. The hook owns mutation feedback: every failed outcome the service
 * reports reaches the user as a toast — the same placement as `useRoster`'s
 * add/remove toasts. Per-game hooks supply the typed service fns and layer on
 * any game-specific extras (e.g. favorite toggling).
 */
export function useParties<TParty extends { id: string }, TMember>(
  session: Session | null,
  config: PartyConfig<TParty, TMember>,
) {
  const { loadParties, saveParty: apiSaveParty, deleteParty: apiDeleteParty, nouns } = config;
  const [parties, setParties] = useState<TParty[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // Always holds the latest parties — read for rollback snapshots without
  // capturing state inside an (impure) updater.
  const partiesRef = useRef<TParty[]>([]);
  // eslint-disable-next-line react-hooks/refs
  partiesRef.current = parties;

  useEffect(() => {
    if (!session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParties([]);
      setIsInitialLoad(false);
      return;
    }

    let isMounted = true;
    (async () => {
      setIsInitialLoad(true);
      try {
        const data = await loadParties(session.user.id);
        if (isMounted) {
          setParties(data);
          setIsLoadError(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setIsLoadError(true);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, retryCount]);

  const retryLoad = () => {
    setIsLoadError(false);
    setIsInitialLoad(true);
    setRetryCount((n) => n + 1);
  };

  /**
   * Reload after a mutation or on demand. Keeps the existing list on failure
   * and flags a load error so the tab offers Retry.
   */
  const reload = async (userId: string, failureMessage: string) => {
    try {
      const data = await loadParties(userId);
      setParties(data);
      setIsLoadError(false);
    } catch (e) {
      console.error(e);
      setIsLoadError(true);
      addToast(failureMessage, 'error');
    }
  };

  const saveParty = async (
    party: Partial<TParty> & { members: TMember[] },
  ): Promise<PartySaveResult> => {
    if (!session?.user) return { partyId: null };
    const result = await apiSaveParty(session.user.id, party);
    if (!result.partyId) {
      addToast(`Couldn't save ${nouns.party}. Please try again.`, 'error');
      return result;
    }
    await reload(session.user.id, `Saved, but couldn't refresh your ${nouns.parties}.`);
    return result;
  };

  const deleteParty = async (partyId: string) => {
    if (!session?.user) return false;
    const success = await apiDeleteParty(partyId);
    if (success) {
      setParties((prev) => prev.filter((p) => p.id !== partyId));
    } else {
      addToast(`Couldn't delete ${nouns.party}. Please try again.`, 'error');
    }
    return success;
  };

  const refreshParties = async () => {
    if (session?.user) {
      await reload(session.user.id, `Couldn't refresh your ${nouns.parties}.`);
    }
  };

  return {
    parties,
    setParties,
    partiesRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    saveParty,
    deleteParty,
    refreshParties,
  };
}

/**
 * Builds an optimistic favorite-toggle for the games that support it. Applies
 * the change locally, persists it, and reverts to the pre-toggle snapshot with
 * an error toast if the write reports failure — keeping local state from
 * silently diverging. Snapshots from a ref so the capture survives React's
 * dev-mode double-invoke of state updaters.
 */
export function makeFavoriteToggle<TParty extends { id: string; isFavorited?: boolean }>(
  setParties: Dispatch<SetStateAction<TParty[]>>,
  partiesRef: MutableRefObject<TParty[]>,
  persist: (partyId: string, value: boolean) => Promise<boolean>,
) {
  return async (partyId: string, value: boolean) => {
    const snapshot = partiesRef.current;
    setParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, isFavorited: value } : p)));
    let ok = false;
    try {
      ok = await persist(partyId, value);
    } catch (e) {
      console.error(e);
    }
    if (!ok) {
      setParties(snapshot);
      addToast("Couldn't update favorite. Please try again.", 'error');
    }
  };
}
