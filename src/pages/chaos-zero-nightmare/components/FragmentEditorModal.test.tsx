import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { FragmentEditorModal } from '@/pages/chaos-zero-nightmare/components/FragmentEditorModal';
import type { CznTrackedCombatant } from '@/types';

const emptyFragments: CznTrackedCombatant['fragments'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

const SPARK = 'spark-of-passion'; // 4-PC
const WING = 'black-wing'; // 2-PC
const CORPSE = 'cursed-corpse'; // 2-PC
const SCARAB = 'seth-s-scarab'; // 2-PC

function makeCombatant(overrides: Partial<CznTrackedCombatant> = {}): CznTrackedCombatant {
  return {
    id: 'mei-lin',
    name: 'Mei Lin',
    rarity: 5,
    class: 'Striker',
    element: 'Passion',
    faction: null,
    imageUrl: '/assets/chaos-zero-nightmare/combatants/mei-lin.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 60,
    ego: 0,
    potentialAttained: false,
    partnerId: null,
    partnerLevel: 1,
    partnerEgo: 0,
    partnerPreferences: [],
    fragments: { ...emptyFragments },
    fragmentPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [], targetSetIds: [] },
    ...overrides,
  };
}

type ModalProps = Parameters<typeof FragmentEditorModal>[0];

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    combatant: makeCombatant(),
    onSaveFragment: vi.fn(),
    onRemoveFragment: vi.fn(),
    onUpdateBuildPreferences: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<FragmentEditorModal {...props} />), props };
}

const slot4WithSet = (): CznTrackedCombatant =>
  makeCombatant({
    fragments: { ...emptyFragments, 4: { setId: SPARK, mainStat: null, subStats: [] } },
  });

// Slot IV with a set AND a main — substats are main-gated, so exercising them needs both.
const slot4WithSetAndMain = (subStats: string[] = []): CznTrackedCombatant =>
  makeCombatant({
    fragments: {
      ...emptyFragments,
      4: { setId: SPARK, mainStat: 'Critical Chance%', subStats },
    },
  });

