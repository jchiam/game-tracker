import { useState, useMemo } from 'react';
import { useCharacters } from '@/hooks/neverness-to-everness/useCharacters';
import { useParties } from '@/hooks/neverness-to-everness/useParties';
import { CharacterCard } from './components/CharacterCard';
import { AddCharacterModal } from './components/AddCharacterModal';
import { PartiesTab } from './components/PartiesTab';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';

interface N2ePageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function N2ePage({ session, isAuthLoading, onSignIn }: N2ePageProps) {
  const {
    availableCharacters,
    trackedCharacters,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCharacter,
    removeCharacter,
    updateCharacterLevel,
    toggleAwakeningSlot,
    updateResonanceCount,
    updateArc,
    updateCartridge,
    saveCartridgePreferences,
    toggleFavoriteCharacter,
    getFilteredRoster,
  } = useCharacters(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const [view, setView] = useState<'roster' | 'second'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ALPHA' | 'LEVEL'>('ALPHA');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRoster = useMemo(
    () => getFilteredRoster(searchTerm, sortBy),
    [getFilteredRoster, searchTerm, sortBy],
  );

  return (
    <RosterPageLayout
      title="Neverness to Everness"
      subtitle="Track your espers and build progress."
      secondViewLabel="Lineups"
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
      emptyMessage="No espers tracked yet. Use the + button to begin!"
      noMatchMessage="No espers match your search."
      search={{
        value: searchTerm,
        placeholder: 'Search by name, esper type, or role...',
        onChange: setSearchTerm,
      }}
      sort={{
        active: sortBy === 'ALPHA',
        label: sortBy === 'ALPHA' ? 'AZ' : 'Lv',
        title:
          sortBy === 'ALPHA'
            ? 'Sorted alphabetically — click to sort by Level'
            : 'Sorted by Level — click to sort alphabetically',
        onToggle: () => setSortBy((prev) => (prev === 'ALPHA' ? 'LEVEL' : 'ALPHA')),
      }}
      add={{ title: 'Add Character', onClick: () => setIsModalOpen(true), disabled: isLoadError }}
      cards={filteredRoster.map((character) => (
        <CharacterCard
          key={character.id!}
          character={character}
          onRemove={removeCharacter}
          onUpdateLevel={updateCharacterLevel}
          onToggleAwakening={toggleAwakeningSlot}
          onUpdateResonance={updateResonanceCount}
          onUpdateArc={updateArc}
          onUpdateCartridge={updateCartridge}
          onToggleFavorite={toggleFavoriteCharacter}
          onSaveCartridgePreferences={saveCartridgePreferences}
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
      {isModalOpen && session && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={(character) => {
            addCharacter(character);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </RosterPageLayout>
  );
}
