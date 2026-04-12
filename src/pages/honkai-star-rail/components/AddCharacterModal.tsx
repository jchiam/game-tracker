import type { Character } from '@/data/honkai-star-rail/characters';
import type { HsrTrackedCharacter } from '@/types';
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import '@/components/AddEntityModal.css';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAvailableCharacters = availableCharacters
    .filter(
      (char) =>
        !trackedCharacters.some((tracked) => tracked.name === char.name) &&
        char.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal title="Add Character" onClose={onClose}>
      <div className="modal-search">
        <input
          type="text"
          name="add-character-search"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="modal-list">
        {filteredAvailableCharacters.length > 0 ? (
          filteredAvailableCharacters.map((char) => (
            <div key={char.id} className="modal-list-item" onClick={() => onAddCharacter(char)}>
              <div className="modal-list-info">
                <div className="modal-list-img-wrapper">
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="modal-list-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${char.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                    }}
                  />
                </div>
                <div className="modal-list-details">
                  <span className="modal-list-name">{char.name}</span>
                  <div className="modal-list-tags">
                    <span className={`element-badge element-${char.element.toLowerCase()}`}>
                      {char.element}
                    </span>
                    {char.path && (
                      <span
                        className={`path-badge path-${char.path.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {char.path}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="add-btn">+</button>
            </div>
          ))
        ) : (
          <div className="no-results">No characters found matching "{searchTerm}"</div>
        )}
      </div>
    </Modal>
  );
}
