import type { Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999TrackedArcanist } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';

interface AddArcanistModalProps {
  availableArcanists: Arcanist[];
  trackedArcanists: R1999TrackedArcanist[];
  onAddArcanist: (arcanist: Arcanist) => void;
  onClose: () => void;
}

export function AddArcanistModal({
  availableArcanists,
  trackedArcanists,
  onAddArcanist,
  onClose,
}: AddArcanistModalProps) {
  return (
    <AddEntityModal
      title="Add Arcanist"
      entityNoun="arcanists"
      available={availableArcanists}
      tracked={trackedArcanists}
      searchKeys={['name', 'afflatus', 'damageType']}
      getBadges={(arcanist) => [
        {
          label: arcanist.afflatus,
          variant: 'afflatus',
          modifier: arcanist.afflatus.toLowerCase(),
        },
        {
          label: arcanist.damageType,
          variant: 'damage',
          modifier: arcanist.damageType.toLowerCase(),
        },
      ]}
      onAdd={onAddArcanist}
      onClose={onClose}
    />
  );
}
