import { useCallback } from 'react';
import { useCombatants } from '@/hooks/chaos-zero-nightmare/useCombatants';
import { useParties } from '@/hooks/chaos-zero-nightmare/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { CombatantCard } from './components/CombatantCard';
import { AddCombatantModal } from './components/AddCombatantModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { CznTrackedCombatant } from '@/types';
import type { Session } from '@supabase/supabase-js';
import './CznPage.css';

interface CznPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function CznPage({ session, isAuthLoading, onSignIn }: CznPageProps) {
  const {
    availableCombatants,
    trackedCombatants,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCombatant,
    removeCombatant,
    updateLevel,
    updateEgo,
    togglePotential,
    toggleFavorite,
    getFilteredRoster,
  } = useCombatants(session, isAuthLoading);

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

  // Referentially stable across entity edits — the projection hook relies on it.
  const filterRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL',
      predicate: ((c: CznTrackedCombatant) => boolean) | undefined,
      entities?: CznTrackedCombatant[],
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
    searchPlaceholder: 'Search by name, class, or attribute...',
    addTitle: 'Add Combatant',
    addDisabled: isLoadError,
    nounPlural: 'combatants',
    filterAccent: 'var(--color-czn-rarity5)',
    filterRoster,
    trackedEntities: trackedCombatants,
  });

  return (
    <RosterPageLayout
      title="Chaos Zero Nightmare"
      subtitle="Track your combatants and build parties."
      secondViewLabel="Parties"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryAll}
      onSignIn={onSignIn}
      hasTracked={trackedCombatants.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No combatants tracked yet. Use the + button to begin!"
      noMatchMessage={noMatchMessage}
      filters={filters}
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((combatant) => (
        <CombatantCard
          key={combatant.id}
          combatant={combatant}
          onRemove={removeCombatant}
          onUpdateLevel={updateLevel}
          onUpdateEgo={updateEgo}
          onTogglePotential={togglePotential}
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavorite(id, value);
            projection.refreshBasis(id);
          }}
          onEditCommit={() => projection.refreshBasis(combatant.id)}
          heldReason={projection.heldReason(combatant.id)}
          isExiting={projection.isExiting(combatant.id)}
          /* v8 ignore next -- jsdom never delivers animationend; the exit
             fallback timer covers eviction in tests */
          onExitEnd={() => projection.completeExit(combatant.id)}
        />
      ))}
      secondView={
        <PartiesTab
          isInitialLoad={isPartiesInitialLoad}
          isLoadError={isPartiesLoadError}
          onRetry={retryParties}
          parties={parties}
          availableCombatants={availableCombatants}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          onToggleFavorite={toggleFavoriteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {isAddModalOpen && session && (
        <AddCombatantModal
          availableCombatants={availableCombatants}
          trackedCombatants={trackedCombatants}
          onAddCombatant={(combatant) => {
            addCombatant(combatant);
            closeAddModal();
          }}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
