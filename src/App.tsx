import { useState, useRef, useEffect, useMemo } from 'react';
import { type Session } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import './App.css';
import { ALL_CHARACTERS, type Character } from './data/characters';
import { type EquippedRelic, type RelicSet } from './data/relics';
import { ALL_RELIC_SETS } from './data/relic_sets';
import { type TrackedCharacter } from './types';
import { supabase } from './lib/supabase';
import { CharacterCard } from './components/CharacterCard';
import { RelicEditorModal } from './components/RelicEditorModal';
import { AddCharacterModal } from './components/AddCharacterModal';

export const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };
const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

function App() {
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(ALL_CHARACTERS);
  const [availableRelicSets, setAvailableRelicSets] = useState<RelicSet[]>(ALL_RELIC_SETS);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [trackedCharacters, setTrackedCharacters] = useState<TrackedCharacter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelic, setEditingRelic] = useState<{ charId: string, slot: keyof TrackedCharacter['relics'] } | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const pendingUpdates = useRef<Record<string, any>>({});
  const updateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const pendingRelicUpdates = useRef<Record<string, { dbId: string, slot: string, relicData: EquippedRelic }>>({});
  const relicUpdateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const queueDBUpdate = (dbId: string, updates: any) => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;

    pendingUpdates.current[dbId] = { ...pendingUpdates.current[dbId], ...updates };

    if (updateTimeouts.current[dbId]) {
      clearTimeout(updateTimeouts.current[dbId]);
    }

    updateTimeouts.current[dbId] = setTimeout(async () => {
      const payload = pendingUpdates.current[dbId];
      if (!payload) return;

      delete pendingUpdates.current[dbId];
      delete updateTimeouts.current[dbId];

      const { error } = await supabase.from('tracked_characters').update(payload).eq('id', dbId);
      if (error) console.error("Debounced DB Update Failed:", error);
    }, 1000);
  };

  const queueRelicDBUpdate = (dbId: string, slot: string, relicData: EquippedRelic) => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;

    const key = `${dbId}-${slot}`;
    pendingRelicUpdates.current[key] = { dbId, slot, relicData };

    if (relicUpdateTimeouts.current[key]) {
      clearTimeout(relicUpdateTimeouts.current[key]);
    }

    relicUpdateTimeouts.current[key] = setTimeout(async () => {
      const payload = pendingRelicUpdates.current[key];
      if (!payload) return;

      delete pendingRelicUpdates.current[key];
      delete relicUpdateTimeouts.current[key];

      const { data: relicRow, error: relicErr } = await supabase.from('equipped_relics').upsert({
        tracked_character_id: payload.dbId,
        slot: payload.slot,
        set_id: payload.relicData.setId,
        main_stat: payload.relicData.mainStat
      }, { onConflict: 'tracked_character_id,slot' }).select('id').single();

      if (relicRow && !relicErr) {
        await supabase.from('relic_substats').delete().eq('relic_id', relicRow.id);

        if (payload.relicData.subStats.length > 0) {
          const subInserts = payload.relicData.subStats.map(s => ({
            relic_id: relicRow.id,
            stat_type: s.type,
            stat_value: s.value
          }));
          await supabase.from('relic_substats').insert(subInserts);
        }
      } else {
        console.error("Relic debounced Upsert Error", relicErr);
      }
    }, 1000);
  };

  // Track Auth State changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load state from DB keyed by User session
  useEffect(() => {
    if (isAuthLoading) return;

    if (!session?.user) {
      setTrackedCharacters([]);
      setIsInitialLoad(false);
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      try {
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn("Supabase not configured. Using local empty roster.");
          if (isMounted) setIsInitialLoad(false);
          return;
        }

        const { data: dbData, error } = await supabase
          .from('tracked_characters')
          .select(`
            id, character_id, level, traces_attained, is_favorited,
            equipped_relics ( id, slot, set_id, main_stat, relic_substats ( stat_type, stat_value ) ),
            build_preference_main_stats ( id, slot, stat, operator_to_next, order_index ),
            build_preference_sub_stats ( id, stat, operator_to_next, order_index )
          `)
          .eq('profile_id', session.user.id);

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching data:', error);
        } else if (dbData && dbData.length > 0) {
          // Rebuild full roster objects merging dynamic API fetched characters + db tracking values
          const rebuiltRoster: TrackedCharacter[] = dbData.map((row: any) => {
            const baseChar = availableCharacters.find(c => c.id === row.character_id) || ALL_CHARACTERS.find(c => c.id === row.character_id);
            if (!baseChar) return null;

            const structuredRelics: any = { ...defaultRelics };
            for (const r of row.equipped_relics || []) {
              structuredRelics[r.slot] = {
                setId: r.set_id,
                mainStat: r.main_stat,
                subStats: (r.relic_substats || []).map((sub: any) => ({ type: sub.stat_type, value: sub.stat_value }))
              };
            }

            const rawMainPrefs = row.build_preference_main_stats || [];
            const rawSubPrefs = row.build_preference_sub_stats || [];

            const prefs = {
              mainStats: { body: [], feet: [], sphere: [], rope: [] } as Record<string, any>,
              subStats: [] as any[]
            };

            ['body', 'feet', 'sphere', 'rope'].forEach(part => {
              prefs.mainStats[part] = rawMainPrefs
                .filter((p: any) => p.slot === part)
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((p: any) => ({ stat: p.stat, operator: p.operator_to_next, orderIndex: p.order_index }));
            });

            prefs.subStats = rawSubPrefs
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((p: any) => ({ stat: p.stat, operator: p.operator_to_next, orderIndex: p.order_index }));

            return {
              ...baseChar,
              dbId: row.id,
              isFavorited: !!row.is_favorited,
              level: row.level,
              tracesAttained: row.traces_attained,
              relics: structuredRelics,
              buildPreferences: prefs as any
            };
          }).filter(Boolean) as TrackedCharacter[];

          setTrackedCharacters(rebuiltRoster);
        } else {
          setTrackedCharacters([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    };
    loadData();

    return () => { isMounted = false; };
  }, [session?.user?.id, isAuthLoading]); // Ignore availableCharacters intentional to avoid DB wipe when dynamic web fetch finishes

  // Removed global debounced saver; handlers now sync state directly.

  const fetchLatestCharacters = async () => {
    setIsUpdating(true);
    try {
      const charResponse = await fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json');
      const relicResponse = await fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relic_sets.json');

      if (!charResponse.ok || !relicResponse.ok) throw new Error('Failed to fetch data');

      const charData = await charResponse.json();
      const relicData = await relicResponse.json();

      const newCharacters: Character[] = [];
      const newRelics: RelicSet[] = [];
      const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';

      for (const [id, charInfo] of Object.entries(charData)) {
        if (!charInfo || typeof charInfo !== 'object') continue;
        const info = charInfo as any;
        newCharacters.push({
          id: id,
          name: info.name,
          element: info.element || 'Unknown',
          imageUrl: `${IMAGE_BASE_URL}${info.icon}`
        });
      }

      for (const [id, relicInfo] of Object.entries(relicData)) {
        if (!relicInfo || typeof relicInfo !== 'object') continue;
        const info = relicInfo as any;
        newRelics.push({
          id: id,
          name: info.name,
          icon: `${IMAGE_BASE_URL}${info.icon}`
        });
      }

      if (newCharacters.length > 0) {
        setAvailableCharacters(newCharacters);
        setTrackedCharacters(prev => prev.map(tc => {
          const updatedChar = newCharacters.find(nc => nc.name === tc.name);
          if (updatedChar) {
            return {
              ...tc,
              id: updatedChar.id,
              imageUrl: updatedChar.imageUrl,
              element: updatedChar.element
            };
          }
          return tc;
        }));
      }

      if (newRelics.length > 0) {
        setAvailableRelicSets(newRelics);
      }

    } catch (error) {
      console.error('Error updating data:', error);
      alert('Failed to connect to update server.');
    } finally {
      setIsUpdating(false);
    }
  };

  const addCharacter = async (char: Character) => {
    if (!session) { alert('Please log in first!'); return; }
    if (trackedCharacters.some(c => c.id === char.id)) {
      setIsModalOpen(false);
      return;
    }

    const newChar: TrackedCharacter = {
      ...char,
      isFavorited: false,
      level: 1,
      tracesAttained: false,
      relics: defaultRelics,
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: []
      }
    };

    setTrackedCharacters(prev => [...prev, newChar]);
    setIsModalOpen(false);

    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('user_profiles').upsert({ id: session.user.id, updated_at: new Date().toISOString() });
      const { data, error } = await supabase.from('tracked_characters').insert({
        profile_id: session.user.id,
        character_id: char.id,
        level: 1,
        traces_attained: false
      }).select('id').single();

      if (data) {
        setTrackedCharacters(prev => prev.map(c => c.id === char.id ? { ...c, dbId: data.id } : c));
      } else {
        console.error("DB Insert Failed:", error);
      }
    }
  };

  const removeCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const charToRemove = trackedCharacters.find(c => c.id === id);
    setTrackedCharacters(prev => prev.filter(c => c.id !== id));

    if (charToRemove?.dbId && import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('tracked_characters').delete().eq('id', charToRemove.dbId);
    }
  };

  const updateCharacterLevel = async (id: string, level: number) => {
    const validLevel = Math.min(80, Math.max(1, level));
    setTrackedCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, level: validLevel } : c
    ));

    // Fire db update in background with debounce
    const char = trackedCharacters.find(c => c.id === id);
    if (char?.dbId && import.meta.env.VITE_SUPABASE_URL) {
      queueDBUpdate(char.dbId, { level: validLevel });
    }
  };

  const toggleCharacterTraces = async (id: string, value: boolean) => {
    setTrackedCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, tracesAttained: value } : c
    ));

    const char = trackedCharacters.find(c => c.id === id);
    if (char?.dbId && import.meta.env.VITE_SUPABASE_URL) {
      queueDBUpdate(char.dbId, { traces_attained: value });
    }
  };

  const toggleFavoriteCharacter = async (id: string, value: boolean) => {
    setTrackedCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, isFavorited: value } : c
    ));

    const char = trackedCharacters.find(c => c.id === id);
    if (char?.dbId && import.meta.env.VITE_SUPABASE_URL) {
      queueDBUpdate(char.dbId, { is_favorited: value });
    }
  };

  const toggleCharacterRelic = (id: string, part: keyof TrackedCharacter['relics']) => {
    setEditingRelic({ charId: id, slot: part });
  };

  const saveRelicData = async (relicData: EquippedRelic) => {
    if (!editingRelic) return;
    const { charId, slot } = editingRelic;

    setTrackedCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        return { ...c, relics: { ...c.relics, [slot]: relicData } };
      }
      return c;
    }));

    const char = trackedCharacters.find(c => c.id === charId);
    if (char?.dbId && import.meta.env.VITE_SUPABASE_URL) {
      queueRelicDBUpdate(char.dbId, slot, relicData);
    }
  };

  const removeRelicData = async () => {
    if (!editingRelic) return;
    const { charId, slot } = editingRelic;

    setTrackedCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        return { ...c, relics: { ...c.relics, [slot]: emptyRelic } };
      }
      return c;
    }));
    setEditingRelic(null);

    const char = trackedCharacters.find(c => c.id === charId);
    if (char?.dbId && import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('equipped_relics').delete().match({ tracked_character_id: char.dbId, slot: slot });
    }
  };

  const saveBuildPreferences = async (charId: string, newPreferences: TrackedCharacter['buildPreferences']) => {
    setTrackedCharacters(prev => prev.map(c => c.id === charId ? { ...c, buildPreferences: newPreferences } : c));
    
    const char = trackedCharacters.find(c => c.id === charId);
    if (!char?.dbId || !import.meta.env.VITE_SUPABASE_URL) return;

    await supabase.from('build_preference_main_stats').delete().eq('tracked_character_id', char.dbId);
    await supabase.from('build_preference_sub_stats').delete().eq('tracked_character_id', char.dbId);

    const mainInserts: any[] = [];
    (['body', 'feet', 'sphere', 'rope'] as const).forEach(slot => {
      newPreferences.mainStats[slot].forEach((pref, idx) => {
        mainInserts.push({
          tracked_character_id: char.dbId,
          slot: slot,
          stat: pref.stat,
          operator_to_next: pref.operator,
          order_index: idx
        });
      });
    });

    const subInserts = newPreferences.subStats.map((pref, idx) => ({
      tracked_character_id: char.dbId,
      stat: pref.stat,
      operator_to_next: pref.operator,
      order_index: idx
    }));

    if (mainInserts.length > 0) {
      const { error: mErr } = await supabase.from('build_preference_main_stats').insert(mainInserts);
      if (mErr) console.error("Error saving main stats prefs:", mErr);
    }
    if (subInserts.length > 0) {
      const { error: sErr } = await supabase.from('build_preference_sub_stats').insert(subInserts);
      if (sErr) console.error("Error saving sub stats prefs:", sErr);
    }
  };

  const filteredRoster = useMemo(() => {
    let result = trackedCharacters;

    if (searchTerm.trim()) {
      const fuse = new Fuse(trackedCharacters, {
        keys: ['name', 'element'],
        threshold: 0.3,
      });
      result = fuse.search(searchTerm).map(res => res.item);
    }

    return [...result].sort((a, b) => {
      if (a.isFavorited && !b.isFavorited) return -1;
      if (!a.isFavorited && b.isFavorited) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [trackedCharacters, searchTerm]);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">✧</span> Astral Express Tracker
        </div>
        <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {session ? (
            <>
              <span className="user-email" style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{session.user.email}</span>
              <button className="secondary-action" style={{ padding: '0.4rem 1rem' }} onClick={() => supabase.auth.signOut()}>Sign Out</button>
            </>
          ) : (
            <button className="primary-action" style={{ padding: '0.4rem 1rem' }} onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}>Sign In with Google</button>
          )}
        </div>
      </nav>

      <main className="main-content">
        <header className="hero">
          <h1 className="title">Trailblazer Roster</h1>
          <p className="subtitle">Manage and track your Honkai Star Rail characters' ascension and trace materials.</p>
          <div className="action-group">
            <button className="secondary-action" onClick={fetchLatestCharacters} disabled={isUpdating}>
              {isUpdating ? 'Fetching Data...' : 'Force Sync Characters & Relics'}
            </button>
            {session && (
              <button className="primary-action" onClick={() => setIsModalOpen(true)}>
                Add Character
              </button>
            )}
          </div>
          {session && trackedCharacters.length > 0 && (
            <div className="search-bar-container">
              <input
                type="text"
                className="roster-search-input"
                placeholder="Search your roster by name or element..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </header>

        <section className="roster-grid">
          {isAuthLoading ? (
            <div className="empty-state">
              <p>Authenticating...</p>
            </div>
          ) : isInitialLoad && session ? (
            <div className="empty-state">
              <p>Loading database sync...</p>
            </div>
          ) : !session ? (
            <div className="empty-state auth-gate" style={{
              padding: '3rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              margin: '2rem auto',
              maxWidth: '480px',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text)' }}>Welcome to the Astral Express</h2>
              <p style={{ color: 'var(--color-text-dim)', lineHeight: '1.5' }}>
                Securely sync your character builds, trace tracking, and relics across all your devices using Google Authentication.
              </p>
              <button
                className="primary-action"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
              >
                Sign In with Google
              </button>
            </div>
          ) : trackedCharacters.length === 0 ? (
            <div className="empty-state">
              <p>No characters tracked yet. Click "Add Character" to begin!</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="empty-state">
              <p>No characters match your search.</p>
            </div>
          ) : (
            filteredRoster.map(char => (
              <CharacterCard
                key={char.id}
                char={char}
                availableRelicSets={availableRelicSets}
                onRemove={removeCharacter}
                onUpdateLevel={updateCharacterLevel}
                onToggleTraces={toggleCharacterTraces}
                onToggleFavorite={toggleFavoriteCharacter}
                onToggleRelic={toggleCharacterRelic}
              />
            ))
          )}
        </section>
      </main>

      {/* Advanced Relic Editor Modal */}
      {editingRelic && (() => {
        const char = trackedCharacters.find(c => c.id === editingRelic.charId);
        if (!char) return null;
        return (
          <RelicEditorModal
            char={char}
            slot={editingRelic.slot}
            availableRelicSets={availableRelicSets}
            emptyRelic={emptyRelic}
            onSave={saveRelicData}
            onRemove={removeRelicData}
            onUpdateBuildPreferences={(newPrefs) => saveBuildPreferences(char.id, newPrefs)}
            onClose={() => setEditingRelic(null)}
          />
        );
      })()}

      {/* Modal for adding characters */}
      {isModalOpen && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={addCharacter}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}

export default App
