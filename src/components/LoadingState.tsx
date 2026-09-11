interface LoadingStateProps {
  /** Status text shown below the spinner — e.g. "Loading your roster…". */
  label: string;
}

/**
 * Shared animated loading indicator: spinner-dot trio above a status label.
 * Visually distinct from `.empty-state` (no dashed border) — dashed boxes are
 * reserved for true empty/no-match states. Announces via `role="status"`.
 */
export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state-dots" aria-hidden="true">
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
      <p>{label}</p>
    </div>
  );
}
