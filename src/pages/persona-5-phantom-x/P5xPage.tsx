import { useCallback, useState } from 'react';
import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { useParties } from '@/hooks/persona-5-phantom-x/useParties';
import { useRosterView, type RosterFilterChip } from '@/hooks/useRosterView';
import { ThiefCard } from './components/ThiefCard';
import { AddThiefModal } from './components/AddThiefModal';
import { RevelationEditorModal } from './components/RevelationEditorModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import {
  countEquippedRevelations,
  type RevelationSlot,
} from '@/data/persona-5-phantom-x/revelations';
import type { P5xTrackedThief } from '@/types';
import type { Session } from '@supabase/supabase-js';

/**
 * Roster filter chips — progression bottlenecks, in the card summary's
 * Weapon → Mindscape → Revelations order (roster-predicate-filter).
 */
const FILTER_CHIPS: RosterFilterChip<P5xTrackedThief>[] = [
  {
    key: 'rose',
    label: '🌹 Gated',
    predicate: (t) => t.skillProgress === 1,
    onTitle: 'Show only rose-gated thieves',
    noMatch: 'No rose-gated thieves found.',
  },
  {
    key: 'weapon',
    label: '⚔ <5★',
    predicate: (t) => t.weaponRarity < 5,
    onTitle: 'Show only thieves with a sub-5★ weapon',
    noMatch: 'No thieves with a sub-5★ weapon.',
  },
  {
    key: 'mindscape',
    label: 'MS ✗',
    predicate: (t) => t.mindscapeProgress === 0,
    onTitle: 'Show only thieves without Outer Mindscape',
    noMatch: 'No thieves without Outer Mindscape.',
  },
  {
    key: 'revelations',
    label: '◈ Rev <5',
    predicate: (t) => countEquippedRevelations(t.revelations) < 5,
    onTitle: 'Show only thieves with open revelation slots',
    noMatch: 'No thieves with open revelation slots.',
  },
];

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
    updateSkillProgress,
    toggleFavorite,
    updateMindscapeProgress,
    updateWeaponRarity,
    updateWeaponLevel,
    updateWeaponForge,
    updateRevelationSlot,
    updateRevelationPreferences,
    getFilteredRoster,
  } = useThieves(session, isAuthLoading);

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

  const [editingRev, setEditingRev] = useState<{
    thiefId: string;
    anchorSlot: RevelationSlot;
  } | null>(null);

  const editingRevThief = editingRev
    ? trackedThieves.find((t) => t.id === editingRev.thiefId)
    : null;

  // Closes over nothing chip-related: the hook injects the composed predicate,
  // so this identity stays stable across chip toggles and entity edits.
  const filterRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL' | 'SCORE',
      predicate: ((t: P5xTrackedThief) => boolean) | undefined,
      entities?: P5xTrackedThief[],
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
      { key: 'SCORE', label: '★', described: 'by Revelation Score' },
    ],
    searchPlaceholder: 'Search by name, codename, persona, role, or element...',
    addTitle: 'Add Phantom Thief',
    addDisabled: isLoadError,
    nounPlural: 'thieves',
    noMatchMessage: 'No phantom thieves match your search.',
    filterChips: FILTER_CHIPS,
    filterAccent: 'var(--color-p5x-element-fire)',
    filterRoster,
    trackedEntities: trackedThieves,
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
      onRetry={retryAll}
      onSignIn={onSignIn}
      hasTracked={trackedThieves.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No phantom thieves tracked yet. Use the + button to begin!"
      noMatchMessage={noMatchMessage}
      filters={filters}
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
          onUpdateSkillProgress={updateSkillProgress}
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavorite(id, value);
            projection.refreshBasis(id);
          }}
          onUpdateMindscapeProgress={updateMindscapeProgress}
          onUpdateWeaponRarity={updateWeaponRarity}
          onUpdateWeaponLevel={updateWeaponLevel}
          onUpdateWeaponForge={updateWeaponForge}
          onOpenRevelations={(id, slot) => setEditingRev({ thiefId: id, anchorSlot: slot })}
          onEditCommit={() => projection.refreshBasis(thief.id)}
          heldReason={projection.heldReason(thief.id)}
          isExiting={projection.isExiting(thief.id)}
          /* v8 ignore next -- jsdom never delivers animationend; the exit
             fallback timer covers eviction in tests */
          onExitEnd={() => projection.completeExit(thief.id)}
        />
      ))}
      secondView={
        <PartiesTab
          isInitialLoad={isPartiesInitialLoad}
          isLoadError={isPartiesLoadError}
          onRetry={retryParties}
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
      {editingRev && editingRevThief && (
        <RevelationEditorModal
          thief={editingRevThief}
          anchorSlot={editingRev.anchorSlot}
          onUpdateSlot={(slot, data) => updateRevelationSlot(editingRevThief.id, slot, data)}
          onSavePreferences={(prefs) => updateRevelationPreferences(editingRevThief.id, prefs)}
          onClose={() => {
            // Equipment-modal close is a release point
            projection.refreshBasis(editingRevThief.id);
            setEditingRev(null);
          }}
        />
      )}
    </RosterPageLayout>
  );
}
