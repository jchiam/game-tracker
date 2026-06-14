import { useState, useEffect, useCallback, useRef } from 'react';
import { type Session } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import { usePendingSaves } from '@/hooks/usePendingSaves';
import { addToast } from '@/utils/toast';

/**
 * Minimum shape every game's base entity must satisfy.
 */
export interface RosterBase {
  id: string;
}

/**
 * Minimum shape every game's tracked entity must satisfy. The roster skeleton
 * relies on `id` (local identity), `dbId` (DB row id, absent until insert
 * resolves), `name` (search/sort), and `isFavorited` (favorited-first sort).
 */
export interface RosterTracked {
  id: string;
  dbId?: string;
  name: string;
  isFavorited: boolean;
}

export interface RosterConfig<TBase extends RosterBase, TTracked extends RosterTracked> {
  allEntities: TBase[];
  loadFromDB: (userId: string) => Promise<TTracked[]>;
  insertEntity: (userId: string, entityId: string) => Promise<string | null>;
  deleteEntity: (dbId: string) => Promise<void>;
  /** Build the optimistic tracked entity from its base record. */
  createTracked: (base: TBase) => TTracked;
  /** Noun used in toast messages, e.g. "character" / "characters". */
  nounSingular: string;
  nounPlural: string;
  /** Fuse.js search keys for `filterRoster`. */
  fuseKeys: string[];
}

/**
 * Shared roster lifecycle for the per-game tracking hooks. Concentrates the
 * load effect, optimistic add/remove with rollback, the in-flight insert dedup,
 * the debounced-save wiring, and the Fuse search + favorited-first sort
 * primitive. Per-game hooks layer their typed field updaters on top, calling
 * the returned `queueUpdate` / `queueAction`.
 */
export function useRoster<TBase extends RosterBase, TTracked extends RosterTracked>(
  session: Session | null,
  isAuthLoading: boolean,
  config: RosterConfig<TBase, TTracked>,
) {
  const { allEntities, loadFromDB, insertEntity, deleteEntity, createTracked } = config;
  const [availableEntities] = useState<TBase[]>(allEntities);
  const [trackedEntities, setTrackedEntities] = useState<TTracked[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Track in-flight inserts to prevent race condition on rapid adds
  const pendingInserts = useRef<Set<string>>(new Set());
  // Ref always holds the latest trackedEntities to avoid stale closures in update functions
  const trackedRef = useRef<TTracked[]>([]);
  trackedRef.current = trackedEntities;

  const { pendingSaveCount, queueUpdate, queueAction } = usePendingSaves(1000, () =>
    addToast('Failed to save changes. Please try again.', 'error'),
  );

  // Load from DB on session change
  useEffect(() => {
    if (isAuthLoading) return;
    if (!session?.user) {
      setTrackedEntities([]);
      setIsInitialLoad(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const roster = await loadFromDB(session.user.id);
        if (isMounted) {
          setTrackedEntities(roster);
          setIsLoadError(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setIsLoadError(true);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isAuthLoading, retryCount]);

  const addEntity = async (base: TBase) => {
    if (!session) {
      addToast(`Please log in to add ${config.nounPlural}.`, 'warning');
      return;
    }
    // Check both local state AND in-flight inserts to prevent duplicates
    if (trackedRef.current.some((t) => t.id === base.id)) return;
    if (pendingInserts.current.has(base.id)) return;

    pendingInserts.current.add(base.id);
    const newEntity = createTracked(base);
    setTrackedEntities((prev) => [...prev, newEntity]);
    try {
      const dbId = await insertEntity(session.user.id, base.id);
      if (dbId)
        setTrackedEntities((prev) => prev.map((t) => (t.id === base.id ? { ...t, dbId } : t)));
    } catch (e) {
      console.error(e);
      setTrackedEntities((prev) => prev.filter((t) => t.id !== base.id));
      addToast(`Failed to add ${config.nounSingular}. Please try again.`, 'error');
    } finally {
      pendingInserts.current.delete(base.id);
    }
  };

  const removeEntity = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toRemove = trackedRef.current.find((t) => t.id === id);
    const snapshot = trackedRef.current;
    setTrackedEntities((prev) => prev.filter((t) => t.id !== id));
    if (toRemove?.dbId) {
      try {
        await deleteEntity(toRemove.dbId);
      } catch (err) {
        console.error(err);
        setTrackedEntities(snapshot);
        addToast(`Failed to remove ${config.nounSingular}. Please try again.`, 'error');
      }
    }
  };

  /**
   * Fuse search (when a term is present) followed by favorited-first ordering
   * with an alphabetical tiebreak. A per-game `secondaryCompare` slots between
   * the favorited check and the alpha fallback to express SCORE / LEVEL sorts.
   */
  const filterRoster = useCallback(
    (searchTerm: string, secondaryCompare?: (a: TTracked, b: TTracked) => number) => {
      let result = trackedEntities;
      if (searchTerm.trim()) {
        const fuse = new Fuse(trackedEntities, { keys: config.fuseKeys, threshold: 0.3 });
        result = fuse.search(searchTerm).map((r) => r.item);
      }
      return [...result].sort((a, b) => {
        if (a.isFavorited && !b.isFavorited) return -1;
        if (!a.isFavorited && b.isFavorited) return 1;
        if (secondaryCompare) {
          const diff = secondaryCompare(a, b);
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackedEntities],
  );

  const retryLoad = () => {
    setIsLoadError(false);
    setIsInitialLoad(true);
    setRetryCount((n) => n + 1);
  };

  return {
    availableEntities,
    trackedEntities,
    setTrackedEntities,
    trackedRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueUpdate,
    queueAction,
    addEntity,
    removeEntity,
    filterRoster,
  };
}
