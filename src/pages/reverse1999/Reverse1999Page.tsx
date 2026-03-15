import { useState, useMemo } from 'react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { ArcanistCard } from './components/ArcanistCard';
import { AddArcanistModal } from './components/AddArcanistModal';
import { AuthGate } from '@/components/AuthGate';
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
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updateInsightLevel,
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
        <div className="action-group">
          <button className="secondary-action" disabled title="Coming soon">
            Force Sync Arcanists
          </button>
          {session && (
            <button className="primary-action" onClick={() => setIsModalOpen(true)}>
              Add Arcanist
            </button>
          )}
        </div>
      </header>

      {session && trackedArcanists.length > 0 && (
        <div className="roster-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search roster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'ALPHA' | 'LEVEL')}
          >
            <option value="ALPHA">Sort by Name</option>
            <option value="LEVEL">Sort by Level</option>
          </select>
        </div>
      )}

      <section className="roster-grid">
        {isAuthLoading ? (
          <div className="empty-state">
            <p>Authenticating...</p>
          </div>
        ) : !session ? (
          <AuthGate onSignIn={onSignIn} />
        ) : trackedArcanists.length === 0 ? (
          <div className="empty-state">
            <p>No arcanists tracked yet. Click "Add Arcanist" to begin!</p>
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
              onToggleFavorite={toggleFavoriteArcanist}
            />
          ))
        )}
      </section>

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
