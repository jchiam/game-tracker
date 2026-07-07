import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { useParties } from '@/hooks/persona-5-phantom-x/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { ThiefCard } from './components/ThiefCard';
import { AddThiefModal } from './components/AddThiefModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import './P5xPage.css';

interface P5xPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function P5xPage({ session, isAuthLoading, onSignIn }: P5xPageProps) {
  const {
    availableThieves,
    trackedThieves,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addThief,
    removeThief,
    updateLevel,
    updateAwareness,
    toggleFavorite,
    getFilteredRoster,
  } = useThieves(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
      ],
      searchPlaceholder: 'Search by name, codename, persona, role, or element...',
      addTitle: 'Add Phantom Thief',
      addDisabled: isLoadError,
      filterRoster: getFilteredRoster,
    });

  return (
    <RosterPageLayout
      title="Persona 5: The Phantom X"
      subtitle="Track your phantom thieves and build parties."
      secondViewLabel="Parties"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedThieves.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No phantom thieves tracked yet. Use the + button to begin!"
      noMatchMessage="No phantom thieves match your search."
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((thief) => (
        <ThiefCard
          key={thief.id}
          thief={thief}
          onRemove={removeThief}
          onUpdateLevel={updateLevel}
          onUpdateAwareness={updateAwareness}
          onToggleFavorite={toggleFavorite}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableThieves={availableThieves}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          onToggleFavorite={toggleFavoriteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {isAddModalOpen && session && (
        <AddThiefModal
          availableThieves={availableThieves}
          trackedThieves={trackedThieves}
          onAddThief={(thief) => {
            addThief(thief);
            closeAddModal();
          }}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
