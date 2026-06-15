import type { StatPreference } from '@/types';

interface PreferenceChainProps {
  values: StatPreference[];
  options: readonly string[];
  onChange: (values: StatPreference[]) => void;
  /** Prefix for the select `name` attributes, e.g. "pref-sub-stat". */
  namePrefix: string;
}

/**
 * A stat-preference priority chain: an ordered list of stats joined by
 * operators (`>`, `>=`, `OR`). Owns the add/update/remove handlers and the
 * operator-fixup convention — appending sets the previous tail's operator to
 * `>`; removing the tail clears the new tail's operator. Shared by the relic
 * and cartridge editors.
 */
export function PreferenceChain({ values, options, onChange, namePrefix }: PreferenceChainProps) {
  const add = () => {
    const next = values.map((p) => ({ ...p }));
    if (next.length > 0) next[next.length - 1].operator = '>';
    next.push({ stat: options[0], operator: null, orderIndex: next.length });
    onChange(next);
  };

  const update = (idx: number, patch: Partial<StatPreference>) => {
    onChange(values.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const remove = (idx: number) => {
    const next = values.filter((_, i) => i !== idx).map((p) => ({ ...p }));
    if (next.length > 0) next[next.length - 1].operator = null;
    onChange(next);
  };

  return (
    <>
      <div className="pref-chain">
        {values.map((pref, idx) => (
          <div key={idx} className="pref-item">
            <select
              name={`${namePrefix}-${idx}`}
              value={pref.stat}
              onChange={(e) => update(idx, { stat: e.target.value })}
            >
              {options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {idx < values.length - 1 ? (
              <select
                name={`${namePrefix}-operator-${idx}`}
                className="operator-select"
                value={pref.operator || '>'}
                onChange={(e) => update(idx, { operator: e.target.value })}
              >
                <option value=">">&gt;</option>
                <option value=">=">&ge;</option>
                <option value="OR">OR</option>
              </select>
            ) : (
              <button className="remove-pref-btn" onClick={() => remove(idx)}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="add-pref-btn" onClick={add}>
        + Add Priority
      </button>
    </>
  );
}
