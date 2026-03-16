import { useState } from 'react';
import type { HsrParty, HsrPartyMember } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';
import type { Session } from '@supabase/supabase-js';
import { PartyCard } from './PartyCard';
import { PartyEditorModal } from './PartyEditorModal';
import './PartiesTab.css';

interface PartiesTabProps {
  parties: HsrParty[];
  availableCharacters: Character[];
  onSaveParty: (party: Partial<HsrParty> & { members: HsrPartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableCharacters,
  onSaveParty,
  onDeleteParty,
  session,
}: PartiesTabProps) {
  const [editingParty, setEditingParty] = useState<HsrParty | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="empty-state">
        <p>Please sign in to track your party configurations.</p>
      </div>
    );
  }

  return (
    <div className="parties-tab">
      <div className="parties-header">
        <h2>Your Lineups</h2>
        <button className="primary-action" onClick={() => setIsCreateModalOpen(true)}>
          Create New Party
        </button>
      </div>

      <div className="parties-grid">
        {parties.length === 0 ? (
          <div className="empty-state">
            <p>No parties configured yet. Build your first team!</p>
          </div>
        ) : (
          parties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              availableCharacters={availableCharacters}
              onEdit={() => setEditingParty(party)}
              onDelete={() => onDeleteParty(party.id)}
            />
          ))
        )}
      </div>

      {(isCreateModalOpen || editingParty) && (
        <PartyEditorModal
          party={editingParty || undefined}
          availableCharacters={availableCharacters}
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
