import { supabase } from '@/lib/supabase';
import type { R1999Party, R1999PartyMember } from '@/types';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

export async function loadParties(userId: string): Promise<R1999Party[]> {
  if (!DB_ENABLED) return [];

  const { data, error } = await supabase
    .from('r1999_parties')
    .select(
      `
      id,
      profile_id,
      name,
      notes,
      created_at,
      r1999_party_members (
        arcanist_id,
        slot_index
      )
    `,
    )
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading R1999 parties:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    notes: row.notes,
    createdAt: row.created_at,
    members: (row.r1999_party_members || [])
      .sort((a: any, b: any) => a.slot_index - b.slot_index)
      .map((m: any) => ({
        arcanistId: m.arcanist_id,
        slotIndex: m.slot_index,
      })),
  }));
}

export async function saveParty(
  userId: string,
  party: Partial<R1999Party> & { members: R1999PartyMember[] },
): Promise<string | null> {
  if (!DB_ENABLED) return null;

  const partyData = {
    profile_id: userId,
    name: party.name || 'New Lineup',
    notes: party.notes || '',
  };

  let partyId = party.id;

  if (partyId) {
    // Update existing
    const { error } = await supabase.from('r1999_parties').update(partyData).eq('id', partyId);
    if (error) {
      console.error('Error updating R1999 party:', error);
      return null;
    }
    // Clear old members
    await supabase.from('r1999_party_members').delete().eq('party_id', partyId);
  } else {
    // Create new
    const { data, error } = await supabase
      .from('r1999_parties')
      .insert(partyData)
      .select('id')
      .single();
    if (error || !data) {
      console.error('Error creating R1999 party:', error);
      return null;
    }
    partyId = data.id;
  }

  // Insert members
  if (party.members.length > 0) {
    const membersToInsert = party.members.map((m) => ({
      party_id: partyId,
      arcanist_id: m.arcanistId,
      slot_index: m.slotIndex,
    }));
    const { error: memberError } = await supabase
      .from('r1999_party_members')
      .insert(membersToInsert);
    if (memberError) {
      console.error('Error saving R1999 party members:', memberError);
    }
  }

  return partyId || null;
}

export async function deleteParty(partyId: string): Promise<boolean> {
  if (!DB_ENABLED) return false;
  const { error } = await supabase.from('r1999_parties').delete().eq('id', partyId);
  if (error) {
    console.error('Error deleting R1999 party:', error);
    return false;
  }
  return true;
}
