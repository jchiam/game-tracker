import { useState } from 'react';
import './App.css';
import { ALL_CHARACTERS, type Character } from './data/characters';
import { type EquippedRelic, type RelicSet } from './data/relics';
import { ALL_RELIC_SETS } from './data/relic_sets';
import { type TrackedCharacter } from './types';
import { CharacterCard } from './components/CharacterCard';
import { RelicEditorModal } from './components/RelicEditorModal';
import { AddCharacterModal } from './components/AddCharacterModal';

export const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };
const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };
const mockMaxedRelics = { 
  head: { setId: '101', mainStat: 'HP', subStats: [{type: 'CRIT Rate', value: '3.2%'}, {type: 'SPD', value: '2'}] }, 
  hands: { setId: '101', mainStat: 'ATK', subStats: [{type: 'CRIT DMG', value: '6.4%'}, {type: 'ATK%', value: '4.3%'}] }, 
  body: { setId: '101', mainStat: 'CRIT Rate', subStats: [{type: 'CRIT DMG', value: '12.9%'}, {type: 'SPD', value: '4'}] }, 
  feet: { setId: '101', mainStat: 'SPD', subStats: [{type: 'ATK%', value: '8.6%'}, {type: 'Break Effect', value: '5.8%'}] }, 
  sphere: { setId: '301', mainStat: 'Lightning DMG Boost', subStats: [{type: 'CRIT Rate', value: '2.9%'}, {type: 'ATK', value: '19'}] }, 
  rope: { setId: '301', mainStat: 'ATK%', subStats: [{type: 'CRIT DMG', value: '11.6%'}, {type: 'SPD', value: '2'}] } 
};

function App() {
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(ALL_CHARACTERS);
  const [availableRelicSets, setAvailableRelicSets] = useState<RelicSet[]>(ALL_RELIC_SETS);
  const [isUpdating, setIsUpdating] = useState(false);

  const [trackedCharacters, setTrackedCharacters] = useState<TrackedCharacter[]>([
    { ...ALL_CHARACTERS.find(c => c.id === 'acheron')!, level: 80, tracesAttained: true, relics: mockMaxedRelics },
    { ...ALL_CHARACTERS.find(c => c.id === 'aventurine')!, level: 80, tracesAttained: true, relics: mockMaxedRelics },
    { ...ALL_CHARACTERS.find(c => c.id === 'firefly')!, level: 80, tracesAttained: true, relics: mockMaxedRelics },
    { ...ALL_CHARACTERS.find(c => c.id === 'ruan_mei')!, level: 80, tracesAttained: true, relics: mockMaxedRelics },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelic, setEditingRelic] = useState<{charId: string, slot: keyof TrackedCharacter['relics']} | null>(null);

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
          path: info.path || 'Unknown',
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
              path: updatedChar.path,
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

  const addCharacter = (char: Character) => {
    if (!trackedCharacters.some(c => c.id === char.id)) {
      setTrackedCharacters([...trackedCharacters, { 
        ...char, 
        level: 1, 
        tracesAttained: false, 
        relics: defaultRelics 
      }]);
    }
    setIsModalOpen(false);
  };

  const removeCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackedCharacters(trackedCharacters.filter(c => c.id !== id));
  };

  const updateCharacterLevel = (id: string, level: number) => {
    setTrackedCharacters(prev => prev.map(c => 
      c.id === id ? { ...c, level: Math.min(80, Math.max(1, level)) } : c
    ));
  };

  const toggleCharacterTraces = (id: string, value: boolean) => {
    setTrackedCharacters(prev => prev.map(c => 
      c.id === id ? { ...c, tracesAttained: value } : c
    ));
  };

  const toggleCharacterRelic = (id: string, part: keyof TrackedCharacter['relics']) => {
    setEditingRelic({ charId: id, slot: part });
  };

  const saveRelicData = (relicData: EquippedRelic) => {
    if (!editingRelic) return;
    setTrackedCharacters(prev => prev.map(c => {
      if (c.id === editingRelic.charId) {
        return {
          ...c,
          relics: { ...c.relics, [editingRelic.slot]: relicData }
        };
      }
      return c;
    }));
  };

  const removeRelicData = () => {
    if (!editingRelic) return;
    setTrackedCharacters(prev => prev.map(c => {
      if (c.id === editingRelic.charId) {
        return {
          ...c,
          relics: { ...c.relics, [editingRelic.slot]: emptyRelic }
        };
      }
      return c;
    }));
    setEditingRelic(null);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">✧</span> Astral Express Tracker Worker
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
            <button className="primary-action" onClick={() => setIsModalOpen(true)}>
              Add Character
            </button>
          </div>
        </header>

        <section className="roster-grid">
          {trackedCharacters.map(char => (
            <CharacterCard 
              key={char.id}
              char={char}
              availableRelicSets={availableRelicSets}
              onRemove={removeCharacter}
              onUpdateLevel={updateCharacterLevel}
              onToggleTraces={toggleCharacterTraces}
              onToggleRelic={toggleCharacterRelic}
            />
          ))}
          
          {trackedCharacters.length === 0 && (
            <div className="empty-state">
              <p>No characters tracked yet. Click "Add Character" to begin!</p>
            </div>
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
