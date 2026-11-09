import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCombatantModal } from './AddCombatantModal';
import type { CznCombatant } from '@/data/chaos-zero-nightmare/combatants';
import type { CznTrackedCombatant } from '@/types';

// Config-wiring tests only — picker behaviour (search, exclusion, keyboard
// handling) is covered by the shared AddEntityModal tests.

const sample: CznCombatant[] = [
  {
    id: 'mei-lin',
    name: 'Mei Lin',
    rarity: 5,
    class: 'Striker',
    element: 'Passion',
    faction: 'Terrascion',
    imageUrl: '/assets/chaos-zero-nightmare/combatants/mei-lin.webp',
  },
  {
    id: 'mika',
    name: 'Mika',
    rarity: 4,
    class: 'Controller',
    element: 'Justice',
    faction: null,
    imageUrl: '/assets/chaos-zero-nightmare/combatants/mika.webp',
  },
];

describe('AddCombatantModal', () => {
  const defaultProps = {
    availableCombatants: sample,
    trackedCombatants: [] as CznTrackedCombatant[],
    onAddCombatant: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Combatant title and lists combatants', () => {
    render(<AddCombatantModal {...defaultProps} />);
    expect(screen.getByText('Add Combatant')).toBeInTheDocument();
    expect(screen.getByText('Mei Lin')).toBeInTheDocument();
    expect(screen.getByText('Mika')).toBeInTheDocument();
  });

  it('renders rarity, class, and attribute badges with the czn variants', () => {
    render(<AddCombatantModal {...defaultProps} />);
    expect(screen.getByText('5★').className).toBe('game-badge czn-rarity-badge czn-rarity-5');
    expect(screen.getByText('4★').className).toBe('game-badge czn-rarity-badge czn-rarity-4');
    expect(screen.getByText('Striker').className).toBe(
      'game-badge czn-class-badge czn-class-striker',
    );
    expect(screen.getByText('Justice').className).toBe(
      'game-badge czn-element-badge czn-element-justice',
    );
  });

  it('matches class and attribute search keys', async () => {
    const user = userEvent.setup();
    render(<AddCombatantModal {...defaultProps} />);
    await user.type(screen.getByRole('textbox'), 'Controller');
    expect(screen.getByText('Mika')).toBeInTheDocument();
    expect(screen.queryByText('Mei Lin')).not.toBeInTheDocument();
  });

  it('excludes tracked combatants by id and reports the picked one', async () => {
    const user = userEvent.setup();
    const tracked: CznTrackedCombatant[] = [
      {
        ...sample[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 1,
        ego: 0,
        potentialAttained: false,
        partnerId: null,
        partnerLevel: 1,
        partnerEgo: 0,
        partnerPreferences: [],
      },
    ];
    render(<AddCombatantModal {...defaultProps} trackedCombatants={tracked} />);
    expect(screen.queryByText('Mei Lin')).not.toBeInTheDocument();
    await user.click(screen.getByText('Mika'));
    expect(defaultProps.onAddCombatant).toHaveBeenCalledWith(sample[1]);
  });
});
