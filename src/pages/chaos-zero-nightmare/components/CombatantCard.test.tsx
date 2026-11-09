import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantCard } from './CombatantCard';
import type { CznTrackedCombatant } from '@/types';

// A fixed Partner catalog keeps the class-scoping assertions independent of the
// generated data: two Strikers (5★ and 4★, authored out of display order), one
// Psionic, one Vanguard.
vi.mock('@/data/chaos-zero-nightmare/partners', () => ({
  ALL_CZN_PARTNERS: [
    {
      id: 'ritochka',
      name: 'Ritochka',
      rarity: 4,
      class: 'Striker',
      faction: 'Peltion',
      imageUrl: '/assets/chaos-zero-nightmare/partners/ritochka.webp',
    },
    {
      id: 'scarlet',
      name: 'Scarlet',
      rarity: 5,
      class: 'Striker',
      faction: 'Peltion',
      imageUrl: '/assets/chaos-zero-nightmare/partners/scarlet.webp',
    },
    {
      id: 'asteria',
      name: 'Asteria',
      rarity: 5,
      class: 'Striker',
      faction: 'SS Edenity',
      imageUrl: '/assets/chaos-zero-nightmare/partners/asteria.webp',
    },
    {
      id: 'bria',
      name: 'Bria',
      rarity: 5,
      class: 'Psionic',
      faction: 'Wanderer',
      imageUrl: '/assets/chaos-zero-nightmare/partners/bria.webp',
    },
    {
      id: 'zeta',
      name: 'Zeta',
      rarity: 5,
      class: 'Vanguard',
      faction: 'Peltion',
      imageUrl: '/assets/chaos-zero-nightmare/partners/zeta.webp',
    },
  ],
}));

const baseCombatant: CznTrackedCombatant = {
  id: 'mei-lin',
  name: 'Mei Lin',
  rarity: 5,
  class: 'Striker',
  element: 'Passion',
  faction: 'Terrascion',
  imageUrl: '/assets/chaos-zero-nightmare/combatants/mei-lin.webp',
  dbId: 'db-1',
  isFavorited: false,
  level: 45,
  ego: 2,
  potentialAttained: false,
  partnerId: null,
  partnerLevel: 1,
  partnerEgo: 0,
  partnerPreferences: [],
};

const withPartner: CznTrackedCombatant = {
  ...baseCombatant,
  partnerId: 'scarlet',
  partnerLevel: 60,
  partnerEgo: 2,
};

// The static line joins its spans with non-breaking spaces; normalize all whitespace.
const lineText = (container: HTMLElement) =>
  container.querySelector('.game-card-static-line')?.textContent?.replace(/\s/g, ' ');

