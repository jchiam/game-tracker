import type { AeOperator } from '@/data/arknights-endfield/operators';
import type { AeTrackedOperator } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';

interface AddOperatorModalProps {
  availableOperators: AeOperator[];
  trackedOperators: AeTrackedOperator[];
  onAddOperator: (operator: AeOperator) => void;
  onClose: () => void;
}

export function AddOperatorModal({
  availableOperators,
  trackedOperators,
  onAddOperator,
  onClose,
}: AddOperatorModalProps) {
  return (
    <AddEntityModal
      title="Add Operator"
      entityNoun="operators"
      available={availableOperators}
      tracked={trackedOperators}
      searchKeys={['name', 'class', 'element', 'weapon']}
      getBadges={(operator) => [
        { label: operator.class, variant: 'ae-class', modifier: operator.class.toLowerCase() },
        {
          label: operator.element,
          variant: 'ae-element',
          modifier: operator.element.toLowerCase(),
        },
      ]}
      onAdd={onAddOperator}
      onClose={onClose}
    />
  );
}
