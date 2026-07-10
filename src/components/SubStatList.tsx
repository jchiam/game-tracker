import { Select } from './Select';

export interface SubStatValue {
  type: string;
  value: string;
}

/** A row option — a bare string (value === label) or a distinct value/label pair. */
export type StatOption = string | { value: string; label: string };

/** The stored value of an option, whether it's a bare string or a value/label pair. */
const optionValue = (o: StatOption): string => (typeof o === 'string' ? o : o.value);

interface SubStatBaseProps {
  /** Selectable stat options for every row (bare strings or `{ value, label }` pairs). */
  options: readonly StatOption[];
  /** Prefix for row control `name`s — `${namePrefix}-type-${i}` / `${namePrefix}-value-${i}`. */
  namePrefix: string;
  /** Row cap; the add button hides at the cap. Default 4. */
  max?: number;
  /** Add-button label. Default "+ Add Substat". */
  addLabel?: string;
  /** Optional section label rendered above the rows. */
  label?: string;
  /** Option values omitted from every row except a row whose own value is already that value. */
  excludeValues?: readonly string[];
}

interface StatOnlyProps extends SubStatBaseProps {
  variant: 'stat-only';
  values: string[];
  onChange: (values: string[]) => void;
}

interface StatValueProps extends SubStatBaseProps {
  variant: 'stat-value';
  values: SubStatValue[];
  onChange: (values: SubStatValue[]) => void;
  /** Placeholder for the value input. Default "Value". */
  placeholder?: string;
}

type SubStatListProps = StatOnlyProps | StatValueProps;

/**
 * A bounded, repeatable stat list with two row shapes:
 * - `stat-only` — a stat `Select` per row (`string[]`).
 * - `stat-value` — a stat `Select` plus a free-text value input (`{ type, value }[]`).
 *
 * Treats `values` as immutable — add/update/remove each emit a fresh array.
 */
export function SubStatList(props: SubStatListProps) {
  const { options, namePrefix, max = 4, addLabel = '+ Add Substat', label, excludeValues } = props;

  // A row offers every non-excluded option, plus its own current value (so an
  // already-chosen-but-now-conflicting stat stays visible until the user changes it).
  const rowOptions = (current: string): readonly StatOption[] =>
    excludeValues && excludeValues.length > 0
      ? options.filter((o) => optionValue(o) === current || !excludeValues.includes(optionValue(o)))
      : options;

  const firstOption = options.find((o) => !excludeValues?.includes(optionValue(o))) ?? options[0];
  const firstAllowed = firstOption === undefined ? '' : optionValue(firstOption);

  const atCap = props.values.length >= max;

  return (
    <div className="substats-section">
      {label && <label>{label}</label>}

      {props.variant === 'stat-value'
        ? props.values.map((row, idx) => (
            <div key={idx} className="substat-row stat-value">
              <Select
                name={`${namePrefix}-type-${idx}`}
                value={row.type}
                placeholder="- Stat -"
                options={rowOptions(row.type)}
                onChange={(type) =>
                  props.onChange(props.values.map((r, i) => (i === idx ? { ...r, type } : r)))
                }
              />
              <input
                type="text"
                name={`${namePrefix}-value-${idx}`}
                className="substat-value-input"
                placeholder={props.placeholder ?? 'Value'}
                value={row.value}
                onChange={(e) =>
                  props.onChange(
                    props.values.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)),
                  )
                }
              />
              <button
                className="remove-substat"
                onClick={() => props.onChange(props.values.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            </div>
          ))
        : props.values.map((stat, idx) => (
            <div key={idx} className="substat-row stat-only">
              <Select
                name={`${namePrefix}-type-${idx}`}
                value={stat}
                placeholder="- Stat -"
                options={rowOptions(stat)}
                onChange={(type) =>
                  props.onChange(props.values.map((v, i) => (i === idx ? type : v)))
                }
              />
              <button
                className="remove-substat"
                onClick={() => props.onChange(props.values.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            </div>
          ))}

      {!atCap && (
        <button
          className="add-substat-btn"
          onClick={() => {
            if (props.variant === 'stat-value') {
              props.onChange([...props.values, { type: firstAllowed, value: '' }]);
            } else {
              props.onChange([...props.values, firstAllowed]);
            }
          }}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
