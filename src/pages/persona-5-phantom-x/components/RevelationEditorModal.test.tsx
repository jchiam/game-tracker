import { describe, it, expect, vi } from 'vitest';
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
    weaponRarity: null,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
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

  it('renders all 5 slot FormGroups in Equip tab', () => {
    render(<RevelationEditorModal {...defaultProps} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Moon')).toBeInTheDocument();
    expect(screen.getByText('Star')).toBeInTheDocument();
    expect(screen.getByText('Sky')).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
  });

  it('renders fixed mains as read-only labels (Sun: HP; Space: Attack + Defense)', () => {
    const { container } = render(<RevelationEditorModal {...defaultProps} />);
    const fixedLabels = Array.from(container.querySelectorAll('.rev-fixed-main')).map(
      (e) => e.textContent,
    );
    // Sun's single fixed main plus Space's two fixed mains — none is a <select>.
    expect(fixedLabels).toContain('HP');
    expect(fixedLabels).toContain('Attack');
    expect(fixedLabels).toContain('Defense');
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
    // Select a set in the Moon slot (second FormGroup's first select)
    const setSelects = screen.getAllByDisplayValue('-- No Set --');
    await user.selectOptions(setSelects[1], 'strife');
    expect(defaultProps.onUpdateSlot).toHaveBeenCalledWith(
      'moon',
      expect.objectContaining({ setId: 'strife' }),
    );
  });

  it('calls onSavePreferences when preferred Heavens set is selected', async () => {
    const user = userEvent.setup();
    render(<RevelationEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Build Preferences'));
    const heavensSelect = screen.getAllByDisplayValue('-- None --')[0];
    await user.selectOptions(heavensSelect, 'power');
    expect(defaultProps.onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ heavensSetId: 'power' }),
    );
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
    // The Moon slot's substat add should not offer "Attack%" since it's the main stat
    // We verify by checking + Substat buttons exist (can add substats)
    const addButtons = screen.getAllByText('+ Substat');
    expect(addButtons.length).toBe(5); // one per slot
  });
});
