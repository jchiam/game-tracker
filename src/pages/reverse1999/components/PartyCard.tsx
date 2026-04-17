import type { R1999Party } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import { getMugshotUrl } from '@/lib/imagekit';
import './PartyCard.css';

interface PartyCardProps {
  party: R1999Party;
  availableArcanists: Arcanist[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: (value: boolean) => void;
}

export function PartyCard({
  party,
  availableArcanists,
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
            className={`icon-btn favorite-btn ${party.isFavorited ? 'active' : ''}`}
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
          const arcanist = member
            ? availableArcanists.find((a) => a.id === member.arcanistId)
            : null;

          return (
            <div key={slotIndex} className="slot-item">
              <div
                className={`slot-avatar ${arcanist ? `afflatus-${arcanist.afflatus.toLowerCase()}` : 'empty'}`}
              >
                {arcanist ? (
                  <img
                    src={getMugshotUrl(arcanist.imageUrl)}
                    alt={arcanist.name}
                    className="char-img"
                  />
                ) : (
                  <span className="empty-plus">+</span>
                )}
              </div>
              {arcanist && <span className="char-name-small">{arcanist.name}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
