import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { ZzzAgent } from '@/data/zenless-zone-zero/agents';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import { getElementBadge } from './agentBadges';
import './PartiesTab.css';

// ZZZ squads field three agents — the first uniform-but-not-four consumer of
// `PartyViewConfig.slots` (games without `slots` fall back to four slots).
const ZZZ_PARTY_VIEW: PartyViewConfig<ZzzAgent> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'agent',
    header: 'Your Parties',
    namePlaceholder: 'e.g. Shiyu Defense Team',
    searchPlaceholder: 'Search agent...',
  },
  searchKeys: ['name', 'specialty', 'element'],
  resolveSlotImage: (agent) => getMugshotUrl(agent.imageUrl),
  resolveListImage: (agent) => getAvatarUrl(agent.imageUrl),
  // zzz- prefixed: HSR already claims .slot-avatar.element-* with its own hues.
  slotAccentClass: (agent) => `zzz-element-${getElementBadge(agent.element).modifier}`,
  supportsTier: true,
  supportsFavorite: true,
  slots: [
    { index: 0, label: 'Agent 1' },
    { index: 1, label: 'Agent 2' },
    { index: 2, label: 'Agent 3' },
  ],
};

interface PartiesTabProps {
  parties: Party[];
  availableAgents: ZzzAgent[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableAgents,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
}: PartiesTabProps) {
  return (
    <PartiesView
      config={ZZZ_PARTY_VIEW}
      parties={parties}
      entities={availableAgents}
      onSaveParty={onSaveParty}
      onDeleteParty={onDeleteParty}
      onToggleFavorite={onToggleFavorite}
      session={session}
    />
  );
}
