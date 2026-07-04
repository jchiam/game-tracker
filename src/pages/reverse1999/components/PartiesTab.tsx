import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import './PartiesTab.css';

const R1999_PARTY_VIEW: PartyViewConfig<Arcanist> = {
  nouns: {
    party: 'Lineup',
    partiesLower: 'lineups',
    entity: 'arcanist',
    header: 'Your Lineups',
    namePlaceholder: 'e.g. Limbo of Ruin 3-3',
    searchPlaceholder: 'Search arcanist...',
  },
  resolveSlotImage: (arcanist) => getMugshotUrl(arcanist.imageUrl),
  resolveListImage: (arcanist) => getAvatarUrl(arcanist.imageUrl),
  slotAccentClass: (arcanist) => `afflatus-${arcanist.afflatus.toLowerCase()}`,
  supportsTier: true,
  supportsFavorite: true,
};

interface PartiesTabProps {
  parties: Party[];
  availableArcanists: Arcanist[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableArcanists,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
}: PartiesTabProps) {
  return (
    <PartiesView
      config={R1999_PARTY_VIEW}
      parties={parties}
      entities={availableArcanists}
      onSaveParty={onSaveParty}
      onDeleteParty={onDeleteParty}
      onToggleFavorite={onToggleFavorite}
      session={session}
    />
  );
}
