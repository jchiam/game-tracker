import { useCharacters } from '@/hooks/neverness-to-everness/useCharacters';
import { useParties } from '@/hooks/neverness-to-everness/useParties';
import { useRosterView } from '@/hooks/useRosterView';
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
    toggleModulesConfigured,
    toggleAwakeningSlot,
    updateArc,
    updateCartridge,
    saveCartridgePreferences,
    toggleFavoriteCharacter,
    getFilteredRoster,
  } = useCharacters(session, isAuthLoading);

  const { parties, saveParty, deleteParty, toggleFavoriteParty } = useParties(session);

  const { view, setView, filteredRoster, isAddModalOpen, closeAddModal, search, sort, add } =
    useRosterView({
      sortModes: [
        { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
        { key: 'LEVEL', label: 'Lv', described: 'by Level' },
        { key: 'SCORE', label: '★', described: 'by Cartridge Score' },
      ],
      searchPlaceholder: 'Search by name, esper type, or role...',
      addTitle: 'Add Character',
      addDisabled: isLoadError,
      filterRoster: getFilteredRoster,
    });

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
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((character) => (
        <CharacterCard
          key={character.id!}
          character={character}
          onRemove={removeCharacter}
          onUpdateLevel={updateCharacterLevel}
          onToggleModules={toggleModulesConfigured}
          onToggleAwakening={toggleAwakeningSlot}
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
      {isAddModalOpen && session && (
        <AddCharacterModal
          availableCharacters={availableCharacters}
          trackedCharacters={trackedCharacters}
          onAddCharacter={(character) => {
            addCharacter(character);
            closeAddModal();
          }}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}
