import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';

const HSR_PARTY_VIEW: PartyViewConfig<Character> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'character',
    header: 'Your Lineups',
    namePlaceholder: 'e.g. Memory of Chaos 12-1',
    searchPlaceholder: 'Search character...',
  },
  resolveSlotImage: (char) => char.imageUrl,
  resolveListImage: (char) => char.imageUrl,
  slotAccentClass: (char) => `element-${char.element.toLowerCase()}`,
  supportsTier: false,
  supportsFavorite: false,
};

interface PartiesTabProps {
  parties: Party[];
  availableCharacters: Character[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableCharacters,
  onSaveParty,
  onDeleteParty,
  session,
}: PartiesTabProps) {
  return (
    <PartiesView
      config={HSR_PARTY_VIEW}
      parties={parties}
      entities={availableCharacters}
      onSaveParty={onSaveParty}
      onDeleteParty={onDeleteParty}
      session={session}
    />
  );
}
