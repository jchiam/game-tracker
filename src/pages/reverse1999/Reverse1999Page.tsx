import { useCallback, useState, type CSSProperties } from 'react';
import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { useParties } from '@/hooks/reverse1999/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { ArcanistCard } from './components/ArcanistCard';
import { AddArcanistModal } from './components/AddArcanistModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import type { R1999TrackedArcanist } from '@/types';

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

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const [resonanceGateFilter, setResonanceGateFilter] = useState(false);
  const [gluttonyGateFilter, setGluttonyGateFilter] = useState(false);

  const filteredGetRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL', entities?: R1999TrackedArcanist[]) => {
      const gates: Array<(a: R1999TrackedArcanist) => boolean> = [];
      if (resonanceGateFilter) gates.push((a) => a.resonanceLevel > 0 && a.resonanceLevel < 15);
      if (gluttonyGateFilter)
        gates.push((a) => a.psychubeName !== null && a.psychubeAmplification < 5);
      const predicate = gates.length
        ? (a: R1999TrackedArcanist) => gates.every((g) => g(a))
        : undefined;
      return getFilteredRoster(searchTerm, sortBy, predicate, entities);
    },
    [getFilteredRoster, resonanceGateFilter, gluttonyGateFilter],
  );

  // Ghost-tag copy for a held card — names the first gate its live data fails.
  const describeHeld = useCallback(
    (a: R1999TrackedArcanist) => {
      if (resonanceGateFilter && !(a.resonanceLevel > 0 && a.resonanceLevel < 15))
        return 'no longer matches 💠 Resonating';
      if (gluttonyGateFilter && !(a.psychubeName !== null && a.psychubeAmplification < 5))
        return 'no longer matches 🍽️ Amplifying';
      return null;
    },
    [resonanceGateFilter, gluttonyGateFilter],
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
    ],
    searchPlaceholder: 'Search by name, afflatus, or damage type...',
    addTitle: 'Add Arcanist',
    addDisabled: isLoadError,
    filterRoster: filteredGetRoster,
    trackedEntities: trackedArcanists,
    // Held detection only pays its extra projection pass while a gate is on
    describeHeld: resonanceGateFilter || gluttonyGateFilter ? describeHeld : undefined,
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
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedArcanists.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No arcanists tracked yet. Use the + button to begin!"
      noMatchMessage={
        resonanceGateFilter && gluttonyGateFilter
          ? 'No arcanists match the active filters.'
          : resonanceGateFilter
            ? 'No arcanists with resonance in progress.'
            : gluttonyGateFilter
              ? 'No arcanists with un-maxed psychube amplification.'
              : 'No arcanists match your search.'
      }
      filterRow={
        <div
          className="filter-row"
          style={{ '--filter-chip-accent': 'var(--color-r1999-accent)' } as CSSProperties}
        >
          <button
            className={`filter-chip ${resonanceGateFilter ? 'active' : ''}`}
            onClick={() => setResonanceGateFilter((v) => !v)}
            title={
              resonanceGateFilter
                ? 'Show all arcanists'
                : 'Show only arcanists with resonance in progress'
            }
          >
            💠 Resonating
          </button>
          <button
            className={`filter-chip ${gluttonyGateFilter ? 'active' : ''}`}
            onClick={() => setGluttonyGateFilter((v) => !v)}
            title={
              gluttonyGateFilter
                ? 'Show all arcanists'
                : 'Show only arcanists with an equipped psychube below max amplification'
            }
          >
            🍽️ Amplifying
          </button>
        </div>
      }
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
          onExitEnd={() => projection.completeExit(arcanist.id!)}
        />
      ))}
      partiesTab={
        <PartiesTab
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
