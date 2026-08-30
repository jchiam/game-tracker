import { useState, type CSSProperties } from 'react';
import { getPreviewStyle, getProgressStyle } from '@/utils/progressGradient';

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
  /**
   * How the selection is *rendered* — orthogonal to which palette colours it.
   * `exact` (default) lights only the selected option. `cumulative` renders every
   * rung from the first through the selected one as attained, for ladders where
   * each rung is a prerequisite of the next (ZZZ Core Skill).
   */
  fill?: 'exact' | 'cumulative';
  name?: string;
  disabled?: boolean;
  size?: 'md' | 'compact';
  /** Applied to the button-row container so a host keeps its row-wrapper class. */
  className?: string;
}

/** How one rung renders, once selection and any hover/focus preview are resolved. */
type RungState = 'attained' | 'add' | 'drop' | 'empty';

/**
 * A row of pill buttons over the canonical `.toggle-btn` base. Consolidates the
 * rarity / tier / phase / portrait / euphoria / amplification rows.
 *
 * Selection is **single-valued**: exactly one option is selected — the one whose
 * `value` matches — and `onChange` emits that option's value. Active colour is
 * either a per-option `modifier` class (`static`) or the shared investment
 * gradient computed from each option's position (`investment`) — never passed in
 * by the host.
 *
 * `fill="cumulative"` changes only the rendering, not the selection: rungs up to
 * the selected one all render attained, and hovering or focusing a rung previews
 * the whole range from the first rung — what a click would add, or give up —
 * rather than highlighting one rung in isolation.
 */
export function SegmentedButtons({
  options,
  value,
  onChange,
  allowDeselect,
  coloring = 'static',
  fill = 'exact',
  name,
  disabled,
  size = 'md',
  className,
}: SegmentedButtonsProps) {
  const span = Math.max(1, options.length - 1);
  const cumulative = fill === 'cumulative';

  // Pointer and keyboard both drive the same range preview, so the affordance is
  // not pointer-only. Pointer wins when both are set (the pointer is what moved).
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const previewIdx = cumulative ? (hoverIdx ?? focusIdx) : null;

  const activeIdx = options.findIndex((opt) => opt.value === value);

  /**
   * Resting: rungs 0..activeIdx are attained. Preview above the selection marks
   * the gained rungs `add`; preview below it marks the rungs that would be given
   * up `drop`; previewing the selected rung under `allowDeselect` drops the whole
   * run, because that click clears it.
   */
  function rungStateAt(idx: number): RungState {
    if (!cumulative) return idx === activeIdx ? 'attained' : 'empty';

    if (previewIdx !== null) {
      if (previewIdx > activeIdx) {
        if (idx <= activeIdx) return 'attained';
        return idx <= previewIdx ? 'add' : 'empty';
      }
      if (previewIdx < activeIdx) {
        if (idx <= previewIdx) return 'attained';
        return idx <= activeIdx ? 'drop' : 'empty';
      }
      if (allowDeselect && activeIdx >= 0) return idx <= activeIdx ? 'drop' : 'empty';
    }

    return idx <= activeIdx ? 'attained' : 'empty';
  }

  return (
    <div
      className={['segmented-buttons', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={name}
      onMouseLeave={cumulative ? () => setHoverIdx(null) : undefined}
    >
      {options.map((opt, idx) => {
        const isActive = opt.value === value;
        const rungState = rungStateAt(idx);
        // What the button *reads* as owned — the whole attained run in cumulative
        // mode, the single selection otherwise.
        const isAttained = rungState === 'attained';

        // `drop` deliberately takes no inline hue: the gradient colour is exactly
        // what the click would remove, so `.rung-drop`'s neutral tokens paint it.
        const gradientStyle: CSSProperties | undefined =
          coloring === 'investment' && (isAttained || rungState === 'add')
            ? (() => {
                const ps =
                  rungState === 'add'
                    ? getPreviewStyle(idx, 0, span)
                    : getProgressStyle(idx, 0, span);
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
          isAttained ? 'active' : '',
          // `.is-rung` opts the button out of the base per-button hover, whose
          // single-button highlight would contradict the range preview.
          cumulative ? 'is-rung' : '',
          cumulative && rungState !== 'empty' ? `rung-${rungState}` : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={opt.value}
            className={classes}
            style={gradientStyle}
            disabled={disabled}
            title={opt.label}
            aria-pressed={isAttained}
            onMouseEnter={cumulative ? () => setHoverIdx(idx) : undefined}
            onFocus={cumulative ? () => setFocusIdx(idx) : undefined}
            onBlur={cumulative ? () => setFocusIdx(null) : undefined}
            onClick={() => {
              if (allowDeselect && isActive) onChange(null);
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
