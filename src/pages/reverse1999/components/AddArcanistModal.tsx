import { useState, useEffect } from 'react';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999TrackedArcanist } from '@/types';
import { getAvatarUrl } from '@/lib/imagekit';
import './Modal.css';
import './AddArcanistModal.css';

interface AddArcanistModalProps {
  availableArcanists: Arcanist[];
  trackedArcanists: R1999TrackedArcanist[];
  onAddArcanist: (arcanist: Arcanist) => void;
  onClose: () => void;
}

export function AddArcanistModal({
  availableArcanists,
  trackedArcanists,
  onAddArcanist,
  onClose,
}: AddArcanistModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredAvailable = availableArcanists
    .filter(
      (a) =>
        !trackedArcanists.some((tracked) => tracked.name === a.name) &&
        a.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Arcanist</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            name="add-arcanist-search"
            placeholder="Search arcanists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="arcanist-list">
          {filteredAvailable.length > 0 ? (
            filteredAvailable.map((arcanist) => (
              <div
                key={arcanist.id}
                className="arcanist-list-item"
                onClick={() => onAddArcanist(arcanist)}
              >
                <div className="arcanist-list-info">
                  <div className="arcanist-list-img-wrapper">
                    <img
                      src={getAvatarUrl(arcanist.imageUrl)}
                      alt={arcanist.name}
                      className="arcanist-list-img"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${arcanist.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                      }}
                    />
                  </div>
                  <div className="arcanist-list-details">
                    <span className="arcanist-list-name">{arcanist.name}</span>
                    <div className="arcanist-list-tags">
                      <span
                        className={`afflatus-badge afflatus-${arcanist.afflatus.toLowerCase()}`}
                      >
                        {arcanist.afflatus}
                      </span>
                      <span className={`damage-badge damage-${arcanist.damageType.toLowerCase()}`}>
                        {arcanist.damageType}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="add-btn">+</button>
              </div>
            ))
          ) : (
            <div className="no-results">No arcanists found matching &quot;{searchTerm}&quot;</div>
          )}
        </div>
      </div>
    </div>
  );
}
