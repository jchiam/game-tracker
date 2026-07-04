import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ETrackedCharacter } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';

interface AddCharacterModalProps {
  availableCharacters: N2ECharacter[];
  trackedCharacters: N2ETrackedCharacter[];
  onAddCharacter: (character: N2ECharacter) => void;
  onClose: () => void;
}

export function AddCharacterModal({
  availableCharacters,
  trackedCharacters,
  onAddCharacter,
  onClose,
}: AddCharacterModalProps) {
  return (
    <AddEntityModal
      title="Add Esper"
      entityNoun="espers"
      available={availableCharacters}
      tracked={trackedCharacters}
      searchKeys={['name', 'esperType', 'arcType', 'roles']}
      getBadges={(character) => [
        {
          label: character.esperType,
          variant: 'esper',
          modifier: character.esperType.toLowerCase(),
        },
        { label: character.arcType, variant: 'arc', modifier: character.arcType.toLowerCase() },
      ]}
      onAdd={onAddCharacter}
      onClose={onClose}
    />
  );
}
