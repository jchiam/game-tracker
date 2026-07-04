import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AddEntityModal } from './AddEntityModal';
import type { EntityBadgeDescriptor } from './AddEntityModal';
import './Modal.css';
import './AddEntityModal.css';
import '@/pages/honkai-star-rail/components/CharacterCard.css';
import '@/pages/arknights-endfield/components/OperatorCard.css';
import '@/App.css';

interface DemoEntity {
  id: string;
  name: string;
  imageUrl: string;
  element: string;
  path: string;
}

const DEMO_ENTITIES: DemoEntity[] = [
  {
    id: 'acheron',
    name: 'Acheron',
    imageUrl: '/acheron.webp',
    element: 'Thunder',
    path: 'Nihility',
  },
  { id: 'seele', name: 'Seele', imageUrl: '/seele.webp', element: 'Quantum', path: 'The Hunt' },
  {
    id: 'firefly',
    name: 'Firefly',
    imageUrl: '/firefly.webp',
    element: 'Fire',
    path: 'Destruction',
  },
  { id: 'ruan-mei', name: 'Ruan Mei', imageUrl: '/ruan-mei.webp', element: 'Ice', path: 'Harmony' },
];

const getBadges = (e: DemoEntity): EntityBadgeDescriptor[] => [
  { label: e.element, variant: 'element', modifier: e.element.toLowerCase() },
  { label: e.path, variant: 'path', modifier: e.path.toLowerCase().replace(/\s+/g, '-') },
];

const meta = {
  title: 'Components/AddEntityModal',
  component: AddEntityModal,
  tags: ['autodocs'],
  args: {
    title: 'Add Character',
    entityNoun: 'characters',
    available: DEMO_ENTITIES,
    tracked: [],
    searchKeys: ['name', 'element', 'path'],
    getBadges,
    onAdd: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof AddEntityModal<DemoEntity>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTrackedExcluded: Story = {
  args: {
    tracked: [{ id: 'acheron' }, { id: 'seele' }],
  },
};

export const EmptyCatalog: Story = {
  args: {
    available: [],
  },
};