describe('FragmentEditorModal', () => {
  it('renders the combatant name in the title', () => {
    renderModal();
    expect(screen.getByText('Memory Fragments — Mei Lin')).toBeInTheDocument();
  });

  it('renders six slot cards headed by numeral and slot name', () => {
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
    expect(
      [...container.querySelectorAll('.equip-slot-header')].map((el) => el.textContent),
    ).toEqual([
      'I · Shock',
      'II · Suppression',
      'III · Denial',
      'IV · Ideal',
      'V · Desire',
      'VI · Imagination',
    ]);
  });

  it('shows fixed read-only mains for slots I–III', () => {
    const { container } = renderModal();
    const fixed = [...container.querySelectorAll('.readonly-stat')].map((el) => el.textContent);
    expect(fixed).toEqual(['Flat ATK (Fixed)', 'Flat DEF (Fixed)', 'Flat HP (Fixed)']);
  });

  it('offers every set on every slot, labelled with its piece count', () => {
    const { container } = renderModal();
    const slot1 = container.querySelector<HTMLSelectElement>('select[name="fragment-1-set"]')!;
    const slot5 = container.querySelector<HTMLSelectElement>('select[name="fragment-5-set"]')!;
    const labels = within(slot1)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(labels).toContain('Spark of Passion [4-PC]');
    expect(labels).toContain('Black Wing [2-PC]');
    expect(within(slot5).getAllByRole('option')).toHaveLength(labels.length);
  });

  it('offers the slot-specific main pool on variable slots', () => {
    const { container } = renderModal({ combatant: slot4WithSet() });
    const main4 = container.querySelector<HTMLSelectElement>(
      'select[name="fragment-4-main-stat"]',
    )!;
    const options = within(main4)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toContain('Critical Chance%');
    expect(options).toContain('HP%');
    expect(options).not.toContain('Void Damage%'); // slot V pool only
    expect(options).not.toContain('Ego Recovery'); // slot VI pool only
  });

  // --- Equip tab: save/remove interactions ---

  it('calls onSaveFragment with the numeric slot when a set is selected', () => {
    const { container, props } = renderModal();
    fireEvent.change(container.querySelector('select[name="fragment-4-set"]')!, {
      target: { value: SPARK },
    });
    expect(props.onSaveFragment).toHaveBeenCalledWith(4, expect.objectContaining({ setId: SPARK }));
  });

  it('calls onRemoveFragment for that slot when the set is cleared to None', () => {
    const { container, props } = renderModal({ combatant: slot4WithSet() });
    fireEvent.change(container.querySelector('select[name="fragment-4-set"]')!, {
      target: { value: '' },
    });
    expect(props.onRemoveFragment).toHaveBeenCalledWith(4);
    expect(props.onSaveFragment).not.toHaveBeenCalled();
  });

  it('forces the fixed main when a fixed slot is saved', () => {
    const { container, props } = renderModal();
    fireEvent.change(container.querySelector('select[name="fragment-1-set"]')!, {
      target: { value: WING },
    });
    expect(props.onSaveFragment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ setId: WING, mainStat: 'Flat ATK' }),
    );
  });

  it('prunes a substat that conflicts with the newly selected main stat', () => {
    const combatant = makeCombatant({
      fragments: {
        ...emptyFragments,
        4: { setId: SPARK, mainStat: null, subStats: ['Critical Chance%', 'ATK%'] },
      },
    });
    const { container, props } = renderModal({ combatant });
    fireEvent.change(container.querySelector('select[name="fragment-4-main-stat"]')!, {
      target: { value: 'Critical Chance%' },
    });
    expect(props.onSaveFragment).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ mainStat: 'Critical Chance%', subStats: ['ATK%'] }),
    );
  });

  it('calls onSaveFragment with a new substat when "+ Add Substat" is clicked', () => {
    const { props } = renderModal({ combatant: slot4WithSetAndMain() });
    fireEvent.click(screen.getByRole('button', { name: /\+ add substat/i }));
    expect(props.onSaveFragment).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ subStats: expect.arrayContaining([expect.any(String)]) }),
    );
  });

  // --- Equip tab: set-gating ---

  it('gates variable mains and all substat lists until each slot has a set', () => {
    const { container } = renderModal();
    // 3 variable-main groups + 6 substat wrappers, all without a set.
    expect(container.querySelectorAll('.is-gated').length).toBe(9);
    const main4 = container.querySelector<HTMLSelectElement>('select[name="fragment-4-main-stat"]');
    expect(main4?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /\+ add substat/i })).toBeNull();
  });

  it('ungates a slot main once it has a set, but keeps substats main-gated', () => {
    const { container } = renderModal({ combatant: slot4WithSet() });
    expect(container.querySelectorAll('.is-gated').length).toBe(8);
    const main4 = container.querySelector<HTMLSelectElement>('select[name="fragment-4-main-stat"]');
    expect(main4?.disabled).toBe(false);
    expect(screen.queryByRole('button', { name: /\+ add substat/i })).toBeNull();
  });

  it('ungates a slot substat list once it has both a set and a main', () => {
    const { container } = renderModal({ combatant: slot4WithSetAndMain() });
    expect(container.querySelectorAll('.is-gated').length).toBe(7);
    expect(screen.getByRole('button', { name: /\+ add substat/i })).toBeInTheDocument();
  });

  it('ungates a fixed slot substat list on its set alone', () => {
    const combatant = makeCombatant({
      fragments: { ...emptyFragments, 1: { setId: WING, mainStat: 'Flat ATK', subStats: [] } },
    });
    renderModal({ combatant });
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

  it('shows set selects, three main chains, substat chain, and comments', () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(container.querySelector('select[name="pref-set-1"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="pref-set-2"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="pref-set-3"]')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (IV · Ideal)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (V · Desire)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (VI · Imagination)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Substats (Global)')).toBeInTheDocument();
    expect(screen.getByText('Build Comments')).toBeInTheDocument();
  });

  const compositionLabels = (container: HTMLElement, name: string) =>
    within(container.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!)
      .getAllByRole('option')
      .map((o) => o.textContent ?? '');
  const isDisabled = (container: HTMLElement, name: string) =>
    container.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!.disabled;
  const withComposition = (targetSetIds: string[]) =>
    makeCombatant({
      fragmentPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [], targetSetIds },
    });

  it('offers every set on every composition row when the composition is empty', () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    for (const name of ['pref-set-1', 'pref-set-2', 'pref-set-3']) {
      const labels = compositionLabels(container, name);
      expect(labels).toContain('Spark of Passion [4-PC]');
      expect(labels).toContain('Black Wing [2-PC]');
      expect(isDisabled(container, name)).toBe(false);
    }
  });

  it('a 4-PC set in row 1 leaves rows 2 and 3 with 2-PC sets only', () => {
    const { container } = renderModal({ combatant: withComposition([SPARK]) });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    for (const name of ['pref-set-2', 'pref-set-3']) {
      const labels = compositionLabels(container, name);
      expect(labels).toContain('Black Wing [2-PC]');
      expect(labels.some((l) => l.includes('[4-PC]'))).toBe(false);
      expect(isDisabled(container, name)).toBe(false);
    }
    // Row 1 keeps offering its own value and the other 4-PC sets.
    expect(compositionLabels(container, 'pref-set-1')).toContain('Spark of Passion [4-PC]');
  });

  it('a full 4+2 composition disables the third row', () => {
    const { container } = renderModal({ combatant: withComposition([SPARK, WING]) });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(isDisabled(container, 'pref-set-3')).toBe(true);
    expect(compositionLabels(container, 'pref-set-3')).toEqual(['-- None --']);
    // Rows 1 and 2 keep their own values offered.
    expect(compositionLabels(container, 'pref-set-1')).toContain('Spark of Passion [4-PC]');
    expect(compositionLabels(container, 'pref-set-2')).toContain('Black Wing [2-PC]');
  });

  it('two 2-PC sets leave row 3 with the remaining 2-PC sets and no 4-PC set', () => {
    const { container } = renderModal({ combatant: withComposition([WING, CORPSE]) });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    const row3 = compositionLabels(container, 'pref-set-3');
    expect(row3).toContain("Seth's Scarab [2-PC]");
    expect(row3).not.toContain('Black Wing [2-PC]');
    expect(row3).not.toContain('Cursed Corpse [2-PC]');
    expect(row3.some((l) => l.includes('[4-PC]'))).toBe(false);
    expect(isDisabled(container, 'pref-set-3')).toBe(false);
  });

  it('emits a three-set composition when the third row is filled', () => {
    const { container, props } = renderModal({ combatant: withComposition([WING, CORPSE]) });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-set-3"]')!, {
      target: { value: SCARAB },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      targetSetIds: [WING, CORPSE, SCARAB],
    });
  });

  it('emits the whole preferences object when a preferred set is chosen', () => {
    const { container, props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-set-1"]')!, {
      target: { value: SPARK },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      targetSetIds: [SPARK],
    });
  });

  it('emits an updated per-slot main chain when a priority is added', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    // First add button belongs to the slot IV main chain (3 main chains + subs follow).
    fireEvent.click(screen.getAllByRole('button', { name: '+ Add Priority' })[0]);
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        mainStats: expect.objectContaining({
          4: [expect.objectContaining({ stat: expect.any(String) })],
        }),
      }),
    );
  });

  it('emits an updated substat chain when a priority is added', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    const addButtons = screen.getAllByRole('button', { name: '+ Add Priority' });
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        subStats: [expect.objectContaining({ stat: expect.any(String) })],
      }),
    );
  });

  it('emits updated comments when the textarea changes', () => {
    const { container, props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('textarea')!, {
      target: { value: 'crit build' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ comments: 'crit build' }),
    );
  });

  it('clearing a 4-PC row drops it from the composition without leaving a hole', () => {
    const combatant = makeCombatant({
      fragmentPreferences: {
        mainStats: { 4: [], 5: [], 6: [] },
        subStats: [],
        targetSetIds: [SPARK, WING],
        comments: 'keep',
      },
    });
    const { container, props } = renderModal({ combatant });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-set-1"]')!, {
      target: { value: '' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith({
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      targetSetIds: [WING],
      comments: 'keep',
    });
  });

  it('a lone 2-PC set frees the budget for a 4-PC set on every other row', () => {
    const { container } = renderModal({ combatant: withComposition([WING]) });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(compositionLabels(container, 'pref-set-2')).toContain('Spark of Passion [4-PC]');
    expect(compositionLabels(container, 'pref-set-3')).toContain('Spark of Passion [4-PC]');
  });
});
