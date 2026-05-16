import { useState, useEffect, useCallback, useRef } from 'react';
import { type Session } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import { ALL_CHARACTERS, type N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ETrackedCharacter } from '@/types';
import {
  loadCharactersFromDB,
  insertCharacter,
  deleteCharacter,
  updateCharacter,
  saveCartridgePreferences as apiSaveCartridgePrefs,
} from '@/services/neverness-to-everness/characterService';
import { usePendingSaves } from '@/hooks/usePendingSaves';
import { addToast } from '@/utils/toast';

const DEFAULT_AWAKENING = [false, false, false, false, false, false];

export function useCharacters(session: Session | null, isAuthLoading: boolean) {
  const [availableCharacters] = useState<N2ECharacter[]>(ALL_CHARACTERS);
  const [trackedCharacters, setTrackedCharacters] = useState<N2ETrackedCharacter[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const pendingInserts = useRef<Set<string>>(new Set());
  const trackedCharactersRef = useRef<N2ETrackedCharacter[]>([]);
  trackedCharactersRef.current = trackedCharacters;

  const { pendingSaveCount, queueUpdate } = usePendingSaves(1000, () =>
    addToast('Failed to save changes. Please try again.', 'error'),
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!session?.user) {
      setTrackedCharacters([]);
      setIsInitialLoad(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const roster = await loadCharactersFromDB(session.user.id);
        if (isMounted) {
          setTrackedCharacters(roster);
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

  const addCharacter = async (character: N2ECharacter) => {
    if (!session) {
      addToast('Please log in to add characters.', 'warning');
      return;
    }
    if (trackedCharactersRef.current.some((c) => c.id === character.id)) return;
    if (pendingInserts.current.has(character.id)) return;

    pendingInserts.current.add(character.id);
    const newChar: N2ETrackedCharacter = {
      ...character,
      isFavorited: false,
      level: 1,
      awakening: [...DEFAULT_AWAKENING],
      resonanceCount: 0,
      arcId: null,
      arcLevel: 1,
      arcTier: 1,
      cartridgeRarity: null,
      cartridgeLevel: 0,
      cartridgeMainStat: null,
      cartridgeSubStats: [],
      cartridgePreferences: { mainStats: [], subStats: [], comments: '' },
    };
    setTrackedCharacters((prev) => [...prev, newChar]);
    try {
      const dbId = await insertCharacter(session.user.id, character.id);
      if (dbId)
        setTrackedCharacters((prev) =>
          prev.map((c) => (c.id === character.id ? { ...c, dbId } : c)),
        );
    } catch (e) {
      console.error(e);
      setTrackedCharacters((prev) => prev.filter((c) => c.id !== character.id));
      addToast('Failed to add character. Please try again.', 'error');
    } finally {
      pendingInserts.current.delete(character.id);
    }
  };

  const removeCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toRemove = trackedCharactersRef.current.find((c) => c.id === id);
    const snapshot = trackedCharactersRef.current;
    setTrackedCharacters((prev) => prev.filter((c) => c.id !== id));
    if (toRemove?.dbId) {
      try {
        await deleteCharacter(toRemove.dbId);
      } catch (err) {
        console.error(err);
        setTrackedCharacters(snapshot);
        addToast('Failed to remove character. Please try again.', 'error');
      }
    }
  };

  const updateCharacterLevel = (id: string, level: number) => {
    const validLevel = Math.min(90, Math.max(1, level));
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, level: validLevel } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { level: validLevel }, (p) => updateCharacter(char.dbId!, p));
  };

  const toggleAwakeningSlot = (id: string, slotIndex: number) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newAwakening = [...c.awakening];
        newAwakening[slotIndex] = !newAwakening[slotIndex];
        return { ...c, awakening: newAwakening };
      }),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId) {
      const newAwakening = [...char.awakening];
      newAwakening[slotIndex] = !newAwakening[slotIndex];
      queueUpdate(char.dbId, { awakening_slots: newAwakening }, (p) =>
        updateCharacter(char.dbId!, p),
      );
    }
  };

  const updateResonanceCount = (id: string, count: number) => {
    const validCount = Math.min(6, Math.max(0, count));
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resonanceCount: validCount } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { resonance_count: validCount }, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

  const updateArc = (id: string, arcId: string | null, arcLevel: number, arcTier: number) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, arcId, arcLevel, arcTier } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { arc_id: arcId, arc_level: arcLevel, arc_tier: arcTier }, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

  const updateCartridge = (
    id: string,
    rarity: string | null,
    level: number,
    mainStat: string | null,
    subStats: string[],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              cartridgeRarity: rarity,
              cartridgeLevel: level,
              cartridgeMainStat: mainStat,
              cartridgeSubStats: subStats,
            }
          : c,
      ),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(
        char.dbId,
        {
          cartridge_rarity: rarity,
          cartridge_level: level,
          cartridge_main_stat: mainStat,
          cartridge_sub_stats: subStats,
        },
        (p) => updateCharacter(char.dbId!, p),
      );
  };

  const toggleFavoriteCharacter = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorited: value } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { is_favorited: value }, (p) => updateCharacter(char.dbId!, p));
  };

  const saveCartridgePreferences = async (
    id: string,
    newPrefs: N2ETrackedCharacter['cartridgePreferences'],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cartridgePreferences: newPrefs } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId) await apiSaveCartridgePrefs(char.dbId, newPrefs);
  };

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') => {
      let result = trackedCharacters;
      if (searchTerm.trim()) {
        const fuse = new Fuse(trackedCharacters, {
          keys: ['name', 'esperType', 'arcType', 'roles'],
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
    [trackedCharacters],
  );

  const retryLoad = () => {
    setIsLoadError(false);
    setIsInitialLoad(true);
    setRetryCount((n) => n + 1);
  };

  return {
    availableCharacters,
    trackedCharacters,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCharacter,
    removeCharacter,
    updateCharacterLevel,
    toggleAwakeningSlot,
    updateResonanceCount,
    updateArc,
    updateCartridge,
    saveCartridgePreferences,
    toggleFavoriteCharacter,
    getFilteredRoster,
  };
}
