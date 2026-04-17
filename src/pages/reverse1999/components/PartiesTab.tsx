import { useState } from 'react';
import type { R1999Party, R1999PartyMember } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import type { Session } from '@supabase/supabase-js';
import { PartyCard } from './PartyCard';
import { PartyEditorModal } from './PartyEditorModal';
import './PartiesTab.css';

interface PartiesTabProps {
  parties: R1999Party[];
  availableArcanists: Arcanist[];
  onSaveParty: (
    party: Partial<R1999Party> & { members: R1999PartyMember[] },
  ) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  onToggleFavorite: (partyId: string, value: boolean) => void;
  session: Session | null;
}

export function PartiesTab({
  parties,
  availableArcanists,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
}: PartiesTabProps) {
  const [editingParty, setEditingParty] = useState<R1999Party | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="empty-state">
        <p>Please sign in to track your lineup configurations.</p>
      </div>
    );
  }

  return (
    <div className="parties-tab">
      <div className="parties-header">
        <h2>Your Lineups</h2>
        <button className="primary-action" onClick={() => setIsCreateModalOpen(true)}>
          Create New Lineup
        </button>
      </div>

      <div className="parties-grid">
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
                availableArcanists={availableArcanists}
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
          availableArcanists={availableArcanists}
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
