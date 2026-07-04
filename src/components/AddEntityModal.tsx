import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Modal } from '@/components/Modal';
import { GameBadge } from '@/components/GameBadge';
import { getAvatarUrl } from '@/lib/imagekit';
import '@/components/AddEntityModal.css';

export interface EntityBadgeDescriptor {
  label: string;
  variant: string;
  modifier: string;
}

interface PickerEntity {
  id: string;
  name: string;
  imageUrl: string;
}

interface AddEntityModalProps<T extends PickerEntity> {
  title: string;
  /** Plural noun used in the search placeholder and empty-state message. */
  entityNoun: string;
  available: T[];
  tracked: readonly { id: string }[];
  searchKeys: string[];
  getBadges: (entity: T) => EntityBadgeDescriptor[];
  onAdd: (entity: T) => void;
  onClose: () => void;
}

export function AddEntityModal<T extends PickerEntity>({
  title,
  entityNoun,
  available,
  tracked,
  searchKeys,
  getBadges,
  onAdd,
  onClose,
}: AddEntityModalProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const untracked = useMemo(
    () => available.filter((entity) => !tracked.some((t) => t.id === entity.id)),
    [available, tracked],
  );

  const fuse = useMemo(
    () => new Fuse(untracked, { keys: searchKeys, threshold: 0.3 }),
    [untracked, searchKeys],
  );

  const filteredAvailable = useMemo(() => {
    if (!searchTerm.trim()) {
      return [...untracked].sort((a, b) => a.name.localeCompare(b.name));
    }
    return fuse.search(searchTerm).map((r) => r.item);
  }, [untracked, fuse, searchTerm]);

  return (
    <Modal title={title} onClose={onClose}>
      <div className="modal-search">
        <input
          type="text"
          name="add-entity-search"
          placeholder={`Search ${entityNoun}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="modal-list">
        {filteredAvailable.length > 0 ? (
          filteredAvailable.map((entity) => (
            <div key={entity.id} className="modal-list-item" onClick={() => onAdd(entity)}>
              <div className="modal-list-info">
                <div className="modal-list-img-wrapper">
                  <img
                    src={getAvatarUrl(entity.imageUrl)}
                    alt={entity.name}
                    className="modal-list-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${entity.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                    }}
                  />
                </div>
                <div className="modal-list-details">
                  <span className="modal-list-name">{entity.name}</span>
                  <div className="modal-list-tags">
                    {getBadges(entity).map((badge) => (
                      <GameBadge
                        key={`${badge.variant}-${badge.modifier}`}
                        label={badge.label}
                        variant={badge.variant}
                        modifier={badge.modifier}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button className="add-btn">+</button>
            </div>
          ))
        ) : (
          <div className="no-results">
            No {entityNoun} found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </Modal>
  );
}
