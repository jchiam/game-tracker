import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DiscEditorModal } from '@/pages/zenless-zone-zero/components/DiscEditorModal';
import type { ZzzTrackedAgent } from '@/types';

const emptyDiscs: ZzzTrackedAgent['discs'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

function makeAgent(overrides: Partial<ZzzTrackedAgent> = {}): ZzzTrackedAgent {
  return {
    id: '1011',
    name: 'Anby',
    rarity: 3,
    specialty: 'Stun',
    element: 'Elec',
    imageUrl: '/assets/zenless-zone-zero/agents/1011.png',
    dbId: 'db-1',
    isFavorited: false,
    level: 60,
    mindscape: 0,
    coreSkill: 0,
    discs: { ...emptyDiscs },
    buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
    ...overrides,
  };
}

type ModalProps = Parameters<typeof DiscEditorModal>[0];

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    agent: makeAgent(),
    onSaveDisc: vi.fn(),
    onRemoveDisc: vi.fn(),
    onUpdateBuildPreferences: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<DiscEditorModal {...props} />), props };
}

const slot4WithSuit = (): ZzzTrackedAgent =>
  makeAgent({ discs: { ...emptyDiscs, 4: { suitId: '31000', mainStat: null, subStats: [] } } });

// Slot 4 with a suit AND a main — substats are main-gated, so exercising them needs both.
const slot4WithSuitAndMain = (subStats: string[] = []): ZzzTrackedAgent =>
  makeAgent({
    discs: { ...emptyDiscs, 4: { suitId: '31000', mainStat: 'CRIT Rate', subStats } },
  });

