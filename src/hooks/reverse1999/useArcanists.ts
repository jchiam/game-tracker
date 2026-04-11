import { useState, useEffect, useCallback, useRef } from 'react';
import { type Session } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import { ALL_ARCANISTS, type Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999TrackedArcanist } from '@/types';
import {
  loadArcanistsFromDB,
  insertArcanist,
  deleteArcanist,
  updateArcanist,
} from '@/services/reverse1999/arcanistService';
import { usePendingSaves } from '@/hooks/usePendingSaves';
import { addToast } from '@/utils/toast';

export function useArcanists(session: Session | null, isAuthLoading: boolean) {
  const [availableArcanists] = useState<Arcanist[]>(ALL_ARCANISTS);
  const [trackedArcanists, setTrackedArcanists] = useState<R1999TrackedArcanist[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Track in-flight inserts to prevent race condition on rapid adds
  const pendingInserts = useRef<Set<string>>(new Set());
  // Ref always holds the latest trackedArcanists to avoid stale closures in update functions
  const trackedArcanistsRef = useRef<R1999TrackedArcanist[]>([]);
  trackedArcanistsRef.current = trackedArcanists;

  const { pendingSaveCount, queueUpdate } = usePendingSaves(1000, () =>
    addToast('Failed to save changes. Please try again.', 'error'),
  );

  // Load from DB on session change
  useEffect(() => {
    if (isAuthLoading) return;
    if (!session?.user) {
      setTrackedArcanists([]);
      setIsInitialLoad(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const roster = await loadArcanistsFromDB(session.user.id);
        if (isMounted) {
          setTrackedArcanists(roster);
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

  const addArcanist = async (arcanist: Arcanist) => {
    if (!session) {
      addToast('Please log in to add arcanists.', 'warning');
      return;
    }
    // Check both local state AND in-flight inserts to prevent duplicates
    if (trackedArcanistsRef.current.some((a) => a.id === arcanist.id)) return;
    if (pendingInserts.current.has(arcanist.id)) return;

    pendingInserts.current.add(arcanist.id);
    const newArcanist: R1999TrackedArcanist = {
      ...arcanist,
      isFavorited: false,
      level: 1,
      insightLevel: 0,
      portraitLevel: 0,
      resonanceLevel: 0,
    };
    setTrackedArcanists((prev) => [...prev, newArcanist]);
    try {
      const dbId = await insertArcanist(session.user.id, arcanist.id);
      if (dbId)
        setTrackedArcanists((prev) => prev.map((a) => (a.id === arcanist.id ? { ...a, dbId } : a)));
    } catch (e) {
      console.error(e);
      setTrackedArcanists((prev) => prev.filter((a) => a.id !== arcanist.id));
      addToast('Failed to add arcanist. Please try again.', 'error');
    } finally {
      pendingInserts.current.delete(arcanist.id);
    }
  };

  const removeArcanist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toRemove = trackedArcanistsRef.current.find((a) => a.id === id);
    const snapshot = trackedArcanistsRef.current;
    setTrackedArcanists((prev) => prev.filter((a) => a.id !== id));
    if (toRemove?.dbId) {
      try {
        await deleteArcanist(toRemove.dbId);
      } catch (err) {
        console.error(err);
        setTrackedArcanists(snapshot);
        addToast('Failed to remove arcanist. Please try again.', 'error');
      }
    }
  };

  const updateArcanistLevel = (id: string, level: number) => {
    const validLevel = Math.min(60, Math.max(1, level));
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, level: validLevel } : a)));
    const arcanist = trackedArcanistsRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { level: validLevel }, (p) => updateArcanist(arcanist.dbId!, p));
  };

  const updateInsightLevel = (id: string, insightLevel: 0 | 1 | 2 | 3) => {
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, insightLevel } : a)));
    const arcanist = trackedArcanistsRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { insight_level: insightLevel }, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const updatePortraitLevel = (id: string, portraitLevel: number) => {
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, portraitLevel } : a)));
    const arcanist = trackedArcanistsRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { portrait_level: portraitLevel }, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const updateResonanceLevel = (id: string, resonanceLevel: number) => {
    const validLevel = Math.min(15, Math.max(0, resonanceLevel));
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resonanceLevel: validLevel } : a)),
    );
    const arcanist = trackedArcanistsRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { resonance_level: validLevel }, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const toggleFavoriteArcanist = (id: string, value: boolean) => {
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorited: value } : a)),
    );
    const arcanist = trackedArcanistsRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { is_favorited: value }, (p) => updateArcanist(arcanist.dbId!, p));
  };

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') => {
      let result = trackedArcanists;
      if (searchTerm.trim()) {
        const fuse = new Fuse(trackedArcanists, {
          keys: ['name', 'afflatus', 'damageType'],
          threshold: 0.3,
        });
        result = fuse.search(searchTerm).map((r) => r.item);
      }
      return [...result].sort((a, b) => {
        if (a.isFavorited && !b.isFavorited) return -1;
        if (!a.isFavorited && b.isFavorited) return 1;
        if (sortBy === 'LEVEL') {
          const diff = b.level - a.level;
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      });
    },
    [trackedArcanists],
  );

  const retryLoad = () => {
    setIsLoadError(false);
    setIsInitialLoad(true);
    setRetryCount((n) => n + 1);
  };

  return {
    availableArcanists,
    trackedArcanists,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updateInsightLevel,
    updatePortraitLevel,
    updateResonanceLevel,
    toggleFavoriteArcanist,
    getFilteredRoster,
  };
}
