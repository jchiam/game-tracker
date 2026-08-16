import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WEngineEditorModal } from '@/pages/zenless-zone-zero/components/WEngineEditorModal';
import { ALL_ZZZ_WENGINES } from '@/data/zenless-zone-zero/wengines';
import type { ZzzTrackedAgent } from '@/types';

// Derived from the real catalog so tests survive weekly data refreshes.
const stunEngines = ALL_ZZZ_WENGINES.filter((w) => w.specialty === 'Stun');
const offSpecialtyEngine = ALL_ZZZ_WENGINES.find((w) => w.specialty !== 'Stun')!;

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
    level: 45,
    mindscape: 0,
    coreSkill: 0,
    discs: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
    wEngineId: null,
    wEngineLevel: 0,
    wEnginePhase: 1,
    wEnginePreferences: [],
    ...overrides,
  };
}

function renderModal(overrides: Partial<Parameters<typeof WEngineEditorModal>[0]> = {}) {
  const props = {
    agent: makeAgent(),
    onUpdatePreferences: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const utils = render(<WEngineEditorModal {...props} />);
  return { ...utils, props };
}

describe('WEngineEditorModal', () => {
  it('renders the agent-scoped title and the add button', () => {
    renderModal();
    expect(screen.getByText('W-Engines — Anby')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add W-Engine' })).toBeInTheDocument();
  });

  it('wraps content in the canonical modal body slot', () => {
    const { container } = renderModal();
    const body = container.querySelector('.modal-content > .modal-body.wengine-editor-body');
    expect(body).toBeInTheDocument();
    expect(body?.querySelector('.pref-chain-ranked, .add-pref-btn')).toBeInTheDocument();
  });

  it('adds the first available engine when + Add W-Engine is clicked', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: '+ Add W-Engine' }));
    expect(props.onUpdatePreferences).toHaveBeenCalledWith([stunEngines[0].id]);
  });

  it('offers only engines matching the agent specialty', () => {
    const { container } = renderModal({
      agent: makeAgent({ wEnginePreferences: [stunEngines[0].id] }),
    });
    const select = container.querySelector('select[name="pref-wengine-0"]')!;
    const optionValues = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    const stunIds = new Set(stunEngines.map((w) => w.id));
    expect(optionValues.length).toBeGreaterThan(0);
    expect(optionValues.every((v) => stunIds.has(v))).toBe(true);
    expect(optionValues).not.toContain(offSpecialtyEngine.id);
  });

  it('reorders the ranked list with the move buttons', () => {
    const { props } = renderModal({
      agent: makeAgent({ wEnginePreferences: [stunEngines[0].id, stunEngines[1].id] }),
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    expect(props.onUpdatePreferences).toHaveBeenCalledWith([stunEngines[1].id, stunEngines[0].id]);
  });

  it('removes a ranked engine with its row remove button', () => {
    const { props } = renderModal({
      agent: makeAgent({ wEnginePreferences: [stunEngines[0].id, stunEngines[1].id] }),
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(props.onUpdatePreferences).toHaveBeenCalledWith([stunEngines[1].id]);
  });

  it('closes via the Done button', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
