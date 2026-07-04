import type { Character } from '@/data/honkai-star-rail/characters';
import type { HsrTrackedCharacter } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';

interface AddCharacterModalProps {
  availableCharacters: Character[];
  trackedCharacters: HsrTrackedCharacter[];
  onAddCharacter: (char: Character) => void;
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
      title="Add Character"
      entityNoun="characters"
      available={availableCharacters}
      tracked={trackedCharacters}
      searchKeys={['name', 'element', 'path']}
      getBadges={(char) => [
        { label: char.element, variant: 'element', modifier: char.element.toLowerCase() },
        ...(char.path
          ? [
              {
                label: char.path,
                variant: 'path',
                modifier: char.path.toLowerCase().replace(/\s+/g, '-'),
              },
            ]
          : []),
      ]}
      onAdd={onAddCharacter}
      onClose={onClose}
    />
  );
}
