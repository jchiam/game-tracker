import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/digimon/productService', () => ({
  loadProductsFromDB: vi.fn(),
  insertProduct: vi.fn(),
  deleteProduct: vi.fn(),
  updateProduct: vi.fn(),
  upsertVariant: vi.fn(),
  deleteVariant: vi.fn(),
}));

vi.mock('@/hooks/usePendingSaves', () => ({
  usePendingSaves: (_delay?: number, _onFlushError?: unknown) => ({
    pendingSaveCount: 0,
    queueUpdate: vi.fn(
      (
        _key: string,
        updates: Record<string, any>,
        flushFn: (p: Record<string, any>) => Promise<void>,
      ) => flushFn(updates),
    ),
    queueAction: vi.fn((_key: string, action: () => Promise<void>) => action().catch(() => {})),
  }),
}));

vi.mock('@/utils/toast', () => ({
  addToast: vi.fn(),
}));

import { useProducts } from '@/hooks/digimon/useProducts';
import { ALL_PRODUCTS } from '@/data/digimon/products';
import * as productService from '@/services/digimon/productService';
import { addToast } from '@/utils/toast';

const mockLoad = vi.mocked(productService.loadProductsFromDB);
const mockInsert = vi.mocked(productService.insertProduct);
const mockUpdate = vi.mocked(productService.updateProduct);
const mockUpsertVariant = vi.mocked(productService.upsertVariant);
const mockDeleteVariant = vi.mocked(productService.deleteVariant);

