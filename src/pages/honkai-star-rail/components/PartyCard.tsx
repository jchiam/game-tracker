import type { HsrParty } from '@/types';
import type { Character } from '@/data/characters';
import './PartyCard.css';

interface PartyCardProps {
  party: HsrParty;
  availableCharacters: Character[];
  onEdit: () => void;
  onDelete: () => void;
}

export function PartyCard({ party, availableCharacters, onEdit, onDelete }: PartyCardProps) {
  return (
    <div className="party-card">
      <div className="party-card-header">
        <h3 className="party-name">{party.name}</h3>
        <div className="party-actions">
          <button className="icon-btn edit-btn" onClick={onEdit} title="Edit Party">
            ✎
          </button>
          <button className="icon-btn delete-btn" onClick={onDelete} title="Delete Party">
            ✕
          </button>
        </div>
      </div>

      {party.notes && <p className="party-notes">{party.notes}</p>}

      <div className="party-members-row">
        {[0, 1, 2, 3].map((slotIndex) => {
          const member = party.members.find((m) => m.slotIndex === slotIndex);
          const character = member
            ? availableCharacters.find((c) => c.id === member.characterId)
            : null;

          return (
            <div key={slotIndex} className="slot-item">
              <div
                className={`slot-avatar ${character ? `element-${character.element.toLowerCase()}` : 'empty'}`}
              >
                {character ? (
                  <img src={character.imageUrl} alt={character.name} className="char-img" />
                ) : (
                  <span className="empty-plus">+</span>
                )}
              </div>
              {character && <span className="char-name-small">{character.name}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
