import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { AeOperator } from '@/data/arknights-endfield/operators';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import './PartiesTab.css';

const AE_PARTY_VIEW: PartyViewConfig<AeOperator> = {
  nouns: {
    party: 'Squad',
    partiesLower: 'squads',
    entity: 'operator',
    header: 'Your Squads',
    namePlaceholder: 'e.g. Boss Rush Team',
    searchPlaceholder: 'Search operator...',
  },
  resolveSlotImage: (operator) => getMugshotUrl(operator.imageUrl),
  resolveListImage: (operator) => getAvatarUrl(operator.imageUrl),
  supportsTier: false,
  supportsFavorite: false,
  variantClass: 'endfield',
};

interface PartiesTabProps {
  parties: Party[];
  availableOperators: AeOperator[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableOperators,
  onSaveParty,
  onDeleteParty,
  session,
}: PartiesTabProps) {
  return (
    <PartiesView
      config={AE_PARTY_VIEW}
      parties={parties}
      entities={availableOperators}
      onSaveParty={onSaveParty}
      onDeleteParty={onDeleteParty}
      session={session}
    />
  );
}
