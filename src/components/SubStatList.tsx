import { Select } from './Select';

/** A row option — a bare string (value === label) or a distinct value/label pair. */
export type StatOption = string | { value: string; label: string };

/** The stored value of an option, whether it's a bare string or a value/label pair. */
const optionValue = (o: StatOption): string => (typeof o === 'string' ? o : o.value);

interface SubStatListProps {
  /** Selectable stat options for every row (bare strings or `{ value, label }` pairs). */
  options: readonly StatOption[];
  /** The selected stat-type ids, one per row. */
  values: string[];
  onChange: (values: string[]) => void;
  /** Prefix for row control `name`s — `${namePrefix}-type-${i}`. */
  namePrefix: string;
  /** Row cap; the add button hides at the cap. Default 4. */
  max?: number;
  /** Add-button label. Default "+ Add Substat". */
  addLabel?: string;
  /** Optional section label rendered above the rows. */
  label?: string;
  /** Option values omitted from every row except a row whose own value is already that value. */
  excludeValues?: readonly string[];
  /** When true, row selects are disabled and the add button is suppressed. */
  disabled?: boolean;
}

/**
 * A bounded, repeatable list of stat-type rows: each row is a stat `Select`, values are
 * `string[]` (stat-type ids). Substats are tracked as types only — no per-row value.
 *
 * Treats `values` as immutable — add/update/remove each emit a fresh array.
 */
export function SubStatList({
  options,
  values,
  onChange,
  namePrefix,
  max = 4,
  addLabel = '+ Add Substat',
  label,
  excludeValues,
  disabled,
}: SubStatListProps) {
  // A row offers every non-excluded option, plus its own current value (so an
  // already-chosen-but-now-conflicting stat stays visible until the user changes it).
  const rowOptions = (current: string): readonly StatOption[] =>
    excludeValues && excludeValues.length > 0
      ? options.filter((o) => optionValue(o) === current || !excludeValues.includes(optionValue(o)))
      : options;

  const firstOption = options.find((o) => !excludeValues?.includes(optionValue(o))) ?? options[0];
  const firstAllowed = firstOption === undefined ? '' : optionValue(firstOption);

  const atCap = values.length >= max;

  return (
    <div className="substats-section">
      {label && <label>{label}</label>}

      {values.map((stat, idx) => (
        <div key={idx} className="substat-row stat-only">
          <Select
            name={`${namePrefix}-type-${idx}`}
            value={stat}
            placeholder="- Stat -"
            options={rowOptions(stat)}
            disabled={disabled}
            onChange={(type) => onChange(values.map((v, i) => (i === idx ? type : v)))}
          />
          <button
            className="remove-substat"
            onClick={() => onChange(values.filter((_, i) => i !== idx))}
          >
            ✕
          </button>
        </div>
      ))}

      {!atCap && !disabled && (
        <button className="add-substat-btn" onClick={() => onChange([...values, firstAllowed])}>
          {addLabel}
        </button>
      )}
    </div>
  );
}
