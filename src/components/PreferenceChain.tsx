import type { StatPreference } from '@/types';
import './PreferenceChain.css';

/** An option for ranked-list mode, where the persisted value differs from the shown label. */
export interface RankedOption {
  value: string;
  label: string;
}

interface StatChainProps {
  /** Default mode: an ordered stat-priority chain joined by operators. */
  variant?: 'stat-chain';
  values: StatPreference[];
  options: readonly string[];
  onChange: (values: StatPreference[]) => void;
  /** Prefix for the select `name` attributes, e.g. "pref-sub-stat". */
  namePrefix: string;
}

interface RankedListProps {
  /** Ranked-list mode: an ordered list of values, no operators, reorderable. */
  variant: 'ranked-list';
  values: string[];
  options: readonly RankedOption[];
  onChange: (values: string[]) => void;
  namePrefix: string;
  /** Add-button label, defaults to "+ Add". */
  addLabel?: string;
}

type PreferenceChainProps = StatChainProps | RankedListProps;

/**
 * A preference list with two modes:
 *
 * - **stat-chain** (default): an ordered list of stats joined by operators
 *   (`>`, `>=`, `OR`). Owns the operator-fixup convention — appending sets the
 *   previous tail's operator to `>`; removing the tail clears the new tail's
 *   operator. Tail-only remove. Used by the HSR relic and N2E cartridge editors.
 * - **ranked-list**: an ordered, pure ranking with no operators — per-item remove,
 *   up/down reorder, and `{ value, label }` options so the persisted value (e.g. a
 *   weapon id) differs from the shown label. Used by the AE weapon-preference editor.
 */
export function PreferenceChain(props: PreferenceChainProps) {
  if (props.variant === 'ranked-list') {
    return <RankedList {...props} />;
  }
  return <StatChain {...props} />;
}

function StatChain({ values, options, onChange, namePrefix }: StatChainProps) {
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

function RankedList({ values, options, onChange, namePrefix, addLabel }: RankedListProps) {
  // The next addable option is the first one not already ranked (enforces dedupe at the UI).
  const nextOption = options.find((o) => !values.includes(o.value));

  const add = () => {
    if (!nextOption) return;
    onChange([...values, nextOption.value]);
  };

  const update = (idx: number, value: string) => {
    // Guard against picking a value already present in another row.
    if (values.some((v, i) => v === value && i !== idx)) return;
    onChange(values.map((v, i) => (i === idx ? value : v)));
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <>
      <div className="pref-chain pref-chain-ranked">
        {values.map((value, idx) => {
          // Each row offers its own value plus options not chosen by another row.
          const rowOptions = options.filter((o) => o.value === value || !values.includes(o.value));
          return (
            <div key={idx} className="pref-ranked-item">
              <span className="pref-rank">#{idx + 1}</span>
              <select
                name={`${namePrefix}-${idx}`}
                className="game-select"
                value={value}
                onChange={(e) => update(idx, e.target.value)}
              >
                {rowOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="pref-item-actions">
                <button
                  className="reorder-btn"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  title="Move up"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  className="reorder-btn"
                  onClick={() => move(idx, 1)}
                  disabled={idx === values.length - 1}
                  title="Move down"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button className="remove-pref-btn" onClick={() => remove(idx)} aria-label="Remove">
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button className="add-pref-btn" onClick={add} disabled={!nextOption}>
        {addLabel ?? '+ Add'}
      </button>
    </>
  );
}
