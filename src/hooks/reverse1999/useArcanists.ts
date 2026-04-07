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

export function useArcanists(session: Session | null, isAuthLoading: boolean) {
  const [availableArcanists] = useState<Arcanist[]>(ALL_ARCANISTS);
  const [trackedArcanists, setTrackedArcanists] = useState<R1999TrackedArcanist[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track in-flight inserts to prevent race condition on rapid adds
  const pendingInserts = useRef<Set<string>>(new Set());

  const { pendingSaveCount, queueUpdate } = usePendingSaves();

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
        if (isMounted) setTrackedArcanists(roster);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isAuthLoading]);

  const addArcanist = async (arcanist: Arcanist) => {
    if (!session) {
      alert('Please log in first!');
      return;
    }
    // Check both local state AND in-flight inserts to prevent duplicates
    if (trackedArcanists.some((a) => a.id === arcanist.id)) return;
    if (pendingInserts.current.has(arcanist.id)) return;

    pendingInserts.current.add(arcanist.id);
    const newArcanist: R1999TrackedArcanist = {
      ...arcanist,
      isFavorited: false,
      level: 1,
      insightLevel: 0,
    };
    setTrackedArcanists((prev) => [...prev, newArcanist]);
    const dbId = await insertArcanist(session.user.id, arcanist.id);
    pendingInserts.current.delete(arcanist.id);
    if (dbId)
      setTrackedArcanists((prev) => prev.map((a) => (a.id === arcanist.id ? { ...a, dbId } : a)));
  };

  const removeArcanist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toRemove = trackedArcanists.find((a) => a.id === id);
    setTrackedArcanists((prev) => prev.filter((a) => a.id !== id));
    if (toRemove?.dbId) await deleteArcanist(toRemove.dbId);
  };

  const updateArcanistLevel = (id: string, level: number) => {
    const validLevel = Math.min(60, Math.max(1, level));
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, level: validLevel } : a)));
    const arcanist = trackedArcanists.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { level: validLevel }, (p) => updateArcanist(arcanist.dbId!, p));
  };

  const updateInsightLevel = (id: string, insightLevel: 0 | 1 | 2 | 3) => {
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, insightLevel } : a)));
    const arcanist = trackedArcanists.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { insight_level: insightLevel }, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const toggleFavoriteArcanist = (id: string, value: boolean) => {
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorited: value } : a)),
    );
    const arcanist = trackedArcanists.find((a) => a.id === id);
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

  return {
    availableArcanists,
    trackedArcanists,
    isInitialLoad,
    pendingSaveCount,
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updateInsightLevel,
    toggleFavoriteArcanist,
    getFilteredRoster,
  };
}
