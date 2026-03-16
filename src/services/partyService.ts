import { supabase } from '@/lib/supabase';
import type { HsrParty, HsrPartyMember } from '@/types';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

export async function loadParties(userId: string): Promise<HsrParty[]> {
  if (!DB_ENABLED) return [];

  const { data, error } = await supabase
    .from('hsr_parties')
    .select(
      `
      id,
      profile_id,
      name,
      notes,
      created_at,
      hsr_party_members (
        character_id,
        slot_index
      )
    `,
    )
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading parties:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    notes: row.notes,
    createdAt: row.created_at,
    members: (row.hsr_party_members || [])
      .sort((a: any, b: any) => a.slot_index - b.slot_index)
      .map((m: any) => ({
        characterId: m.character_id,
        slotIndex: m.slot_index,
      })),
  }));
}

export async function saveParty(
  userId: string,
  party: Partial<HsrParty> & { members: HsrPartyMember[] },
): Promise<string | null> {
  if (!DB_ENABLED) return null;

  const partyData = {
    profile_id: userId,
    name: party.name || 'New Party',
    notes: party.notes || '',
  };

  let partyId = party.id;

  if (partyId) {
    // Update existing
    const { error } = await supabase.from('hsr_parties').update(partyData).eq('id', partyId);
    if (error) {
      console.error('Error updating party:', error);
      return null;
    }
    // Clear old members
    await supabase.from('hsr_party_members').delete().eq('party_id', partyId);
  } else {
    // Create new
    const { data, error } = await supabase
      .from('hsr_parties')
      .insert(partyData)
      .select('id')
      .single();
    if (error || !data) {
      console.error('Error creating party:', error);
      return null;
    }
    partyId = data.id;
  }

  // Insert members
  if (party.members.length > 0) {
    const membersToInsert = party.members.map((m) => ({
      party_id: partyId,
      character_id: m.characterId,
      slot_index: m.slotIndex,
    }));
    const { error: memberError } = await supabase.from('hsr_party_members').insert(membersToInsert);
    if (memberError) {
      console.error('Error saving party members:', memberError);
    }
  }

  return partyId || null;
}

export async function deleteParty(partyId: string): Promise<boolean> {
  if (!DB_ENABLED) return false;
  const { error } = await supabase.from('hsr_parties').delete().eq('id', partyId);
  if (error) {
    console.error('Error deleting party:', error);
    return false;
  }
  return true;
}
