interface LoadErrorStateProps {
  onRetry: () => void;
}

export function LoadErrorState({ onRetry }: LoadErrorStateProps) {
  return (
    <div className="empty-state">
      <p>Failed to load data. Please check your connection and try again.</p>
      <button className="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
