import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabbedEditorShell } from './TabbedEditorShell';

const tabs = [
  {
    id: 'a',
    label: 'Alpha',
    content: <div>alpha body</div>,
    footerExtra: <span>alpha-extra</span>,
  },
  { id: 'b', label: 'Beta', content: <div>beta body</div> },
  { id: 'c', label: 'Gamma', content: <div>gamma body</div> },
];

function renderShell(initialTab?: string) {
  const onClose = vi.fn();
  render(
    <TabbedEditorShell
      title="Tabbed — Test"
      tabs={tabs}
      initialTab={initialTab}
      bodyClassName="test-editor-body"
      onClose={onClose}
    />,
  );
  return { onClose };
}

describe('TabbedEditorShell', () => {
  it('opens on the first tab with only its content mounted', () => {
    renderShell();
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveClass('active');
    expect(screen.getByText('alpha body')).toBeInTheDocument();
    expect(screen.queryByText('beta body')).not.toBeInTheDocument();
    expect(screen.queryByText('gamma body')).not.toBeInTheDocument();
  });

  it('honours initialTab', () => {
    renderShell('c');
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveClass('active');
    expect(screen.getByText('gamma body')).toBeInTheDocument();
    expect(screen.queryByText('alpha body')).not.toBeInTheDocument();
  });

  it('falls back to the first tab for an unknown initialTab', () => {
    renderShell('nope');
    expect(screen.getByText('alpha body')).toBeInTheDocument();
  });

  it('switching tabs mounts only the clicked tab', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Alpha' })).not.toHaveClass('active');
    expect(screen.getByText('beta body')).toBeInTheDocument();
    expect(screen.queryByText('alpha body')).not.toBeInTheDocument();
    expect(screen.queryByText('gamma body')).not.toBeInTheDocument();
  });

  it('renders the active tab footerExtra before Done and drops it on other tabs', async () => {
    const user = userEvent.setup();
    renderShell();
    expect(screen.getByText('alpha-extra')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.queryByText('alpha-extra')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('a disabled tab renders disabled and cannot activate', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <TabbedEditorShell
        title="Tabbed — Test"
        tabs={[tabs[0], { ...tabs[1], disabled: true }, tabs[2]]}
        bodyClassName="test-editor-body"
        onClose={onClose}
      />,
    );
    const beta = screen.getByRole('button', { name: 'Beta' });
    expect(beta).toBeDisabled();
    await user.click(beta);
    expect(screen.getByText('alpha body')).toBeInTheDocument();
    expect(screen.queryByText('beta body')).not.toBeInTheDocument();
  });

  it('initialTab naming a disabled tab falls back to the first enabled tab', () => {
    render(
      <TabbedEditorShell
        title="Tabbed — Test"
        tabs={[{ ...tabs[0], disabled: true }, { ...tabs[1], disabled: true }, tabs[2]]}
        initialTab="b"
        bodyClassName="test-editor-body"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('gamma body')).toBeInTheDocument();
  });

  it('Done calls onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wraps the body in the canonical modal-body class plus the modifier', () => {
    renderShell();
    expect(screen.getByText('alpha body').parentElement).toHaveClass(
      'modal-body',
      'test-editor-body',
    );
  });

  it('scrolls the body to the top on tab change but not on mount', async () => {
    const user = userEvent.setup();
    renderShell();
    const body = screen.getByText('alpha body').parentElement as HTMLDivElement;
    const scrollTo = vi.fn();
    body.scrollTo = scrollTo;
    expect(scrollTo).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Gamma' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
