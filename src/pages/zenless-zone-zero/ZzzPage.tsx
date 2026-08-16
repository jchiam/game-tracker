import { useCallback, useState } from 'react';
import { useAgents } from '@/hooks/zenless-zone-zero/useAgents';
import { useParties } from '@/hooks/zenless-zone-zero/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { AgentCard } from './components/AgentCard';
import { AddAgentModal } from './components/AddAgentModal';
import { DiscEditorModal } from './components/DiscEditorModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import { calculateDiscScore } from '@/utils/discScoring';
import type { ZzzDiscSlot } from '@/data/zenless-zone-zero/discs';
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
    saveDiscData,
    removeDiscData,
    saveDiscPreferences,
    getFilteredRoster,
  } = useAgents(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const filterRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL' | 'SCORE') =>
      getFilteredRoster(searchTerm, sortBy, calculateDiscScore),
    [getFilteredRoster],
  );

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
        { key: 'SCORE', label: '★', described: 'by Disc Score' },
      ],
      searchPlaceholder: 'Search by name, specialty, or element...',
      addTitle: 'Add Agent',
      addDisabled: isLoadError,
      filterRoster,
    });

  const [editingDisc, setEditingDisc] = useState<{
    agentId: string;
    anchorSlot: ZzzDiscSlot;
  } | null>(null);

  const editingAgent = editingDisc
    ? trackedAgents.find((a) => a.id === editingDisc.agentId)
    : undefined;

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
          onToggleDisc={(id, slot) => setEditingDisc({ agentId: id, anchorSlot: slot })}
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
      {editingDisc && editingAgent && (
        <DiscEditorModal
          agent={editingAgent}
          anchorSlot={editingDisc.anchorSlot}
          onSaveDisc={(slot, discData) =>
            saveDiscData({ agentId: editingAgent.id, slot }, discData)
          }
          onRemoveDisc={(slot) => removeDiscData({ agentId: editingAgent.id, slot })}
          onUpdateBuildPreferences={(newPrefs) => saveDiscPreferences(editingAgent.id, newPrefs)}
          onClose={() => setEditingDisc(null)}
        />
      )}

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
