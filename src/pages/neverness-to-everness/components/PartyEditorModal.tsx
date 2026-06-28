import { useState, useMemo } from 'react';
import type { N2EParty, N2EPartyMember } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import { getMugshotUrl, getAvatarUrl } from '@/lib/imagekit';
import { addToast } from '@/utils/toast';
import { Modal } from '@/components/Modal';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import '@/components/PartyEditorModal.css';

const TIER_OPTIONS = (['S+', 'S', 'A', 'B'] as const).map((t) => ({
  value: t,
  label: t,
  modifier: `tier-${t.replace('+', 'plus')}`,
}));

interface PartyEditorModalProps {
  party?: N2EParty;
  availableCharacters: N2ECharacter[];
  onSave: (party: Partial<N2EParty> & { members: N2EPartyMember[] }) => Promise<void>;
  onClose: () => void;
}

export function PartyEditorModal({
  party,
  availableCharacters,
  onSave,
  onClose,
}: PartyEditorModalProps) {
  const [name, setName] = useState(party?.name || '');
  const [tier, setTier] = useState<string | null>(party?.tier ?? null);
  const [notes, setNotes] = useState(party?.notes || '');
  const [members, setMembers] = useState<N2EPartyMember[]>(party?.members || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const filteredCharacters = useMemo(() => {
    return availableCharacters.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !members.some((m) => m.characterId === c.id),
    );
  }, [availableCharacters, searchTerm, members]);

  const handleSelectCharacter = (characterId: string) => {
    if (activeSlot === null) return;

    const newMembers = [...members.filter((m) => m.slotIndex !== activeSlot)];
    newMembers.push({ characterId, slotIndex: activeSlot });
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
      tier,
      notes,
      members,
    });
  };

  return (
    <Modal
      title={party ? 'Edit Lineup' : 'Create New Lineup'}
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
            Save Lineup
          </button>
        </>
      }
    >
      <div className="party-editor-body">
        <div className="form-group">
          <label>Lineup Name</label>
          <input
            type="text"
            name="lineup-name"
            placeholder="e.g. Abyss Floor 12"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Tier</label>
          <SegmentedButtons
            className="tier-selector"
            options={TIER_OPTIONS}
            value={tier}
            allowDeselect
            onChange={setTier}
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
                      <img
                        src={getMugshotUrl(character.imageUrl)}
                        alt={character.name}
                        className="slot-img"
                      />
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
                  name="lineup-character-search"
                  placeholder="Search esper..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <button className="cancel-picker" onClick={() => setActiveSlot(null)}>
                  Cancel
                </button>
              </div>
              <div className="picker-list">
                {filteredCharacters.map((character) => (
                  <div
                    key={character.id}
                    className="picker-item"
                    onClick={() => handleSelectCharacter(character.id)}
                  >
                    <img src={getAvatarUrl(character.imageUrl)} alt={character.name} />
                    <span>{character.name}</span>
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
