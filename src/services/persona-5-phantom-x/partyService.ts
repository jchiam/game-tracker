import type { Party, PartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<Party, PartyMember>({
  partiesTable: 'p5x_parties',
  membersTable: 'p5x_party_members',
  defaultName: 'New Party',
  memberFromRow: (row) => ({ entityId: row.entity_id, slotIndex: row.slot_index }),
  // member_type is derived from the slot range: slots 1–3 are Wonder's personas,
  // 4–6 are active thieves, slot 7 is the Navigator (off-field support).
  // Denormalized alongside slot_index for query clarity.
  memberToRow: (member) => ({
    entity_id: member.entityId,
    slot_index: member.slotIndex,
    member_type: member.slotIndex <= 3 ? 'persona' : member.slotIndex <= 6 ? 'thief' : 'navigator',
  }),
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
