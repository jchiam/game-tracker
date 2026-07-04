import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Party, PartyMember } from '@/types';
import { PartyCard } from './PartyCard';
import { PartyEditorModal } from './PartyEditorModal';

/** Minimum catalog shape the Party View needs from a game's entities. */
export interface PartyEntity {
  id: string;
  name: string;
  imageUrl: string;
}

/**
 * Per-game adapter for the shared Party View — the UI-side twin of the
 * Party Persistence Factory config. Everything that varies between games
 * is data here; the view behaviour lives in this module.
 */
export interface PartyViewConfig<E extends PartyEntity> {
  nouns: {
    /** Capitalised party noun used in titles/buttons: 'Party' | 'Lineup' | 'Squad'. */
    party: string;
    /** Lowercase plural for the empty state: 'parties' | 'lineups' | 'squads'. */
    partiesLower: string;
    /** Lowercase entity noun, used for input `name` attributes. */
    entity: string;
    /** Tab heading, e.g. 'Your Lineups'. */
    header: string;
    /** Placeholder for the party-name input. */
    namePlaceholder: string;
    /** Placeholder for the member picker search input. */
    searchPlaceholder: string;
  };
  /** Resolves the image shown in team slots (builder and card). */
  resolveSlotImage: (entity: E) => string;
  /** Resolves the image shown in the member picker list. */
  resolveListImage: (entity: E) => string;
  /** Optional accent class for an occupied card slot, e.g. 'element-fire'. */
  slotAccentClass?: (entity: E) => string;
  /** Gates the tier selector, the card tier banner, and the tier sort. */
  supportsTier: boolean;
  /** Gates the favorite star and the favorites-first sort. */
  supportsFavorite: boolean;
  /**
   * Optional class added to the view root for game visual overrides on top of
   * the canonical `party.css` rules (AE's lighter 'endfield' card).
   */
  variantClass?: string;
}

interface PartiesViewProps<E extends PartyEntity> {
  config: PartyViewConfig<E>;
  parties: Party[];
  entities: E[];
  onSaveParty: (party: Partial<Party> & { members: PartyMember[] }) => Promise<string | null>;
  onDeleteParty: (id: string) => Promise<boolean>;
  /** Required when `config.supportsFavorite` is true. */
  onToggleFavorite?: (partyId: string, value: boolean) => void;
  session: Session | null;
}

const TIER_RANK: Record<string, number> = { 'S+': 0, S: 1, A: 2, B: 3 };

/**
 * Shared Party/Lineup view for every game: header, sorted card grid, empty and
 * signed-out states, and the create/edit editor modal. Per-game PartiesTab
 * files are thin config adapters over this module.
 */
export function PartiesView<E extends PartyEntity>({
  config,
  parties,
  entities,
  onSaveParty,
  onDeleteParty,
  onToggleFavorite,
  session,
}: PartiesViewProps<E>) {
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { nouns } = config;

  if (!session) {
    return (
      <div className="empty-state">
        <p>Please sign in to track your {nouns.party.toLowerCase()} configurations.</p>
      </div>
    );
  }

  const sortedParties =
    config.supportsTier || config.supportsFavorite
      ? [...parties].sort((a, b) => {
          if (config.supportsFavorite && a.isFavorited !== b.isFavorited) {
            return a.isFavorited ? -1 : 1;
          }
          if (!config.supportsTier) return 0;
          const ra = a.tier ? (TIER_RANK[a.tier] ?? 4) : 4;
          const rb = b.tier ? (TIER_RANK[b.tier] ?? 4) : 4;
          return ra - rb;
        })
      : parties;

  return (
    <div className={`parties-tab${config.variantClass ? ` ${config.variantClass}` : ''}`}>
      <div className="parties-header">
        <h2>{nouns.header}</h2>
        <button className="btn primary-action" onClick={() => setIsCreateModalOpen(true)}>
          Create New {nouns.party}
        </button>
      </div>

      <div className="parties-grid">
        {parties.length === 0 ? (
          <div className="empty-state">
            <p>No {nouns.partiesLower} configured yet. Build your first team!</p>
          </div>
        ) : (
          sortedParties.map((party) => (
            <PartyCard
              key={party.id}
              config={config}
              party={party}
              entities={entities}
              onEdit={() => setEditingParty(party)}
              onDelete={() => onDeleteParty(party.id)}
              onToggleFavorite={
                config.supportsFavorite && onToggleFavorite
                  ? (value) => onToggleFavorite(party.id, value)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {(isCreateModalOpen || editingParty) && (
        <PartyEditorModal
          config={config}
          party={editingParty || undefined}
          entities={entities}
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
