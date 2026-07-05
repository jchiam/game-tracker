import type { Party, PartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<Party, PartyMember>({
  partiesTable: 'p5x_parties',
  membersTable: 'p5x_party_members',
  defaultName: 'New Party',
  memberFromRow: (row) => ({ entityId: row.thief_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ thief_id: member.entityId, slot_index: member.slotIndex }),
  extraSelect: 'tier, is_favorited',
  extraFromRow: (row) => ({ tier: row.tier, isFavorited: !!row.is_favorited }),
  // is_favorited deliberately absent: the editor payload never carries it, so
  // writing it here would reset a favorited party on every edit. Favorite
  // writes go through toggleFavoriteParty only (same pattern as N2E).
  extraToRow: (party) => ({ tier: party.tier ?? null }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
export const toggleFavoriteParty = persistence.toggleFavoriteParty;
