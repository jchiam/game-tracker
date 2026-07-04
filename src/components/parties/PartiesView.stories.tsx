import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Session } from '@supabase/supabase-js';
import { PartiesView, type PartyViewConfig } from './PartiesView';
import type { Party } from '@/types';
import './PartyEditorModal.css';
import '@/components/Modal.css';
import '@/styles/party.css';
import '@/App.css';

interface DemoEntity {
  id: string;
  name: string;
  imageUrl: string;
  element?: string;
}

const DEMO_ENTITIES: DemoEntity[] = [
  { id: 'acheron', name: 'Acheron', imageUrl: '/acheron.webp', element: 'Thunder' },
  { id: 'seele', name: 'Seele', imageUrl: '/seele.webp', element: 'Quantum' },
  { id: 'firefly', name: 'Firefly', imageUrl: '/firefly.webp', element: 'Fire' },
  { id: 'ruan-mei', name: 'Ruan Mei', imageUrl: '/ruan-mei.webp', element: 'Ice' },
];

const PLAIN_CONFIG: PartyViewConfig<DemoEntity> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'character',
    header: 'Your Lineups',
    namePlaceholder: 'e.g. Memory of Chaos 12-1',
    searchPlaceholder: 'Search character...',
  },
  resolveSlotImage: (e) => e.imageUrl,
  resolveListImage: (e) => e.imageUrl,
  slotAccentClass: (e) => `element-${(e.element ?? '').toLowerCase()}`,
  supportsTier: false,
  supportsFavorite: false,
};

const TIERED_CONFIG: PartyViewConfig<DemoEntity> = {
  ...PLAIN_CONFIG,
  nouns: { ...PLAIN_CONFIG.nouns, party: 'Lineup', partiesLower: 'lineups' },
  supportsTier: true,
  supportsFavorite: true,
};

const DEMO_SESSION = { user: { id: 'storybook-user' } } as Session;

function makeParty(overrides: Partial<Party>): Party {
  return {
    id: 'party-1',
    profileId: 'storybook-user',
    name: 'Team Alpha',
    notes: null,
    members: [
      { entityId: 'acheron', slotIndex: 0 },
      { entityId: 'seele', slotIndex: 1 },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const meta = {
  title: 'Components/PartiesView',
  component: PartiesView,
  tags: ['autodocs'],
  args: {
    config: PLAIN_CONFIG,
    entities: DEMO_ENTITIES,
    parties: [
      makeParty({ id: 'p1', name: 'Team Alpha', notes: 'Hypercarry core.' }),
      makeParty({ id: 'p2', name: 'Team Beta', members: [] }),
    ],
    onSaveParty: fn(async () => 'party-id'),
    onDeleteParty: fn(async () => true),
    session: DEMO_SESSION,
  },
} satisfies Meta<typeof PartiesView<DemoEntity>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const WithTierAndFavorite: Story = {
  args: {
    config: TIERED_CONFIG,
    parties: [
      makeParty({ id: 'p1', name: 'Limbo 3-3', tier: 'S+', isFavorited: true }),
      makeParty({ id: 'p2', name: 'Farming crew', tier: 'B', members: [] }),
      makeParty({ id: 'p3', name: 'Untiered', tier: null }),
    ],
    onToggleFavorite: fn(),
  },
};

export const Empty: Story = {
  args: {
    parties: [],
  },
};

export const SignedOut: Story = {
  args: {
    session: null,
  },
};
