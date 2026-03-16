import { useState, useEffect, useCallback } from 'react';
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

export function useArcanists(session: Session | null, isAuthLoading: boolean) {
  const [availableArcanists] = useState<Arcanist[]>(ALL_ARCANISTS);
  const [trackedArcanists, setTrackedArcanists] = useState<R1999TrackedArcanist[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    if (trackedArcanists.some((a) => a.id === arcanist.id)) return;
    const newArcanist: R1999TrackedArcanist = {
      ...arcanist,
      isFavorited: false,
      level: 1,
      insightLevel: 0,
    };
    setTrackedArcanists((prev) => [...prev, newArcanist]);
    const dbId = await insertArcanist(session.user.id, arcanist.id);
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
    if (arcanist?.dbId) updateArcanist(arcanist.dbId, { level: validLevel });
  };

  const updateInsightLevel = (id: string, insightLevel: 0 | 1 | 2 | 3) => {
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, insightLevel } : a)));
    const arcanist = trackedArcanists.find((a) => a.id === id);
    if (arcanist?.dbId) updateArcanist(arcanist.dbId, { insight_level: insightLevel });
  };

  const toggleFavoriteArcanist = (id: string, value: boolean) => {
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorited: value } : a)),
    );
    const arcanist = trackedArcanists.find((a) => a.id === id);
    if (arcanist?.dbId) updateArcanist(arcanist.dbId, { is_favorited: value });
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
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updateInsightLevel,
    toggleFavoriteArcanist,
    getFilteredRoster,
  };
}
