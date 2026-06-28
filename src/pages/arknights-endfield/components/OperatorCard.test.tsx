import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperatorCard } from './OperatorCard';
import { ALL_WEAPONS } from '@/data/arknights-endfield/weapons';
import { sortWeaponsForDisplay } from './weaponSort';
import type { AeTrackedOperator } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
}));

// Ember is a Greatsword operator — derive expected names from the sorted catalog
// so these tests assert the display-order behavior (rarity desc, alpha asc).
const greatswords = sortWeaponsForDisplay(ALL_WEAPONS.filter((w) => w.type === 'Greatsword'));
const greatswordWeapon = greatswords[0];
const secondGreatsword = greatswords[1];
const nonGreatswordWeapon = ALL_WEAPONS.find((w) => w.type !== 'Greatsword')!;

function makeOperator(overrides: Partial<AeTrackedOperator> = {}): AeTrackedOperator {
  return {
    id: 'ember',
    name: 'Ember',
    rarity: 6,
    class: 'Defender',
    element: 'Heat',
    weapon: 'Greatsword',
    imageUrl: '/assets/arknights-endfield/operators/ember.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 45,
    phase: 3,
    skillsMaxed: false,
    weaponName: null,
    weaponLevel: 1,
    weaponPreferences: [],
    ...overrides,
  };
}

