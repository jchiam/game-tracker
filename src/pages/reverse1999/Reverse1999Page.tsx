import { useState, useMemo } from 'react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { ArcanistCard } from './components/ArcanistCard';
import { AddArcanistModal } from './components/AddArcanistModal';
import { AuthGate } from '@/components/AuthGate';
import { SavingToast } from '@/components/SavingToast';
import type { Session } from '@supabase/supabase-js';
import './Reverse1999Page.css';

interface Reverse1999PageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function Reverse1999Page({ session, isAuthLoading, onSignIn }: Reverse1999PageProps) {
  const {
    availableArcanists,
    trackedArcanists,
    isInitialLoad,
    pendingSaveCount,
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updateInsightLevel,
    updatePortraitLevel,
    updateResonanceLevel,
    toggleFavoriteArcanist,
    getFilteredRoster,
  } = useArcanists(session, isAuthLoading);

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
        <h1 className="title">Reverse: 1999 Arcanists</h1>
        <p className="subtitle">Track your arcanists and build progress.</p>
        {session && (
          <div className="roster-controls">
            {trackedArcanists.length > 0 && (
              <>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, afflatus, or damage type..."
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
              className="add-arcanist-btn"
              onClick={() => setIsModalOpen(true)}
              title="Add Arcanist"
            >
              +
            </button>
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
          <AuthGate onSignIn={onSignIn} />
        ) : trackedArcanists.length === 0 ? (
          <div className="empty-state">
            <p>No arcanists tracked yet. Use the + button to begin!</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="empty-state">
            <p>No arcanists match your search.</p>
          </div>
        ) : (
          filteredRoster.map((arcanist) => (
            <ArcanistCard
              key={arcanist.id!}
              arcanist={arcanist}
              onRemove={removeArcanist}
              onUpdateLevel={updateArcanistLevel}
              onUpdateInsight={updateInsightLevel}
              onUpdatePortrait={updatePortraitLevel}
              onUpdateResonance={updateResonanceLevel}
              onToggleFavorite={toggleFavoriteArcanist}
            />
          ))
        )}
      </section>

      <SavingToast visible={pendingSaveCount > 0} />

      {isModalOpen && session && (
        <AddArcanistModal
          availableArcanists={availableArcanists}
          trackedArcanists={trackedArcanists}
          onAddArcanist={(arcanist) => {
            addArcanist(arcanist);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}
