import { useState, useMemo } from 'react';
import { useCharacters, emptyRelic } from '../../hooks/useCharacters';
import { calculateRelicScore } from '../../utils/relicScoring';
import { CharacterCard } from './components/CharacterCard';
import { RelicEditorModal } from './components/RelicEditorModal';
import { AddCharacterModal } from './components/AddCharacterModal';
import { AuthGate } from '../../components/AuthGate';
import type { TrackedCharacter } from '../../types';
import type { Session } from '@supabase/supabase-js';
import './HsrPage.css';

interface HsrPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function HsrPage({ session, isAuthLoading, onSignIn }: HsrPageProps) {
  const {
    availableCharacters, availableRelicSets, trackedCharacters,
    isInitialLoad, isUpdating,
    fetchLatestCharacters, addCharacter, removeCharacter,
    updateCharacterLevel, toggleCharacterTraces, toggleFavoriteCharacter,
    saveRelicData, removeRelicData, saveBuildPreferences, getFilteredRoster,
  } = useCharacters(session, isAuthLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE' | 'ALPHA'>('SCORE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelic, setEditingRelic] = useState<{ charId: string; slot: keyof TrackedCharacter['relics'] } | null>(null);

  const filteredRoster = useMemo(
    () => getFilteredRoster(searchTerm, sortBy, calculateRelicScore),
    [trackedCharacters, searchTerm, sortBy]
  );

  const handleAddCharacter = async (char: Parameters<typeof addCharacter>[0]) => {
    await addCharacter(char);
    setIsModalOpen(false);
  };

  return (
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
          <div className="search-and-sort-container">
            <input
              type="text"
              className="roster-search-input"
              placeholder="Search your roster by name or element..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className={`sort-btn ${sortBy === 'SCORE' ? 'active' : ''}`}
              onClick={() => setSortBy(prev => prev === 'SCORE' ? 'ALPHA' : 'SCORE')}
              title={sortBy === 'SCORE' ? 'Sorted by Relic Score — click to sort alphabetically' : 'Sorted alphabetically — click to sort by Relic Score'}
            >
              {sortBy === 'SCORE' ? '★' : 'A–Z'}
            </button>
          </div>
        )}
      </header>

      <section className="roster-grid">
        {isAuthLoading ? (
          <div className="empty-state"><p>Authenticating...</p></div>
        ) : isInitialLoad && session ? (
          <div className="empty-state"><p>Loading database sync...</p></div>
        ) : !session ? (
          <AuthGate onSignIn={onSignIn} />
        ) : trackedCharacters.length === 0 ? (
          <div className="empty-state"><p>No characters tracked yet. Click "Add Character" to begin!</p></div>
        ) : filteredRoster.length === 0 ? (
          <div className="empty-state"><p>No characters match your search.</p></div>
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
              onToggleRelic={(id, slot) => setEditingRelic({ charId: id, slot })}
            />
          ))
        )}
      </section>

      {editingRelic && (() => {
        const char = trackedCharacters.find(c => c.id === editingRelic.charId);
        if (!char) return null;
        return (
          <RelicEditorModal
            char={char}
            slot={editingRelic.slot}
            availableRelicSets={availableRelicSets}
            emptyRelic={emptyRelic}
            onSave={(relicData) => saveRelicData(editingRelic, relicData)}
            onRemove={async () => { await removeRelicData(editingRelic); setEditingRelic(null); }}
            onUpdateBuildPreferences={(newPrefs) => saveBuildPreferences(char.id, newPrefs)}
            onClose={() => setEditingRelic(null)}
          />
        );
      })()}

      {isModalOpen && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={handleAddCharacter}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}
