import type { Party, PartyMember } from '@/types';
import { createPartyPersistence } from '@/services/rosterPersistence';

const persistence = createPartyPersistence<Party, PartyMember>({
  partiesTable: 'zzz_parties',
  membersTable: 'zzz_party_members',
  defaultName: 'New Party',
  memberFromRow: (row) => ({ entityId: row.agent_id, slotIndex: row.slot_index }),
  memberToRow: (member) => ({ agent_id: member.entityId, slot_index: member.slotIndex }),
  extraSelect: 'tier, is_favorited, bangboo_id',
  extraFromRow: (row) => ({
    tier: row.tier,
    isFavorited: !!row.is_favorited,
    companionId: row.bangboo_id ?? null,
  }),
  extraToRow: (party) => ({ tier: party.tier ?? null, bangboo_id: party.companionId ?? null }),
});

export const loadParties = persistence.loadParties;
export const saveParty = persistence.saveParty;
export const deleteParty = persistence.deleteParty;
export const toggleFavoriteParty = persistence.toggleFavoriteParty;
