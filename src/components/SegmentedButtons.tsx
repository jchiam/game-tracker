import type { CSSProperties } from 'react';
import { getProgressStyle } from '@/utils/progressGradient';

export interface SegmentedOption {
  value: string;
  label: string;
  /** Extra class hook for `coloring="static"` rows (e.g. `tier-splus`), supplied by game CSS. */
  modifier?: string;
}

interface SegmentedButtonsProps {
  options: readonly SegmentedOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Clicking the active option clears the selection to `null`. */
  allowDeselect?: boolean;
  /** `static` = per-option `modifier` class; `investment` = internal progress gradient. */
  coloring?: 'static' | 'investment';
  name?: string;
  disabled?: boolean;
  size?: 'md' | 'compact';
  /** Applied to the button-row container so a host keeps its row-wrapper class. */
  className?: string;
}

/**
 * A row of pill buttons over the canonical `.toggle-btn` base. Consolidates the
 * rarity / tier / phase / portrait / euphoria / amplification rows.
 *
 * Selection is **single-exact**: exactly one option is active — the one whose
 * `value` matches. Active colour is either a per-option `modifier` class
 * (`static`) or the shared investment gradient computed from each option's
 * position (`investment`) — never passed in by the host.
 */
export function SegmentedButtons({
  options,
  value,
  onChange,
  allowDeselect,
  coloring = 'static',
  name,
  disabled,
  size = 'md',
  className,
}: SegmentedButtonsProps) {
  const span = Math.max(1, options.length - 1);

  const containerClass = ['segmented-buttons', className].filter(Boolean).join(' ');

  return (
    <div className={containerClass} role="group" aria-label={name}>
      {options.map((opt, idx) => {
        const isActive = opt.value === value;

        const investmentStyle: CSSProperties | undefined =
          coloring === 'investment' && isActive
            ? (() => {
                const ps = getProgressStyle(idx, 0, span);
                return { background: ps.activeBg, borderColor: ps.borderColor, color: ps.color };
              })()
            : undefined;

        // `modifier` is a plain class hook (e.g. `tier-s`, `portrait-reset`), emitted in
        // both colourings: under `static` the game CSS colours the active button by it;
        // under `investment` it can still carry non-colour decoration (the component owns
        // the colour, so a modifier never sets one).
        const classes = [
          'toggle-btn',
          size === 'compact' ? 'compact' : '',
          opt.modifier,
          isActive ? 'active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={opt.value}
            className={classes}
            style={investmentStyle}
            disabled={disabled}
            title={opt.label}
            onClick={() => {
              if (allowDeselect && opt.value === value) onChange(null);
              else onChange(opt.value);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
