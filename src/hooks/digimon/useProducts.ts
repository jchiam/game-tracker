import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_PRODUCTS, type DgmProduct } from '@/data/digimon/products';
import type {
  DgmCondition,
  DgmProductPatch,
  DgmTrackedProduct,
  DgmTrackedVariant,
  DgmVariantStatus,
} from '@/types';
import {
  loadProductsFromDB,
  insertProduct,
  deleteProduct,
  updateProduct,
  upsertVariant,
  deleteVariant,
} from '@/services/digimon/productService';
import { useRoster } from '@/hooks/useRoster';
import { addToast } from '@/utils/toast';

export type DgmSortKey = 'ALPHA' | 'YEAR';

function createTrackedProduct(product: DgmProduct): DgmTrackedProduct {
  return {
    ...product,
    isFavorited: false,
    notes: '',
    progress: [],
    variantState: {},
  };
}

/**
 * The Digimon product roster (Product / Ownership / Game Progress in
 * CONTEXT.md). Notes, favorite, and progress are plain field updaters; the
 * per-variant state writes through `queueAction` like an equipment slot —
 * optimistic set on `variantState`, one single-row upsert or delete, rollback
 * on failure.
 */
export function useProducts(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableProducts,
    trackedEntities: trackedProducts,
    setTrackedEntities: setTrackedProducts,
    trackedRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueAction,
    addEntity: addProduct,
    removeEntity: removeProduct,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<DgmProduct, DgmTrackedProduct, DgmProductPatch>(session, isAuthLoading, {
    allEntities: ALL_PRODUCTS,
    loadFromDB: loadProductsFromDB,
    insertEntity: insertProduct,
    deleteEntity: deleteProduct,
    updateEntity: updateProduct,
    createTracked: createTrackedProduct,
    nounSingular: 'product',
    nounPlural: 'products',
    fuseKeys: ['name', 'line', 'series', 'variants.colorway'],
  });

  const updateNotes = makeFieldUpdater('notes');
  const toggleFavorite = makeFieldUpdater('isFavorited');
  const updateProgress = makeFieldUpdater('progress');

  /**
   * Replace one variant's state (null = neither owned nor wishlisted) and
   * persist it as one row write. Rows without a `dbId` update locally only,
   * matching the roster's patch contract.
   */
  const writeVariant = (productId: string, variantId: string, next: DgmTrackedVariant | null) => {
    const product = trackedRef.current.find((p) => p.id === productId);
    if (!product) return;
    const previous = product.variantState[variantId] ?? null;
    const apply = (state: DgmTrackedVariant | null) =>
      setTrackedProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const variantState = { ...p.variantState };
          if (state) variantState[variantId] = state;
          else delete variantState[variantId];
          return { ...p, variantState };
        }),
      );
    apply(next);
    if (!product.dbId) return;
    const dbId = product.dbId;
    queueAction(`${dbId}-${variantId}`, async () => {
      try {
        if (next) await upsertVariant(dbId, variantId, next);
        else await deleteVariant(dbId, variantId);
      } catch (e) {
        apply(previous);
        addToast('Failed to save variant. Please try again.', 'error');
        throw e;
      }
    });
  };

  const setVariantStatus = (
    productId: string,
    variantId: string,
    status: DgmVariantStatus | null,
  ) => {
    const current = trackedRef.current.find((p) => p.id === productId)?.variantState[variantId];
    writeVariant(
      productId,
      variantId,
      status
        ? { status, condition: status === 'owned' ? (current?.condition ?? null) : null }
        : null,
    );
  };

  const setVariantCondition = (
    productId: string,
    variantId: string,
    condition: DgmCondition | null,
  ) => {
    const current = trackedRef.current.find((p) => p.id === productId)?.variantState[variantId];
    if (!current || current.status !== 'owned') return;
    writeVariant(productId, variantId, { status: 'owned', condition });
  };

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: DgmSortKey, entities?: DgmTrackedProduct[]) =>
      filterRoster(
        searchTerm,
        sortBy === 'YEAR' ? (a, b) => a.releaseYear - b.releaseYear : undefined,
        entities,
      ),
    [filterRoster],
  );

  return {
    availableProducts,
    trackedProducts,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addProduct,
    removeProduct,
    updateNotes,
    toggleFavorite,
    updateProgress,
    setVariantStatus,
    setVariantCondition,
    getFilteredRoster,
  };
}
