import { ALL_PRODUCTS, DGM_LINES, type DgmProduct } from '@/data/digimon/products';
import type { DgmTrackedProduct } from '@/types';
import { deriveOwnership } from '@/pages/digimon/ownership';

export interface CompletionRow {
  label: string;
  productsOwned: number;
  productsTotal: number;
  variantsOwned: number;
  variantsTotal: number;
  /** Integer product percentage, 0–100. */
  percent: number;
}

/**
 * Per-line completion derived purely from the collection and the catalog. A
 * product counts as owned when its derived ownership is `owned`; a variant
 * counts when its state is `owned`. Wishlist and interested never count.
 * Returns the overall row first, then one row per `DGM_LINES` entry in
 * catalog order.
 */
export function computeCompletion(tracked: DgmTrackedProduct[]): CompletionRow[] {
  const byId = new Map(tracked.map((t) => [t.id, t]));
  const row = (label: string, products: DgmProduct[]): CompletionRow => {
    let productsOwned = 0;
    let variantsOwned = 0;
    let variantsTotal = 0;
    for (const p of products) {
      variantsTotal += p.variants.length;
      const t = byId.get(p.id);
      if (!t) continue;
      if (deriveOwnership(t) === 'owned') productsOwned++;
      variantsOwned += p.variants.filter((v) => t.variantState[v.id]?.status === 'owned').length;
    }
    const productsTotal = products.length;
    return {
      label,
      productsOwned,
      productsTotal,
      variantsOwned,
      variantsTotal,
      percent: productsTotal === 0 ? 0 : Math.round((productsOwned / productsTotal) * 100),
    };
  };
  return [
    row('All products', ALL_PRODUCTS),
    ...DGM_LINES.map((line) =>
      row(
        line,
        ALL_PRODUCTS.filter((p) => p.line === line),
      ),
    ),
  ];
}
