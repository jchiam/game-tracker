import { type Session } from '@supabase/supabase-js';
import type { AeParty, AePartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
} from '@/services/arknights-endfield/partyService';
import { useParties as usePartiesBase } from '@/hooks/useParties';

export function useParties(session: Session | null) {
  const { parties, isLoading, saveParty, deleteParty, refreshParties } = usePartiesBase<
    AeParty,
    AePartyMember
  >(session, {
    loadParties,
    saveParty: apiSaveParty,
    deleteParty: apiDeleteParty,
  });

  return { parties, isLoading, saveParty, deleteParty, refreshParties };
}
