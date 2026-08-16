import { useState, useCallback, useMemo } from 'react';
import { useCharacters, emptyRelic } from '@/hooks/honkai-star-rail/useCharacters';
import { useParties } from '@/hooks/honkai-star-rail/useParties';
import { useRosterView } from '@/hooks/useRosterView';
import { calculateBuildScore } from '@/utils/buildScore';
import { CharacterCard } from './components/CharacterCard';
import { RelicEditorModal } from './components/RelicEditorModal';
import { LightConeEditorModal } from './components/LightConeEditorModal';
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
    updateUseAltPortrait,
    updateLightCone,
    updateLightConeLevel,
    updateLightConeSuperimposition,
    updateLightConePreferences,
    saveRelicData,
    removeRelicData,
    saveBuildPreferences,
    getFilteredRoster,
  } = useCharacters(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  // Party avatars follow the tracked display-portrait choice (Trailblazer forms);
  // untracked forms keep the default (Stelle) portrait.
  const partyCharacters = useMemo(
    () =>
      availableCharacters.map((c) => {
        if (!c.altImageUrl) return c;
        const tracked = trackedCharacters.find((t) => t.id === c.id);
        return tracked?.useAltPortrait ? { ...c, imageUrl: c.altImageUrl } : c;
      }),
    [availableCharacters, trackedCharacters],
  );

  const filterRoster = useCallback(
    (searchTerm: string, sortBy: 'SCORE' | 'ALPHA', entities?: HsrTrackedCharacter[]) =>
      getFilteredRoster(searchTerm, sortBy, calculateBuildScore, entities),
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
      { key: 'SCORE', label: '★', described: 'by Build Score' },
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
    ],
    searchPlaceholder: 'Search by name, element, or path...',
    addTitle: 'Add Character',
    addDisabled: isLoadError,
    filterRoster,
    trackedEntities: trackedCharacters,
  });

  const [editingRelic, setEditingRelic] = useState<{
    charId: string;
    anchorSlot: keyof HsrTrackedCharacter['relics'];
  } | null>(null);
  const [editingConePrefsCharId, setEditingConePrefsCharId] = useState<string | null>(null);

  const handleAddCharacter = async (char: Parameters<typeof addCharacter>[0]) => {
    await addCharacter(char);
    closeAddModal();
  };

  const editingChar = editingRelic
    ? trackedCharacters.find((c) => c.id === editingRelic.charId)
    : undefined;

  const editingConePrefsChar = editingConePrefsCharId
    ? trackedCharacters.find((c) => c.id === editingConePrefsCharId)
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
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavoriteCharacter(id, value);
            projection.refreshBasis(id);
          }}
          onToggleRelic={(id, slot) => setEditingRelic({ charId: id, anchorSlot: slot })}
          onUpdateLightCone={updateLightCone}
          onUpdateLightConeLevel={updateLightConeLevel}
          onUpdateLightConeSuperimposition={updateLightConeSuperimposition}
          onEditLightConePrefs={setEditingConePrefsCharId}
          onUpdateUseAltPortrait={updateUseAltPortrait}
          onEditCommit={() => projection.refreshBasis(char.id)}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableCharacters={partyCharacters}
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
          onClose={() => {
            // Equipment-modal close is a release point
            projection.refreshBasis(editingChar.id);
            setEditingRelic(null);
          }}
        />
      )}

      {editingConePrefsChar && (
        <LightConeEditorModal
          char={editingConePrefsChar}
          onUpdatePreferences={(prefs) =>
            updateLightConePreferences(editingConePrefsChar.id, prefs)
          }
          onClose={() => {
            projection.refreshBasis(editingConePrefsChar.id);
            setEditingConePrefsCharId(null);
          }}
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
