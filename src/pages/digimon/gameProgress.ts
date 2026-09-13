import type { DgmProgressGuide, DgmProgressItem } from '@/data/digimon/products';

export interface TrackProgress {
  id: string;
  label: string;
  done: number;
  total: number;
  /** Integer percentage, 0–100. */
  percent: number;
}

export interface ProgressSummary {
  /** Integer percentage, 0–100, derived per `guide.overall`. */
  overall: number;
  tracks: TrackProgress[];
}

const pct = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100));

function itemsOf(guide: DgmProgressGuide): Map<string, DgmProgressItem> {
  const map = new Map<string, DgmProgressItem>();
  for (const track of guide.tracks) {
    for (const group of track.groups) {
      for (const item of group.items) map.set(item.id, item);
    }
  }
  return map;
}

/**
 * Per-track done / total / percent plus the overall percentage. `track-mean`
 * averages the track percentages so a long checklist (82 friends) cannot drown
 * a short one (partner forms); `item-weighted` is the plain ratio over every
 * item. Ids in `progress` that the guide does not define are ignored.
 */
export function computeProgress(
  guide: DgmProgressGuide,
  progress: readonly string[],
): ProgressSummary {
  const checked = new Set(progress);
  const tracks = guide.tracks.map((track) => {
    let done = 0;
    let total = 0;
    for (const group of track.groups) {
      for (const item of group.items) {
        total++;
        if (checked.has(item.id)) done++;
      }
    }
    return { id: track.id, label: track.label, done, total, percent: pct(done, total) };
  });

  const overall =
    guide.overall === 'track-mean'
      ? tracks.length === 0
        ? 0
        : Math.round(tracks.reduce((sum, t) => sum + t.percent, 0) / tracks.length)
      : pct(
          tracks.reduce((sum, t) => sum + t.done, 0),
          tracks.reduce((sum, t) => sum + t.total, 0),
        );

  return { overall, tracks };
}

/**
 * Returns the next progress array after toggling `itemId`. Checking adds the
 * item and, transitively, everything it `requires`; unchecking removes the item
 * and, transitively, every item whose `requires` names it. Unknown ids in the
 * input are dropped. Output order follows the guide's item order.
 */
export function toggleProgressItem(
  guide: DgmProgressGuide,
  progress: readonly string[],
  itemId: string,
): string[] {
  const items = itemsOf(guide);
  const next = new Set(progress.filter((id) => items.has(id)));
  if (!items.has(itemId)) return [...items.keys()].filter((id) => next.has(id));

  if (next.has(itemId)) {
    // Uncheck: drop the item and its dependents, transitively.
    const toRemove = [itemId];
    while (toRemove.length > 0) {
      const id = toRemove.pop() as string;
      if (!next.delete(id)) continue;
      for (const item of items.values()) {
        if (item.requires?.includes(id) && next.has(item.id)) toRemove.push(item.id);
      }
    }
  } else {
    // Check: add the item and its prerequisites, transitively.
    const toAdd = [itemId];
    while (toAdd.length > 0) {
      const id = toAdd.pop() as string;
      if (next.has(id)) continue;
      next.add(id);
      for (const req of items.get(id)?.requires ?? []) if (items.has(req)) toAdd.push(req);
    }
  }

  return [...items.keys()].filter((id) => next.has(id));
}
