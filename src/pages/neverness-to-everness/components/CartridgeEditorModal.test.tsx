import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartridgeEditorModal } from '@/pages/neverness-to-everness/components/CartridgeEditorModal';
import type { N2ETrackedCharacter } from '@/types';

function makeChar(overrides: Partial<N2ETrackedCharacter> = {}): N2ETrackedCharacter {
  return {
    id: 'char-1',
    name: 'Baicang',
    rarity: 'S',
    esperType: 'Incantation',
    arcType: 'Burst',
    roles: ['DPS'],
    imageUrl: '/baicang.webp',
    isFavorited: false,
    level: 60,
    awakening: [false, false, false, false, false, false],
    resonanceCount: 0,
    arcId: null,
    arcLevel: 1,
    arcTier: 1,
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: { mainStats: [], subStats: [], comments: '' },
    ...overrides,
  };
}

const defaultProps = {
  onSaveCartridge: vi.fn(),
  onSavePreferences: vi.fn(),
  onClose: vi.fn(),
};

describe('CartridgeEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with character name in title', () => {
    render(<CartridgeEditorModal character={makeChar()} {...defaultProps} />);
    expect(screen.getByText(/edit cartridge - baicang/i)).toBeInTheDocument();
  });

  it('shows equip tab by default', () => {
    render(<CartridgeEditorModal character={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Equip Cartridge')).toBeInTheDocument();
    expect(screen.getByText('Rarity', { selector: 'label' })).toBeInTheDocument();
  });

  it('switches to preferences tab when clicked', () => {
    render(<CartridgeEditorModal character={makeChar()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Build Preferences'));
    expect(screen.getByText('Main Stat Priority')).toBeInTheDocument();
    expect(screen.getByText('Sub Stat Priority')).toBeInTheDocument();
  });

  // --- Equip tab ---

  it('calls onSaveCartridge when rarity is changed', () => {
    const onSaveCartridge = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSaveCartridge={onSaveCartridge}
      />,
    );
    const select = document.querySelector('select[name="cartridge-rarity"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'S' } });
    expect(onSaveCartridge).toHaveBeenCalledWith('S', 0, null, []);
  });

  it('calls onSaveCartridge when main stat is changed', () => {
    const onSaveCartridge = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSaveCartridge={onSaveCartridge}
      />,
    );
    const select = document.querySelector(
      'select[name="cartridge-main-stat"]',
    ) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'ATK %' } });
    expect(onSaveCartridge).toHaveBeenCalledWith(null, 0, 'ATK %', []);
  });

  it('calls onSaveCartridge when level slider changes', () => {
    const onSaveCartridge = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSaveCartridge={onSaveCartridge}
      />,
    );
    const slider = document.querySelector('input[name="cartridge-level"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '15' } });
    expect(onSaveCartridge).toHaveBeenCalledWith(null, 15, null, []);
  });

  it('calls onSaveCartridge with null values when un-equip is clicked', () => {
    const onSaveCartridge = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar({ cartridgeRarity: 'S', cartridgeMainStat: 'ATK %' })}
        {...defaultProps}
        onSaveCartridge={onSaveCartridge}
      />,
    );
    fireEvent.click(screen.getByText('Un-equip Cartridge'));
    expect(onSaveCartridge).toHaveBeenCalledWith(null, 0, null, []);
  });

  it('calls onClose when Done button is clicked', () => {
    const onClose = vi.fn();
    render(<CartridgeEditorModal character={makeChar()} {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows add sub stat button and adds a sub stat when clicked', () => {
    const onSaveCartridge = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSaveCartridge={onSaveCartridge}
      />,
    );
    fireEvent.click(screen.getByText('+ Add Sub Stat'));
    expect(onSaveCartridge).toHaveBeenCalledWith(null, 0, null, ['ATK']);
  });

  it('removes a sub stat when remove button is clicked', () => {
    const onSaveCartridge = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar({ cartridgeSubStats: ['ATK', 'HP'] })}
        {...defaultProps}
        onSaveCartridge={onSaveCartridge}
      />,
    );
    const removeButtons = screen.getAllByText('✕');
    const substatRemoveBtn = removeButtons.find((btn) => btn.classList.contains('remove-substat'))!;
    fireEvent.click(substatRemoveBtn);
    expect(onSaveCartridge).toHaveBeenCalledWith(null, 0, null, ['HP']);
  });

  it('hides add sub stat button when 4 subs are equipped', () => {
    render(
      <CartridgeEditorModal
        character={makeChar({ cartridgeSubStats: ['ATK', 'HP', 'DEF', 'CRIT Rate %'] })}
        {...defaultProps}
      />,
    );
    expect(screen.queryByText('+ Add Sub Stat')).not.toBeInTheDocument();
  });

  // --- Preferences tab ---

  it('adds a main stat preference when + Add Priority is clicked', () => {
    const onSavePreferences = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSavePreferences={onSavePreferences}
      />,
    );
    fireEvent.click(screen.getByText('Build Preferences'));
    const addButtons = screen.getAllByText('+ Add Priority');
    fireEvent.click(addButtons[0]);
    expect(onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        mainStats: [{ stat: 'ATK %', operator: null, orderIndex: 0 }],
      }),
    );
  });

  it('adds a sub stat preference', () => {
    const onSavePreferences = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSavePreferences={onSavePreferences}
      />,
    );
    fireEvent.click(screen.getByText('Build Preferences'));
    const addButtons = screen.getAllByText('+ Add Priority');
    fireEvent.click(addButtons[1]);
    expect(onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        subStats: [{ stat: 'ATK', operator: null, orderIndex: 0 }],
      }),
    );
  });

  it('removes a main stat preference', () => {
    const onSavePreferences = vi.fn();
    const char = makeChar({
      cartridgePreferences: {
        mainStats: [{ stat: 'ATK %', operator: null, orderIndex: 0 }],
        subStats: [],
        comments: '',
      },
    });
    render(
      <CartridgeEditorModal
        character={char}
        {...defaultProps}
        onSavePreferences={onSavePreferences}
      />,
    );
    fireEvent.click(screen.getByText('Build Preferences'));
    const removeBtns = document.querySelectorAll('.remove-pref-btn');
    fireEvent.click(removeBtns[0]);
    expect(onSavePreferences).toHaveBeenCalledWith(expect.objectContaining({ mainStats: [] }));
  });

  it('updates build comments via textarea', () => {
    const onSavePreferences = vi.fn();
    render(
      <CartridgeEditorModal
        character={makeChar()}
        {...defaultProps}
        onSavePreferences={onSavePreferences}
      />,
    );
    fireEvent.click(screen.getByText('Build Preferences'));
    fireEvent.change(screen.getByPlaceholderText(/additional notes/i), {
      target: { value: 'Focus on crit' },
    });
    expect(onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ comments: 'Focus on crit' }),
    );
  });

  it('sets operator to ">" when adding second main stat pref', () => {
    const onSavePreferences = vi.fn();
    const char = makeChar({
      cartridgePreferences: {
        mainStats: [{ stat: 'ATK %', operator: null, orderIndex: 0 }],
        subStats: [],
        comments: '',
      },
    });
    render(
      <CartridgeEditorModal
        character={char}
        {...defaultProps}
        onSavePreferences={onSavePreferences}
      />,
    );
    fireEvent.click(screen.getByText('Build Preferences'));
    const addButtons = screen.getAllByText('+ Add Priority');
    fireEvent.click(addButtons[0]);
    expect(onSavePreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        mainStats: [
          { stat: 'ATK %', operator: '>', orderIndex: 0 },
          { stat: 'ATK %', operator: null, orderIndex: 1 },
        ],
      }),
    );
  });

  it('un-equip button is hidden on preferences tab', () => {
    render(<CartridgeEditorModal character={makeChar()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Build Preferences'));
    expect(screen.queryByText('Un-equip Cartridge')).not.toBeInTheDocument();
  });

  it('equip tab button has active class by default', () => {
    render(<CartridgeEditorModal character={makeChar()} {...defaultProps} />);
    const equip = screen.getByText('Equip Cartridge');
    const prefs = screen.getByText('Build Preferences');
    expect(equip).toHaveClass('active');
    expect(prefs).not.toHaveClass('active');
  });
});
