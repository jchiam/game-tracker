import { type Session } from '@supabase/supabase-js';
import type { HsrParty, HsrPartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
} from '@/services/honkai-star-rail/partyService';
import { useParties as usePartiesBase } from '@/hooks/useParties';

export function useParties(session: Session | null) {
  const { parties, isLoading, saveParty, deleteParty, refreshParties } = usePartiesBase<
    HsrParty,
    HsrPartyMember
  >(session, { loadParties, saveParty: apiSaveParty, deleteParty: apiDeleteParty });

  return { parties, isLoading, saveParty, deleteParty, refreshParties };
}
