interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  /** String options (value === label) or distinct value/label pairs. */
  options: readonly (string | { value: string; label: string })[];
  name: string;
  /** Rendered as a leading empty-value option, e.g. "-- No Set --". */
  placeholder?: string;
  disabled?: boolean;
  /** `md` = modal density (default), `sm` = compact card density. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The canonical styled dropdown. Owns the single `Select` visual language
 * (chevron + gold-glow focus) defined once in `controls.css` via `.game-select`,
 * so a select reads identically inside a modal or a card. `size` varies only
 * density, never the chevron/focus treatment.
 */
export function Select({
  value,
  onChange,
  options,
  name,
  placeholder,
  disabled,
  size = 'md',
  className,
}: SelectProps) {
  const classes = ['game-select', size === 'md' ? 'game-select-md' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <select
      name={name}
      value={value}
      disabled={disabled}
      className={classes}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        const optLabel = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
}
