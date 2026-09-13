import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletionView } from './CompletionView';
import { computeCompletion } from '@/pages/digimon/completion';
import { ALL_DEVICES, DGM_LINES } from '@/data/digimon/devices';
import { createMockSession } from '@/test/mocks/supabase';
import type { DgmTrackedDevice } from '@/types';

function track(id: string, status: 'owned' | 'wishlist' = 'owned'): DgmTrackedDevice {
  const device = ALL_DEVICES.find((d) => d.id === id)!;
  return {
    ...device,
    dbId: `db-${id}`,
    isFavorited: false,
    status,
    condition: null,
    acquiredOn: null,
    notes: '',
  };
}

const pendulum = ALL_DEVICES.filter((d) => d.line === 'Pendulum');

const baseProps = {
  session: createMockSession(),
  isAuthLoading: false,
  isInitialLoad: false,
  isLoadError: false,
  onRetry: vi.fn(),
  onSignIn: vi.fn(),
};

describe('computeCompletion', () => {
  it('returns the overall row first, then one row per line in catalog order', () => {
    const rows = computeCompletion([]);
    expect(rows[0].label).toBe('All devices');
    expect(rows.slice(1).map((r) => r.label)).toEqual(DGM_LINES);
  });

  it('counts owned devices per line and ignores wishlist', () => {
    const tracked = [
      track(pendulum[0].id, 'owned'),
      track(pendulum[1].id, 'owned'),
      track(pendulum[2].id, 'wishlist'),
    ];
    const row = computeCompletion(tracked).find((r) => r.label === 'Pendulum')!;
    expect(row.owned).toBe(2);
    expect(row.total).toBe(pendulum.length);
    expect(row.percent).toBe(Math.round((2 / pendulum.length) * 100));
  });

  it('overall row counts across every line', () => {
    const tracked = [track(pendulum[0].id), track(ALL_DEVICES[0].id)];
    const overall = computeCompletion(tracked)[0];
    expect(overall.owned).toBe(2);
    expect(overall.total).toBe(ALL_DEVICES.length);
    expect(overall.percent).toBe(Math.round((2 / ALL_DEVICES.length) * 100));
  });

  it('reports zero for lines with nothing owned', () => {
    const row = computeCompletion([])[1];
    expect(row.owned).toBe(0);
    expect(row.percent).toBe(0);
  });
});

describe('CompletionView', () => {
  it('renders count, percent, and fill width per row', () => {
    const tracked = [track(pendulum[0].id), track(pendulum[1].id)];
    const { container } = render(<CompletionView {...baseProps} trackedDevices={tracked} />);
    const pct = Math.round((2 / pendulum.length) * 100);
    expect(screen.getByText(`2 / ${pendulum.length}`)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: /pendulum completion/i });
    expect(bar).toHaveAttribute('aria-valuenow', String(pct));
    expect(bar.querySelector('.completion-bar-fill')).toHaveStyle({ width: `${pct}%` });
    expect(container.querySelectorAll('.completion-row').length).toBe(DGM_LINES.length + 1);
  });

  it('renders an empty fill for lines with nothing owned', () => {
    render(<CompletionView {...baseProps} trackedDevices={[]} />);
    const bar = screen.getByRole('progressbar', { name: /^pendulum completion/i });
    expect(bar.querySelector('.completion-bar-fill')).toHaveStyle({ width: '0%' });
  });

  it('shows AuthGate when signed out', () => {
    render(<CompletionView {...baseProps} session={null} trackedDevices={[]} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows loading while the initial load is in flight', () => {
    render(<CompletionView {...baseProps} isInitialLoad trackedDevices={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading your collection/i);
  });

  it('shows ErrorState with retry on load error', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <CompletionView {...baseProps} isLoadError onRetry={onRetry} trackedDevices={[]} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load your collection/i);
    expect(container.querySelector('.empty-state')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
