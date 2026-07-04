import type { N2EParty } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import { getMugshotUrl } from '@/lib/imagekit';

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
    <div className="party-card">
      {party.tier && (
        <div className={`party-tier-banner tier-banner-${party.tier.replace('+', 'plus')}`}>
          {party.tier}
        </div>
      )}
      <div className="party-card-header">
        <h3 className="party-name">{party.name}</h3>
        <div className="party-actions">
          <button
            className={`icon-btn party-favorite-btn ${party.isFavorited ? 'active' : ''}`}
            onClick={() => onToggleFavorite(!party.isFavorited)}
            title={party.isFavorited ? 'Unfavourite' : 'Favourite'}
          >
            {party.isFavorited ? '★' : '☆'}
          </button>
          <button className="icon-btn edit-btn" onClick={onEdit} title="Edit Lineup">
            ✎
          </button>
          <button className="icon-btn delete-btn" onClick={onDelete} title="Delete Lineup">
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
                className={`slot-avatar ${character ? `esper-${character.esperType.toLowerCase()}` : 'empty'}`}
              >
                {character ? (
                  <img
                    src={getMugshotUrl(character.imageUrl)}
                    alt={character.name}
                    className="char-img"
                  />
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
