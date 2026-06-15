import { useState, useEffect } from 'react';
import { type Session } from '@supabase/supabase-js';

export interface PartyConfig<TParty, TMember> {
  loadParties: (userId: string) => Promise<TParty[]>;
  saveParty: (
    userId: string,
    party: Partial<TParty> & { members: TMember[] },
  ) => Promise<string | null>;
  deleteParty: (partyId: string) => Promise<boolean>;
}

/**
 * Shared party-lineup lifecycle for the per-game party hooks. Concentrates the
 * load-on-session effect, the save-then-reload flow, optimistic delete, and the
 * manual refresh. Per-game hooks supply the typed service fns and layer on any
 * game-specific extras (e.g. favorite toggling).
 */
export function useParties<TParty extends { id: string }, TMember>(
  session: Session | null,
  config: PartyConfig<TParty, TMember>,
) {
  const { loadParties, saveParty: apiSaveParty, deleteParty: apiDeleteParty } = config;
  const [parties, setParties] = useState<TParty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setParties([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const data = await loadParties(session.user.id);
        if (isMounted) setParties(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const saveParty = async (party: Partial<TParty> & { members: TMember[] }) => {
    if (!session?.user) return null;
    const partyId = await apiSaveParty(session.user.id, party);
    if (partyId) {
      const updatedData = await loadParties(session.user.id);
      setParties(updatedData);
    }
    return partyId;
  };

  const deleteParty = async (partyId: string) => {
    if (!session?.user) return false;
    const success = await apiDeleteParty(partyId);
    if (success) {
      setParties((prev) => prev.filter((p) => p.id !== partyId));
    }
    return success;
  };

  const refreshParties = async () => {
    if (session?.user) {
      const data = await loadParties(session.user.id);
      setParties(data);
    }
  };

  return { parties, setParties, isLoading, saveParty, deleteParty, refreshParties };
}
