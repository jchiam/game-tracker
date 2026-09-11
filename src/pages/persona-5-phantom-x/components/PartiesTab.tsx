import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember, PartySaveResult } from '@/types';
import type { P5xThief } from '@/data/persona-5-phantom-x/thieves';
import { ALL_PERSONAS } from '@/data/persona-5-phantom-x/personas';
import { PartiesView } from '@/components/parties/PartiesView';
import { P5X_PARTY_VIEW, type P5xPartyEntity } from './partyConfig';
import './PartiesTab.css';

interface PartiesTabProps {
  parties: Party[];
  availableThieves: P5xThief[];
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
  availableThieves,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
  isInitialLoad,
  isLoadError,
  onRetry,
}: PartiesTabProps) {
  // Thieves come from the user's tracked roster; personas from the full static
  // catalog (personas are equipment, never individually "owned").
  const entities: P5xPartyEntity[] = [
    ...availableThieves.map((t) => ({ ...t, entityType: 'thief' as const })),
    ...ALL_PERSONAS.map((p) => ({ ...p, entityType: 'persona' as const })),
  ];

  return (
    <PartiesView
      config={P5X_PARTY_VIEW}
      parties={parties}
      entities={entities}
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
