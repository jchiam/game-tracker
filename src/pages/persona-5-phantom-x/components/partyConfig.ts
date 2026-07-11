import type { P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { P5xPersona } from '@/data/persona-5-phantom-x/personas';
import {
  getMugshotUrl,
  getAvatarUrl,
  getPersonaMugshotUrl,
  getPersonaAvatarUrl,
} from '@/lib/imagekit';
import { type PartyViewConfig, type SlotConfig } from '@/components/parties/PartiesView';

/**
 * P5X parties combine two catalogs in one editor: personas (Wonder's equipment,
 * slots 1–3) and thieves (slots 4–7). They are merged into a single tagged
 * union so the shared PartiesView can filter each slot's picker by `entityType`.
 */
export type P5xPartyEntity = (P5xThief | P5xPersona) & { entityType: 'thief' | 'persona' };

// Wonder is the implicit protagonist — always present, never stored. Wonder has
// no Prydwen catalog entry (not a recruitable thief), so this dedicated portrait
// is a committed public asset served as a raw local path (never through ImageKit).
const WONDER_IMAGE = '/assets/persona-5-phantom-x/wonder.webp';

const isPersona = (e: P5xPartyEntity) => e.entityType === 'persona';
const isThief = (e: P5xPartyEntity): e is P5xThief & { entityType: 'thief' } =>
  e.entityType === 'thief';

// Navigators are a distinct subset of the thief roster (role === 'Navigator'):
// off-field support units that can only occupy the dedicated Navigator slot (7).
// The active thief slots (4–6) therefore exclude them.
const isNavigator = (e: P5xPartyEntity) => isThief(e) && e.role === 'Navigator';
const isActiveThief = (e: P5xPartyEntity) => isThief(e) && e.role !== 'Navigator';

export const P5X_SLOTS: SlotConfig<P5xPartyEntity>[] = [
  { index: -1, fixed: { image: WONDER_IMAGE, name: 'Wonder' }, group: 'wonder' },
  {
    index: 1,
    label: 'Persona 1',
    entityFilter: isPersona,
    searchPlaceholder: 'Search persona...',
    group: 'wonder',
  },
  {
    index: 2,
    label: 'Persona 2',
    entityFilter: isPersona,
    searchPlaceholder: 'Search persona...',
    group: 'wonder',
  },
  {
    index: 3,
    label: 'Persona 3',
    entityFilter: isPersona,
    searchPlaceholder: 'Search persona...',
    group: 'wonder',
  },
  {
    index: 4,
    label: 'Phantom Thief 1',
    entityFilter: isActiveThief,
    searchPlaceholder: 'Search phantom thief...',
    group: 'thieves',
  },
  {
    index: 5,
    label: 'Phantom Thief 2',
    entityFilter: isActiveThief,
    searchPlaceholder: 'Search phantom thief...',
    group: 'thieves',
  },
  {
    index: 6,
    label: 'Phantom Thief 3',
    entityFilter: isActiveThief,
    searchPlaceholder: 'Search phantom thief...',
    group: 'thieves',
  },
  {
    index: 7,
    label: 'Navigator',
    entityFilter: isNavigator,
    searchPlaceholder: 'Search navigator...',
    group: 'thieves',
  },
];

export const P5X_PARTY_VIEW: PartyViewConfig<P5xPartyEntity> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'member',
    header: 'Your Parties',
    namePlaceholder: 'e.g. Kamoshida Palace Crew',
    searchPlaceholder: 'Search...',
  },
  // Parity with the roster search (useThieves fuseKeys): a codename like "Joker"
  // finds "Ren Amamiya" in the picker just as it does in the roster. Fuse skips
  // keys absent on an entity, so persona-slot entities match on name only.
  searchKeys: ['name', 'codename', 'personaName', 'role', 'element'],
  resolveSlotImage: (e) =>
    isPersona(e) ? getPersonaMugshotUrl(e.imageUrl) : getMugshotUrl(e.imageUrl),
  resolveListImage: (e) =>
    isPersona(e) ? getPersonaAvatarUrl(e.imageUrl) : getAvatarUrl(e.imageUrl),
  supportsTier: true,
  supportsFavorite: true,
  slots: P5X_SLOTS,
  slotGroups: {
    wonder: { label: "Wonder's Team", accent: 'p5x-wonder-panel' },
    // 3 active thieves + the Navigator (4th slot) share one row; the Navigator
    // slot keeps its own label and role filter.
    thieves: { label: 'Phantom Thieves', accent: 'p5x-thief-panel' },
  },
  variantClass: 'p5x-party',
};
