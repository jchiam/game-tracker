import type { Party, PartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<Party, PartyMember>({
  partiesTable: 'ae_parties',
  membersTable: 'ae_party_members',
  defaultName: 'New Squad',
  memberFromRow: (row) => ({ entityId: row.operator_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ operator_id: member.entityId, slot_index: member.slotIndex }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
