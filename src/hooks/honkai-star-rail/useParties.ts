import { useState, useEffect } from 'react';
import { type Session } from '@supabase/supabase-js';
import type { HsrParty, HsrPartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
} from '@/services/honkai-star-rail/partyService';

export function useParties(session: Session | null) {
  const [parties, setParties] = useState<HsrParty[]>([]);
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
  }, [session?.user]);

  const saveParty = async (party: Partial<HsrParty> & { members: HsrPartyMember[] }) => {
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

  return {
    parties,
    isLoading,
    saveParty,
    deleteParty,
    refreshParties: async () => {
      if (session?.user) {
        const data = await loadParties(session.user.id);
        setParties(data);
      }
    },
  };
}
