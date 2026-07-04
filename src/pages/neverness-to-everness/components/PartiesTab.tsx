import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';

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
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableCharacters,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
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
    />
  );
}
