import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getMugshotUrl } from '@/lib/imagekit';
import { getProgressStyle } from '@/utils/progressGradient';

interface GameCardShellProps {
  /** Display name — card title and image alt text. */
  name: string;
  /** Catalog image path; resolved to the CDN via `resolveImage` (default getMugshotUrl). */
  imageUrl: string;
  /**
   * Overrides the header-image URL resolver for games whose stored assets need
   * a different CDN transform (ZZZ trims its full-body originals on the fly).
   */
  resolveImage?: (imageUrl: string) => string;
  /** Capitalised entity noun for button titles, e.g. "Character", "Arcanist", "Operator". */
  entityNoun: string;
  isFavorited: boolean;
  onToggleFavorite: (value: boolean) => void;
  onRemove: (e: React.MouseEvent) => void;
  /** GameBadge cluster shown bottom-left of the header. */
  badges: ReactNode;
  /** Optional extras (score badge, …) rendered left of the edit toggle. */
  headerExtra?: ReactNode;
  /** StatChip row of the collapsed summary. */
  summaryStats: ReactNode;
  /**
   * Equipment digest of the collapsed summary. A single node renders in one
   * `.game-card-static-line`; an array renders one `.game-card-static-line`
   * per entry, each independently nowrap/ellipsis truncated. By contract an
   * array always means "multiple lines" — no game passes an array as a single
   * line's content.
   */
  summaryLine: ReactNode | ReactNode[];
  /** Edit-mode sections, expanded when the edit toggle is active. */
  editBody: ReactNode;
  /**
   * Equipment-match score (0–100) driving the anodized temper edge — the card
   * wears the ramp colour at this score as a 3px crown. Omitted or negative
   * (the insufficient-data sentinel), the card renders with no edge.
   */
  temperScore?: number;
  /**
   * Opt into a fixed two-line reserve for the summary chip row. When true the
   * shell tags the card with `.reserve-summary-rows`; the `min-height` rule
   * lives once in card.css. Off by default — existing games are unaffected. The
   * reserve raises the measured summary content height, so the standard budget
   * measurement below picks it up with no separate path.
   */
  reserveSummaryRows?: boolean;
  /**
   * Fired when the edit toggle collapses edit mode (✓) — the card's release
   * point for projection stability. Pages wire it to
   * `projection.refreshBasis(id)`; the entity id stays at the call site so the
   * shell remains entity-agnostic.
   */
  onEditCommit?: () => void;
  /**
   * Ghost-tag copy when the card is held — its live data no longer matches
   * the active filter its basis snapshot still satisfies. Non-null dims the
   * card and renders the tag; null/omitted renders a normal card. Pages feed
   * `projection.heldReason(id)`.
   */
  heldReason?: string | null;
  /** Plays the exit animation — the card was released while no longer matching. */
  isExiting?: boolean;
  /** Fired when the exit animation completes; pages feed `projection.completeExit(id)`. */
  onExitEnd?: () => void;
}

/**
 * Shared structural shell for every game's roster card: header image with
 * loading spinner and ui-avatars fallback, favorite/remove/edit controls,
 * collapsed summary, and the summary ⇄ edit-body collapse mechanism.
 * Game cards supply only their game-unique content through the slots.
 */
