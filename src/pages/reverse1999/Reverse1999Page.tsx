import { useCallback } from 'react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { useParties } from '@/hooks/reverse1999/useParties';
import { useRosterView, type RosterFilterEntry } from '@/hooks/useRosterView';
import { ArcanistCard } from './components/ArcanistCard';
import { AddArcanistModal } from './components/AddArcanistModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import type { R1999TrackedArcanist } from '@/types';

/**
 * Roster filter facets (roster-predicate-filter) — every grindable bottleneck,
 * in the card's Resonance → Euphoria → Psychube section order. Portrait is
 * dupe-bound and Level has the Lv sort, so neither gets a chip. Resonance and
 * Euphoria are counters with disjoint "not started" / "in progress" states, so
 * each is a `one` facet. `None equipped` is exclusive with the other Psychube
 * chips (a level or amplification needs an equipped psychube); those two
 * intersect freely.
 */
const FILTER_FACETS: RosterFilterEntry<R1999TrackedArcanist>[] = [
  {
    key: 'resonance',
    label: 'Resonance',
    mode: 'one',
    chips: [
      {
        key: 'resonanceNotStarted',
        label: 'Not started',
        predicate: (a) => a.resonanceLevel === 0,
        onTitle: 'Show only arcanists who have not started resonance',
        noMatch: 'No arcanists without resonance started.',
      },
      {
        key: 'resonanceInProgress',
        label: 'In progress',
        predicate: (a) => a.resonanceLevel > 0 && a.resonanceLevel < 15,
        onTitle: 'Show only arcanists with resonance in progress',
        noMatch: 'No arcanists with resonance in progress.',
      },
    ],
  },
  {
    key: 'euphoria',
    label: 'Euphoria',
    mode: 'one',
    chips: [
      {
        key: 'euphoriaNotStarted',
        label: 'Not started',
        predicate: (a) => a.hasEuphoria && a.euphoriaStage === 0,
        onTitle: 'Show only Euphoria arcanists who have not started Euphoria',
        noMatch: 'No Euphoria arcanists without Euphoria started.',
      },
      {
        key: 'euphoriaInProgress',
        label: 'In progress',
        predicate: (a) => a.hasEuphoria && a.euphoriaStage > 0 && a.euphoriaStage < 4,
        onTitle: 'Show only Euphoria arcanists with Euphoria in progress',
        noMatch: 'No Euphoria arcanists with Euphoria in progress.',
      },
    ],
  },
  {
    key: 'psychube',
    label: 'Psychube',
    mode: 'any',
    chips: [
      {
        key: 'psychubeNone',
        label: 'None equipped',
        exclusive: true,
        predicate: (a) => a.psychubeName === null,
        onTitle: 'Show only arcanists with no psychube equipped',
        noMatch: 'No arcanists without a psychube.',
      },
      {
        key: 'psychubeLevel',
        label: 'Under Lv 60',
        predicate: (a) => a.psychubeName !== null && a.psychubeLevel < 60,
        onTitle: 'Show only arcanists with an equipped psychube below Lv 60',
        noMatch: 'No arcanists with a psychube below Lv 60.',
      },
      {
        key: 'psychubeAmp',
        label: 'Under A5',
        predicate: (a) => a.psychubeName !== null && a.psychubeAmplification < 5,
        onTitle: 'Show only arcanists with an equipped psychube below A5',
        noMatch: 'No arcanists with un-maxed psychube amplification.',
      },
    ],
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
    filterChips: FILTER_FACETS,
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
