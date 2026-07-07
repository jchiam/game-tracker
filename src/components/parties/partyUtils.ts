import type { PartyEntity, SlotConfig, SlotGroupStyle } from './PartiesView';

/** Groups consecutive slots by their `group` key for panel rendering. */
export function groupSlots<E extends PartyEntity>(
  slots: SlotConfig<E>[],
  slotGroups: Record<string, SlotGroupStyle>,
): { key: string; style: SlotGroupStyle; slots: SlotConfig<E>[] }[] {
  const groups: { key: string; style: SlotGroupStyle; slots: SlotConfig<E>[] }[] = [];
  for (const slot of slots) {
    const groupKey = slot.group;
    if (!groupKey || !slotGroups[groupKey]) {
      const last = groups[groups.length - 1];
      if (last && last.key === '__ungrouped') {
        last.slots.push(slot);
      } else {
        groups.push({ key: '__ungrouped', style: { label: '' }, slots: [slot] });
      }
    } else {
      const last = groups[groups.length - 1];
      if (last && last.key === groupKey) {
        last.slots.push(slot);
      } else {
        groups.push({ key: groupKey, style: slotGroups[groupKey], slots: [slot] });
      }
    }
  }
  return groups;
}
