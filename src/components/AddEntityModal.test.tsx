import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddEntityModal } from './AddEntityModal';
import type { EntityBadgeDescriptor } from './AddEntityModal';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => `https://ik.test${path}`,
}));

interface TestEntity {
  id: string;
  name: string;
  imageUrl: string;
  kind: string;
}

const ENTITIES: TestEntity[] = [
  { id: 'gamma', name: 'Gamma', imageUrl: '/assets/test/gamma.webp', kind: 'Support' },
  { id: 'alpha', name: 'Alpha', imageUrl: '/assets/test/alpha.webp', kind: 'Vanguard' },
  { id: 'beta', name: 'Beta', imageUrl: '/assets/test/beta.webp', kind: 'Vanguard' },
];

function makeProps() {
  return {
    title: 'Add Entity',
    entityNoun: 'entities',
    available: ENTITIES,
    tracked: [] as { id: string }[],
    searchKeys: ['name', 'kind'],
    getBadges: (e: TestEntity): EntityBadgeDescriptor[] => [
      { label: e.kind, variant: 'kind', modifier: e.kind.toLowerCase() },
    ],
    onAdd: vi.fn(),
    onClose: vi.fn(),
  };
}

describe('AddEntityModal', () => {
  it('renders the title and all untracked entities sorted by name', () => {
    const { container } = render(<AddEntityModal {...makeProps()} />);
    expect(screen.getByText('Add Entity')).toBeInTheDocument();
    const names = [...container.querySelectorAll('.modal-list-name')].map((n) => n.textContent);
    expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('excludes tracked entities by id', () => {
    render(<AddEntityModal {...makeProps()} tracked={[{ id: 'alpha' }]} />);
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('fuzzy-searches by name', async () => {
    const user = userEvent.setup();
    render(<AddEntityModal {...makeProps()} />);
    await user.type(screen.getByPlaceholderText('Search entities...'), 'Gama');
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('searches by a secondary key', async () => {
    const user = userEvent.setup();
    render(<AddEntityModal {...makeProps()} />);
    await user.type(screen.getByPlaceholderText('Search entities...'), 'Vanguard');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });

  it('shows the full sorted list again when the search is cleared', async () => {
    const user = userEvent.setup();
    const { container } = render(<AddEntityModal {...makeProps()} />);
    const input = screen.getByPlaceholderText('Search entities...');
    await user.type(input, 'Alpha');
    await user.clear(input);
    const names = [...container.querySelectorAll('.modal-list-name')].map((n) => n.textContent);
    expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('calls onAdd with the full entity when a row is clicked', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<AddEntityModal {...props} />);
    await user.click(screen.getByText('Alpha'));
    expect(props.onAdd).toHaveBeenCalledWith(ENTITIES[1]);
  });

  it('shows the empty state with the noun and search term', async () => {
    const user = userEvent.setup();
    render(<AddEntityModal {...makeProps()} />);
    await user.type(screen.getByPlaceholderText('Search entities...'), 'zzzzzz');
    expect(screen.getByText(/No entities found matching "zzzzzz"/)).toBeInTheDocument();
  });

  it('resolves avatars through getAvatarUrl', () => {
    render(<AddEntityModal {...makeProps()} />);
    const img = screen.getByAltText('Alpha') as HTMLImageElement;
    expect(img.src).toBe('https://ik.test/assets/test/alpha.webp');
  });

  it('falls back to ui-avatars when the image fails to load', () => {
    render(<AddEntityModal {...makeProps()} />);
    const img = screen.getByAltText('Alpha') as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain('https://ui-avatars.com/api/?name=Alpha');
  });

  it('renders badge descriptors with the canonical GameBadge class list', () => {
    render(<AddEntityModal {...makeProps()} />);
    const badge = screen.getAllByText('Vanguard')[0];
    expect(badge.className).toBe('game-badge kind-badge kind-vanguard');
  });
});
