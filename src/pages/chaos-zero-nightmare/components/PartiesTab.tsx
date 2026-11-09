import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember, PartySaveResult } from '@/types';
import type { CznCombatant } from '@/data/chaos-zero-nightmare/combatants';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import { getElementBadge } from './combatantBadges';
import './PartiesTab.css';

// CZN teams field three combatants — the second uniform-but-not-four consumer
// of `PartyViewConfig.slots` after ZZZ (games without `slots` fall back to four).
const CZN_PARTY_VIEW: PartyViewConfig<CznCombatant> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'combatant',
    header: 'Your Parties',
    namePlaceholder: 'e.g. Nightmare Clear Team',
    searchPlaceholder: 'Search combatant...',
  },
  searchKeys: ['name', 'class', 'element'],
  resolveSlotImage: (combatant) => getMugshotUrl(combatant.imageUrl),
  resolveListImage: (combatant) => getAvatarUrl(combatant.imageUrl),
  // czn- prefixed: HSR already claims .slot-avatar.element-* with its own hues.
  slotAccentClass: (combatant) => `czn-element-${getElementBadge(combatant.element).modifier}`,
  supportsTier: true,
  supportsFavorite: true,
  slots: [
    { index: 0, label: 'Combatant 1' },
    { index: 1, label: 'Combatant 2' },
    { index: 2, label: 'Combatant 3' },
  ],
};

interface PartiesTabProps {
  parties: Party[];
  availableCombatants: CznCombatant[];
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
  availableCombatants,
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
      config={CZN_PARTY_VIEW}
      parties={parties}
      entities={availableCombatants}
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
