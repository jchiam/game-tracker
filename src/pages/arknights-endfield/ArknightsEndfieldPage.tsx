import { useOperators } from '@/hooks/arknights-endfield/useOperators';
import { useParties } from '@/hooks/arknights-endfield/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { OperatorCard } from './components/OperatorCard';
import { AddOperatorModal } from './components/AddOperatorModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';

interface ArknightsEndfieldPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function ArknightsEndfieldPage({
  session,
  isAuthLoading,
  onSignIn,
}: ArknightsEndfieldPageProps) {
  const {
    availableOperators,
    trackedOperators,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addOperator,
    removeOperator,
    updateLevel,
    updatePhase,
    updateSkillsMaxed,
    updateWeapon,
    updateWeaponPreferences,
    toggleFavorite,
    getFilteredRoster,
  } = useOperators(session, isAuthLoading);

  const { parties, saveParty, deleteParty } = useParties(session);

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
      ],
      searchPlaceholder: 'Search by name, class, element, or weapon...',
      addTitle: 'Add Operator',
      addDisabled: isLoadError,
      filterRoster: getFilteredRoster,
    });

  return (
    <RosterPageLayout
      title="Arknights: Endfield"
      subtitle="Track your operators and build squads."
      secondViewLabel="Squads"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedOperators.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No operators tracked yet. Use the + button to begin!"
      noMatchMessage="No operators match your search."
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((operator) => (
        <OperatorCard
          key={operator.id}
          operator={operator}
          onRemove={removeOperator}
          onUpdateLevel={updateLevel}
          onUpdatePhase={updatePhase}
          onUpdateSkillsMaxed={updateSkillsMaxed}
          onUpdateWeapon={updateWeapon}
          onUpdateWeaponPreferences={updateWeaponPreferences}
          onToggleFavorite={toggleFavorite}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableOperators={availableOperators}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {isAddModalOpen && session && (
        <AddOperatorModal
          availableOperators={availableOperators}
          trackedOperators={trackedOperators}
          onAddOperator={(operator) => {
            addOperator(operator);
            closeAddModal();
          }}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