describe('OperatorCard', () => {
  const defaultProps = {
    operator: makeOperator(),
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdatePhase: vi.fn(),
    onUpdateSkillsMaxed: vi.fn(),
    onUpdateWeapon: vi.fn(),
    onUpdateWeaponPreferences: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Render ---

  it('renders operator name and badges', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('Ember')).toBeInTheDocument();
    expect(screen.getByText('Defender')).toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('Greatsword')).toBeInTheDocument();
  });

  it('renders level, phase, and skills stat chips', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('P3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Skills ✗')).toBeInTheDocument();
  });

  it('does not render a rarity-star indicator', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    expect(container.querySelector('.rarity-indicator')).toBeNull();
    expect(screen.queryByText('★★★★★★')).not.toBeInTheDocument();
  });

  // --- Investment gradient wiring (shared rust→teal color language) ---

  it('colors the level chip by investment — rust at min, teal at max', () => {
    const { rerender } = render(
      <OperatorCard {...defaultProps} operator={makeOperator({ level: 1 })} />,
    );
    const lowChip = screen.getByText('Lv 1');
    expect(lowChip.style.color).toBe('rgb(138, 96, 80)'); // rust
    expect(lowChip.style.borderColor).toBe('rgba(138, 96, 80, 0.5)');

    rerender(<OperatorCard {...defaultProps} operator={makeOperator({ level: 90 })} />);
    expect(screen.getByText('Lv 90').style.color).toBe('rgb(64, 200, 160)'); // teal
  });

  it('colors the phase chip by investment', () => {
    // Scope to the summary chip — `P0` also appears as an edit-body button.
    const { container } = render(
      <OperatorCard {...defaultProps} operator={makeOperator({ phase: 0 })} />,
    );
    const chips = container.querySelectorAll<HTMLElement>('.game-card-static-stats .stat-chip');
    const phaseChip = chips[1]; // [0] = Lv, [1] = P, [2] = Skills
    expect(phaseChip).toHaveTextContent('P0');
    expect(phaseChip.style.color).toBe('rgb(138, 96, 80)'); // rust at phase 0
  });

  it('drives the level slider fill from the investment gradient via the canonical class', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} operator={makeOperator({ level: 1 })} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getAllByRole('slider')[0];
    expect(slider).toHaveClass('level-slider');
    expect(slider).not.toHaveClass('character-slider');
    expect(slider.style.getPropertyValue('--slider-fill-color')).toBe('rgb(138, 96, 80)');
  });

  // --- Weapon gear one-liner ---

  it('shows an em-dash gear one-liner when no weapon is equipped', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    const line = container.querySelector('.game-card-static-line');
    expect(line).not.toBeNull();
    expect(line).toHaveTextContent('—');
  });

  it('shows the equipped weapon name and level in the gear one-liner', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({ weaponName: greatswordWeapon.name, weaponLevel: 60 })}
      />,
    );
    const line = container.querySelector('.game-card-static-line');
    expect(line).toHaveTextContent(greatswordWeapon.name);
    expect(line).toHaveTextContent(/Lv.*60/);
  });

  // --- Favorite ---

  it('calls onToggleFavorite with true when favoriting', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Favorite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ember', true);
  });

  it('calls onToggleFavorite with false when unfavoriting', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} operator={makeOperator({ isFavorited: true })} />);
    await user.click(screen.getByTitle('Unfavorite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ember', false);
  });

  it('favorite button has active class when favorited', () => {
    render(<OperatorCard {...defaultProps} operator={makeOperator({ isFavorited: true })} />);
    expect(screen.getByTitle('Unfavorite')).toHaveClass('active');
  });

  it('favorite button does not have active class when not favorited', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByTitle('Favorite')).not.toHaveClass('active');
  });

  // --- Remove ---

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Operator'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('ember', expect.any(Object));
  });

  // --- Edit toggle ---

  it('shows edit button with pencil icon by default', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toHaveTextContent('✎');
  });

  it('toggles to editing mode when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByTitle('Done editing')).toBeInTheDocument();
    expect(screen.getByTitle('Done editing')).toHaveTextContent('✓');
  });

  it('edit toggle button has active class in editing mode', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByTitle('Done editing')).toHaveClass('active');
  });

  it('card has is-editing class when in edit mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(container.querySelector('.game-card')).toHaveClass('is-editing');
  });

  // --- Level slider ---

  it('renders level slider with correct value', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getAllByRole('slider')[0];
    expect(slider).toHaveValue('45');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('calls onUpdateLevel when slider changes', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getAllByRole('slider')[0];
    fireEvent.change(slider, { target: { value: '60' } });
    expect(defaultProps.onUpdateLevel).toHaveBeenCalledWith('ember', 60);
  });

  // --- Phase buttons ---

  it('renders all 6 phase buttons (P0–P5)', () => {
    render(<OperatorCard {...defaultProps} />);
    for (let p = 0; p <= 5; p++) {
      expect(screen.getByTitle(`P${p}`)).toBeInTheDocument();
    }
  });

  it('calls onUpdatePhase when a phase button is clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('P5'));
    expect(defaultProps.onUpdatePhase).toHaveBeenCalledWith('ember', 5);
  });

  it('marks only the current phase button as active (single-exact)', () => {
    render(<OperatorCard {...defaultProps} operator={makeOperator({ phase: 3 })} />);
    expect(screen.getByTitle('P3')).toHaveClass('active');
    for (const p of [0, 1, 2, 4, 5]) {
      expect(screen.getByTitle(`P${p}`)).not.toHaveClass('active');
    }
  });

  // --- Skills maxed ---

  it('calls onUpdateSkillsMaxed when the skills checkbox is confirmed', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByText('All Skills Maxed')); // arms confirmation
    await user.click(screen.getByText('Click to confirm'));
    expect(defaultProps.onUpdateSkillsMaxed).toHaveBeenCalledWith('ember', true);
  });

  // --- Weapon picker ---

  it('filters the weapon picker to the operator weapon class', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    // Ember is a Greatsword operator: only Greatsword weapons + the empty option
    expect(optionValues).toContain('');
    expect(optionValues).toContain(greatswordWeapon.name);
    expect(optionValues).not.toContain(nonGreatswordWeapon.name);
  });

  it('calls onUpdateWeapon when a weapon is selected', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.selectOptions(screen.getByRole('combobox'), greatswordWeapon.name);
    expect(defaultProps.onUpdateWeapon).toHaveBeenCalledWith('ember', {
      weaponName: greatswordWeapon.name,
    });
  });

  it('calls onUpdateWeapon when the weapon level slider changes', async () => {
    const user = userEvent.setup();
    render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({ weaponName: greatswordWeapon.name, weaponLevel: 1 })}
      />,
    );
    await user.click(screen.getByTitle('Edit'));
    const sliders = screen.getAllByRole('slider');
    const weaponSlider = sliders[sliders.length - 1];
    fireEvent.change(weaponSlider, { target: { value: '70' } });
    expect(defaultProps.onUpdateWeapon).toHaveBeenCalledWith('ember', { weaponLevel: 70 });
  });

  // --- Weapon preference match badge ---

  it('shows a teal #1 badge when the equipped weapon is the first preference', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({
          weaponName: greatswordWeapon.name,
          weaponPreferences: [greatswordWeapon.id, secondGreatsword.id],
        })}
      />,
    );
    const badge = container.querySelector<HTMLElement>('.weapon-match-badge');
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent('#1');
    expect(badge!.style.color).toBe('rgb(64, 200, 160)'); // teal — full match
  });

  it('shows a lower-ranked badge when the equipped weapon is not the first preference', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({
          weaponName: secondGreatsword.name,
          weaponPreferences: [greatswordWeapon.id, secondGreatsword.id],
        })}
      />,
    );
    const badge = container.querySelector<HTMLElement>('.weapon-match-badge');
    expect(badge).toHaveTextContent('#2');
    expect(badge!.style.color).not.toBe('rgb(64, 200, 160)'); // not full teal
  });

  it('shows an off-build badge when the equipped weapon is not in the preference list', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({
          weaponName: greatswordWeapon.name,
          weaponPreferences: [secondGreatsword.id],
        })}
      />,
    );
    const badge = container.querySelector<HTMLElement>('.weapon-match-badge');
    expect(badge).toHaveTextContent('Off-build');
    expect(badge!.style.color).toBe('rgb(138, 96, 80)'); // rust
  });

  it('degrades to off-build when the equipped name does not resolve in the catalog', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({
          weaponName: 'Nonexistent Blade',
          weaponPreferences: [greatswordWeapon.id],
        })}
      />,
    );
    expect(container.querySelector('.weapon-match-badge')).toHaveTextContent('Off-build');
  });

  it('renders no badge when there are no preferences', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({ weaponName: greatswordWeapon.name, weaponPreferences: [] })}
      />,
    );
    expect(container.querySelector('.weapon-match-badge')).toBeNull();
  });

  it('renders no badge when no weapon is equipped even if preferences exist', () => {
    const { container } = render(
      <OperatorCard
        {...defaultProps}
        operator={makeOperator({ weaponName: null, weaponPreferences: [greatswordWeapon.id] })}
      />,
    );
    expect(container.querySelector('.weapon-match-badge')).toBeNull();
  });

  // --- Weapon preference editor ---

  it('renders the preferred-weapons editor in the edit body', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Preferred Weapons')).toBeInTheDocument();
    expect(screen.getByText('+ Add Weapon')).toBeInTheDocument();
  });

  it('calls onUpdateWeaponPreferences when a weapon is added to the list', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('+ Add Weapon'));
    expect(defaultProps.onUpdateWeaponPreferences).toHaveBeenCalledWith('ember', [
      greatswordWeapon.id,
    ]);
  });

  // --- Image fallback ---

  it('falls back to ui-avatars when image fails to load', () => {
    render(<OperatorCard {...defaultProps} />);
    const img = screen.getByAltText('Ember');
    fireEvent.error(img);
    expect((img as HTMLImageElement).src).toContain('ui-avatars.com');
    expect((img as HTMLImageElement).src).toContain('Ember');
  });

  it('shows loading spinner initially', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    expect(container.querySelector('.game-card-image-spinner')).toBeInTheDocument();
  });

  it('hides loading spinner after image loads', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    const img = screen.getByAltText('Ember');
    fireEvent.load(img);
    expect(container.querySelector('.game-card-image-spinner')).not.toBeInTheDocument();
  });
});
