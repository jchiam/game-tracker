import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ETrackedCharacter } from '@/types';
import { getAvatarUrl } from '@/lib/imagekit';
import { Modal } from '@/components/Modal';
import '@/components/AddEntityModal.css';

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
  const [searchTerm, setSearchTerm] = useState('');

  const untrackedCharacters = useMemo(
    () =>
      availableCharacters.filter((c) => !trackedCharacters.some((tracked) => tracked.id === c.id)),
    [availableCharacters, trackedCharacters],
  );

  const fuse = useMemo(
    () =>
      new Fuse(untrackedCharacters, {
        keys: ['name', 'esperType', 'arcType', 'roles'],
        threshold: 0.3,
      }),
    [untrackedCharacters],
  );

  const filteredAvailable = useMemo(() => {
    if (!searchTerm.trim()) {
      return [...untrackedCharacters].sort((a, b) => a.name.localeCompare(b.name));
    }
    return fuse.search(searchTerm).map((r) => r.item);
  }, [untrackedCharacters, fuse, searchTerm]);

  return (
    <Modal title="Add Esper" onClose={onClose}>
      <div className="modal-search">
        <input
          type="text"
          name="add-character-search"
          placeholder="Search espers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="modal-list">
        {filteredAvailable.length > 0 ? (
          filteredAvailable.map((character) => (
            <div
              key={character.id}
              className="modal-list-item"
              onClick={() => onAddCharacter(character)}
            >
              <div className="modal-list-info">
                <div className="modal-list-img-wrapper">
                  <img
                    src={getAvatarUrl(character.imageUrl)}
                    alt={character.name}
                    className="modal-list-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${character.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                    }}
                  />
                </div>
                <div className="modal-list-details">
                  <span className="modal-list-name">{character.name}</span>
                  <div className="modal-list-tags">
                    <span className={`esper-badge esper-${character.esperType.toLowerCase()}`}>
                      {character.esperType}
                    </span>
                    <span className={`arc-badge arc-${character.arcType.toLowerCase()}`}>
                      {character.arcType}
                    </span>
                  </div>
                </div>
              </div>
              <button className="add-btn">+</button>
            </div>
          ))
        ) : (
          <div className="no-results">No espers found matching &quot;{searchTerm}&quot;</div>
        )}
      </div>
    </Modal>
  );
}
