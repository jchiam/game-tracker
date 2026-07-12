import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevelationEditorModal } from './RevelationEditorModal';
import type { P5xTrackedThief } from '@/types';

function makeThief(overrides: Partial<P5xTrackedThief> = {}): P5xTrackedThief {
  return {
    id: 'ann-takamaki',
    name: 'Ann Takamaki',
    codename: 'Panther',
    personaName: 'Carmen',
    rarity: 5,
    role: 'Multi-target',
    element: 'Fire',
    imageUrl: '/assets/persona-5-phantom-x/thieves/ann-takamaki.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 45,
    awareness: 3,
    skillsLeveled: false,
    roseMaxed: false,
    mindscapeMaxed: false,
    weaponRarity: 2,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
      comments: '',
    },
    ...overrides,
  };
}

describe('RevelationEditorModal', () => {
  const defaultProps = {
    thief: makeThief(),
    onUpdateSlot: vi.fn(),
    onSavePreferences: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders with Equip Cards tab active by default', () => {
    render(<RevelationEditorModal {...defaultProps} />);
    expect(screen.getByText('Equip Cards')).toHaveClass('active');
    expect(screen.getByText('Build Preferences')).not.toHaveClass('active');
  });

  it('renders five bordered slot cards, space-first', () => {
    const { container } = render(<RevelationEditorModal {...defaultProps} />);
    const cards = Array.from(container.querySelectorAll('.equip-slot-card'));
    expect(cards).toHaveLength(5);
    const headers = cards.map((c) => c.querySelector('.equip-slot-header')?.textContent);
    expect(headers).toEqual(['Space', 'Sun', 'Moon', 'Star', 'Sky']);
  });

  describe('anchor scroll', () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    afterEach(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('scrolls the anchored slot card into view on mount', () => {
      const spy = vi.fn();
      Element.prototype.scrollIntoView = spy;
      render(<RevelationEditorModal {...defaultProps} anchorSlot="star" />);
      expect(spy).toHaveBeenCalledTimes(1);
      const anchored = spy.mock.contexts[0] as HTMLElement;
      expect(anchored.dataset.slot).toBe('star');
    });

    it('does not scroll when no anchor slot is given', () => {
      const spy = vi.fn();
      Element.prototype.scrollIntoView = spy;
      render(<RevelationEditorModal {...defaultProps} />);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('labels every equip control (Set / Main Stat / Substats) per slot', () => {
    render(<RevelationEditorModal {...defaultProps} />);
    // One of each label per slot.
    expect(screen.getAllByText('Set')).toHaveLength(5);
    expect(screen.getAllByText('Main Stat')).toHaveLength(5);
    expect(screen.getAllByText('Substats')).toHaveLength(5);
  });

  it('renders fixed mains as read-only .readonly-stat labels (Sun: HP; Space: Attack + Defense)', () => {
    const { container } = render(<RevelationEditorModal {...defaultProps} />);
    const fixedLabels = Array.from(container.querySelectorAll('.readonly-stat')).map(
      (e) => e.textContent,
    );
    // Sun's single fixed main plus Space's two fixed mains — none is a <select>.
    expect(fixedLabels).toContain('HP');
    expect(fixedLabels).toContain('Attack');
    expect(fixedLabels).toContain('Defense');
  });

  it('set-gates stat controls: disabled + dimmed until a Set is chosen', () => {
    const { container } = render(<RevelationEditorModal {...defaultProps} />);
    // No sets equipped — Moon's variable main select is disabled, and gated groups are dimmed.
    const moonMain = container.querySelector<HTMLSelectElement>('select[name="rev-moon-main"]');
    expect(moonMain?.disabled).toBe(true);
    // Gated when no set: 3 variable Main Stat groups (Moon/Star/Sky) + 5 Substats lists.
    // Fixed mains (Sun/Space) are never gated — always shown.
    expect(container.querySelectorAll('.is-gated').length).toBe(8);
    // Add-substat buttons are suppressed while gated.
    expect(screen.queryByText('+ Substat')).toBeNull();
  });

  it('never gates the fixed-main display (Sun/Space shown even with no set)', () => {
    const { container } = render(<RevelationEditorModal {...defaultProps} />);
    // Sun and Space fixed mains render inside a Main Stat group with no .is-gated wrapper.
    const fixedGroups = Array.from(container.querySelectorAll('.form-group')).filter((g) =>
      g.querySelector('.readonly-stat'),
    );
    expect(fixedGroups).toHaveLength(2);
    for (const g of fixedGroups) expect(g.classList.contains('is-gated')).toBe(false);
  });

  it('enables a slot’s main once its Set is equipped, but keeps substats main-gated', () => {
    const thief = makeThief({
      revelations: {
        sun: null,
        moon: { setId: 'strife', mainStat: null, subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<RevelationEditorModal {...defaultProps} thief={thief} />);
    const moonMain = container.querySelector<HTMLSelectElement>('select[name="rev-moon-main"]');
    expect(moonMain?.disabled).toBe(false);
    // No main chosen yet → Moon's substats stay gated, so no add-substat button anywhere.
    expect(screen.queryByText('+ Substat')).toBeNull();
    // Gated: Star + Sky Main Stat (2) + all 5 Substats lists (incl. Moon) = 7.
    expect(container.querySelectorAll('.is-gated').length).toBe(7);
  });

  it('gives the variable main select an empty placeholder option so an unset main is selectable', () => {
    // Regression: without a placeholder, a controlled `value=""` has no matching option, so the
    // browser paints the first stat while state stays "" — picking that same stat fires no change
    // event, the main never sets, and substats stay gated forever.
    const thief = makeThief({
      revelations: {
        sun: null,
        moon: { setId: 'strife', mainStat: null, subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<RevelationEditorModal {...defaultProps} thief={thief} />);
    const moonMain = container.querySelector<HTMLSelectElement>('select[name="rev-moon-main"]')!;
    const emptyOpt = moonMain.querySelector<HTMLOptionElement>('option[value=""]');
    expect(emptyOpt).not.toBeNull();
    expect(moonMain.value).toBe('');
  });

  it('ungates substats after the variable main is picked interactively', async () => {
    const user = userEvent.setup();
    // Parent re-feeds a fresh thief on each slot update, matching P5xPage's live-derived prop.
    function Harness() {
      const [thief, setThief] = useState<P5xTrackedThief>(
        makeThief({
          revelations: {
            sun: null,
            moon: { setId: 'strife', mainStat: null, subStats: [] },
            star: null,
            sky: null,
            space: null,
          },
        }),
      );
      return (
        <RevelationEditorModal
          {...defaultProps}
          thief={thief}
          onUpdateSlot={(slot, data) =>
            setThief((t) => ({ ...t, revelations: { ...t.revelations, [slot]: data } }))
          }
        />
      );
    }
    render(<Harness />);
    expect(screen.queryByText('+ Substat')).toBeNull();
    const moonMain = document.querySelector<HTMLSelectElement>('select[name="rev-moon-main"]')!;
    await user.selectOptions(moonMain, 'attack-pct');
    expect(screen.getAllByText('+ Substat')).toHaveLength(1);
  });

  it('enables a slot’s substats once its Set and variable main are set', () => {
    const thief = makeThief({
      revelations: {
        sun: null,
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<RevelationEditorModal {...defaultProps} thief={thief} />);
    // Only Moon (set + main) offers its add-substat button.
    expect(screen.getAllByText('+ Substat')).toHaveLength(1);
    // Gated: Star + Sky Main Stat (2) + Sun/Star/Sky/Space Substats (4) = 6.
    expect(container.querySelectorAll('.is-gated').length).toBe(6);
  });

  it('never main-gates a fixed slot: Space substats enable on Set alone (derived main)', () => {
    const thief = makeThief({
      revelations: {
        sun: null,
        moon: null,
        star: null,
        sky: null,
        // Space's dual main (Attack + Defense) is derived, never stored → mainStat null.
        space: { setId: 'integrity', mainStat: null, subStats: [] },
      },
    });
    render(<RevelationEditorModal {...defaultProps} thief={thief} />);
    // Space is fixed-main: a set alone must ungate its substats (regression guard — a
    // truthiness gate on `card.mainStat` would lock it forever).
    expect(screen.getAllByText('+ Substat')).toHaveLength(1);
  });

  it('switches to Preferences tab on click', async () => {
    const user = userEvent.setup();
    render(<RevelationEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Build Preferences'));
    expect(screen.getByText('Build Preferences')).toHaveClass('active');
    expect(screen.getByText('Preferred Heavens Set')).toBeInTheDocument();
    expect(screen.getByText('Preferred Space Set')).toBeInTheDocument();
    expect(screen.getByText('Moon Main Stat')).toBeInTheDocument();
    expect(screen.getByText('Star Main Stat')).toBeInTheDocument();
    expect(screen.getByText('Sky Main Stat')).toBeInTheDocument();
    expect(screen.getByText('Substats')).toBeInTheDocument();
  });

  it('calls onClose when Done button is clicked', async () => {
    const user = userEvent.setup();
    render(<RevelationEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Done'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onUpdateSlot when a set is selected', async () => {
    const user = userEvent.setup();
    render(<RevelationEditorModal {...defaultProps} />);
    // Slots render space-first: [space, sun, moon, star, sky]; Moon is the third set select.
    const setSelects = screen.getAllByDisplayValue('-- No Set --');
    await user.selectOptions(setSelects[2], 'strife');
    expect(defaultProps.onUpdateSlot).toHaveBeenCalledWith(
      'moon',
      expect.objectContaining({ setId: 'strife' }),
    );
  });

  it('calls onSavePreferences when preferred Heavens set is selected', async () => {
    const user = userEvent.setup();
    render(<RevelationEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Build Preferences'));
    const heavensSelect = document.querySelector<HTMLSelectElement>(
      'select[name="rev-pref-heavens"]',
    )!;
    await user.selectOptions(heavensSelect, 'power');
    expect(defaultProps.onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ heavensSetId: 'power' }),
    );
  });

  it('shows a Build Comments field on the Preferences tab and saves edits', async () => {
    const user = userEvent.setup();
    render(<RevelationEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Build Preferences'));
    const textarea = screen.getByPlaceholderText(/additional notes/i);
    await user.type(textarea, 'F');
    expect(defaultProps.onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ comments: 'F' }),
    );
  });

  it('pre-populates existing comments in the Build Comments textarea', async () => {
    const user = userEvent.setup();
    const thief = makeThief();
    thief.revelationPreferences = { ...thief.revelationPreferences, comments: 'Crit first' };
    render(<RevelationEditorModal {...defaultProps} thief={thief} />);
    await user.click(screen.getByText('Build Preferences'));
    expect(screen.getByDisplayValue('Crit first')).toBeInTheDocument();
  });

  it('filters substats to exclude the equipped main stat', () => {
    const thief = makeThief({
      revelations: {
        sun: null,
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    render(<RevelationEditorModal {...defaultProps} thief={thief} />);
    // The Moon slot's substat add should not offer "Attack%" since it's the main stat.
    // Only Moon has a set equipped, so only its (ungated) add button renders.
    const addButtons = screen.getAllByText('+ Substat');
    expect(addButtons.length).toBe(1);
  });
});
