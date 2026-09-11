import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember, PartySaveResult } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import './PartiesTab.css';

const HSR_PARTY_VIEW: PartyViewConfig<Character> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'character',
    header: 'Your Lineups',
    namePlaceholder: 'e.g. Memory of Chaos 12-1',
    searchPlaceholder: 'Search character...',
  },
  resolveSlotImage: (char) => getMugshotUrl(char.imageUrl),
  resolveListImage: (char) => getAvatarUrl(char.imageUrl),
  slotAccentClass: (char) => `element-${char.element.toLowerCase()}`,
  // Only one Trailblazer path form may be fielded per party (game rule)
  exclusionGroup: (char) => (char.id.startsWith('trailblazer_') ? 'trailblazer' : null),
  supportsTier: true,
  supportsFavorite: true,
};

interface PartiesTabProps {
  parties: Party[];
  availableCharacters: Character[];
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
      config={HSR_PARTY_VIEW}
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
