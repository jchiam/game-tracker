import type { CznCombatant } from '@/data/chaos-zero-nightmare/combatants';
import type { CznTrackedCombatant } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';
import { getClassBadge, getElementBadge, getRarityBadge } from './combatantBadges';

interface AddCombatantModalProps {
  availableCombatants: CznCombatant[];
  trackedCombatants: CznTrackedCombatant[];
  onAddCombatant: (combatant: CznCombatant) => void;
  onClose: () => void;
}

export function AddCombatantModal({
  availableCombatants,
  trackedCombatants,
  onAddCombatant,
  onClose,
}: AddCombatantModalProps) {
  return (
    <AddEntityModal
      title="Add Combatant"
      entityNoun="combatants"
      available={availableCombatants}
      tracked={trackedCombatants}
      searchKeys={['name', 'class', 'element']}
      getBadges={(combatant) => {
        const rarity = getRarityBadge(combatant.rarity);
        const cls = getClassBadge(combatant.class);
        const element = getElementBadge(combatant.element);
        return [
          { label: rarity.label, variant: 'czn-rarity', modifier: rarity.modifier },
          { label: cls.label, variant: 'czn-class', modifier: cls.modifier },
          { label: element.label, variant: 'czn-element', modifier: element.modifier },
        ];
      }}
      onAdd={onAddCombatant}
      onClose={onClose}
    />
  );
}
