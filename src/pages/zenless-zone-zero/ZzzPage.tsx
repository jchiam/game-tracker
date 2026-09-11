import { useCallback, useState, type CSSProperties } from 'react';
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
    updateSkillProgress,
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

  const [passGateFilter, setPassGateFilter] = useState(false);

  const filterRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL' | 'SCORE', entities?: ZzzTrackedAgent[]) => {
      // Undefined when the chip is off preserves the no-predicate fast path.
      const predicate = passGateFilter ? (a: ZzzTrackedAgent) => a.skillProgress === 1 : undefined;
      return getFilteredRoster(searchTerm, sortBy, calculateZzzBuildScore, predicate, entities);
    },
    [getFilteredRoster, passGateFilter],
  );

  // Ghost-tag copy for a held card — names the gate its live data fails.
  const describeHeld = useCallback(
    (a: ZzzTrackedAgent) => (a.skillProgress !== 1 ? 'no longer matches 🐹 Gated' : null),
    [],
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
    // Held detection only pays its extra projection pass while the gate is on
    describeHeld: passGateFilter ? describeHeld : undefined,
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
      onRetry={retryAll}
      onSignIn={onSignIn}
      hasTracked={trackedAgents.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No agents tracked yet. Use the + button to begin!"
      noMatchMessage={
        passGateFilter ? 'No Pass-gated agents found.' : 'No agents match your search.'
      }
      filterRow={
        <div
          className="filter-row"
          style={{ '--filter-chip-accent': 'var(--color-zzz-rarity-s)' } as CSSProperties}
        >
          <button
            className={`filter-chip ${passGateFilter ? 'active' : ''}`}
            onClick={() => setPassGateFilter((v) => !v)}
            title={passGateFilter ? 'Show all agents' : 'Show only Pass-gated agents'}
          >
            🐹 Gated
          </button>
        </div>
      }
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
          onUpdateSkillProgress={updateSkillProgress}
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
          heldReason={projection.heldReason(agent.id)}
          isExiting={projection.isExiting(agent.id)}
          /* v8 ignore next -- jsdom never delivers animationend; the exit
             fallback timer covers eviction in tests */
          onExitEnd={() => projection.completeExit(agent.id)}
        />
      ))}
      partiesTab={
        <PartiesTab
          isInitialLoad={isPartiesInitialLoad}
          isLoadError={isPartiesLoadError}
          onRetry={retryParties}
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
