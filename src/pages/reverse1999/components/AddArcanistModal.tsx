import { useState } from 'react';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999TrackedArcanist } from '@/types';
import { getAvatarUrl } from '@/lib/imagekit';
import { Modal } from '@/components/Modal';
import '@/components/AddEntityModal.css';

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

  const filteredAvailable = availableArcanists
    .filter(
      (a) =>
        !trackedArcanists.some((tracked) => tracked.name === a.name) &&
        a.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal title="Add Arcanist" onClose={onClose}>
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

      <div className="modal-list">
        {filteredAvailable.length > 0 ? (
          filteredAvailable.map((arcanist) => (
            <div
              key={arcanist.id}
              className="modal-list-item"
              onClick={() => onAddArcanist(arcanist)}
            >
              <div className="modal-list-info">
                <div className="modal-list-img-wrapper">
                  <img
                    src={getAvatarUrl(arcanist.imageUrl)}
                    alt={arcanist.name}
                    className="modal-list-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${arcanist.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                    }}
                  />
                </div>
                <div className="modal-list-details">
                  <span className="modal-list-name">{arcanist.name}</span>
                  <div className="modal-list-tags">
                    <span className={`afflatus-badge afflatus-${arcanist.afflatus.toLowerCase()}`}>
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
    </Modal>
  );
}
