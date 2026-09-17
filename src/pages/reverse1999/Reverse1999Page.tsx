import { useCallback } from 'react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { useParties } from '@/hooks/reverse1999/useParties';
import { useRosterView, type RosterFilterChip } from '@/hooks/useRosterView';
import { ArcanistCard } from './components/ArcanistCard';
import { AddArcanistModal } from './components/AddArcanistModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import type { R1999TrackedArcanist } from '@/types';

/** Roster filter chips — item-gate bottlenecks (roster-predicate-filter). */
const FILTER_CHIPS: RosterFilterChip<R1999TrackedArcanist>[] = [
  {
    key: 'resonance',
    label: '💠 Resonating',
    predicate: (a) => a.resonanceLevel > 0 && a.resonanceLevel < 15,
    onTitle: 'Show only arcanists with resonance in progress',
    noMatch: 'No arcanists with resonance in progress.',
  },
  {
    key: 'gluttony',
    label: '🍽️ Amplifying',
    predicate: (a) => a.psychubeName !== null && a.psychubeAmplification < 5,
    onTitle: 'Show only arcanists with an equipped psychube below max amplification',
    noMatch: 'No arcanists with un-maxed psychube amplification.',
  },
];

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

  const {
    parties,
    isInitialLoad: isPartiesInitialLoad,
    isLoadError: isPartiesLoadError,
    retryLoad: retryParties,
    saveParty,
    deleteParty,
    toggleFavoriteParty,
  } = useParties(session);

  // Roster Retry recovers both data sets after a shared outage; the parties
  // tab's own Retry (passed below) touches only parties.
  const retryAll = () => {
    retryLoad();
    retryParties();
  };

  // Closes over nothing chip-related: the hook injects the composed predicate,
  // so this identity stays stable across chip toggles and entity edits.
  const filterRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL',
      predicate: ((a: R1999TrackedArcanist) => boolean) | undefined,
      entities?: R1999TrackedArcanist[],
    ) => getFilteredRoster(searchTerm, sortBy, predicate, entities),
    [getFilteredRoster],
  );

  const {
    view,
    setView,
    filteredRoster,
    isAddModalOpen,
    closeAddModal,
    search,
    sort,
    add,
    filters,
    noMatchMessage,
    projection,
  } = useRosterView({
    sortModes: [
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      { key: 'LEVEL', label: 'Lv', described: 'by Level' },
    ],
    searchPlaceholder: 'Search by name, afflatus, or damage type...',
    addTitle: 'Add Arcanist',
    addDisabled: isLoadError,
    nounPlural: 'arcanists',
    filterChips: FILTER_CHIPS,
    filterAccent: 'var(--color-r1999-accent)',
    filterRoster,
    trackedEntities: trackedArcanists,
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
      onRetry={retryAll}
      onSignIn={onSignIn}
      hasTracked={trackedArcanists.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No arcanists tracked yet. Use the + button to begin!"
      noMatchMessage={noMatchMessage}
      filters={filters}
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
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavoriteArcanist(id, value);
            projection.refreshBasis(id);
          }}
          onEditCommit={() => projection.refreshBasis(arcanist.id!)}
          heldReason={projection.heldReason(arcanist.id!)}
          isExiting={projection.isExiting(arcanist.id!)}
          /* v8 ignore next -- jsdom never delivers animationend; the exit
             fallback timer covers eviction in tests */
          onExitEnd={() => projection.completeExit(arcanist.id!)}
        />
      ))}
      secondView={
        <PartiesTab
          isInitialLoad={isPartiesInitialLoad}
          isLoadError={isPartiesLoadError}
          onRetry={retryParties}
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
