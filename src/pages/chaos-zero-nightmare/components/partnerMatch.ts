/**
 * Rank of the equipped Partner in the preferred-Partners list. Both sides are
 * catalog ids, so no catalog bridge is needed. Returns the 0-based rank, or
 * null when no Partner is equipped or it is not in the list. Never throws.
 */
export function resolvePartnerRank(
  partnerId: string | null,
  partnerPreferences: string[],
): number | null {
  if (!partnerId) return null;
  const idx = partnerPreferences.indexOf(partnerId);
  return idx === -1 ? null : idx;
}
