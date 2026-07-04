import type { R1999Party, R1999PartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<R1999Party, R1999PartyMember>({
  partiesTable: 'r1999_parties',
  membersTable: 'r1999_party_members',
  defaultName: 'New Lineup',
  memberFromRow: (row) => ({ arcanistId: row.arcanist_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ arcanist_id: member.arcanistId, slot_index: member.slotIndex }),
  extraSelect: 'tier, is_favorited',
  extraFromRow: (row) => ({ tier: row.tier, isFavorited: !!row.is_favorited }),
  extraToRow: (party) => ({ tier: party.tier ?? null, is_favorited: party.isFavorited ?? false }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
export const toggleFavoriteParty = persistence.toggleFavoriteParty;
