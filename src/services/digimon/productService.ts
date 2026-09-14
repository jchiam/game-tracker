import { createRosterPersistence } from '@/services/rosterPersistence';
import { supabase } from '@/lib/supabase';
import type { DgmProductPatch, DgmTrackedProduct, DgmTrackedVariant } from '@/types';
import { ALL_PRODUCTS, type DgmProduct } from '@/data/digimon/products';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

/** A copy counter as stored; anything that is not a non-negative number reads as 0. */
const count = (v: unknown): number => (typeof v === 'number' && v > 0 ? v : 0);

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const PRODUCT_COLUMNS: Record<keyof DgmProductPatch, string> = {
  notes: 'notes',
  isFavorited: 'is_favorited',
  progress: 'progress',
};

/**
 * The Digimon product roster. The product row carries favorite, notes, and the
 * game-progress item ids; per-variant state (wishlist flag + copy counts per
 * condition) lives in `dgm_tracked_variants`, joined on load through the
 * Extras Adapter and written one row at a time by `upsertVariant` /
 * `deleteVariant`.
 */
const svc = createRosterPersistence<DgmProduct, DgmTrackedProduct, DgmProductPatch>({
  table: 'dgm_tracked_products',
  entityIdColumn: 'product_id',
  catalog: ALL_PRODUCTS,
  columns: PRODUCT_COLUMNS,
  insertDefaults: {
    is_favorited: false,
    notes: '',
    progress: [],
  },
  select: 'id, product_id, is_favorited, notes, progress',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    notes: row.notes ?? '',
    progress: Array.isArray(row.progress)
      ? row.progress.filter((v: unknown) => typeof v === 'string')
      : [],
    variantState: {},
  }),
  extras: {
    selectFragment: 'dgm_tracked_variants ( variant_id, wishlist, sealed, boxed, loose )',
    mapRow: (row, tracked) => {
      const variantState: Record<string, DgmTrackedVariant> = {};
      for (const v of row.dgm_tracked_variants || []) {
        variantState[v.variant_id] = {
          wishlist: !!v.wishlist,
          copies: { sealed: count(v.sealed), boxed: count(v.boxed), loose: count(v.loose) },
        };
      }
      return { ...tracked, variantState };
    },
  },
});

export const loadProductsFromDB = svc.load;
export const insertProduct = svc.insert;
export const deleteProduct = svc.remove;
export const updateProduct = svc.update;

/** Single-row upsert of one variant's wishlist flag and copy counts, resolved on (tracked_product_id, variant_id). */
export async function upsertVariant(
  dbId: string,
  variantId: string,
  state: DgmTrackedVariant,
): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase.from('dgm_tracked_variants').upsert(
    {
      tracked_product_id: dbId,
      variant_id: variantId,
      wishlist: state.wishlist,
      sealed: state.copies.sealed,
      boxed: state.copies.boxed,
      loose: state.copies.loose,
    },
    { onConflict: 'tracked_product_id,variant_id' },
  );
  if (error) {
    console.error('Variant Save Failed:', error);
    throw error;
  }
}

/** Removes one variant's row — the variant holds no copies and is not wishlisted any more. */
export async function deleteVariant(dbId: string, variantId: string): Promise<void> {
  if (!DB_ENABLED) return;
  const { error } = await supabase
    .from('dgm_tracked_variants')
    .delete()
    .match({ tracked_product_id: dbId, variant_id: variantId });
  if (error) {
    console.error('Variant Delete Failed:', error);
    throw error;
  }
}
