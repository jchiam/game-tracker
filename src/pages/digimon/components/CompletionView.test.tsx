import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletionView } from './CompletionView';
import { computeCompletion } from '@/pages/digimon/completion';
import { ALL_PRODUCTS, DGM_LINES } from '@/data/digimon/products';
import { createMockSession } from '@/test/mocks/supabase';
import type { DgmTrackedProduct, DgmTrackedVariant } from '@/types';

function track(
  id: string,
  variantState: Record<string, DgmTrackedVariant> = {},
): DgmTrackedProduct {
  const product = ALL_PRODUCTS.find((p) => p.id === id)!;
  return {
    ...product,
    dbId: `db-${id}`,
    isFavorited: false,
    notes: '',
    progress: [],
    variantState,
  };
}

const owned = (variantId: string): Record<string, DgmTrackedVariant> => ({
  [variantId]: { status: 'owned', condition: null },
});
const wishlist = (variantId: string): Record<string, DgmTrackedVariant> => ({
  [variantId]: { status: 'wishlist', condition: null },
});

const pendulum = ALL_PRODUCTS.filter((p) => p.line === 'Pendulum');
const pendulumVariants = pendulum.reduce((n, p) => n + p.variants.length, 0);
const dvc = ALL_PRODUCTS.find((p) => p.id === 'dv-25th-color-evolution')!;

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
    expect(rows[0].label).toBe('All products');
    expect(rows.slice(1).map((r) => r.label)).toEqual(DGM_LINES);
  });

  it('counts owned products and variants per line; wishlist and interested never count', () => {
    const tracked = [
      track(pendulum[0].id, owned(pendulum[0].variants[0].id)),
      track(pendulum[1].id, owned(pendulum[1].variants[0].id)),
      track(pendulum[2].id, wishlist(pendulum[2].variants[0].id)),
      track(pendulum[3].id),
    ];
    const row = computeCompletion(tracked).find((r) => r.label === 'Pendulum')!;
    expect(row.productsOwned).toBe(2);
    expect(row.productsTotal).toBe(pendulum.length);
    expect(row.variantsOwned).toBe(2);
    expect(row.variantsTotal).toBe(pendulumVariants);
    expect(row.percent).toBe(Math.round((2 / pendulum.length) * 100));
  });

  it('counts every owned variant of a product', () => {
    const tracked = [
      track(dvc.id, {
        ...owned(dvc.variants[0].id),
        ...owned(dvc.variants[1].id),
        ...wishlist(dvc.variants[2].id),
      }),
    ];
    const row = computeCompletion(tracked).find((r) => r.label === 'Digivice')!;
    expect(row.productsOwned).toBe(1);
    expect(row.variantsOwned).toBe(2);
  });

  it('overall row counts across every line', () => {
    const tracked = [
      track(pendulum[0].id, owned(pendulum[0].variants[0].id)),
      track(ALL_PRODUCTS[0].id, owned(ALL_PRODUCTS[0].variants[0].id)),
    ];
    const overall = computeCompletion(tracked)[0];
    expect(overall.productsOwned).toBe(2);
    expect(overall.productsTotal).toBe(ALL_PRODUCTS.length);
    expect(overall.percent).toBe(Math.round((2 / ALL_PRODUCTS.length) * 100));
  });

  it('reports zero for lines with nothing owned', () => {
    const row = computeCompletion([])[1];
    expect(row.productsOwned).toBe(0);
    expect(row.variantsOwned).toBe(0);
    expect(row.percent).toBe(0);
  });
});

describe('CompletionView', () => {
  it('renders count, percent, variant readout, and fill width per row', () => {
    const tracked = [
      track(pendulum[0].id, owned(pendulum[0].variants[0].id)),
      track(pendulum[1].id, owned(pendulum[1].variants[0].id)),
    ];
    const { container } = render(<CompletionView {...baseProps} trackedProducts={tracked} />);
    const pct = Math.round((2 / pendulum.length) * 100);
    expect(screen.getByText(`2 / ${pendulum.length}`)).toBeInTheDocument();
    expect(screen.getByText(`2 / ${pendulumVariants} variants`)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: /pendulum completion/i });
    expect(bar).toHaveAttribute('aria-valuenow', String(pct));
    expect(bar.querySelector('.completion-bar-fill')).toHaveStyle({ width: `${pct}%` });
    expect(container.querySelectorAll('.completion-row').length).toBe(DGM_LINES.length + 1);
  });

  it('renders an empty fill for lines with nothing owned', () => {
    render(<CompletionView {...baseProps} trackedProducts={[]} />);
    const bar = screen.getByRole('progressbar', { name: /^pendulum completion/i });
    expect(bar.querySelector('.completion-bar-fill')).toHaveStyle({ width: '0%' });
  });

  it('shows AuthGate when signed out', () => {
    render(<CompletionView {...baseProps} session={null} trackedProducts={[]} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows loading while the initial load is in flight', () => {
    render(<CompletionView {...baseProps} isInitialLoad trackedProducts={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading your collection/i);
  });

  it('shows ErrorState with retry on load error', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <CompletionView {...baseProps} isLoadError onRetry={onRetry} trackedProducts={[]} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load your collection/i);
    expect(container.querySelector('.empty-state')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
