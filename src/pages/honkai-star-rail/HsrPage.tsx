import { useState, useMemo } from 'react';
import { useCharacters, emptyRelic } from '@/hooks/honkai-star-rail/useCharacters';
import { useParties } from '@/hooks/honkai-star-rail/useParties';
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

  const { parties, saveParty, deleteParty } = useParties(session);

  const [view, setView] = useState<'roster' | 'second'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE' | 'ALPHA'>('SCORE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelic, setEditingRelic] = useState<{
    charId: string;
    slot: keyof HsrTrackedCharacter['relics'];
  } | null>(null);

  const filteredRoster = useMemo(
    () => getFilteredRoster(searchTerm, sortBy, calculateRelicScore),
    [getFilteredRoster, searchTerm, sortBy],
  );

  const handleAddCharacter = async (char: Parameters<typeof addCharacter>[0]) => {
    await addCharacter(char);
    setIsModalOpen(false);
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
      search={{
        value: searchTerm,
        placeholder: 'Search by name, element, or path...',
        onChange: setSearchTerm,
      }}
      sort={{
        active: sortBy === 'SCORE',
        label: sortBy === 'SCORE' ? '★' : 'AZ',
        title:
          sortBy === 'SCORE'
            ? 'Sorted by Relic Score — click to sort alphabetically'
            : 'Sorted alphabetically — click to sort by Relic Score',
        onToggle: () => setSortBy((prev) => (prev === 'SCORE' ? 'ALPHA' : 'SCORE')),
      }}
      add={{ title: 'Add Character', onClick: () => setIsModalOpen(true), disabled: isLoadError }}
      cards={filteredRoster.map((char) => (
        <CharacterCard
          key={char.id}
          char={char}
          availableRelicSets={availableRelicSets}
          onRemove={removeCharacter}
          onUpdateLevel={updateCharacterLevel}
          onToggleTraces={toggleCharacterTraces}
          onToggleFavorite={toggleFavoriteCharacter}
          onToggleRelic={(id, slot) => setEditingRelic({ charId: id, slot })}
        />
      ))}
      partiesTab={
        <PartiesTab
          parties={parties}
          availableCharacters={availableCharacters}
          onSaveParty={saveParty}
          onDeleteParty={deleteParty}
          session={session}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {editingRelic && editingChar && (
        <RelicEditorModal
          char={editingChar}
          slot={editingRelic.slot}
          availableRelicSets={availableRelicSets}
          emptyRelic={emptyRelic}
          onSave={(relicData) => saveRelicData(editingRelic, relicData)}
          onRemove={async () => {
            await removeRelicData(editingRelic);
            setEditingRelic(null);
          }}
          onUpdateBuildPreferences={(newPrefs) => saveBuildPreferences(editingChar.id, newPrefs)}
          onClose={() => setEditingRelic(null)}
        />
      )}

      {isModalOpen && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={handleAddCharacter}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </RosterPageLayout>
  );
}
