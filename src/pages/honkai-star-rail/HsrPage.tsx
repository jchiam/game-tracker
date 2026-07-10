import { useState, useCallback } from 'react';
import { useCharacters, emptyRelic } from '@/hooks/honkai-star-rail/useCharacters';
import { useParties } from '@/hooks/honkai-star-rail/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { calculateRelicScore } from '@/utils/relicScoring';
import { CharacterCard } from './components/CharacterCard';
import { RelicEditorModal } from './components/RelicEditorModal';
import { AddCharacterModal } from './components/AddCharacterModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { HsrTrackedCharacter } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface HsrPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function HsrPage({ session, isAuthLoading, onSignIn }: HsrPageProps) {
  const {
    availableCharacters,
    availableRelicSets,
    trackedCharacters,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCharacter,
    removeCharacter,
    updateCharacterLevel,
    toggleCharacterTraces,
    toggleFavoriteCharacter,
    saveRelicData,
    removeRelicData,
    saveBuildPreferences,
    getFilteredRoster,
  } = useCharacters(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const filterRoster = useCallback(
    (searchTerm: string, sortBy: 'SCORE' | 'ALPHA') =>
      getFilteredRoster(searchTerm, sortBy, calculateRelicScore),
    [getFilteredRoster],
  );

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'SCORE', label: '★', described: 'by Relic Score' },
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      ],
      searchPlaceholder: 'Search by name, element, or path...',
      addTitle: 'Add Character',
      addDisabled: isLoadError,
      filterRoster,
    });

  const [editingRelic, setEditingRelic] = useState<{
    charId: string;
    anchorSlot: keyof HsrTrackedCharacter['relics'];
  } | null>(null);

  const handleAddCharacter = async (char: Parameters<typeof addCharacter>[0]) => {
    await addCharacter(char);
    closeAddModal();
  };

  const editingChar = editingRelic
    ? trackedCharacters.find((c) => c.id === editingRelic.charId)
    : undefined;

  return (
    <RosterPageLayout
      title="Honkai Star Rail Tracker"
      subtitle="Manage your character roster and party configurations."
      secondViewLabel="Parties"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedCharacters.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage='No characters tracked yet. Click "Add Character" to begin!'
      noMatchMessage="No characters match your search."
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((char) => (
        <CharacterCard
          key={char.id}
          char={char}
          availableRelicSets={availableRelicSets}
          onRemove={removeCharacter}
          onUpdateLevel={updateCharacterLevel}
          onToggleTraces={toggleCharacterTraces}
          onToggleFavorite={toggleFavoriteCharacter}
          onToggleRelic={(id, slot) => setEditingRelic({ charId: id, anchorSlot: slot })}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableCharacters={availableCharacters}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          onToggleFavorite={toggleFavoriteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {editingRelic && editingChar && (
        <RelicEditorModal
          char={editingChar}
          anchorSlot={editingRelic.anchorSlot}
          availableRelicSets={availableRelicSets}
          emptyRelic={emptyRelic}
          onSaveRelic={(slot, relicData) =>
            saveRelicData({ charId: editingChar.id, slot }, relicData)
          }
          onRemoveRelic={(slot) => removeRelicData({ charId: editingChar.id, slot })}
          onUpdateBuildPreferences={(newPrefs) => saveBuildPreferences(editingChar.id, newPrefs)}
          onClose={() => setEditingRelic(null)}
        />
      )}

      {isAddModalOpen && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={handleAddCharacter}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
