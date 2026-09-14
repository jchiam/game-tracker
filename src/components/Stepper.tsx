interface StepperProps {
  /** Names the group and both buttons ("Decrease {label}" / "Increase {label}"). */
  label: string;
  value: number;
  /** Emits `value ± 1`; the host owns the value. */
  onChange: (next: number) => void;
  /** Inclusive lower bound; the decrement button disables at it. */
  min?: number;
  /** Inclusive upper bound; the increment button disables at it. Unbounded when omitted. */
  max?: number;
  disabled?: boolean;
  size?: 'md' | 'compact';
  /** Applied to the group container so a host keeps its row-wrapper class. */
  className?: string;
}

/**
 * A bounded integer control: label, `−` button, value readout, `+` button. The
 * counter twin of `ToggleChips` — for quantities (copies of a collectible)
 * rather than flags. Self-styled `.stepper-btn` buttons; never `.btn`.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max,
  disabled,
  size = 'md',
  className,
}: StepperProps) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  const classes = ['stepper', size === 'compact' ? 'compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="group" aria-label={label}>
      <span className="stepper-label">{label}</span>
      <button
        type="button"
        className="stepper-btn"
        aria-label={`Decrease ${label}`}
        disabled={disabled || atMin}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button
        type="button"
        className="stepper-btn"
        aria-label={`Increase ${label}`}
        disabled={disabled || atMax}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
