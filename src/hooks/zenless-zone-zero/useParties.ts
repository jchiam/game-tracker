import { type Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
  toggleFavoriteParty as apiToggleFavorite,
} from '@/services/zenless-zone-zero/partyService';
import { useParties as usePartiesBase, makeFavoriteToggle } from '@/hooks/useParties';

export function useParties(session: Session | null) {
  const { parties, setParties, partiesRef, isLoading, saveParty, deleteParty, refreshParties } =
    usePartiesBase<Party, PartyMember>(session, {
      loadParties,
      saveParty: apiSaveParty,
      deleteParty: apiDeleteParty,
    });

  const toggleFavoriteParty = makeFavoriteToggle(setParties, partiesRef, apiToggleFavorite);

  return { parties, isLoading, saveParty, deleteParty, toggleFavoriteParty, refreshParties };
}
