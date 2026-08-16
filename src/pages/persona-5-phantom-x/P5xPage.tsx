import { useCallback, useState, type CSSProperties } from 'react';
import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { useParties } from '@/hooks/persona-5-phantom-x/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { ThiefCard } from './components/ThiefCard';
import { AddThiefModal } from './components/AddThiefModal';
import { RevelationEditorModal } from './components/RevelationEditorModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { RevelationSlot } from '@/data/persona-5-phantom-x/revelations';
import type { P5xTrackedThief } from '@/types';
import type { Session } from '@supabase/supabase-js';

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

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const [roseGateFilter, setRoseGateFilter] = useState(false);
  const [weaponFilter, setWeaponFilter] = useState(false);
  const [editingRev, setEditingRev] = useState<{
    thiefId: string;
    anchorSlot: RevelationSlot;
  } | null>(null);

  const editingRevThief = editingRev
    ? trackedThieves.find((t) => t.id === editingRev.thiefId)
    : null;

  const filteredGetRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL' | 'SCORE', entities?: P5xTrackedThief[]) => {
      // Compose the active chip predicates as a logical AND; undefined when none
      // active preserves the no-predicate fast path.
      const predicate =
        roseGateFilter || weaponFilter
          ? (t: P5xTrackedThief) =>
              (!roseGateFilter || t.skillProgress === 1) && (!weaponFilter || t.weaponRarity < 5)
          : undefined;
      return getFilteredRoster(searchTerm, sortBy, predicate, entities);
    },
    [getFilteredRoster, roseGateFilter, weaponFilter],
  );

  // Ghost-tag copy for a held card — names the first gate its live data fails.
  const describeHeld = useCallback(
    (t: P5xTrackedThief) => {
      if (roseGateFilter && t.skillProgress !== 1) return 'no longer matches 🌹 Gated';
      if (weaponFilter && t.weaponRarity >= 5) return 'no longer matches ⚔ <5★';
      return null;
    },
    [roseGateFilter, weaponFilter],
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
      { key: 'SCORE', label: '★', described: 'by Revelation Score' },
    ],
    searchPlaceholder: 'Search by name, codename, persona, role, or element...',
    addTitle: 'Add Phantom Thief',
    addDisabled: isLoadError,
    filterRoster: filteredGetRoster,
    trackedEntities: trackedThieves,
    // Held detection only pays its extra projection pass while a gate is on
    describeHeld: roseGateFilter || weaponFilter ? describeHeld : undefined,
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
      noMatchMessage={
        roseGateFilter && weaponFilter
          ? 'No rose-gated thieves with a sub-5★ weapon.'
          : roseGateFilter
            ? 'No rose-gated thieves found.'
            : weaponFilter
              ? 'No thieves with a sub-5★ weapon.'
              : 'No phantom thieves match your search.'
      }
      filterRow={
        <div
          className="filter-row"
          style={{ '--filter-chip-accent': 'var(--color-p5x-element-fire)' } as CSSProperties}
        >
          <button
            className={`filter-chip ${roseGateFilter ? 'active' : ''}`}
            onClick={() => setRoseGateFilter((v) => !v)}
            title={roseGateFilter ? 'Show all thieves' : 'Show only rose-gated thieves'}
          >
            🌹 Gated
          </button>
          <button
            className={`filter-chip ${weaponFilter ? 'active' : ''}`}
            onClick={() => setWeaponFilter((v) => !v)}
            title={weaponFilter ? 'Show all thieves' : 'Show only thieves with a sub-5★ weapon'}
          >
            ⚔ &lt;5★
          </button>
        </div>
      }
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
          onExitEnd={() => projection.completeExit(thief.id)}
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
