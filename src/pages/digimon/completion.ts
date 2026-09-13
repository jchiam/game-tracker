import { ALL_DEVICES, DGM_LINES } from '@/data/digimon/devices';
import type { DgmTrackedDevice } from '@/types';

export interface CompletionRow {
  label: string;
  owned: number;
  total: number;
  /** Integer percentage, 0–100. */
  percent: number;
}

/**
 * Per-line completion derived purely from the collection and the catalog.
 * **Owned** means `status === 'owned'`; wishlist rows do not count. Returns the
 * overall row first, then one row per `DGM_LINES` entry in catalog order.
 */
export function computeCompletion(tracked: DgmTrackedDevice[]): CompletionRow[] {
  const ownedIds = new Set(tracked.filter((d) => d.status === 'owned').map((d) => d.id));
  const row = (label: string, devices: { id: string }[]): CompletionRow => {
    const total = devices.length;
    const owned = devices.filter((d) => ownedIds.has(d.id)).length;
    return { label, owned, total, percent: total === 0 ? 0 : Math.round((owned / total) * 100) };
  };
  return [
    row('All devices', ALL_DEVICES),
    ...DGM_LINES.map((line) =>
      row(
        line,
        ALL_DEVICES.filter((d) => d.line === line),
      ),
    ),
  ];
}
