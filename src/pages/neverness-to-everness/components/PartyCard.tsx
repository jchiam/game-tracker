import type { N2EParty } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import { getMugshotUrl } from '@/lib/imagekit';
import './PartyCard.css';

interface PartyCardProps {
  party: N2EParty;
  availableCharacters: N2ECharacter[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: (value: boolean) => void;
}

export function PartyCard({
  party,
  availableCharacters,
  onEdit,
  onDelete,
  onToggleFavorite,
}: PartyCardProps) {
  return (
    <div className="n2e-party-card">
      {party.tier && (
        <div className={`n2e-party-tier-banner n2e-tier-banner-${party.tier.replace('+', 'plus')}`}>
          {party.tier}
        </div>
      )}
      <div className="n2e-party-card-header">
        <h3 className="n2e-party-name">{party.name}</h3>
        <div className="n2e-party-actions">
          <button
            className={`n2e-icon-btn n2e-favorite-btn ${party.isFavorited ? 'active' : ''}`}
            onClick={() => onToggleFavorite(!party.isFavorited)}
            title={party.isFavorited ? 'Unfavourite' : 'Favourite'}
          >
            {party.isFavorited ? '★' : '☆'}
          </button>
          <button className="n2e-icon-btn n2e-edit-btn" onClick={onEdit} title="Edit Lineup">
            ✎
          </button>
          <button className="n2e-icon-btn n2e-delete-btn" onClick={onDelete} title="Delete Lineup">
            ✕
          </button>
        </div>
      </div>

      {party.notes && <p className="n2e-party-notes">{party.notes}</p>}

      <div className="n2e-party-members-row">
        {[0, 1, 2, 3].map((slotIndex) => {
          const member = party.members.find((m) => m.slotIndex === slotIndex);
          const character = member
            ? availableCharacters.find((c) => c.id === member.characterId)
            : null;

          return (
            <div key={slotIndex} className="n2e-slot-item">
              <div
                className={`n2e-slot-avatar ${character ? `esper-${character.esperType.toLowerCase()}` : 'empty'}`}
              >
                {character ? (
                  <img
                    src={getMugshotUrl(character.imageUrl)}
                    alt={character.name}
                    className="n2e-char-img"
                  />
                ) : (
                  <span className="n2e-empty-plus">+</span>
                )}
              </div>
              {character && <span className="n2e-char-name-small">{character.name}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