describe('DiscEditorModal', () => {
  it('renders the agent name in the title', () => {
    renderModal();
    expect(screen.getByText('Drive Discs — Anby')).toBeInTheDocument();
  });

  it('renders all six slot cards on the Equip tab', () => {
    const { container } = renderModal();
    const cards = container.querySelectorAll('.equip-slot-card');
    expect(cards).toHaveLength(6);
    expect([...cards].map((c) => (c as HTMLElement).dataset.slot)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
  });

  it('shows fixed read-only mains for slots 1-3', () => {
    const { container } = renderModal();
    const fixed = [...container.querySelectorAll('.readonly-stat')].map((el) => el.textContent);
    expect(fixed).toEqual(['HP (Fixed)', 'ATK (Fixed)', 'DEF (Fixed)']);
  });

  it('offers the full suit pool on every slot (no family filtering)', () => {
    const { container } = renderModal();
    const slot1Suit = container.querySelector<HTMLSelectElement>('select[name="disc-1-suit"]')!;
    const slot5Suit = container.querySelector<HTMLSelectElement>('select[name="disc-5-suit"]')!;
    const names1 = within(slot1Suit)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(names1).toContain('Woodpecker Electro');
    expect(names1).toContain('Swing Jazz');
    expect(within(slot5Suit).getAllByRole('option')).toHaveLength(names1.length);
  });

  it('offers the slot-specific main pool on variable slots', () => {
    const { container } = renderModal({ agent: slot4WithSuit() });
    const main4 = container.querySelector<HTMLSelectElement>('select[name="disc-4-main-stat"]')!;
    const options = within(main4)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toContain('CRIT Rate');
    expect(options).toContain('Anomaly Proficiency');
    expect(options).not.toContain('Electric DMG Bonus'); // slot 5 pool only
  });

  // --- Equip tab: save/remove interactions ---

  it('calls onSaveDisc with the numeric slot when a suit is selected', () => {
    const { container, props } = renderModal();
    const suit4 = container.querySelector('select[name="disc-4-suit"]')!;
    fireEvent.change(suit4, { target: { value: '31000' } });
    expect(props.onSaveDisc).toHaveBeenCalledWith(4, expect.objectContaining({ suitId: '31000' }));
  });

  it('calls onRemoveDisc for that slot when the suit is cleared to None', () => {
    const { container, props } = renderModal({ agent: slot4WithSuit() });
    const suit4 = container.querySelector('select[name="disc-4-suit"]')!;
    fireEvent.change(suit4, { target: { value: '' } });
    expect(props.onRemoveDisc).toHaveBeenCalledWith(4);
    expect(props.onSaveDisc).not.toHaveBeenCalled();
  });

  it('forces the fixed main when a fixed slot is saved', () => {
    const { container, props } = renderModal();
    const suit2 = container.querySelector('select[name="disc-2-suit"]')!;
    fireEvent.change(suit2, { target: { value: '31000' } });
    expect(props.onSaveDisc).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ suitId: '31000', mainStat: 'ATK' }),
    );
  });

  it('prunes a substat that conflicts with the newly selected main stat', () => {
    const agent = makeAgent({
      discs: { ...emptyDiscs, 4: { suitId: '31000', mainStat: null, subStats: ['CRIT Rate'] } },
    });
    const { container, props } = renderModal({ agent });
    const main4 = container.querySelector('select[name="disc-4-main-stat"]')!;
    fireEvent.change(main4, { target: { value: 'CRIT Rate' } });
    expect(props.onSaveDisc).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ mainStat: 'CRIT Rate', subStats: [] }),
    );
  });

  it('calls onSaveDisc with a new substat when "+ Add Substat" is clicked', () => {
    const { props } = renderModal({ agent: slot4WithSuitAndMain() });
    fireEvent.click(screen.getByRole('button', { name: /\+ add substat/i }));
    expect(props.onSaveDisc).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ subStats: expect.arrayContaining([expect.any(String)]) }),
    );
  });

  // --- Equip tab: suit-gating ---

  it('gates variable mains and all substat lists until each slot has a suit', () => {
    const { container } = renderModal();
    // 3 variable-main groups + 6 substat wrappers, all suitless.
    expect(container.querySelectorAll('.is-gated').length).toBe(9);
    const main4 = container.querySelector<HTMLSelectElement>('select[name="disc-4-main-stat"]');
    expect(main4?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /\+ add substat/i })).toBeNull();
  });

  it('ungates a slot main once it has a suit, but keeps substats main-gated', () => {
    const { container } = renderModal({ agent: slot4WithSuit() });
    expect(container.querySelectorAll('.is-gated').length).toBe(8);
    const main4 = container.querySelector<HTMLSelectElement>('select[name="disc-4-main-stat"]');
    expect(main4?.disabled).toBe(false);
    expect(screen.queryByRole('button', { name: /\+ add substat/i })).toBeNull();
  });

  it('ungates a slot substat list once it has both a suit and a main', () => {
    const { container } = renderModal({ agent: slot4WithSuitAndMain() });
    expect(container.querySelectorAll('.is-gated').length).toBe(7);
    expect(screen.getByRole('button', { name: /\+ add substat/i })).toBeInTheDocument();
  });

  it('ungates a fixed slot substat list on its suit alone', () => {
    const agent = makeAgent({
      discs: { ...emptyDiscs, 1: { suitId: '31000', mainStat: 'HP', subStats: [] } },
    });
    renderModal({ agent });
    expect(screen.getByRole('button', { name: /\+ add substat/i })).toBeInTheDocument();
  });

  // --- Anchor scroll ---

  describe('anchor scroll', () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    afterEach(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('scrolls the anchored slot card into view on mount', () => {
      const spy = vi.fn();
      Element.prototype.scrollIntoView = spy;
      renderModal({ anchorSlot: 5 });
      expect(spy).toHaveBeenCalledTimes(1);
      const anchored = spy.mock.contexts[0] as HTMLElement;
      expect(anchored.dataset.slot).toBe('5');
    });

    it('does not scroll when no anchor slot is given', () => {
      const spy = vi.fn();
      Element.prototype.scrollIntoView = spy;
      renderModal();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // --- Footer / close ---

  it('calls onClose when Done button is clicked', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(props.onClose).toHaveBeenCalled();
  });

  // --- Preferences tab ---

  it('shows suit selects, three main chains, substat chain, and comments', () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(container.querySelector('select[name="pref-suit-4"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="pref-suit-2"]')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (Slot 4)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (Slot 5)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (Slot 6)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Substats (Global)')).toBeInTheDocument();
    expect(screen.getByText('Build Comments')).toBeInTheDocument();
  });

  it('emits the whole preferences object when a preferred suit is chosen', () => {
    const { container, props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-suit-4"]')!, {
      target: { value: '31000' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      discSuit4Id: '31000',
    });
  });

  it('emits the whole preferences object when clearing the 2pc suit', () => {
    const agent = makeAgent({
      buildPreferences: {
        mainStats: { 4: [], 5: [], 6: [] },
        subStats: [],
        discSuit4Id: '31000',
        discSuit2Id: '31600',
        comments: 'keep',
      },
    });
    const { container, props } = renderModal({ agent });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-suit-2"]')!, {
      target: { value: '' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      discSuit4Id: '31000',
      discSuit2Id: null,
      comments: 'keep',
    });
  });
});
