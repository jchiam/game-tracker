import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { useParties } from '@/hooks/reverse1999/useParties';
import { useRosterView } from '@/hooks/useRosterView';
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

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
      ],
      searchPlaceholder: 'Search by name, afflatus, or damage type...',
      addTitle: 'Add Arcanist',
      addDisabled: isLoadError,
      filterRoster: getFilteredRoster,
    });

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
      search={search}
      sort={sort}
      add={add}
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
      {isAddModalOpen && session && (
        <AddArcanistModal
          availableArcanists={availableArcanists}
          trackedArcanists={trackedArcanists}
          onAddArcanist={(arcanist) => {
            addArcanist(arcanist);
            closeAddModal();
          }}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
