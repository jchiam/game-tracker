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
});
