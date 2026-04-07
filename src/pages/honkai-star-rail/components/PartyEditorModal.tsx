import { useState, useMemo } from 'react';
import type { HsrParty, HsrPartyMember } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';
import { addToast } from '@/utils/toast';
import './PartyEditorModal.css';

interface PartyEditorModalProps {
  party?: HsrParty;
  availableCharacters: Character[];
  onSave: (party: Partial<HsrParty> & { members: HsrPartyMember[] }) => Promise<void>;
  onClose: () => void;
}

export function PartyEditorModal({
  party,
  availableCharacters,
  onSave,
  onClose,
}: PartyEditorModalProps) {
  const [name, setName] = useState(party?.name || '');
  const [notes, setNotes] = useState(party?.notes || '');
  const [members, setMembers] = useState<HsrPartyMember[]>(party?.members || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const filteredCharacters = useMemo(() => {
    return availableCharacters.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !members.some((m) => m.characterId === c.id),
    );
  }, [availableCharacters, searchTerm, members]);

  const handleSelectCharacter = (charId: string) => {
    if (activeSlot === null) return;

    const newMembers = [...members.filter((m) => m.slotIndex !== activeSlot)];
    newMembers.push({ characterId: charId, slotIndex: activeSlot });
    setMembers(newMembers.sort((a, b) => a.slotIndex - b.slotIndex));
    setActiveSlot(null);
    setSearchTerm('');
  };

  const removeMember = (slotIndex: number) => {
    setMembers(members.filter((m) => m.slotIndex !== slotIndex));
  };

  const handleSave = () => {
    if (!name.trim()) {
      addToast('Please enter a party name.', 'warning');
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
          <h2>{party ? 'Edit Party' : 'Create New Party'}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="party-editor-body">
          <div className="form-group">
            <label>Party Name</label>
            <input
              type="text"
              placeholder="e.g. Memory of Chaos 12-1"
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
                const character = member
                  ? availableCharacters.find((c) => c.id === member.characterId)
                  : null;

                return (
                  <div
                    key={slotIndex}
                    className={`builder-slot ${activeSlot === slotIndex ? 'active' : ''} ${character ? 'occupied' : 'empty'}`}
                    onClick={() => setActiveSlot(slotIndex)}
                  >
                    {character ? (
                      <>
                        <img src={character.imageUrl} alt={character.name} className="slot-img" />
                        <div className="slot-overlay">
                          <span className="slot-name">{character.name}</span>
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
                    placeholder="Search character..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <button className="cancel-picker" onClick={() => setActiveSlot(null)}>
                    Cancel
                  </button>
                </div>
                <div className="picker-list">
                  {filteredCharacters.map((char) => (
                    <div
                      key={char.id}
                      className="picker-item"
                      onClick={() => handleSelectCharacter(char.id)}
                    >
                      <img src={char.imageUrl} alt={char.name} />
                      <span>{char.name}</span>
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
            Save Party
          </button>
        </div>
      </div>
    </div>
  );
}