describe('CombatantCard', () => {
  const defaultProps = {
    combatant: baseCombatant,
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdateEgo: vi.fn(),
    onTogglePotential: vi.fn(),
    onUpdatePartner: vi.fn(),
    onUpdatePartnerPreferences: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The edit body is aria-hidden until the edit toggle is clicked.
  async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByTitle('Edit'));
  }

  it('renders name with rarity, class, and attribute badges', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('Mei Lin')).toBeInTheDocument();
    expect(screen.getByText('5★').className).toBe('game-badge czn-rarity-badge czn-rarity-5');
    expect(screen.getByText('Striker').className).toBe(
      'game-badge czn-class-badge czn-class-striker',
    );
    expect(screen.getByText('Passion').className).toBe(
      'game-badge czn-element-badge czn-element-passion',
    );
  });

  it('renders a 4★ rarity badge', () => {
    render(<CombatantCard {...defaultProps} combatant={{ ...baseCombatant, rarity: 4 }} />);
    expect(screen.getByText('4★').className).toBe('game-badge czn-rarity-badge czn-rarity-4');
  });

  it('renders unknown class and attribute strings verbatim with the neutral fallback class', () => {
    render(
      <CombatantCard
        {...defaultProps}
        combatant={{ ...baseCombatant, class: 'Oracle', element: 'Chaos' }}
      />,
    );
    expect(screen.getByText('Oracle').className).toBe(
      'game-badge czn-class-badge czn-class-unknown',
    );
    expect(screen.getByText('Chaos').className).toBe(
      'game-badge czn-element-badge czn-element-unknown',
    );
  });

  it('does not render the faction anywhere on the card', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.queryByText('Terrascion')).not.toBeInTheDocument();
  });

  it('renders level, Ego (T prefix), and Potential summary chips', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('T2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Potential ✗')).toBeInTheDocument();
  });

  it('shows Potential ✓ when the tree is fully unlocked', () => {
    render(
      <CombatantCard {...defaultProps} combatant={{ ...baseCombatant, potentialAttained: true }} />,
    );
    expect(screen.getByText('Potential ✓')).toBeInTheDocument();
    expect(screen.queryByText('Potential ✗')).not.toBeInTheDocument();
  });

  it('level slider spans 1–62 and reports changes', () => {
    const { container } = render(<CombatantCard {...defaultProps} />);
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.min).toBe('1');
    expect(slider.max).toBe('62');
    fireEvent.change(slider, { target: { value: '62' } });
    expect(defaultProps.onUpdateLevel).toHaveBeenCalledWith('mei-lin', 62);
  });

  it('renders edit sections in the order Level → Manifest Ego → Potential → Partner → Preferred Partners', async () => {
    const user = userEvent.setup();
    const { container } = render(<CombatantCard {...defaultProps} />);
    await enterEditMode(user);
    const labels = Array.from(container.querySelectorAll('.section-header')).map((el) =>
      el.textContent?.replace(/\d+ \/ \d+|T\d/g, '').trim(),
    );
    expect(labels).toEqual(['Level', 'Manifest Ego', 'Potential', 'Partner', 'Preferred Partners']);
  });

  it('renders the Manifest Ego row as T0–T6 and reports the numeric rank', async () => {
    const user = userEvent.setup();
    const { container } = render(<CombatantCard {...defaultProps} />);
    await enterEditMode(user);
    const rungs = Array.from(container.querySelectorAll<HTMLButtonElement>('.ego-row .toggle-btn'));
    expect(rungs.map((b) => b.textContent)).toEqual(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6']);
    await user.click(screen.getByRole('button', { name: 'T6' }));
    expect(defaultProps.onUpdateEgo).toHaveBeenCalledWith('mei-lin', 6);
  });

  it('toggles Potential through the confirm checkbox', async () => {
    const user = userEvent.setup();
    render(<CombatantCard {...defaultProps} />);
    await enterEditMode(user);
    const checkbox = screen.getByText('Potential Fully Unlocked').closest('button') as HTMLElement;
    // First click arms the confirmation, second commits.
    await user.click(checkbox);
    expect(defaultProps.onTogglePotential).not.toHaveBeenCalled();
    await user.click(checkbox);
    expect(defaultProps.onTogglePotential).toHaveBeenCalledWith('mei-lin', true);
  });

  describe('Partner summary line', () => {
    it('renders a dimmed dash and no match badge when no Partner is equipped', () => {
      const { container } = render(<CombatantCard {...defaultProps} />);
      expect(container.querySelector('.no-partner')).toHaveTextContent('—');
      expect(container.querySelector('.pref-match-badge')).toBeNull();
    });

    it('renders the Partner name, level, and T-prefixed Ego', () => {
      const { container } = render(<CombatantCard {...defaultProps} combatant={withPartner} />);
      expect(lineText(container)).toBe('Scarlet · Lv 60 · T2');
      expect(container.querySelector('.no-partner')).toBeNull();
    });

    it('falls back to the stored id when the Partner is missing from the catalog', () => {
      const { container } = render(
        <CombatantCard {...defaultProps} combatant={{ ...withPartner, partnerId: 'ghost' }} />,
      );
      expect(lineText(container)).toContain('ghost');
    });
  });

  describe('match badge', () => {
    it('shows #1 for the first-choice Partner', () => {
      const { container } = render(
        <CombatantCard
          {...defaultProps}
          combatant={{ ...withPartner, partnerPreferences: ['scarlet', 'asteria'] }}
        />,
      );
      expect(container.querySelector('.pref-match-badge')).toHaveTextContent('#1');
    });

    it('shows the lower rank for a later preference', () => {
      const { container } = render(
        <CombatantCard
          {...defaultProps}
          combatant={{ ...withPartner, partnerPreferences: ['asteria', 'ritochka', 'scarlet'] }}
        />,
      );
      expect(container.querySelector('.pref-match-badge')).toHaveTextContent('#3');
    });

    it('shows Off-build when the equipped Partner is not preferred', () => {
      const { container } = render(
        <CombatantCard
          {...defaultProps}
          combatant={{ ...withPartner, partnerPreferences: ['asteria'] }}
        />,
      );
      expect(container.querySelector('.pref-match-badge')).toHaveTextContent('Off-build');
    });

    it('hides the badge when the preference list is empty', () => {
      const { container } = render(<CombatantCard {...defaultProps} combatant={withPartner} />);
      expect(container.querySelector('.pref-match-badge')).toBeNull();
    });

    it('hides the badge when preferences exist but no Partner is equipped', () => {
      const { container } = render(
        <CombatantCard
          {...defaultProps}
          combatant={{ ...baseCombatant, partnerPreferences: ['scarlet'] }}
        />,
      );
      expect(container.querySelector('.pref-match-badge')).toBeNull();
    });
  });

  describe('Partner editor', () => {
    it('offers only same-class Partners, 5★ first then alphabetical, after No Partner', async () => {
      const user = userEvent.setup();
      const { container } = render(<CombatantCard {...defaultProps} />);
      await enterEditMode(user);
      const select = container.querySelector('select[name="partner-mei-lin"]') as HTMLSelectElement;
      expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
        'No Partner',
        'Asteria (5★)',
        'Scarlet (5★)',
        'Ritochka (4★)',
      ]);
    });

    it('appends an equipped off-class Partner so the selection stays visible', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CombatantCard {...defaultProps} combatant={{ ...withPartner, partnerId: 'zeta' }} />,
      );
      await enterEditMode(user);
      const select = container.querySelector('select[name="partner-mei-lin"]') as HTMLSelectElement;
      expect(select.value).toBe('zeta');
      expect(Array.from(select.options).map((o) => o.value)).toEqual([
        '',
        'asteria',
        'scarlet',
        'ritochka',
        'zeta',
      ]);
    });

    it('shows only No Partner when no catalog Partner shares the class', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CombatantCard {...defaultProps} combatant={{ ...baseCombatant, class: 'Hunter' }} />,
      );
      await enterEditMode(user);
      const select = container.querySelector('select[name="partner-mei-lin"]') as HTMLSelectElement;
      expect(Array.from(select.options).map((o) => o.textContent)).toEqual(['No Partner']);
    });

    it('equips and unequips through onUpdatePartner', async () => {
      const user = userEvent.setup();
      const { container } = render(<CombatantCard {...defaultProps} />);
      await enterEditMode(user);
      const select = container.querySelector('select[name="partner-mei-lin"]') as HTMLSelectElement;
      await user.selectOptions(select, 'scarlet');
      expect(defaultProps.onUpdatePartner).toHaveBeenCalledWith('mei-lin', {
        partnerId: 'scarlet',
      });
      await user.selectOptions(select, '');
      expect(defaultProps.onUpdatePartner).toHaveBeenLastCalledWith('mei-lin', {
        partnerId: null,
      });
    });

    it('Partner level slider spans 1–60 and reports through onUpdatePartner', async () => {
      const user = userEvent.setup();
      const { container } = render(<CombatantCard {...defaultProps} combatant={withPartner} />);
      await enterEditMode(user);
      const slider = container.querySelector(
        'input[name="partner-level-mei-lin"]',
      ) as HTMLInputElement;
      expect(slider.min).toBe('1');
      expect(slider.max).toBe('60');
      fireEvent.change(slider, { target: { value: '30' } });
      expect(defaultProps.onUpdatePartner).toHaveBeenCalledWith('mei-lin', { partnerLevel: 30 });
    });

    it('renders the Partner Ego row as T0–T4 and reports the numeric rank', async () => {
      const user = userEvent.setup();
      const { container } = render(<CombatantCard {...defaultProps} combatant={withPartner} />);
      await enterEditMode(user);
      const rungs = Array.from(
        container.querySelectorAll<HTMLButtonElement>('.partner-ego-row .toggle-btn'),
      );
      expect(rungs.map((b) => b.textContent)).toEqual(['T0', 'T1', 'T2', 'T3', 'T4']);
      await user.click(rungs[4]);
      expect(defaultProps.onUpdatePartner).toHaveBeenCalledWith('mei-lin', { partnerEgo: 4 });
    });

    it('adds a preferred Partner through onUpdatePartnerPreferences', async () => {
      const user = userEvent.setup();
      render(<CombatantCard {...defaultProps} />);
      await enterEditMode(user);
      await user.click(screen.getByRole('button', { name: '+ Add Partner' }));
      expect(defaultProps.onUpdatePartnerPreferences).toHaveBeenCalledWith(
        'mei-lin',
        expect.arrayContaining([expect.any(String)]),
      );
    });

    it('does not render the Partner editors while collapsed', () => {
      const { container } = render(<CombatantCard {...defaultProps} combatant={withPartner} />);
      const editBody = container.querySelector('.game-card-edit-body');
      expect(editBody).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('calls onRemove from the remove control', async () => {
    const user = userEvent.setup();
    render(<CombatantCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Combatant'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('mei-lin', expect.any(Object));
  });

  it('calls onToggleFavorite from the favorite control', async () => {
    const user = userEvent.setup();
    const { container } = render(<CombatantCard {...defaultProps} />);
    await user.click(container.querySelector('.favorite-btn') as HTMLButtonElement);
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('mei-lin', true);
  });

  it('fires onEditCommit when the edit toggle collapses the card', async () => {
    const user = userEvent.setup();
    const onEditCommit = vi.fn();
    render(<CombatantCard {...defaultProps} onEditCommit={onEditCommit} />);
    await enterEditMode(user);
    await user.click(screen.getByTitle('Done editing'));
    expect(onEditCommit).toHaveBeenCalledTimes(1);
  });
});
