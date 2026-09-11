interface ErrorStateProps {
  /** Cause-neutral description of what failed — e.g. "Couldn't load your roster." */
  message: string;
  /** Recovery action. Omit to render the message without a button. */
  onRetry?: () => void;
  /** Button label; defaults to "Retry". */
  retryLabel?: string;
}

/**
 * Shared page-level error surface: warning glyph, message, optional retry.
 * Announces via `role="alert"`. Visually distinct from both `.empty-state`
 * (dashed, "nothing here") and `.loading-state` (borderless, "working") —
 * a failure must never read as empty content.
 */
export function ErrorState({ message, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state-glyph" aria-hidden="true">
        ⚠
      </span>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button className="btn primary-action" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
