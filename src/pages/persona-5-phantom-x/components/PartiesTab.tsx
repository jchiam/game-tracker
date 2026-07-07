import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import type { P5xThief } from '@/data/persona-5-phantom-x/thieves';
import { ALL_PERSONAS, type P5xPersona } from '@/data/persona-5-phantom-x/personas';
import {
  getMugshotUrl,
  getAvatarUrl,
  getPersonaMugshotUrl,
  getPersonaAvatarUrl,
} from '@/lib/imagekit';
import {
  PartiesView,
  type PartyViewConfig,
  type SlotConfig,
} from '@/components/parties/PartiesView';
import './PartiesTab.css';

/**
 * P5X parties combine two catalogs in one editor: personas (Wonder's equipment,
 * slots 1–3) and thieves (slots 4–6). They are merged into a single tagged
 * union so the shared PartiesView can filter each slot's picker by `entityType`.
 */
type P5xPartyEntity = (P5xThief | P5xPersona) & { entityType: 'thief' | 'persona' };

// Wonder is the implicit protagonist — always present, never stored. Wonder has
// no Prydwen catalog entry (not a recruitable thief), so this dedicated portrait
// is a committed public asset served as a raw local path (never through ImageKit).
const WONDER_IMAGE = '/assets/persona-5-phantom-x/wonder.webp';

const isPersona = (e: P5xPartyEntity) => e.entityType === 'persona';
const isThief = (e: P5xPartyEntity) => e.entityType === 'thief';

const P5X_SLOTS: SlotConfig<P5xPartyEntity>[] = [
  { index: -1, fixed: { image: WONDER_IMAGE, name: 'Wonder' }, group: 'wonder' },
  { index: 1, label: 'Persona 1', entityFilter: isPersona, searchPlaceholder: 'Search persona...', group: 'wonder' },
  { index: 2, label: 'Persona 2', entityFilter: isPersona, searchPlaceholder: 'Search persona...', group: 'wonder' },
  { index: 3, label: 'Persona 3', entityFilter: isPersona, searchPlaceholder: 'Search persona...', group: 'wonder' },
  { index: 4, label: 'Phantom Thief 1', entityFilter: isThief, searchPlaceholder: 'Search phantom thief...', group: 'thieves' },
  { index: 5, label: 'Phantom Thief 2', entityFilter: isThief, searchPlaceholder: 'Search phantom thief...', group: 'thieves' },
  { index: 6, label: 'Phantom Thief 3', entityFilter: isThief, searchPlaceholder: 'Search phantom thief...', group: 'thieves' },
];

const P5X_PARTY_VIEW: PartyViewConfig<P5xPartyEntity> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'member',
    header: 'Your Parties',
    namePlaceholder: 'e.g. Kamoshida Palace Crew',
    searchPlaceholder: 'Search...',
  },
  resolveSlotImage: (e) =>
    isPersona(e) ? getPersonaMugshotUrl(e.imageUrl) : getMugshotUrl(e.imageUrl),
  resolveListImage: (e) =>
    isPersona(e) ? getPersonaAvatarUrl(e.imageUrl) : getAvatarUrl(e.imageUrl),
  supportsTier: true,
  supportsFavorite: true,
  slots: P5X_SLOTS,
  slotGroups: {
    wonder: { label: "Wonder's Team", accent: 'p5x-wonder-panel' },
    thieves: { label: 'Phantom Thieves', accent: 'p5x-thief-panel' },
  },
  variantClass: 'p5x-party',
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
    />
  );
}
