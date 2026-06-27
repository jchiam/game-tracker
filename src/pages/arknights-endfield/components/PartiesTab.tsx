import { useState } from 'react';
import type { AeParty, AePartyMember } from '@/types';
import type { AeOperator } from '@/data/arknights-endfield/operators';
import type { Session } from '@supabase/supabase-js';
import { PartyCard } from './PartyCard';
import { PartyEditorModal } from './PartyEditorModal';
import './PartiesTab.css';

interface PartiesTabProps {
  parties: AeParty[];
  availableOperators: AeOperator[];
  onSaveParty: (party: Partial<AeParty> & { members: AePartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableOperators,
  onSaveParty,
  onDeleteParty,
  session,
}: PartiesTabProps) {
  const [editingParty, setEditingParty] = useState<AeParty | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="empty-state">
        <p>Please sign in to track your squad configurations.</p>
      </div>
    );
  }

  return (
    <div className="endfield-parties-tab">
      <div className="endfield-parties-header">
        <h2>Your Squads</h2>
        <button className="primary-action" onClick={() => setIsCreateModalOpen(true)}>
          Create New Squad
        </button>
      </div>

      <div className="endfield-parties-grid">
        {parties.length === 0 ? (
          <div className="empty-state">
            <p>No squads configured yet. Build your first team!</p>
          </div>
        ) : (
          parties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              availableOperators={availableOperators}
              onEdit={() => setEditingParty(party)}
              onDelete={() => onDeleteParty(party.id)}
            />
          ))
        )}
      </div>

      {(isCreateModalOpen || editingParty) && (
        <PartyEditorModal
          party={editingParty || undefined}
          availableOperators={availableOperators}
          onSave={async (partyData) => {
            await onSaveParty(partyData);
            setIsCreateModalOpen(false);
            setEditingParty(null);
          }}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingParty(null);
          }}
        />
      )}
    </div>
  );
}
