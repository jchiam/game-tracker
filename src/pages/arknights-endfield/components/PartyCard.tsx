import type { AeParty } from '@/types';
import type { AeOperator } from '@/data/arknights-endfield/operators';
import { getMugshotUrl } from '@/lib/imagekit';
import './PartyCard.css';

interface PartyCardProps {
  party: AeParty;
  availableOperators: AeOperator[];
  onEdit: () => void;
  onDelete: () => void;
}

export function PartyCard({ party, availableOperators, onEdit, onDelete }: PartyCardProps) {
  return (
    <div className="endfield-party-card">
      <div className="endfield-party-card-header">
        <h3 className="endfield-party-name">{party.name}</h3>
        <div className="endfield-party-actions">
          <button className="n2e-icon-btn n2e-edit-btn" onClick={onEdit} title="Edit Squad">
            ✎
          </button>
          <button className="n2e-icon-btn n2e-delete-btn" onClick={onDelete} title="Delete Squad">
            ✕
          </button>
        </div>
      </div>

      {party.notes && <p className="endfield-party-notes">{party.notes}</p>}

      <div className="endfield-party-members-row">
        {[0, 1, 2, 3].map((slotIndex) => {
          const member = party.members.find((m) => m.slotIndex === slotIndex);
          const operator = member
            ? availableOperators.find((o) => o.id === member.operatorId)
            : null;

          return (
            <div key={slotIndex} className="endfield-slot-item">
              <div className={`endfield-slot-avatar ${operator ? '' : 'empty'}`}>
                {operator ? (
                  <img
                    src={getMugshotUrl(operator.imageUrl)}
                    alt={operator.name}
                    className="endfield-op-img"
                  />
                ) : (
                  <span className="endfield-empty-plus">+</span>
                )}
              </div>
              {operator && <span className="endfield-op-name-small">{operator.name}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
