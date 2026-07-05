import type { P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { P5xTrackedThief } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';

/** Badge modifiers derive from the verbatim source values (e.g. "Single-target"). */
const toModifier = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

interface AddThiefModalProps {
  availableThieves: P5xThief[];
  trackedThieves: P5xTrackedThief[];
  onAddThief: (thief: P5xThief) => void;
  onClose: () => void;
}

export function AddThiefModal({
  availableThieves,
  trackedThieves,
  onAddThief,
  onClose,
}: AddThiefModalProps) {
  return (
    <AddEntityModal
      title="Add Thief"
      entityNoun="thieves"
      available={availableThieves}
      tracked={trackedThieves}
      searchKeys={['name', 'codename', 'personaName', 'role', 'element']}
      getBadges={(thief) => [
        { label: thief.role, variant: 'p5x-role', modifier: toModifier(thief.role) },
        { label: thief.element, variant: 'p5x-element', modifier: toModifier(thief.element) },
      ]}
      onAdd={onAddThief}
      onClose={onClose}
    />
  );
}
