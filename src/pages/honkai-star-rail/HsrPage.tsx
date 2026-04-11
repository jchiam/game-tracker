import { useState, useMemo } from 'react';
import { useCharacters, emptyRelic } from '@/hooks/honkai-star-rail/useCharacters';
import { useParties } from '@/hooks/honkai-star-rail/useParties';
import { calculateRelicScore } from '@/utils/relicScoring';
import { CharacterCard } from './components/CharacterCard';
import { RelicEditorModal } from './components/RelicEditorModal';
import { AddCharacterModal } from './components/AddCharacterModal';
import { PartiesTab } from './components/PartiesTab';
import { AuthGate } from '@/components/AuthGate';
import { LoadErrorState } from '@/components/LoadErrorState';
import { SavingToast } from '@/components/SavingToast';
import type { HsrTrackedCharacter } from '@/types';
import type { Session } from '@supabase/supabase-js';
import './HsrPage.css';

interface HsrPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function HsrPage({ session, isAuthLoading, onSignIn }: HsrPageProps) {
  const {
    availableCharacters,
    availableRelicSets,
    trackedCharacters,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCharacter,
    removeCharacter,
    updateCharacterLevel,
    toggleCharacterTraces,
    toggleFavoriteCharacter,
    saveRelicData,
    removeRelicData,
    saveBuildPreferences,
    getFilteredRoster,
  } = useCharacters(session, isAuthLoading);

  const { parties, saveParty, deleteParty } = useParties(session);

  const [view, setView] = useState<'roster' | 'parties'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE' | 'ALPHA'>('SCORE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelic, setEditingRelic] = useState<{
    charId: string;
    slot: keyof HsrTrackedCharacter['relics'];
  } | null>(null);

  const filteredRoster = useMemo(
    () => getFilteredRoster(searchTerm, sortBy, calculateRelicScore),
    [getFilteredRoster, searchTerm, sortBy],
  );

  const handleAddCharacter = async (char: Parameters<typeof addCharacter>[0]) => {
    await addCharacter(char);
    setIsModalOpen(false);
  };

  return (
    <main className="main-content">
      <header className="hero">
        <h1 className="title">Honkai Star Rail Tracker</h1>
        <p className="subtitle">Manage your character roster and party configurations.</p>

        <div className="view-selector">
          <button
            className={`view-btn ${view === 'roster' ? 'active' : ''}`}
            onClick={() => setView('roster')}
          >
            Roster
          </button>
          <button
            className={`view-btn ${view === 'parties' ? 'active' : ''}`}
            onClick={() => setView('parties')}
          >
            Parties
          </button>
        </div>

        {view === 'roster' && session && (
          <div className="search-and-sort-container" style={{ marginTop: 'var(--spacing-md)' }}>
            {trackedCharacters.length > 0 && (
              <>
                <input
                  type="text"
                  className="roster-search-input"
                  placeholder="Search by name, element, or path..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className={`sort-btn ${sortBy === 'SCORE' ? 'active' : ''}`}
                  onClick={() => setSortBy((prev) => (prev === 'SCORE' ? 'ALPHA' : 'SCORE'))}
                  title={
                    sortBy === 'SCORE'
                      ? 'Sorted by Relic Score — click to sort alphabetically'
                      : 'Sorted alphabetically — click to sort by Relic Score'
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 3h10M2 7h6M2 11h3" />
                    <path d="M10 6v6M10 12l-2-2M10 12l2-2" />
                  </svg>
                  <span className="sort-btn-label">{sortBy === 'SCORE' ? '★' : 'AZ'}</span>
                </button>
              </>
            )}
            <button
              className="add-character-btn"
              onClick={() => setIsModalOpen(true)}
              title="Add Character"
              disabled={isLoadError}
            >
              +
            </button>
          </div>
        )}
      </header>

      {view === 'roster' ? (
        <section className="roster-grid">
          {isAuthLoading ? (
            <div className="empty-state">
              <p>Authenticating...</p>
            </div>
          ) : isInitialLoad && session ? (
            <div className="empty-state">
              <p>Loading database sync...</p>
            </div>
          ) : isLoadError ? (
            <LoadErrorState onRetry={retryLoad} />
          ) : !session ? (
            <AuthGate onSignIn={onSignIn} />
          ) : trackedCharacters.length === 0 ? (
            <div className="empty-state">
              <p>No characters tracked yet. Click "Add Character" to begin!</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="empty-state">
              <p>No characters match your search.</p>
            </div>
          ) : (
            filteredRoster.map((char) => (
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
      ) : (
        <PartiesTab
          parties={parties}
          availableCharacters={availableCharacters}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          session={session}
        />
      )}

      {editingRelic &&
        (() => {
          const char = trackedCharacters.find((c) => c.id === editingRelic.charId);
          if (!char) return null;
          return (
            <RelicEditorModal
              char={char}
              slot={editingRelic.slot}
              availableRelicSets={availableRelicSets}
              emptyRelic={emptyRelic}
              onSave={(relicData) => saveRelicData(editingRelic, relicData)}
              onRemove={async () => {
                await removeRelicData(editingRelic);
                setEditingRelic(null);
              }}
              onUpdateBuildPreferences={(newPrefs) => saveBuildPreferences(char.id, newPrefs)}
              onClose={() => setEditingRelic(null)}
            />
          );
        })()}

      <SavingToast visible={pendingSaveCount > 0} />

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
