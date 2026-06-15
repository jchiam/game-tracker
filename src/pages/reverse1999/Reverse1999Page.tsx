import { useState, useMemo } from 'react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { useParties } from '@/hooks/reverse1999/useParties';
import { ArcanistCard } from './components/ArcanistCard';
import { AddArcanistModal } from './components/AddArcanistModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';

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
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updatePortraitLevel,
    updateResonanceLevel,
    updateEuphoriaStage,
    updatePsychube,
    updatePsychubeAmplification,
    toggleFavoriteArcanist,
    getFilteredRoster,
  } = useArcanists(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const [view, setView] = useState<'roster' | 'second'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ALPHA' | 'LEVEL'>('ALPHA');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRoster = useMemo(
    () => getFilteredRoster(searchTerm, sortBy),
    [getFilteredRoster, searchTerm, sortBy],
  );

  return (
    <RosterPageLayout
      title="Reverse: 1999 Arcanists"
      subtitle="Track your arcanists and build progress."
      secondViewLabel="Lineups"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedArcanists.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No arcanists tracked yet. Use the + button to begin!"
      noMatchMessage="No arcanists match your search."
      search={{
        value: searchTerm,
        placeholder: 'Search by name, afflatus, or damage type...',
        onChange: setSearchTerm,
      }}
      sort={{
        active: sortBy === 'ALPHA',
        label: sortBy === 'ALPHA' ? 'AZ' : 'Lv',
        title:
          sortBy === 'ALPHA'
            ? 'Sorted alphabetically — click to sort by Level'
            : 'Sorted by Level — click to sort alphabetically',
        onToggle: () => setSortBy((prev) => (prev === 'ALPHA' ? 'LEVEL' : 'ALPHA')),
      }}
      add={{ title: 'Add Arcanist', onClick: () => setIsModalOpen(true), disabled: isLoadError }}
      cards={filteredRoster.map((arcanist) => (
        <ArcanistCard
          key={arcanist.id!}
          arcanist={arcanist}
          onRemove={removeArcanist}
          onUpdateLevel={updateArcanistLevel}
          onUpdatePortrait={updatePortraitLevel}
          onUpdateResonance={updateResonanceLevel}
          onUpdateEuphoriaStage={updateEuphoriaStage}
          onUpdatePsychube={updatePsychube}
          onUpdatePsychubeAmplification={updatePsychubeAmplification}
          onToggleFavorite={toggleFavoriteArcanist}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableArcanists={availableArcanists}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          onToggleFavorite={toggleFavoriteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
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
    </RosterPageLayout>
  );
}
