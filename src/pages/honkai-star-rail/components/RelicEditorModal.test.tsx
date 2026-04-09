import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RelicEditorModal } from '@/pages/honkai-star-rail/components/RelicEditorModal';
import type { HsrTrackedCharacter } from '@/types';
import type { RelicSet, EquippedRelic } from '@/data/honkai-star-rail/relics';

const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };

const cavernRelicSets: RelicSet[] = [
  { id: '101', name: 'Passerby of Wandering Cloud', icon: '/icon1.png' },
  { id: '102', name: 'Musketeer of Wild Wheat', icon: '/icon2.png' },
];

const planarRelicSets: RelicSet[] = [
  { id: '301', name: 'Space Sealing Station', icon: '/icon3.png' },
  { id: '302', name: 'Fleet of the Ageless', icon: '/icon4.png' },
];

function makeChar(overrides: Partial<HsrTrackedCharacter> = {}): HsrTrackedCharacter {
  return {
    id: 'char-1',
    name: 'Acheron',
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: '/acheron.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 60,
    tracesAttained: false,
    relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
    buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
    ...overrides,
  };
}

describe('RelicEditorModal', () => {
  it('renders the slot name in the title', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="head"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /edit head/i })).toBeInTheDocument();
  });

  it('shows the Equip Relic tab by default', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={cavernRelicSets}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Use exact name to avoid matching "Un-equip Relic" in the footer
    expect(screen.getByRole('button', { name: 'Equip Relic' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Build Preferences' })).not.toHaveClass('active');
  });

  it('switches to Build Preferences tab when clicked', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={cavernRelicSets}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.getByRole('button', { name: 'Build Preferences' })).toHaveClass('active');
  });

  it('shows "HP (Fixed)" for head slot main stat', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="head"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/HP \(Fixed\)/)).toBeInTheDocument();
  });

  it('shows "ATK (Fixed)" for hands slot main stat', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="hands"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/ATK \(Fixed\)/)).toBeInTheDocument();
  });

  it('shows a main stat select for body slot', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={cavernRelicSets}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Multiple selects exist for relic set and main stat
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('shows only cavern relic sets for non-planar slots', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[...cavernRelicSets, ...planarRelicSets]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Passerby of Wandering Cloud')).toBeInTheDocument();
    expect(screen.queryByText('Space Sealing Station')).not.toBeInTheDocument();
  });

  it('shows only planar relic sets for sphere and rope slots', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="sphere"
        availableRelicSets={[...cavernRelicSets, ...planarRelicSets]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Space Sealing Station')).toBeInTheDocument();
    expect(screen.queryByText('Passerby of Wandering Cloud')).not.toBeInTheDocument();
  });

  it('calls onClose when Done button is clicked', () => {
    const onClose = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={onClose}
        onUpdateBuildPreferences={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onRemove when Un-equip Relic button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={onRemove}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /un-equip relic/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not show Un-equip button on preferences tab', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.queryByRole('button', { name: /un-equip relic/i })).not.toBeInTheDocument();
  });

  it('shows Add Priority buttons on preferences tab for body slot', () => {
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    const addButtons = screen.getAllByRole('button', { name: /add priority/i });
    expect(addButtons.length).toBeGreaterThanOrEqual(2); // main stat + sub stat
  });

  it('calls onUpdateBuildPreferences when a sub stat priority is added', () => {
    const onUpdateBuildPreferences = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={onUpdateBuildPreferences}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    // Click the sub stat "Add Priority" button (last one)
    const addButtons = screen.getAllByRole('button', { name: /add priority/i });
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(onUpdateBuildPreferences).toHaveBeenCalled();
  });
});
