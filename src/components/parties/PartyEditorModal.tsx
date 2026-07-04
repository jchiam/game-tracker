import { useState, useMemo } from 'react';
import type { Party, PartyMember } from '@/types';
import { addToast } from '@/utils/toast';
import { Modal } from '@/components/Modal';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import type { PartyEntity, PartyViewConfig } from './PartiesView';
import './PartyEditorModal.css';

const TIER_OPTIONS = (['S+', 'S', 'A', 'B'] as const).map((t) => ({
  value: t,
  label: t,
  modifier: `tier-${t.replace('+', 'plus')}`,
}));

interface PartyEditorModalProps<E extends PartyEntity> {
  config: PartyViewConfig<E>;
  party?: Party;
  entities: E[];
  onSave: (party: Partial<Party> & { members: PartyMember[] }) => Promise<void>;
  onClose: () => void;
}

export function PartyEditorModal<E extends PartyEntity>({
  config,
  party,
  entities,
  onSave,
  onClose,
}: PartyEditorModalProps<E>) {
  const [name, setName] = useState(party?.name || '');
  const [tier, setTier] = useState<string | null>(party?.tier ?? null);
  const [notes, setNotes] = useState(party?.notes || '');
  const [members, setMembers] = useState<PartyMember[]>(party?.members || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const { nouns } = config;
  const partyLower = nouns.party.toLowerCase();

  const filteredEntities = useMemo(() => {
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !members.some((m) => m.entityId === e.id),
    );
  }, [entities, searchTerm, members]);

  const handleSelectEntity = (entityId: string) => {
    if (activeSlot === null) return;

    const newMembers = [...members.filter((m) => m.slotIndex !== activeSlot)];
    newMembers.push({ entityId, slotIndex: activeSlot });
    setMembers(newMembers.sort((a, b) => a.slotIndex - b.slotIndex));
    setActiveSlot(null);
    setSearchTerm('');
  };

  const removeMember = (slotIndex: number) => {
    setMembers(members.filter((m) => m.slotIndex !== slotIndex));
  };

  const handleSave = () => {
    if (!name.trim()) {
      addToast(`Please enter a ${partyLower} name.`, 'warning');
      return;
    }
    onSave({
      id: party?.id,
      name,
      ...(config.supportsTier ? { tier } : {}),
      notes,
      members,
    });
  };

  return (
    <Modal
      title={party ? `Edit ${nouns.party}` : `Create New ${nouns.party}`}
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
          <button className="btn secondary-action" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary-action" onClick={handleSave}>
            Save {nouns.party}
          </button>
        </>
      }
    >
      <div className="party-editor-body">
        <div className="form-group">
          <label>{nouns.party} Name</label>
          <input
            type="text"
            name={`${partyLower}-name`}
            placeholder={nouns.namePlaceholder}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {config.supportsTier && (
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
        )}

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
              const entity = member ? entities.find((e) => e.id === member.entityId) : null;

              return (
                <div
                  key={slotIndex}
                  className={`builder-slot ${activeSlot === slotIndex ? 'active' : ''} ${entity ? 'occupied' : 'empty'}`}
                  onClick={() => setActiveSlot(slotIndex)}
                >
                  {entity ? (
                    <>
                      <img
                        src={config.resolveSlotImage(entity)}
                        alt={entity.name}
                        className="slot-img"
                      />
                      <div className="slot-overlay">
                        <span className="slot-name">{entity.name}</span>
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
                  name={`${partyLower}-${nouns.entity}-search`}
                  placeholder={nouns.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <button className="cancel-picker" onClick={() => setActiveSlot(null)}>
                  Cancel
                </button>
              </div>
              <div className="picker-list">
                {filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="picker-item"
                    onClick={() => handleSelectEntity(entity.id)}
                  >
                    <img src={config.resolveListImage(entity)} alt={entity.name} />
                    <span>{entity.name}</span>
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
