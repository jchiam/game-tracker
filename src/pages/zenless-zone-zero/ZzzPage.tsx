import { useAgents } from '@/hooks/zenless-zone-zero/useAgents';
import { useParties } from '@/hooks/zenless-zone-zero/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { AgentCard } from './components/AgentCard';
import { AddAgentModal } from './components/AddAgentModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import './ZzzPage.css';

interface ZzzPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function ZzzPage({ session, isAuthLoading, onSignIn }: ZzzPageProps) {
  const {
    availableAgents,
    trackedAgents,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addAgent,
    removeAgent,
    updateLevel,
    updateMindscape,
    updateCoreSkill,
    toggleFavorite,
    getFilteredRoster,
  } = useAgents(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
      ],
      searchPlaceholder: 'Search by name, specialty, or element...',
      addTitle: 'Add Agent',
      addDisabled: isLoadError,
      filterRoster: getFilteredRoster,
    });

  return (
    <RosterPageLayout
      title="Zenless Zone Zero"
      subtitle="Track your agents and build parties."
      secondViewLabel="Parties"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedAgents.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No agents tracked yet. Use the + button to begin!"
      noMatchMessage="No agents match your search."
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onRemove={removeAgent}
          onUpdateLevel={updateLevel}
          onUpdateMindscape={updateMindscape}
          onUpdateCoreSkill={updateCoreSkill}
          onToggleFavorite={toggleFavorite}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableAgents={availableAgents}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          onToggleFavorite={toggleFavoriteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {isAddModalOpen && session && (
        <AddAgentModal
          availableAgents={availableAgents}
          trackedAgents={trackedAgents}
          onAddAgent={(agent) => {
            addAgent(agent);
            closeAddModal();
          }}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
