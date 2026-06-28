import { useState, useMemo } from 'react';
import { useOperators } from '@/hooks/arknights-endfield/useOperators';
import { useParties } from '@/hooks/arknights-endfield/useParties';
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
      search={{
        value: searchTerm,
        placeholder: 'Search by name, class, element, or weapon...',
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
      add={{ title: 'Add Operator', onClick: () => setIsModalOpen(true), disabled: isLoadError }}
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
      {isModalOpen && session && (
        <AddOperatorModal
          availableOperators={availableOperators}
          trackedOperators={trackedOperators}
          onAddOperator={(operator) => {
            addOperator(operator);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </RosterPageLayout>
  );
}
