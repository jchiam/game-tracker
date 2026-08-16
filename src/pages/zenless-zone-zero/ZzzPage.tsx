import { useCallback, useState } from 'react';
import { useAgents } from '@/hooks/zenless-zone-zero/useAgents';
import { useParties } from '@/hooks/zenless-zone-zero/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { AgentCard } from './components/AgentCard';
import { AddAgentModal } from './components/AddAgentModal';
import { DiscEditorModal } from './components/DiscEditorModal';
import { WEngineEditorModal } from './components/WEngineEditorModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import { calculateZzzBuildScore } from '@/utils/zzzBuildScore';
import type { ZzzDiscSlot } from '@/data/zenless-zone-zero/discs';
import type { ZzzTrackedAgent } from '@/types';
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
    updateWEngine,
    updateWEngineLevel,
    updateWEnginePhase,
    updateWEnginePreferences,
    getFilteredRoster,
  } = useAgents(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const filterRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL' | 'SCORE', entities?: ZzzTrackedAgent[]) =>
      getFilteredRoster(searchTerm, sortBy, calculateZzzBuildScore, entities),
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
    projection,
  } = useRosterView({
    sortModes: [
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      { key: 'LEVEL', label: 'Lv', described: 'by Level' },
      { key: 'SCORE', label: '★', described: 'by Build Score' },
    ],
    searchPlaceholder: 'Search by name, specialty, or element...',
    addTitle: 'Add Agent',
    addDisabled: isLoadError,
    filterRoster,
    trackedEntities: trackedAgents,
  });

  const [editingDisc, setEditingDisc] = useState<{
    agentId: string;
    anchorSlot: ZzzDiscSlot;
  } | null>(null);

  const editingAgent = editingDisc
    ? trackedAgents.find((a) => a.id === editingDisc.agentId)
    : undefined;

  const [editingWEnginePrefsFor, setEditingWEnginePrefsFor] = useState<string | null>(null);
  const wenginePrefsAgent = editingWEnginePrefsFor
    ? trackedAgents.find((a) => a.id === editingWEnginePrefsFor)
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
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavorite(id, value);
            projection.refreshBasis(id);
          }}
          onToggleDisc={(id, slot) => setEditingDisc({ agentId: id, anchorSlot: slot })}
          onEditCommit={() => projection.refreshBasis(agent.id)}
          onUpdateWEngine={updateWEngine}
          onUpdateWEngineLevel={updateWEngineLevel}
          onUpdateWEnginePhase={updateWEnginePhase}
          onEditWEnginePrefs={setEditingWEnginePrefsFor}
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
          onClose={() => {
            // Equipment-modal close is a release point
            projection.refreshBasis(editingAgent.id);
            setEditingDisc(null);
          }}
        />
      )}

      {wenginePrefsAgent && (
        <WEngineEditorModal
          agent={wenginePrefsAgent}
          onUpdatePreferences={(prefs) => updateWEnginePreferences(wenginePrefsAgent.id, prefs)}
          onClose={() => setEditingWEnginePrefsFor(null)}
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
