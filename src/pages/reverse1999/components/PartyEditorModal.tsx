import { useState, useMemo } from 'react';
import type { R1999Party, R1999PartyMember } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { addToast } from '@/utils/toast';
import './PartyEditorModal.css';

interface PartyEditorModalProps {
  party?: R1999Party;
  availableArcanists: Arcanist[];
  onSave: (party: Partial<R1999Party> & { members: R1999PartyMember[] }) => Promise<void>;
  onClose: () => void;
}

export function PartyEditorModal({
  party,
  availableArcanists,
  onSave,
  onClose,
}: PartyEditorModalProps) {
  const [name, setName] = useState(party?.name || '');
  const [notes, setNotes] = useState(party?.notes || '');
  const [members, setMembers] = useState<R1999PartyMember[]>(party?.members || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const filteredArcanists = useMemo(() => {
    return availableArcanists.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !members.some((m) => m.arcanistId === a.id),
    );
  }, [availableArcanists, searchTerm, members]);

  const handleSelectArcanist = (arcanistId: string) => {
    if (activeSlot === null) return;

    const newMembers = [...members.filter((m) => m.slotIndex !== activeSlot)];
    newMembers.push({ arcanistId, slotIndex: activeSlot });
    setMembers(newMembers.sort((a, b) => a.slotIndex - b.slotIndex));
    setActiveSlot(null);
    setSearchTerm('');
  };

  const removeMember = (slotIndex: number) => {
    setMembers(members.filter((m) => m.slotIndex !== slotIndex));
  };

  const handleSave = () => {
    if (!name.trim()) {
      addToast('Please enter a lineup name.', 'warning');
      return;
    }
    onSave({
      id: party?.id,
      name,
      notes,
      members,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content party-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{party ? 'Edit Lineup' : 'Create New Lineup'}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="party-editor-body">
          <div className="form-group">
            <label>Lineup Name</label>
            <input
              type="text"
              name="lineup-name"
              placeholder="e.g. Limbo of Ruin 3-3"
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
                const arcanist = member
                  ? availableArcanists.find((a) => a.id === member.arcanistId)
                  : null;

                return (
                  <div
                    key={slotIndex}
                    className={`builder-slot ${activeSlot === slotIndex ? 'active' : ''} ${arcanist ? 'occupied' : 'empty'}`}
                    onClick={() => setActiveSlot(slotIndex)}
                  >
                    {arcanist ? (
                      <>
                        <img
                          src={getMugshotUrl(arcanist.imageUrl)}
                          alt={arcanist.name}
                          className="slot-img"
                        />
                        <div className="slot-overlay">
                          <span className="slot-name">{arcanist.name}</span>
                        </div>
                        <button
                          className="remove-member-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMember(slotIndex);
                          }}
                        >
                          ✕
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
                    name="lineup-arcanist-search"
                    placeholder="Search arcanist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <button className="cancel-picker" onClick={() => setActiveSlot(null)}>
                    Cancel
                  </button>
                </div>
                <div className="picker-list">
                  {filteredArcanists.map((arcanist) => (
                    <div
                      key={arcanist.id}
                      className="picker-item"
                      onClick={() => handleSelectArcanist(arcanist.id)}
                    >
                      <img src={getAvatarUrl(arcanist.imageUrl)} alt={arcanist.name} />
                      <span>{arcanist.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-action" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-action" onClick={handleSave}>
            Save Lineup
          </button>
        </div>
      </div>
    </div>
  );
}
