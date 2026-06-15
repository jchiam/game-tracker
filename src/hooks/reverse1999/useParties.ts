import { type Session } from '@supabase/supabase-js';
import type { R1999Party, R1999PartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
  toggleFavoriteParty as apiToggleFavorite,
} from '@/services/reverse1999/partyService';
import { useParties as usePartiesBase } from '@/hooks/useParties';

export function useParties(session: Session | null) {
  const { parties, setParties, isLoading, saveParty, deleteParty, refreshParties } = usePartiesBase<
    R1999Party,
    R1999PartyMember
  >(session, { loadParties, saveParty: apiSaveParty, deleteParty: apiDeleteParty });

  const toggleFavoriteParty = (partyId: string, value: boolean) => {
    setParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, isFavorited: value } : p)));
    apiToggleFavorite(partyId, value);
  };

  return { parties, isLoading, saveParty, deleteParty, toggleFavoriteParty, refreshParties };
}
