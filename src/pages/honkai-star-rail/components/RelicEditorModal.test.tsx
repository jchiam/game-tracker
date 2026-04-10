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

  // --- Equip tab: save interactions ---

  it('calls onSave when a relic set is selected from the dropdown', () => {
    const onSave = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={cavernRelicSets}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    // selects[0] is the relic set select
    fireEvent.change(selects[0], { target: { value: '101' } });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ setId: '101' }));
  });

  it('calls onSave when a main stat is selected for a flexible slot', () => {
    const onSave = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    // selects[1] is the main stat select (selects[0] is relic set)
    fireEvent.change(selects[1], { target: { value: 'CRIT Rate' } });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ mainStat: 'CRIT Rate' }));
  });

  it('prunes a substat that conflicts with the newly selected main stat', () => {
    const onSave = vi.fn();
    const char = makeChar({
      relics: {
        head: null,
        hands: null,
        body: { setId: null, mainStat: null, subStats: [{ type: 'CRIT Rate', value: '3.2%' }] },
        feet: null,
        sphere: null,
        rope: null,
      },
    });
    render(
      <RelicEditorModal
        char={char}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'CRIT Rate' } });
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ mainStat: 'CRIT Rate', subStats: [] }),
    );
  });

  it('calls onSave with a new substat when "+ Add Substat" is clicked', () => {
    const onSave = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /\+ add substat/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subStats: expect.arrayContaining([expect.objectContaining({ value: '2.5%' })]),
      }),
    );
  });

  it('calls onSave when a substat value input is changed', () => {
    const onSave = vi.fn();
    const char = makeChar({
      relics: {
        head: null,
        hands: null,
        body: { setId: null, mainStat: null, subStats: [{ type: 'HP', value: '3.2%' }] },
        feet: null,
        sphere: null,
        rope: null,
      },
    });
    render(
      <RelicEditorModal
        char={char}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Value'), { target: { value: '5.0%' } });
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subStats: [expect.objectContaining({ value: '5.0%' })],
      }),
    );
  });

  it('calls onSave with the substat removed when its remove button is clicked', () => {
    const onSave = vi.fn();
    const char = makeChar({
      relics: {
        head: null,
        hands: null,
        body: { setId: null, mainStat: null, subStats: [{ type: 'HP', value: '3.2%' }] },
        feet: null,
        sphere: null,
        rope: null,
      },
    });
    const { container } = render(
      <RelicEditorModal
        char={char}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(container.querySelector('.remove-substat')!);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ subStats: [] }));
  });

  // --- Modal close interactions ---

  it('calls onClose when the header ✕ button is clicked', () => {
    const onClose = vi.fn();
    render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the modal overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <RelicEditorModal
        char={makeChar()}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(container.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- Build Preferences tab: head/hands behaviour ---

  it('does not show a main stat section on the preferences tab for head slot', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.queryByText(/preferred main stat/i)).not.toBeInTheDocument();
  });

  it('does not show a main stat section on the preferences tab for hands slot', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.queryByText(/preferred main stat/i)).not.toBeInTheDocument();
  });

  // --- Build Preferences tab: editing ---

  it('calls onUpdateBuildPreferences when build comments are entered', () => {
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
    fireEvent.change(screen.getByPlaceholderText(/additional notes/i), {
      target: { value: 'Focus on CRIT stats' },
    });
    expect(onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ comments: 'Focus on CRIT stats' }),
    );
  });

  it('pre-populates existing build comments in the textarea', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [],
        comments: 'Pre-existing comment',
      },
    });
    render(
      <RelicEditorModal
        char={char}
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
    expect(screen.getByDisplayValue('Pre-existing comment')).toBeInTheDocument();
  });

  it('calls onUpdateBuildPreferences when a main stat preference is removed', () => {
    const onUpdateBuildPreferences = vi.fn();
    const char = makeChar({
      buildPreferences: {
        mainStats: {
          body: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
          feet: [],
          sphere: [],
          rope: [],
        },
        subStats: [],
      },
    });
    const { container } = render(
      <RelicEditorModal
        char={char}
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
    fireEvent.click(container.querySelector('.remove-pref-btn')!);
    expect(onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ mainStats: expect.objectContaining({ body: [] }) }),
    );
  });

  it('calls onUpdateBuildPreferences when a sub stat preference is removed', () => {
    const onUpdateBuildPreferences = vi.fn();
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
      },
    });
    const { container } = render(
      <RelicEditorModal
        char={char}
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
    fireEvent.click(container.querySelector('.remove-pref-btn')!);
    expect(onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ subStats: [] }),
    );
  });

  // --- Equip tab: substat type change ---

  it('calls onSave when a substat type select is changed', () => {
    const onSave = vi.fn();
    const char = makeChar({
      relics: {
        head: null,
        hands: null,
        body: { setId: null, mainStat: null, subStats: [{ type: 'HP', value: '3.2%' }] },
        feet: null,
        sphere: null,
        rope: null,
      },
    });
    render(
      <RelicEditorModal
        char={char}
        slot="body"
        availableRelicSets={[]}
        emptyRelic={emptyRelic}
        onSave={onSave}
        onRemove={vi.fn()}
        onUpdateBuildPreferences={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    // selects[0] = relic set, selects[1] = main stat, selects[2] = substat type
    fireEvent.change(selects[2], { target: { value: 'CRIT Rate' } });
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subStats: [expect.objectContaining({ type: 'CRIT Rate' })],
      }),
    );
  });

  // --- Preferences tab: stat select changes ---

  it('calls onUpdateBuildPreferences when a main stat preference stat is changed', () => {
    const onUpdateBuildPreferences = vi.fn();
    const char = makeChar({
      buildPreferences: {
        mainStats: {
          body: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
          feet: [],
          sphere: [],
          rope: [],
        },
        subStats: [],
      },
    });
    render(
      <RelicEditorModal
        char={char}
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
    const prefSelects = screen.getAllByRole('combobox');
    fireEvent.change(prefSelects[0], { target: { value: 'CRIT DMG' } });
    expect(onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        mainStats: expect.objectContaining({
          body: expect.arrayContaining([expect.objectContaining({ stat: 'CRIT DMG' })]),
        }),
      }),
    );
  });

  it('calls onUpdateBuildPreferences when a sub stat preference stat is changed', () => {
    const onUpdateBuildPreferences = vi.fn();
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [{ stat: 'HP', operator: null, orderIndex: 0 }],
      },
    });
    render(
      <RelicEditorModal
        char={char}
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
    const prefSelects = screen.getAllByRole('combobox');
    fireEvent.change(prefSelects[0], { target: { value: 'CRIT Rate' } });
    expect(onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        subStats: expect.arrayContaining([expect.objectContaining({ stat: 'CRIT Rate' })]),
      }),
    );
  });
});
