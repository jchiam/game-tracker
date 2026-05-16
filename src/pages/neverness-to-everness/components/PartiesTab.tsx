import { useState } from 'react';
import type { N2EParty, N2EPartyMember } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { Session } from '@supabase/supabase-js';
import { PartyCard } from './PartyCard';
import { PartyEditorModal } from './PartyEditorModal';
import './PartiesTab.css';

interface PartiesTabProps {
  parties: N2EParty[];
  availableCharacters: N2ECharacter[];
  onSaveParty: (party: Partial<N2EParty> & { members: N2EPartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableCharacters,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
}: PartiesTabProps) {
  const [editingParty, setEditingParty] = useState<N2EParty | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="empty-state">
        <p>Please sign in to track your lineup configurations.</p>
      </div>
    );
  }

  return (
    <div className="n2e-parties-tab">
      <div className="n2e-parties-header">
        <h2>Your Lineups</h2>
        <button className="primary-action" onClick={() => setIsCreateModalOpen(true)}>
          Create New Lineup
        </button>
      </div>

      <div className="n2e-parties-grid">
        {parties.length === 0 ? (
          <div className="empty-state">
            <p>No lineups configured yet. Build your first team!</p>
          </div>
        ) : (
          [...parties]
            .sort((a, b) => {
              if (a.isFavorited !== b.isFavorited) return a.isFavorited ? -1 : 1;
              const tierRank: Record<string, number> = { 'S+': 0, S: 1, A: 2, B: 3 };
              const ra = a.tier ? (tierRank[a.tier] ?? 4) : 4;
              const rb = b.tier ? (tierRank[b.tier] ?? 4) : 4;
              return ra - rb;
            })
            .map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                availableCharacters={availableCharacters}
                onEdit={() => setEditingParty(party)}
                onDelete={() => onDeleteParty(party.id)}
                onToggleFavorite={(value) => onToggleFavorite(party.id, value)}
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