export function GameCardShell({
  name,
  imageUrl,
  resolveImage = getMugshotUrl,
  entityNoun,
  isFavorited,
  onToggleFavorite,
  onRemove,
  badges,
  headerExtra,
  summaryStats,
  summaryLine,
  editBody,
  reserveSummaryRows = false,
  temperScore,
  onEditCommit,
  heldReason = null,
  isExiting = false,
  onExitEnd,
}: GameCardShellProps) {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // The collapse transitions are max-height based, so both budgets are measured
  // from the real content instead of per-game constants — conditional sections
  // (target-build displays, preference rows) can never clip the bottom. Budgets
  // are written straight to the card's CSS custom properties (no state, no
  // re-render) after every render, since slot content can change height freely.
  // Both measurements target an inner wrapper that carries the content's layout
  // (padding, gap) and is never itself height-capped — the outer element owns
  // the max-height clip, so its scrollHeight lies mid-transition (measuring the
  // summary while it reopened from edit mode used to shrink the budget and clip
  // the static line).
  const cardRef = useRef<HTMLDivElement>(null);
  const summaryInnerRef = useRef<HTMLDivElement>(null);
  const editInnerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    /* v8 ignore next -- defensive: the ref is attached to the always-rendered
       card div before layout effects run */
    if (!card) return;
    if (summaryInnerRef.current) {
      card.style.setProperty(
        '--game-card-summary-max-height',
        `${summaryInnerRef.current.scrollHeight}px`,
      );
    }
    if (editInnerRef.current) {
      card.style.setProperty(
        '--game-card-edit-max-height',
        `${editInnerRef.current.scrollHeight}px`,
      );
    }
  });

  // The anodized temper edge — the card's score position on the ramp, worn as
  // a 3px crown. Colour comes from the shared progress gradient so the edge,
  // score badge, and investment sliders all speak the same ramp.
  const hasTemperEdge = temperScore !== undefined && temperScore >= 0;
  const temperStyle = hasTemperEdge
    ? ({ '--temper': getProgressStyle(temperScore, 0, 100).color } as CSSProperties)
    : undefined;

  return (
    <div
      className={`game-card ${isEditing ? 'is-editing' : ''} ${
        reserveSummaryRows ? 'reserve-summary-rows' : ''
      } ${hasTemperEdge ? 'has-temper-edge' : ''} ${heldReason ? 'is-held' : ''} ${
        isExiting ? 'is-exiting' : ''
      }`}
      style={temperStyle}
      ref={cardRef}
      onAnimationEnd={
        /* v8 ignore next 5 -- jsdom: React's animation-event mapping never
           delivers animationend under jsdom, so this handler is only reachable
           in a real browser; eviction is covered via the exit fallback timer */
        isExiting
          ? (e) => {
              if (e.animationName === 'card-exit') onExitEnd?.();
            }
          : undefined
      }
    >
      {heldReason && <div className="game-card-held-tag">{heldReason}</div>}
      <div className="game-card-header">
        <div className="game-card-image-wrapper">
          {imgLoading && !imgError && (
            <div className="game-card-image-spinner">
              <div className="spinner-dot" />
              <div className="spinner-dot" />
              <div className="spinner-dot" />
            </div>
          )}
          <img
            src={resolveImage(imageUrl)}
            alt={name}
            className={`game-card-image ${imgLoading ? 'loading' : 'loaded'}`}
            onLoad={() => setImgLoading(false)}
            onError={(e) => {
              setImgLoading(false);
              setImgError(true);
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
            }}
          />
        </div>
        <div className="game-card-overlay"></div>
        <div className="game-card-controls">
          <div className="game-card-controls-top">
            <button
              className={`favorite-btn ${isFavorited ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(!isFavorited);
              }}
              title={isFavorited ? `Unfavorite ${entityNoun}` : `Favorite ${entityNoun}`}
            >
              {isFavorited ? '★' : '☆'}
            </button>
            <button className="remove-btn" onClick={onRemove} title={`Remove ${entityNoun}`}>
              ✕
            </button>
          </div>
          <div className="game-card-controls-bottom">
            <div className="game-card-badges">{badges}</div>
            <div className="game-card-header-actions">
              {headerExtra}
              <button
                className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
                onClick={() => {
                  setIsEditing((v) => !v);
                  if (isEditing) onEditCommit?.();
                }}
                title={isEditing ? 'Done editing' : 'Edit'}
              >
                {isEditing ? '✓' : '✎'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`game-card-body ${isEditing ? 'is-editing' : ''}`}>
        <h3 className="game-card-name">{name}</h3>

        <div className="game-card-static-summary">
          <div className="game-card-static-summary-inner" ref={summaryInnerRef}>
            <div className="game-card-static-stats">{summaryStats}</div>
            {(Array.isArray(summaryLine) ? summaryLine : [summaryLine]).map((line, i) => (
              <div className="game-card-static-line" key={i}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="game-card-edit-body" aria-hidden={!isEditing}>
          <div className="game-card-edit-body-inner" ref={editInnerRef}>
            {editBody}
          </div>
        </div>
      </div>
    </div>
  );
}
