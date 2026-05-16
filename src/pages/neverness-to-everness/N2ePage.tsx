import { useState, useMemo } from 'react';
import { useCharacters } from '@/hooks/neverness-to-everness/useCharacters';
import { useParties } from '@/hooks/neverness-to-everness/useParties';
import { CharacterCard } from './components/CharacterCard';
import { AddCharacterModal } from './components/AddCharacterModal';
import { PartiesTab } from './components/PartiesTab';
import { AuthGate } from '@/components/AuthGate';
import { LoadErrorState } from '@/components/LoadErrorState';
import { SavingToast } from '@/components/SavingToast';
import type { Session } from '@supabase/supabase-js';
import './N2ePage.css';

interface N2ePageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function N2ePage({ session, isAuthLoading, onSignIn }: N2ePageProps) {
  const {
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
  } = useCharacters(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const [view, setView] = useState<'roster' | 'lineups'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ALPHA' | 'LEVEL'>('ALPHA');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRoster = useMemo(
    () => getFilteredRoster(searchTerm, sortBy),
    [getFilteredRoster, searchTerm, sortBy],
  );

  return (
    <main className="main-content">
      <header className="hero">
        <h1 className="title">Neverness to Everness</h1>
        <p className="subtitle">Track your espers and build progress.</p>

        <div className="view-selector">
          <button
            className={`view-btn ${view === 'roster' ? 'active' : ''}`}
            onClick={() => setView('roster')}
          >
            Roster
          </button>
          <button
            className={`view-btn ${view === 'lineups' ? 'active' : ''}`}
            onClick={() => setView('lineups')}
          >
            Lineups
          </button>
        </div>

        {view === 'roster' && session && (
          <div className="roster-controls">
            {trackedCharacters.length > 0 && (
              <>
                <input
                  type="text"
                  name="character-search"
                  className="search-input"
                  placeholder="Search by name, esper type, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className={`sort-btn ${sortBy === 'ALPHA' ? 'active' : ''}`}
                  onClick={() => setSortBy((prev) => (prev === 'ALPHA' ? 'LEVEL' : 'ALPHA'))}
                  title={
                    sortBy === 'ALPHA'
                      ? 'Sorted alphabetically — click to sort by Level'
                      : 'Sorted by Level — click to sort alphabetically'
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
                  <span className="sort-btn-label">{sortBy === 'ALPHA' ? 'AZ' : 'Lv'}</span>
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
              <p>No espers tracked yet. Use the + button to begin!</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="empty-state">
              <p>No espers match your search.</p>
            </div>
          ) : (
            filteredRoster.map((character) => (
              <CharacterCard
                key={character.id!}
                character={character}
                onRemove={removeCharacter}
                onUpdateLevel={updateCharacterLevel}
                onToggleAwakening={toggleAwakeningSlot}
                onUpdateResonance={updateResonanceCount}
                onUpdateArc={updateArc}
                onUpdateCartridge={updateCartridge}
                onToggleFavorite={toggleFavoriteCharacter}
                onSaveCartridgePreferences={saveCartridgePreferences}
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
          onToggleFavorite={toggleFavoriteParty}
          session={session}
        />
      )}

      <SavingToast visible={pendingSaveCount > 0} />

      {isModalOpen && session && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={(character) => {
            addCharacter(character);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}
