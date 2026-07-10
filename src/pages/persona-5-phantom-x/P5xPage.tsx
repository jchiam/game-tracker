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
    toggleMindscapeMaxed,
    updateWeaponRarity,
    updateWeaponLevel,
    updateWeaponForge,
    updateRevelationSlot,
    updateRevelationPreferences,
    getFilteredRoster,
  } = useThieves(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const [roseGateFilter, setRoseGateFilter] = useState(false);
  const [editingRev, setEditingRev] = useState<{
    thiefId: string;
    anchorSlot: RevelationSlot;
  } | null>(null);

  const editingRevThief = editingRev
    ? trackedThieves.find((t) => t.id === editingRev.thiefId)
    : null;

  const filteredGetRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL' | 'SCORE') =>
      getFilteredRoster(
        searchTerm,
        sortBy,
        roseGateFilter ? (t) => t.skillsLeveled && !t.roseMaxed : undefined,
      ),
    [getFilteredRoster, roseGateFilter],
  );

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
        { key: 'SCORE', label: '★', described: 'by Revelation Score' },
      ],
      searchPlaceholder: 'Search by name, codename, persona, role, or element...',
      addTitle: 'Add Phantom Thief',
      addDisabled: isLoadError,
      filterRoster: filteredGetRoster,
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
        roseGateFilter ? 'No rose-gated thieves found.' : 'No phantom thieves match your search.'
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
          onToggleFavorite={toggleFavorite}
          onToggleMindscapeMaxed={toggleMindscapeMaxed}
          onUpdateWeaponRarity={updateWeaponRarity}
          onUpdateWeaponLevel={updateWeaponLevel}
          onUpdateWeaponForge={updateWeaponForge}
          onOpenRevelations={(id, slot) => setEditingRev({ thiefId: id, anchorSlot: slot })}
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
          onClose={() => setEditingRev(null)}
        />
      )}
    </RosterPageLayout>
  );
}
