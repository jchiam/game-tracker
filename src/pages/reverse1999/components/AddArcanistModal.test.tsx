import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddArcanistModal } from '@/pages/reverse1999/components/AddArcanistModal';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999TrackedArcanist } from '@/types';

// ImageKit not configured in tests — getAvatarUrl returns the path unchanged.

const availableArcanists: Arcanist[] = [
  { id: '37', name: '37', afflatus: 'Star', damageType: 'Mental', imageUrl: '/37.webp' },
  {
    id: 'regulus',
    name: 'Regulus',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/regulus.webp',
  },
  {
    id: 'vertin',
    name: 'Vertin',
    afflatus: 'Star',
    damageType: 'Reality',
    imageUrl: '/vertin.webp',
  },
];

const emptyTracked: R1999TrackedArcanist[] = [];

describe('AddArcanistModal', () => {
  it('renders the modal title', () => {
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /add arcanist/i })).toBeInTheDocument();
  });

  it('renders all available arcanists', () => {
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.getByText('Regulus')).toBeInTheDocument();
    expect(screen.getByText('Vertin')).toBeInTheDocument();
  });

  it('filters out already-tracked arcanists', () => {
    const tracked = [
      {
        ...availableArcanists[1],
        dbId: 'db-1',
        isFavorited: false,
        level: 40,
        portraitLevel: 2,
        resonanceLevel: 5,
        euphoriaStage: 0,
        psychubeId: null,
        psychubeLevel: 1,
        psychubeAmplification: 1,
      },
    ] as R1999TrackedArcanist[];
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={tracked}
        onAddArcanist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
  });

  it('filters arcanists by search input', async () => {
    const user = userEvent.setup();
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/search/i), 'Vertin');
    expect(screen.getByText('Vertin')).toBeInTheDocument();
    expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
  });

  it('shows no-results message when search finds nothing', async () => {
    const user = userEvent.setup();
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/search/i), 'zzznomatch');
    expect(screen.getByText(/no arcanists found/i)).toBeInTheDocument();
  });

  it('calls onAddArcanist when an arcanist is clicked', () => {
    const onAddArcanist = vi.fn();
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={onAddArcanist}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Regulus'));
    expect(onAddArcanist).toHaveBeenCalledWith(availableArcanists[1]);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(container.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to ui-avatars when an arcanist list image fails to load', () => {
    render(
      <AddArcanistModal
        availableArcanists={availableArcanists}
        trackedArcanists={emptyTracked}
        onAddArcanist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const img = screen.getByAltText('Regulus');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });
});