const mockSession = createMockSession();
const dvc = ALL_PRODUCTS.find((p) => p.id === 'dv-25th-color-evolution')!;
const anime = dvc.variants[0].id;

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue([]);
    mockInsert.mockResolvedValue('new-db-id');
    mockUpdate.mockResolvedValue(undefined);
    mockUpsertVariant.mockResolvedValue(undefined);
    mockDeleteVariant.mockResolvedValue(undefined);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useProducts(session, false));
    await waitFor(() => {
      expect(hook.result.current.isInitialLoad).toBe(false);
    });
    return hook;
  }

  async function setupWithProduct() {
    const hook = await setup();
    await act(async () => {
      await hook.result.current.addProduct(dvc);
    });
    await waitFor(() => expect(hook.result.current.trackedProducts[0].dbId).toBe('new-db-id'));
    return hook;
  }

  it('exposes the full catalog as available products', async () => {
    const { result } = await setup();
    expect(result.current.availableProducts.length).toBe(ALL_PRODUCTS.length);
  });

  it('adds a product optimistically with collection defaults', async () => {
    const { result } = await setup();
    await act(async () => {
      await result.current.addProduct(dvc);
    });
    const tracked = result.current.trackedProducts[0];
    expect(tracked.id).toBe(dvc.id);
    expect(tracked.isFavorited).toBe(false);
    expect(tracked.notes).toBe('');
    expect(tracked.progress).toEqual([]);
    expect(tracked.variantState).toEqual({});
    expect(mockInsert).toHaveBeenCalledWith(mockSession.user.id, dvc.id);
  });

  it.each([
    ['updateNotes', 'Gift', { notes: 'Gift' }],
    ['toggleFavorite', true, { isFavorited: true }],
    ['updateProgress', ['map:subspace'], { progress: ['map:subspace'] }],
  ] as const)('%s writes its field optimistically and to the DB', async (fn, value, patch) => {
    const { result } = await setupWithProduct();
    await act(async () => {
      (result.current[fn] as (id: string, v: unknown) => void)(dvc.id, value);
    });
    const key = Object.keys(patch)[0] as keyof typeof patch;
    expect(result.current.trackedProducts[0][key]).toEqual(value);
    expect(mockUpdate).toHaveBeenCalledWith('new-db-id', patch);
  });

  const copies = (c: Partial<Record<'sealed' | 'boxed' | 'loose', number>>) => ({
    sealed: 0,
    boxed: 0,
    loose: 0,
    ...c,
  });

  it('setVariantCopies sets the count optimistically and upserts one row', async () => {
    const { result } = await setupWithProduct();
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'sealed', 1);
    });
    expect(result.current.trackedProducts[0].variantState[anime]).toEqual({
      wishlist: false,
      copies: copies({ sealed: 1 }),
    });
    await waitFor(() =>
      expect(mockUpsertVariant).toHaveBeenCalledWith('new-db-id', anime, {
        wishlist: false,
        copies: copies({ sealed: 1 }),
      }),
    );
  });

  it('setVariantCopies keeps the other counters and clamps below zero', async () => {
    const { result } = await setupWithProduct();
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'sealed', 1);
    });
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'loose', 2);
    });
    expect(result.current.trackedProducts[0].variantState[anime].copies).toEqual(
      copies({ sealed: 1, loose: 2 }),
    );
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'sealed', -3);
    });
    expect(result.current.trackedProducts[0].variantState[anime].copies).toEqual(
      copies({ loose: 2 }),
    );
    await waitFor(() =>
      expect(mockUpsertVariant).toHaveBeenLastCalledWith('new-db-id', anime, {
        wishlist: false,
        copies: copies({ loose: 2 }),
      }),
    );
    expect(mockDeleteVariant).not.toHaveBeenCalled();
  });

  it('removing the last copy of an unwishlisted variant deletes the row', async () => {
    const { result } = await setupWithProduct();
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'sealed', 1);
    });
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'sealed', 0);
    });
    expect(result.current.trackedProducts[0].variantState).toEqual({});
    await waitFor(() => expect(mockDeleteVariant).toHaveBeenCalledWith('new-db-id', anime));
  });

  it('setVariantWishlist keeps a copy-less row alive and deletes it when cleared', async () => {
    const { result } = await setupWithProduct();
    act(() => {
      result.current.setVariantWishlist(dvc.id, anime, true);
    });
    expect(result.current.trackedProducts[0].variantState[anime]).toEqual({
      wishlist: true,
      copies: copies({}),
    });
    await waitFor(() =>
      expect(mockUpsertVariant).toHaveBeenCalledWith('new-db-id', anime, {
        wishlist: true,
        copies: copies({}),
      }),
    );
    act(() => {
      result.current.setVariantWishlist(dvc.id, anime, false);
    });
    expect(result.current.trackedProducts[0].variantState).toEqual({});
    await waitFor(() => expect(mockDeleteVariant).toHaveBeenCalledWith('new-db-id', anime));
  });

  it('wishlist and copies are independent on the same variant', async () => {
    const { result } = await setupWithProduct();
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'loose', 1);
    });
    act(() => {
      result.current.setVariantWishlist(dvc.id, anime, true);
    });
    expect(result.current.trackedProducts[0].variantState[anime]).toEqual({
      wishlist: true,
      copies: copies({ loose: 1 }),
    });
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'loose', 0);
    });
    expect(result.current.trackedProducts[0].variantState[anime]).toEqual({
      wishlist: true,
      copies: copies({}),
    });
    expect(mockDeleteVariant).not.toHaveBeenCalled();
  });

  it('rolls back the variant state and toasts when the write fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUpsertVariant.mockRejectedValue(new Error('DB down'));
    const { result } = await setupWithProduct();
    act(() => {
      result.current.setVariantCopies(dvc.id, anime, 'boxed', 1);
    });
    await waitFor(() =>
      expect(result.current.trackedProducts[0].variantState[anime]).toBeUndefined(),
    );
    expect(addToast).toHaveBeenCalledWith('Failed to save variant. Please try again.', 'error');
    spy.mockRestore();
  });

  it('sorts by release year ascending under YEAR, favorites first', async () => {
    const byYear = [...ALL_PRODUCTS].sort((a, b) => a.releaseYear - b.releaseYear);
    const early = byYear[0];
    const late = byYear[byYear.length - 1];
    const mid = byYear[Math.floor(byYear.length / 2)];
    const tracked = (p: (typeof ALL_PRODUCTS)[number], isFavorited = false) => ({
      ...p,
      isFavorited,
      notes: '',
      progress: [],
      variantState: {},
    });
    mockLoad.mockResolvedValue([tracked(late), tracked(early), tracked(mid, true)]);
    const { result } = await setup();
    const ids = result.current.getFilteredRoster('', 'YEAR').map((p) => p.id);
    expect(ids).toEqual([mid.id, early.id, late.id]);
  });

  it('searches variant colourways', async () => {
    mockLoad.mockResolvedValue([
      { ...dvc, isFavorited: false, notes: '', progress: [], variantState: {} },
    ]);
    const { result } = await setup();
    expect(result.current.getFilteredRoster('Yagami', 'ALPHA').map((p) => p.id)).toEqual([dvc.id]);
    expect(result.current.getFilteredRoster('Pendulum', 'ALPHA')).toEqual([]);
  });

  it('sets isLoadError when the load fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoad.mockRejectedValue(new Error('DB down'));
    const { result } = renderHook(() => useProducts(mockSession, false));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.isLoadError).toBe(true);
    spy.mockRestore();
  });
});
