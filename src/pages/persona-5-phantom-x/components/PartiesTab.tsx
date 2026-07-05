import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { P5xThief } from '@/data/persona-5-phantom-x/thieves';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import './PartiesTab.css';

const P5X_PARTY_VIEW: PartyViewConfig<P5xThief> = {
  nouns: {
    party: 'Team',
    partiesLower: 'teams',
    entity: 'thief',
    header: 'Your Teams',
    namePlaceholder: 'e.g. Kamoshida Palace Crew',
    searchPlaceholder: 'Search thief...',
  },
  resolveSlotImage: (thief) => getMugshotUrl(thief.imageUrl),
  resolveListImage: (thief) => getAvatarUrl(thief.imageUrl),
  supportsTier: true,
  supportsFavorite: true,
};

interface PartiesTabProps {
  parties: Party[];
  availableThieves: P5xThief[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableThieves,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
}: PartiesTabProps) {
  return (
    <PartiesView
      config={P5X_PARTY_VIEW}
      parties={parties}
      entities={availableThieves}
      onSaveParty={onSaveParty}
      onDeleteParty={onDeleteParty}
      onToggleFavorite={onToggleFavorite}
      session={session}
    />
  );
}
