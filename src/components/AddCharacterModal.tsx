import { useState } from 'react';
import { type Character } from '../data/characters';
import { type TrackedCharacter } from '../types';
import './Modal.css';
import './AddCharacterModal.css';

interface AddCharacterModalProps {
  availableCharacters: Character[];
  trackedCharacters: TrackedCharacter[];
  onAddCharacter: (char: Character) => void;
  onClose: () => void;
}

export function AddCharacterModal({
  availableCharacters,
  trackedCharacters,
  onAddCharacter,
  onClose
}: AddCharacterModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAvailableCharacters = availableCharacters.filter(char =>
    !trackedCharacters.some(tracked => tracked.name === char.name) &&
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Character</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="character-list">
          {filteredAvailableCharacters.length > 0 ? (
            filteredAvailableCharacters.map(char => (
              <div key={char.id} className="character-list-item" onClick={() => onAddCharacter(char)}>
                <div className="char-list-info">
                  <div className="char-list-img-wrapper">
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="char-list-img"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${char.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                      }}
                    />
                  </div>
                  <div className="char-list-details">
                    <span className="char-list-name">{char.name}</span>
                    <div className="char-list-tags">
                      <span className={`element-badge element-${char.element.toLowerCase()}`}>{char.element}</span>
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
      </div>
    </div>
  );
}
