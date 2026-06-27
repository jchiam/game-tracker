import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { EndfieldOperator } from '@/data/arknights-endfield/operators';
import type { EndfieldTrackedOperator } from '@/types';
import { getAvatarUrl } from '@/lib/imagekit';
import { Modal } from '@/components/Modal';
import '@/components/AddEntityModal.css';

interface AddOperatorModalProps {
  availableOperators: EndfieldOperator[];
  trackedOperators: EndfieldTrackedOperator[];
  onAddOperator: (operator: EndfieldOperator) => void;
  onClose: () => void;
}

export function AddOperatorModal({
  availableOperators,
  trackedOperators,
  onAddOperator,
  onClose,
}: AddOperatorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const untrackedOperators = useMemo(
    () => availableOperators.filter((o) => !trackedOperators.some((t) => t.id === o.id)),
    [availableOperators, trackedOperators],
  );

  const fuse = useMemo(
    () =>
      new Fuse(untrackedOperators, {
        keys: ['name', 'class', 'element', 'weapon'],
        threshold: 0.3,
      }),
    [untrackedOperators],
  );

  const filteredAvailable = useMemo(() => {
    if (!searchTerm.trim()) {
      return [...untrackedOperators].sort((a, b) => a.name.localeCompare(b.name));
    }
    return fuse.search(searchTerm).map((r) => r.item);
  }, [untrackedOperators, fuse, searchTerm]);

  return (
    <Modal title="Add Operator" onClose={onClose}>
      <div className="modal-search">
        <input
          type="text"
          name="add-operator-search"
          placeholder="Search operators..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="modal-list">
        {filteredAvailable.length > 0 ? (
          filteredAvailable.map((operator) => (
            <div
              key={operator.id}
              className="modal-list-item"
              onClick={() => onAddOperator(operator)}
            >
              <div className="modal-list-info">
                <div className="modal-list-img-wrapper">
                  <img
                    src={getAvatarUrl(operator.imageUrl)}
                    alt={operator.name}
                    className="modal-list-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${operator.name.replace(' ', '+')}&background=1a1a1a&color=fff`;
                    }}
                  />
                </div>
                <div className="modal-list-details">
                  <span className="modal-list-name">{operator.name}</span>
                  <div className="modal-list-tags">
                    <span
                      className={`game-badge endfield-class-badge endfield-class-${operator.class.toLowerCase()}`}
                    >
                      {operator.class}
                    </span>
                    <span
                      className={`game-badge endfield-element-badge endfield-element-${operator.element.toLowerCase()}`}
                    >
                      {operator.element}
                    </span>
                  </div>
                </div>
              </div>
              <button className="add-btn">+</button>
            </div>
          ))
        ) : (
          <div className="no-results">No operators found matching &quot;{searchTerm}&quot;</div>
        )}
      </div>
    </Modal>
  );
}
