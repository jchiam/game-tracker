export interface ToggleChipOption<T extends string = string> {
  value: T;
  label: string;
  /** Extra class hook so a host stylesheet can supply a per-option accent. */
  modifier?: string;
}

interface ToggleChipsProps<T extends string> {
  options: readonly ToggleChipOption<T>[];
  /** Every option currently on. Any subset is valid, including none and all. */
  values: readonly T[];
  /** Emits the toggled option's value only — the host owns the resulting set. */
  onToggle: (value: T) => void;
  name?: string;
  disabled?: boolean;
  size?: 'md' | 'compact';
  /** Applied to the button-row container so a host keeps its row-wrapper class. */
  className?: string;
}

/**
 * A row of independently-toggleable pill buttons over the canonical `.toggle-btn`
 * base — the multi-boolean twin of `SegmentedButtons`.
 *
 * `SegmentedButtons` models exactly one selected value, which is the wrong shape
 * for a set of unrelated flags (ZZZ combat-skill maxed row, N2E awakening).
 * Toggling one option here never touches another.
 */
export function ToggleChips<T extends string>({
  options,
  values,
  onToggle,
  name,
  disabled,
  size = 'md',
  className,
}: ToggleChipsProps<T>) {
  return (
    <div
      className={['segmented-buttons', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={name}
    >
      {options.map((opt) => {
        const isOn = values.includes(opt.value);

        const classes = [
          'toggle-btn',
          size === 'compact' ? 'compact' : '',
          opt.modifier,
          isOn ? 'active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={opt.value}
            className={classes}
            disabled={disabled}
            title={opt.label}
            aria-pressed={isOn}
            onClick={() => onToggle(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
