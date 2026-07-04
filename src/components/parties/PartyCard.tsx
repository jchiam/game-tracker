import type { Party } from '@/types';
import type { PartyEntity, PartyViewConfig } from './PartiesView';

interface PartyCardProps<E extends PartyEntity> {
  config: PartyViewConfig<E>;
  party: Party;
  entities: E[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite?: (value: boolean) => void;
}

export function PartyCard<E extends PartyEntity>({
  config,
  party,
  entities,
  onEdit,
  onDelete,
  onToggleFavorite,
}: PartyCardProps<E>) {
  const { nouns } = config;

  return (
    <div className="party-card">
      {config.supportsTier && party.tier && (
        <div className={`party-tier-banner tier-banner-${party.tier.replace('+', 'plus')}`}>
          {party.tier}
        </div>
      )}
      <div className="party-card-header">
        <h3 className="party-name">{party.name}</h3>
        <div className="party-actions">
          {onToggleFavorite && (
            <button
              className={`icon-btn party-favorite-btn ${party.isFavorited ? 'active' : ''}`}
              onClick={() => onToggleFavorite(!party.isFavorited)}
              title={party.isFavorited ? 'Unfavourite' : 'Favourite'}
            >
              {party.isFavorited ? '★' : '☆'}
            </button>
          )}
          <button className="icon-btn edit-btn" onClick={onEdit} title={`Edit ${nouns.party}`}>
            ✎
          </button>
          <button
            className="icon-btn delete-btn"
            onClick={onDelete}
            title={`Delete ${nouns.party}`}
          >
            ✕
          </button>
        </div>
      </div>

      {party.notes && <p className="party-notes">{party.notes}</p>}

      <div className="party-members-row">
        {[0, 1, 2, 3].map((slotIndex) => {
          const member = party.members.find((m) => m.slotIndex === slotIndex);
          const entity = member ? entities.find((e) => e.id === member.entityId) : null;

          return (
            <div key={slotIndex} className="slot-item">
              <div
                className={`slot-avatar ${entity ? (config.slotAccentClass?.(entity) ?? '') : 'empty'}`}
              >
                {entity ? (
                  <img
                    src={config.resolveSlotImage(entity)}
                    alt={entity.name}
                    className="char-img"
                  />
                ) : (
                  <span className="empty-plus">+</span>
                )}
              </div>
              {entity && <span className="char-name-small">{entity.name}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
