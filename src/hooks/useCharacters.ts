import { useState, useEffect, useRef } from 'react';
import { type Session } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import { ALL_CHARACTERS, type Character } from '../data/characters';
import { type EquippedRelic, type RelicSet } from '../data/relics';
import { ALL_RELIC_SETS } from '../data/relic_sets';
import type { TrackedCharacter } from '../types';
import {
  loadCharactersFromDB,
  insertCharacter,
  deleteCharacter,
  updateCharacter,
  upsertRelic,
  deleteRelic,
  saveBuildPrefs,
} from '../services/characterService';

export const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };
const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

export function useCharacters(session: Session | null, isAuthLoading: boolean) {
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(ALL_CHARACTERS);
  const [availableRelicSets, setAvailableRelicSets] = useState<RelicSet[]>(ALL_RELIC_SETS);
  const [trackedCharacters, setTrackedCharacters] = useState<TrackedCharacter[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce refs for DB writes
  const pendingUpdates = useRef<Record<string, any>>({});
  const updateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingRelicUpdates = useRef<Record<string, { dbId: string; slot: string; relicData: EquippedRelic }>>({});
  const relicUpdateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const queueDBUpdate = (dbId: string, updates: any) => {
    pendingUpdates.current[dbId] = { ...pendingUpdates.current[dbId], ...updates };
    if (updateTimeouts.current[dbId]) clearTimeout(updateTimeouts.current[dbId]);
    updateTimeouts.current[dbId] = setTimeout(async () => {
      const payload = pendingUpdates.current[dbId];
      if (!payload) return;
      delete pendingUpdates.current[dbId];
      delete updateTimeouts.current[dbId];
      await updateCharacter(dbId, payload);
    }, 1000);
  };

  const queueRelicDBUpdate = (dbId: string, slot: string, relicData: EquippedRelic) => {
    const key = `${dbId}-${slot}`;
    pendingRelicUpdates.current[key] = { dbId, slot, relicData };
    if (relicUpdateTimeouts.current[key]) clearTimeout(relicUpdateTimeouts.current[key]);
    relicUpdateTimeouts.current[key] = setTimeout(async () => {
      const payload = pendingRelicUpdates.current[key];
      if (!payload) return;
      delete pendingRelicUpdates.current[key];
      delete relicUpdateTimeouts.current[key];
      await upsertRelic(payload.dbId, payload.slot, payload.relicData);
    }, 1000);
  };

  // Load from DB on session change
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
        if (isMounted) setTrackedCharacters(roster);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    })();
    return () => { isMounted = false; };
  }, [session?.user?.id, isAuthLoading]);

  const fetchLatestCharacters = async () => {
    setIsUpdating(true);
    try {
      const charResponse = await fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json');
      const relicResponse = await fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relic_sets.json');
      if (!charResponse.ok || !relicResponse.ok) throw new Error('Failed to fetch data');
      const charData = await charResponse.json();
      const relicData = await relicResponse.json();
      const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
      const newCharacters: Character[] = [];
      const newRelics: RelicSet[] = [];
      for (const [id, info] of Object.entries(charData)) {
        if (!info || typeof info !== 'object') continue;
        const i = info as any;
        newCharacters.push({ id, name: i.name, element: i.element || 'Unknown', imageUrl: `${IMAGE_BASE_URL}${i.icon}` });
      }
      for (const [id, info] of Object.entries(relicData)) {
        if (!info || typeof info !== 'object') continue;
        const i = info as any;
        newRelics.push({ id, name: i.name, icon: `${IMAGE_BASE_URL}${i.icon}` });
      }
      if (newCharacters.length > 0) {
        setAvailableCharacters(newCharacters);
        setTrackedCharacters(prev => prev.map(tc => {
          const updated = newCharacters.find(nc => nc.name === tc.name);
          return updated ? { ...tc, id: updated.id, imageUrl: updated.imageUrl, element: updated.element } : tc;
        }));
      }
      if (newRelics.length > 0) setAvailableRelicSets(newRelics);
    } catch (err) {
      console.error('Error updating data:', err);
      alert('Failed to connect to update server.');
    } finally {
      setIsUpdating(false);
    }
  };

  const addCharacter = async (char: Character) => {
    if (!session) { alert('Please log in first!'); return; }
    if (trackedCharacters.some(c => c.id === char.id)) return;
    const newChar: TrackedCharacter = {
      ...char, isFavorited: false, level: 1, tracesAttained: false,
      relics: defaultRelics,
      buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] }
    };
    setTrackedCharacters(prev => [...prev, newChar]);
    const dbId = await insertCharacter(session.user.id, char.id);
    if (dbId) setTrackedCharacters(prev => prev.map(c => c.id === char.id ? { ...c, dbId } : c));
  };

  const removeCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const charToRemove = trackedCharacters.find(c => c.id === id);
    setTrackedCharacters(prev => prev.filter(c => c.id !== id));
    if (charToRemove?.dbId) await deleteCharacter(charToRemove.dbId);
  };

  const updateCharacterLevel = (id: string, level: number) => {
    const validLevel = Math.min(80, Math.max(1, level));
    setTrackedCharacters(prev => prev.map(c => c.id === id ? { ...c, level: validLevel } : c));
    const char = trackedCharacters.find(c => c.id === id);
    if (char?.dbId) queueDBUpdate(char.dbId, { level: validLevel });
  };

  const toggleCharacterTraces = (id: string, value: boolean) => {
    setTrackedCharacters(prev => prev.map(c => c.id === id ? { ...c, tracesAttained: value } : c));
    const char = trackedCharacters.find(c => c.id === id);
    if (char?.dbId) queueDBUpdate(char.dbId, { traces_attained: value });
  };

  const toggleFavoriteCharacter = (id: string, value: boolean) => {
    setTrackedCharacters(prev => prev.map(c => c.id === id ? { ...c, isFavorited: value } : c));
    const char = trackedCharacters.find(c => c.id === id);
    if (char?.dbId) queueDBUpdate(char.dbId, { is_favorited: value });
  };

  const saveRelicData = async (editingRelic: { charId: string; slot: keyof TrackedCharacter['relics'] }, relicData: EquippedRelic) => {
    const { charId, slot } = editingRelic;
    setTrackedCharacters(prev => prev.map(c => c.id === charId ? { ...c, relics: { ...c.relics, [slot]: relicData } } : c));
    const char = trackedCharacters.find(c => c.id === charId);
    if (char?.dbId) queueRelicDBUpdate(char.dbId, slot, relicData);
  };

  const removeRelicData = async (editingRelic: { charId: string; slot: keyof TrackedCharacter['relics'] }) => {
    const { charId, slot } = editingRelic;
    setTrackedCharacters(prev => prev.map(c => c.id === charId ? { ...c, relics: { ...c.relics, [slot]: emptyRelic } } : c));
    const char = trackedCharacters.find(c => c.id === charId);
    if (char?.dbId) await deleteRelic(char.dbId, slot);
  };

  const saveBuildPreferences = async (charId: string, newPreferences: TrackedCharacter['buildPreferences']) => {
    setTrackedCharacters(prev => prev.map(c => c.id === charId ? { ...c, buildPreferences: newPreferences } : c));
    const char = trackedCharacters.find(c => c.id === charId);
    if (char?.dbId) await saveBuildPrefs(char.dbId, newPreferences);
  };

  const getFilteredRoster = (searchTerm: string, sortBy: 'SCORE' | 'ALPHA', scoreFor: (c: TrackedCharacter) => number) => {
    let result = trackedCharacters;
    if (searchTerm.trim()) {
      const fuse = new Fuse(trackedCharacters, { keys: ['name', 'element'], threshold: 0.3 });
      result = fuse.search(searchTerm).map(r => r.item);
    }
    return [...result].sort((a, b) => {
      if (a.isFavorited && !b.isFavorited) return -1;
      if (!a.isFavorited && b.isFavorited) return 1;
      if (sortBy === 'SCORE') {
        const diff = scoreFor(b) - scoreFor(a);
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });
  };

  return {
    availableCharacters, availableRelicSets, trackedCharacters,
    isInitialLoad, isUpdating,
    fetchLatestCharacters, addCharacter, removeCharacter,
    updateCharacterLevel, toggleCharacterTraces, toggleFavoriteCharacter,
    saveRelicData, removeRelicData, saveBuildPreferences, getFilteredRoster,
  };
}
