import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentEditorShell } from './EquipmentEditorShell';

function renderShell(extra?: React.ReactNode) {
  const onClose = vi.fn();
  render(
    <EquipmentEditorShell
      title="Relics — Test"
      equipTabLabel="Equip Relics"
      bodyClassName="test-editor-body"
      equipContent={<div>equip body</div>}
      preferencesContent={<div>prefs body</div>}
      equipFooterExtra={extra}
      onClose={onClose}
    />,
  );
  return { onClose };
}

describe('EquipmentEditorShell', () => {
  it('opens on the Equip tab with the preferences content unmounted', () => {
    renderShell();
    expect(screen.getByRole('button', { name: 'Equip Relics' })).toHaveClass('active');
    expect(screen.getByText('equip body')).toBeInTheDocument();
    expect(screen.queryByText('prefs body')).not.toBeInTheDocument();
  });

  it('switching tabs unmounts the inactive content', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.getByText('prefs body')).toBeInTheDocument();
    expect(screen.queryByText('equip body')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Preferences' })).toHaveClass('active');
  });

  it('Done fires onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders equipFooterExtra only on the Equip tab', async () => {
    const user = userEvent.setup();
    renderShell(<button>Un-equip</button>);
    expect(screen.getByRole('button', { name: 'Un-equip' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Build Preferences' }));
    expect(screen.queryByRole('button', { name: 'Un-equip' })).not.toBeInTheDocument();
  });

  describe('scroll reset on tab switch', () => {
    // jsdom elements have no scrollTo — install a spy on the body wrapper.
    function renderWithScrollSpy() {
      renderShell();
      const body = document.querySelector('.test-editor-body') as HTMLDivElement & {
        scrollTo: ReturnType<typeof vi.fn>;
      };
      body.scrollTo = vi.fn() as unknown as typeof body.scrollTo;
      return body;
    }

    it('does not reset scroll on initial mount', () => {
      const scrollTo = vi.fn();
      const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        value: scrollTo,
        configurable: true,
      });
      try {
        renderShell();
        expect(scrollTo).not.toHaveBeenCalled();
      } finally {
        if (original) Object.defineProperty(HTMLElement.prototype, 'scrollTo', original);
        else delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
      }
    });

    it('scrolls the body wrapper to the top when switching to Build Preferences', async () => {
      const user = userEvent.setup();
      const body = renderWithScrollSpy();
      await user.click(screen.getByRole('button', { name: 'Build Preferences' }));
      expect(body.scrollTo).toHaveBeenCalledWith({ top: 0 });
    });

    it('scrolls the body wrapper to the top when returning to the Equip tab', async () => {
      const user = userEvent.setup();
      const body = renderWithScrollSpy();
      await user.click(screen.getByRole('button', { name: 'Build Preferences' }));
      body.scrollTo.mockClear();
      await user.click(screen.getByRole('button', { name: 'Equip Relics' }));
      expect(body.scrollTo).toHaveBeenCalledWith({ top: 0 });
    });

    it('does not throw when scrollTo is unavailable (jsdom default)', async () => {
      const user = userEvent.setup();
      renderShell();
      await user.click(screen.getByRole('button', { name: 'Build Preferences' }));
      expect(screen.getByText('prefs body')).toBeInTheDocument();
    });
  });
});
