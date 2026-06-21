import { type Session } from '@supabase/supabase-js';
import type { EndfieldParty, EndfieldPartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
} from '@/services/arknights-endfield/partyService';
import { useParties as usePartiesBase } from '@/hooks/useParties';

export function useParties(session: Session | null) {
  const { parties, isLoading, saveParty, deleteParty, refreshParties } = usePartiesBase<
    EndfieldParty,
    EndfieldPartyMember
  >(session, {
    loadParties,
    saveParty: apiSaveParty,
    deleteParty: apiDeleteParty,
  });

  return { parties, isLoading, saveParty, deleteParty, refreshParties };
}
