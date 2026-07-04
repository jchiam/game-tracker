import type { N2EParty, N2EPartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<N2EParty, N2EPartyMember>({
  partiesTable: 'n2e_parties',
  membersTable: 'n2e_party_members',
  defaultName: 'New Party',
  memberFromRow: (row) => ({ characterId: row.character_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ character_id: member.characterId, slot_index: member.slotIndex }),
  extraSelect: 'tier, is_favorited',
  extraFromRow: (row) => ({ tier: row.tier, isFavorited: !!row.is_favorited }),
  extraToRow: (party) => ({ tier: party.tier ?? null }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
export const toggleFavoriteParty = persistence.toggleFavoriteParty;
