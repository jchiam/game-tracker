import type { AeParty, AePartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<AeParty, AePartyMember>({
  partiesTable: 'ae_parties',
  membersTable: 'ae_party_members',
  defaultName: 'New Squad',
  memberFromRow: (row) => ({ operatorId: row.operator_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ operator_id: member.operatorId, slot_index: member.slotIndex }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
