import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

const emptyRelics: HsrTrackedCharacter['relics'] = {
  head: null,
  hands: null,
  body: null,
  feet: null,
  sphere: null,
  rope: null,
};

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
    relics: { ...emptyRelics },
    buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
    ...overrides,
  };
}

type ModalProps = Parameters<typeof RelicEditorModal>[0];

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    char: makeChar(),
    availableRelicSets: [...cavernRelicSets, ...planarRelicSets],
    emptyRelic,
    onSaveRelic: vi.fn(),
    onRemoveRelic: vi.fn(),
    onUpdateBuildPreferences: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<RelicEditorModal {...props} />), props };
}

const bodyWithSet = (): HsrTrackedCharacter =>
  makeChar({
    relics: { ...emptyRelics, body: { setId: '101', mainStat: null, subStats: [] } },
  });

describe('RelicEditorModal', () => {
  it('renders the character name in the title', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: /relics — acheron/i })).toBeInTheDocument();
  });

  it('renders all six slot cards on the Equip tab', () => {
    const { container } = renderModal();
    const cards = container.querySelectorAll('.equip-slot-card');
    expect(cards).toHaveLength(6);
    const headers = [...container.querySelectorAll('.equip-slot-header')].map((h) => h.textContent);
    expect(headers).toEqual(['Head', 'Hands', 'Body', 'Feet', 'Sphere', 'Rope']);
  });

  it('shows the Equip Relics tab by default', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Equip Relics' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Build Preferences' })).not.toHaveClass('active');
  });

  it('switches to Build Preferences tab when clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.getByRole('button', { name: 'Build Preferences' })).toHaveClass('active');
  });

  // --- Equip tab: fixed mains + slot-family filtering ---

  it('shows fixed read-only mains for head and hands', () => {
    const { container } = renderModal();
    const fixed = [...container.querySelectorAll('.readonly-stat')].map((el) => el.textContent);
    expect(fixed).toEqual(['HP (Fixed)', 'ATK (Fixed)']);
    // No leftover inline style block (old hardcoded rgba is gone).
    expect(container.querySelector('.readonly-stat')?.getAttribute('style')).toBeNull();
  });

  it('offers only cavern relic sets (1*) on non-planar slot cards', () => {
    const { container } = renderModal();
    const bodySet = container.querySelector<HTMLSelectElement>('select[name="relic-body-set"]')!;
    const options = within(bodySet)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toContain('Passerby of Wandering Cloud');
    expect(options).not.toContain('Space Sealing Station');
  });

  it('offers only planar relic sets (3*) on sphere and rope slot cards', () => {
    const { container } = renderModal();
    const sphereSet = container.querySelector<HTMLSelectElement>(
      'select[name="relic-sphere-set"]',
    )!;
    const options = within(sphereSet)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toContain('Space Sealing Station');
    expect(options).not.toContain('Passerby of Wandering Cloud');
  });

  // --- Equip tab: save/remove interactions ---

  it('calls onSaveRelic with the slot when a relic set is selected', () => {
    const { container, props } = renderModal();
    const bodySet = container.querySelector('select[name="relic-body-set"]')!;
    fireEvent.change(bodySet, { target: { value: '101' } });
    expect(props.onSaveRelic).toHaveBeenCalledWith(
      'body',
      expect.objectContaining({ setId: '101' }),
    );
  });

  it('calls onRemoveRelic for that slot when the set is cleared to None', () => {
    const { container, props } = renderModal({ char: bodyWithSet() });
    const bodySet = container.querySelector('select[name="relic-body-set"]')!;
    fireEvent.change(bodySet, { target: { value: '' } });
    expect(props.onRemoveRelic).toHaveBeenCalledWith('body');
    expect(props.onSaveRelic).not.toHaveBeenCalled();
  });

  it('calls onSaveRelic when a main stat is selected for a flexible slot', () => {
    const { container, props } = renderModal({ char: bodyWithSet() });
    const mainSelect = container.querySelector('select[name="relic-body-main-stat"]')!;
    fireEvent.change(mainSelect, { target: { value: 'CRIT Rate' } });
    expect(props.onSaveRelic).toHaveBeenCalledWith(
      'body',
      expect.objectContaining({ mainStat: 'CRIT Rate' }),
    );
  });

  it('prunes a substat that conflicts with the newly selected main stat', () => {
    const char = makeChar({
      relics: { ...emptyRelics, body: { setId: '101', mainStat: null, subStats: ['CRIT Rate'] } },
    });
    const { container, props } = renderModal({ char });
    const mainSelect = container.querySelector('select[name="relic-body-main-stat"]')!;
    fireEvent.change(mainSelect, { target: { value: 'CRIT Rate' } });
    expect(props.onSaveRelic).toHaveBeenCalledWith(
      'body',
      expect.objectContaining({ mainStat: 'CRIT Rate', subStats: [] }),
    );
  });

  it('calls onSaveRelic with a new substat when "+ Add Substat" is clicked', () => {
    const { props } = renderModal({ char: bodyWithSet() });
    // Only the body slot has a set, so exactly one add button is enabled/rendered.
    fireEvent.click(screen.getByRole('button', { name: /\+ add substat/i }));
    expect(props.onSaveRelic).toHaveBeenCalledWith(
      'body',
      expect.objectContaining({ subStats: expect.arrayContaining([expect.any(String)]) }),
    );
  });

  it('calls onSaveRelic with the substat removed when its remove button is clicked', () => {
    const char = makeChar({
      relics: { ...emptyRelics, body: { setId: '101', mainStat: null, subStats: ['HP'] } },
    });
    const { container, props } = renderModal({ char });
    fireEvent.click(container.querySelector('.remove-substat')!);
    expect(props.onSaveRelic).toHaveBeenCalledWith(
      'body',
      expect.objectContaining({ subStats: [] }),
    );
  });

  it('calls onSaveRelic when a substat type select is changed', () => {
    const char = makeChar({
      relics: { ...emptyRelics, body: { setId: '101', mainStat: null, subStats: ['HP'] } },
    });
    const { container, props } = renderModal({ char });
    const subSelect = container.querySelector('select[name="relic-body-substat-type-0"]')!;
    fireEvent.change(subSelect, { target: { value: 'CRIT Rate' } });
    expect(props.onSaveRelic).toHaveBeenCalledWith(
      'body',
      expect.objectContaining({ subStats: ['CRIT Rate'] }),
    );
  });

  // --- Equip tab: set-gating ---

  it('gates variable mains and all substat lists until each slot has a set', () => {
    const { container } = renderModal();
    // 4 variable-main groups + 6 substat wrappers, all setless.
    expect(container.querySelectorAll('.is-gated').length).toBe(10);
    const mainSelect = container.querySelector<HTMLSelectElement>(
      'select[name="relic-body-main-stat"]',
    );
    expect(mainSelect?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /\+ add substat/i })).toBeNull();
  });

  it('ungates a slot once it has a set', () => {
    const { container } = renderModal({ char: bodyWithSet() });
    // Body's two groups ungate: 10 - 2 = 8.
    expect(container.querySelectorAll('.is-gated').length).toBe(8);
    const mainSelect = container.querySelector<HTMLSelectElement>(
      'select[name="relic-body-main-stat"]',
    );
    expect(mainSelect?.disabled).toBe(false);
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
      renderModal({ anchorSlot: 'feet' });
      expect(spy).toHaveBeenCalledTimes(1);
      const anchored = spy.mock.contexts[0] as HTMLElement;
      expect(anchored.dataset.slot).toBe('feet');
    });

    it('does not scroll when no anchor slot is given', () => {
      const spy = vi.fn();
      Element.prototype.scrollIntoView = spy;
      renderModal();
      expect(spy).not.toHaveBeenCalled();
    });

    it('tab-return lands at the top, not the anchor', () => {
      const anchorSpy = vi.fn();
      Element.prototype.scrollIntoView = anchorSpy;
      const { container } = renderModal({ anchorSlot: 'feet' });
      const body = container.querySelector('.relic-editor-body') as HTMLDivElement & {
        scrollTo: ReturnType<typeof vi.fn>;
      };
      body.scrollTo = vi.fn();

      fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
      anchorSpy.mockClear();
      body.scrollTo.mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Equip Relics' }));

      // The anchor re-fires on EquipTab remount (child effect), but the shell's
      // reset flushes after it (parent effect) — the top position wins.
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      expect(body.scrollTo).toHaveBeenCalledWith({ top: 0 });
      expect(body.scrollTo.mock.invocationCallOrder[0]).toBeGreaterThan(
        anchorSpy.mock.invocationCallOrder[0],
      );
    });
  });

  // --- Footer ---

  it('renders only a Done button in the footer (no Un-equip)', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /un-equip/i })).not.toBeInTheDocument();
  });

  it('calls onClose when Done button is clicked', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('calls onClose when the header ✕ button is clicked', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the modal overlay is clicked', () => {
    const { container, props } = renderModal();
    fireEvent.mouseDown(container.querySelector('.modal-overlay')!);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  // --- Build Preferences tab ---

  it('shows all four variable-slot main chains together on the preferences tab', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.getByText('Preferred Main Stat (Body)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (Feet)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (Sphere)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Main Stat (Rope)')).toBeInTheDocument();
    expect(screen.getByText('Preferred Substats (Global)')).toBeInTheDocument();
    // No chains for the fixed head/hands slots.
    expect(screen.queryByText('Preferred Main Stat (Head)')).not.toBeInTheDocument();
    expect(screen.queryByText('Preferred Main Stat (Hands)')).not.toBeInTheDocument();
  });

  it('shows the preferred relic/planar set selects and comments field', () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(container.querySelector('select[name="pref-relic-set"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="pref-planar-set"]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/additional notes/i)).toBeInTheDocument();
  });

  it('calls onUpdateBuildPreferences when a preferred set is chosen', () => {
    const { container, props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-relic-set"]')!, {
      target: { value: '101' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ relicSetId: '101' }),
    );
    fireEvent.change(container.querySelector('select[name="pref-planar-set"]')!, {
      target: { value: '301' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ planarSetId: '301' }),
    );
  });

  it('calls onUpdateBuildPreferences when a sub stat priority is added', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    const addButtons = screen.getAllByRole('button', { name: /add priority/i });
    // 4 main chains + 1 substat chain.
    expect(addButtons).toHaveLength(5);
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(props.onUpdateBuildPreferences).toHaveBeenCalled();
  });

  it('calls onUpdateBuildPreferences when a main stat preference is removed', () => {
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
    const { container, props } = renderModal({ char });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.click(container.querySelector('.remove-pref-btn')!);
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ mainStats: expect.objectContaining({ body: [] }) }),
    );
  });

  it('calls onUpdateBuildPreferences when a main stat preference stat is changed', () => {
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
    const { container, props } = renderModal({ char });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    const prefSelect = container.querySelector('select[name="pref-main-stat-body-0"]')!;
    fireEvent.change(prefSelect, { target: { value: 'CRIT DMG' } });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        mainStats: expect.objectContaining({
          body: expect.arrayContaining([expect.objectContaining({ stat: 'CRIT DMG' })]),
        }),
      }),
    );
  });

  it('calls onUpdateBuildPreferences when a sub stat preference is removed', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
      },
    });
    const { container, props } = renderModal({ char });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.click(container.querySelector('.remove-pref-btn')!);
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ subStats: [] }),
    );
  });

  it('calls onUpdateBuildPreferences when build comments are entered', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(screen.getByPlaceholderText(/additional notes/i), {
      target: { value: 'Focus on CRIT stats' },
    });
    expect(props.onUpdateBuildPreferences).toHaveBeenCalledWith(
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
    renderModal({ char });
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.getByDisplayValue('Pre-existing comment')).toBeInTheDocument();
  });
});
