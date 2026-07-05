import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { getMugshotUrl } from '@/lib/imagekit';

interface GameCardShellProps {
  /** Display name — card title and image alt text. */
  name: string;
  /** Catalog image path; resolved to the CDN via getMugshotUrl. */
  imageUrl: string;
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
  /** Equipment one-liner of the collapsed summary. */
  summaryLine: ReactNode;
  /** Edit-mode sections, expanded when the edit toggle is active. */
  editBody: ReactNode;
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
  entityNoun,
  isFavorited,
  onToggleFavorite,
  onRemove,
  badges,
  headerExtra,
  summaryStats,
  summaryLine,
  editBody,
}: GameCardShellProps) {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // The collapse transitions are max-height based, so both budgets are measured
  // from the real content instead of per-game constants — conditional sections
  // (target-build displays, preference rows) can never clip the bottom. Budgets
  // are written straight to the card's CSS custom properties (no state, no
  // re-render) after every render, since slot content can change height freely.
  // The summary is only measured while expanded: collapsed it loses its padding,
  // so a mid-collapse measurement would shrink the reopen budget.
  const cardRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const editInnerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!isEditing && summaryRef.current) {
      card.style.setProperty(
        '--game-card-summary-max-height',
        `${summaryRef.current.scrollHeight}px`,
      );
    }
    if (editInnerRef.current) {
      card.style.setProperty(
        '--game-card-edit-max-height',
        `${editInnerRef.current.scrollHeight}px`,
      );
    }
  });

  return (
    <div className={`game-card ${isEditing ? 'is-editing' : ''}`} ref={cardRef}>
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
            src={getMugshotUrl(imageUrl)}
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
                onClick={() => setIsEditing((v) => !v)}
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

        <div className="game-card-static-summary" ref={summaryRef}>
          <div className="game-card-static-stats">{summaryStats}</div>
          <div className="game-card-static-line">{summaryLine}</div>
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
