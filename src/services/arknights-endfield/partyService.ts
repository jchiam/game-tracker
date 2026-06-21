import { supabase } from '@/lib/supabase';
import type { EndfieldParty } from '@/types';

const DB_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

export async function loadParties(userId: string): Promise<EndfieldParty[]> {
  if (!DB_ENABLED) return [];

  const { data, error } = await supabase
    .from('endfield_parties')
    .select('id, profile_id, name, notes, created_at, endfield_party_members(*)')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parties:', error);
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    notes: row.notes,
    members: (row.endfield_party_members ?? [])
      .sort((a: any, b: any) => a.slot_index - b.slot_index)
      .map((m: any) => ({
        operatorId: m.operator_id,
        slotIndex: m.slot_index,
      })),
    createdAt: row.created_at,
  }));
}

export async function saveParty(
  userId: string,
  party: Partial<EndfieldParty> & { members: EndfieldParty['members'] },
): Promise<string | null> {
  if (!DB_ENABLED) return null;

  if (party.id) {
    const { error: updateErr } = await supabase
      .from('endfield_parties')
      .update({
        name: party.name,
        notes: party.notes,
      })
      .eq('id', party.id);
    if (updateErr) {
      console.error('Party update failed:', updateErr);
      throw updateErr;
    }

    await supabase.from('endfield_party_members').delete().eq('party_id', party.id);

    if (party.members.length > 0) {
      const { error: memberErr } = await supabase.from('endfield_party_members').insert(
        party.members.map((m) => ({
          party_id: party.id,
          operator_id: m.operatorId,
          slot_index: m.slotIndex,
        })),
      );
      if (memberErr) {
        console.error('Party member insert failed:', memberErr);
        throw memberErr;
      }
    }

    return party.id;
  }

  const { data, error } = await supabase
    .from('endfield_parties')
    .insert({
      profile_id: userId,
      name: party.name ?? 'New Squad',
      notes: party.notes ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Party create failed:', error);
    throw error;
  }

  const partyId = data?.id;
  if (partyId && party.members.length > 0) {
    const { error: memberErr } = await supabase.from('endfield_party_members').insert(
      party.members.map((m) => ({
        party_id: partyId,
        operator_id: m.operatorId,
        slot_index: m.slotIndex,
      })),
    );
    if (memberErr) {
      console.error('Party member insert failed:', memberErr);
      throw memberErr;
    }
  }

  return partyId ?? null;
}

export async function deleteParty(partyId: string): Promise<boolean> {
  if (!DB_ENABLED) return false;
  const { error } = await supabase.from('endfield_parties').delete().eq('id', partyId);
  if (error) {
    console.error('Party delete failed:', error);
    return false;
  }
  return true;
}
