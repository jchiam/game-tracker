import { useState, useMemo } from 'react';
import type { EndfieldParty, EndfieldPartyMember } from '@/types';
import type { EndfieldOperator } from '@/data/arknights-endfield/operators';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { addToast } from '@/utils/toast';
import { Modal } from '@/components/Modal';
import '@/components/PartyEditorModal.css';

interface PartyEditorModalProps {
  party?: EndfieldParty;
  availableOperators: EndfieldOperator[];
  onSave: (party: Partial<EndfieldParty> & { members: EndfieldPartyMember[] }) => Promise<void>;
  onClose: () => void;
}

export function PartyEditorModal({
  party,
  availableOperators,
  onSave,
  onClose,
}: PartyEditorModalProps) {
  const [name, setName] = useState(party?.name || '');
  const [notes, setNotes] = useState(party?.notes || '');
  const [members, setMembers] = useState<EndfieldPartyMember[]>(party?.members || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const filteredOperators = useMemo(() => {
    return availableOperators.filter(
      (o) =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !members.some((m) => m.operatorId === o.id),
    );
  }, [availableOperators, searchTerm, members]);

  const handleSelectOperator = (operatorId: string) => {
    if (activeSlot === null) return;
    const newMembers = [...members.filter((m) => m.slotIndex !== activeSlot)];
    newMembers.push({ operatorId, slotIndex: activeSlot });
    setMembers(newMembers.sort((a, b) => a.slotIndex - b.slotIndex));
    setActiveSlot(null);
    setSearchTerm('');
  };

  const removeMember = (slotIndex: number) => {
    setMembers(members.filter((m) => m.slotIndex !== slotIndex));
  };

  const handleSave = () => {
    if (!name.trim()) {
      addToast('Please enter a squad name.', 'warning');
      return;
    }
    onSave({ id: party?.id, name, notes, members });
  };

  return (
    <Modal
      title={party ? 'Edit Squad' : 'Create New Squad'}
      onClose={onClose}
      className="party-editor"
      onEscPress={() => {
        if (activeSlot !== null) {
          setActiveSlot(null);
          setSearchTerm('');
        } else {
          onClose();
        }
      }}
      footer={
        <>
          <button className="secondary-action" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-action" onClick={handleSave}>
            Save Squad
          </button>
        </>
      }
    >
      <div className="party-editor-body">
        <div className="form-group">
          <label>Squad Name</label>
          <input
            type="text"
            name="squad-name"
            placeholder="e.g. Boss Rush Team"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            placeholder="Strategy, alternative members, etc..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="team-builder-section">
          <label>Team Selection</label>
          <div className="team-slots">
            {[0, 1, 2, 3].map((slotIndex) => {
              const member = members.find((m) => m.slotIndex === slotIndex);
              const operator = member
                ? availableOperators.find((o) => o.id === member.operatorId)
                : null;

              return (
                <div
                  key={slotIndex}
                  className={`builder-slot ${activeSlot === slotIndex ? 'active' : ''} ${operator ? 'occupied' : 'empty'}`}
                  onClick={() => setActiveSlot(slotIndex)}
                >
                  {operator ? (
                    <>
                      <img
                        src={getMugshotUrl(operator.imageUrl)}
                        alt={operator.name}
                        className="slot-img"
                      />
                      <div className="slot-overlay">
                        <span className="slot-name">{operator.name}</span>
                      </div>
                      <button
                        className="remove-member-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMember(slotIndex);
                        }}
                      >
                        {'✕'}
                      </button>
                    </>
                  ) : (
                    <div className="slot-placeholder">
                      <span className="plus">+</span>
                      <span>Slot {slotIndex + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeSlot !== null && (
            <div className="character-picker">
              <div className="picker-header">
                <input
                  type="text"
                  name="squad-operator-search"
                  placeholder="Search operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <button className="cancel-picker" onClick={() => setActiveSlot(null)}>
                  Cancel
                </button>
              </div>
              <div className="picker-list">
                {filteredOperators.map((operator) => (
                  <div
                    key={operator.id}
                    className="picker-item"
                    onClick={() => handleSelectOperator(operator.id)}
                  >
                    <img src={getAvatarUrl(operator.imageUrl)} alt={operator.name} />
                    <span>{operator.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
