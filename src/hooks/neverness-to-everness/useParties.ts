import { type Session } from '@supabase/supabase-js';
import type { N2EParty, N2EPartyMember } from '@/types';
import {
  loadParties,
  saveParty as apiSaveParty,
  deleteParty as apiDeleteParty,
  toggleFavoriteParty as apiToggleFavorite,
} from '@/services/neverness-to-everness/partyService';
import { useParties as usePartiesBase } from '@/hooks/useParties';

export function useParties(session: Session | null) {
  const { parties, setParties, isLoading, saveParty, deleteParty, refreshParties } = usePartiesBase<
    N2EParty,
    N2EPartyMember
  >(session, { loadParties, saveParty: apiSaveParty, deleteParty: apiDeleteParty });

  const toggleFavoriteParty = (partyId: string, value: boolean) => {
    setParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, isFavorited: value } : p)));
    apiToggleFavorite(partyId, value);
  };

  return { parties, isLoading, saveParty, deleteParty, toggleFavoriteParty, refreshParties };
}
