import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember, PartySaveResult } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import './PartiesTab.css';

const N2E_PARTY_VIEW: PartyViewConfig<N2ECharacter> = {
  nouns: {
    party: 'Lineup',
    partiesLower: 'lineups',
    entity: 'character',
    header: 'Your Lineups',
    namePlaceholder: 'e.g. Abyss Floor 12',
    searchPlaceholder: 'Search esper...',
  },
  resolveSlotImage: (character) => getMugshotUrl(character.imageUrl),
  resolveListImage: (character) => getAvatarUrl(character.imageUrl),
  slotAccentClass: (character) => `esper-${character.esperType.toLowerCase()}`,
  supportsTier: true,
  supportsFavorite: true,
};

interface PartiesTabProps {
  parties: Party[];
  availableCharacters: N2ECharacter[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<PartySaveResult>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
  isInitialLoad?: boolean;
  isLoadError?: boolean;
  onRetry?: () => void;
}

export function PartiesTab({
  parties,
  availableCharacters,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
  isInitialLoad,
  isLoadError,
  onRetry,
}: PartiesTabProps) {
  return (
    <PartiesView
      config={N2E_PARTY_VIEW}
      parties={parties}
      entities={availableCharacters}
      onSaveParty={onSaveParty}
      onDeleteParty={onDeleteParty}
      onToggleFavorite={onToggleFavorite}
      session={session}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={onRetry}
    />
  );
}
