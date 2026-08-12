import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LightConeEditorModal } from '@/pages/honkai-star-rail/components/LightConeEditorModal';
import { ALL_LIGHT_CONES } from '@/data/honkai-star-rail/light_cones';
import type { HsrTrackedCharacter } from '@/types';

// Derived from the real catalog so tests survive weekly data refreshes.
const nihilityCones = ALL_LIGHT_CONES.filter((lc) => lc.path === 'Nihility');
const offPathCone = ALL_LIGHT_CONES.find((lc) => lc.path !== 'Nihility')!;

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
    lightConeId: null,
    lightConeLevel: 1,
    lightConeSuperimposition: 1,
    lightConePreferences: [],
    relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
    buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
    ...overrides,
  };
}

function renderModal(overrides: Partial<Parameters<typeof LightConeEditorModal>[0]> = {}) {
  const props = {
    char: makeChar(),
    onUpdatePreferences: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const utils = render(<LightConeEditorModal {...props} />);
  return { ...utils, props };
}

describe('LightConeEditorModal', () => {
  it('renders the character-scoped title and the add button', () => {
    renderModal();
    expect(screen.getByText('Light Cones — Acheron')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Light Cone' })).toBeInTheDocument();
  });

  it('wraps content in a padded scrollable modal body', () => {
    const { container } = renderModal();
    const body = container.querySelector('.modal-content .light-cone-editor-body');
    expect(body).toBeInTheDocument();
    expect(body?.querySelector('.pref-chain-ranked, .add-pref-btn')).toBeInTheDocument();
  });

  it('adds the first available cone when + Add Light Cone is clicked', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: '+ Add Light Cone' }));
    expect(props.onUpdatePreferences).toHaveBeenCalledWith([nihilityCones[0].id]);
  });

  it('offers only cones matching the character path', () => {
    const { container } = renderModal({
      char: makeChar({ lightConePreferences: [nihilityCones[0].id] }),
    });
    const select = container.querySelector('select[name="pref-light-cone-0"]')!;
    const optionValues = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    const nihilityIds = new Set(nihilityCones.map((lc) => lc.id));
    expect(optionValues.length).toBeGreaterThan(0);
    expect(optionValues.every((v) => nihilityIds.has(v))).toBe(true);
    expect(optionValues).not.toContain(offPathCone.id);
  });

  it('reorders the ranked list with the move buttons', () => {
    const { props } = renderModal({
      char: makeChar({ lightConePreferences: [nihilityCones[0].id, nihilityCones[1].id] }),
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    expect(props.onUpdatePreferences).toHaveBeenCalledWith([
      nihilityCones[1].id,
      nihilityCones[0].id,
    ]);
  });

  it('removes a ranked cone with its row remove button', () => {
    const { props } = renderModal({
      char: makeChar({ lightConePreferences: [nihilityCones[0].id, nihilityCones[1].id] }),
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(props.onUpdatePreferences).toHaveBeenCalledWith([nihilityCones[1].id]);
  });

  it('closes via the Done button', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
