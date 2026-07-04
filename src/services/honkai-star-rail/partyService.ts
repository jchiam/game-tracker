import type { Party, PartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<Party, PartyMember>({
  partiesTable: 'hsr_parties',
  membersTable: 'hsr_party_members',
  defaultName: 'New Party',
  memberFromRow: (row) => ({ entityId: row.character_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ character_id: member.entityId, slot_index: member.slotIndex }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
