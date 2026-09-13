import type { Session } from '@supabase/supabase-js';
import type { DgmTrackedDevice } from '@/types';
import { computeCompletion, type CompletionRow } from '@/pages/digimon/completion';
import { AuthGate } from '@/components/AuthGate';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { getProgressStyle } from '@/utils/progressGradient';
import './CompletionView.css';

interface CompletionViewProps {
  trackedDevices: DgmTrackedDevice[];
  session: Session | null;
  isAuthLoading: boolean;
  isInitialLoad: boolean;
  isLoadError: boolean;
  onRetry: () => void;
  onSignIn: () => void;
}

/**
 * The collection modality's second view: owned-vs-catalog progress per product
 * line. A pure projection of the roster — nothing is fetched or persisted — so
 * it follows the roster's own load ladder.
 */
export function CompletionView({
  trackedDevices,
  session,
  isAuthLoading,
  isInitialLoad,
  isLoadError,
  onRetry,
  onSignIn,
}: CompletionViewProps) {
  if (isAuthLoading) return <LoadingState label="Checking sign-in…" />;
  if (!session) return <AuthGate onSignIn={onSignIn} />;
  if (isInitialLoad) return <LoadingState label="Loading your collection…" />;
  if (isLoadError) return <ErrorState message="Couldn't load your collection." onRetry={onRetry} />;

  const [overall, ...lines] = computeCompletion(trackedDevices);

  const renderRow = (row: CompletionRow, className = '') => {
    const ps = getProgressStyle(row.owned, 0, row.total);
    return (
      <li key={row.label} className={`completion-row ${className}`.trim()}>
        <div className="completion-row-header">
          <span className="completion-row-label">{row.label}</span>
          <span className="completion-row-count" style={{ color: ps.color }}>
            {row.owned} / {row.total}
          </span>
          <span className="completion-row-percent" style={{ color: ps.color }}>
            {row.percent}%
          </span>
        </div>
        <div
          className="completion-bar"
          role="progressbar"
          aria-label={`${row.label} completion`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={row.percent}
        >
          <div className="completion-bar-fill" style={{ width: `${row.percent}%` }} />
        </div>
      </li>
    );
  };

  return (
    <section className="completion-view" aria-label="Collection completion">
      <ul className="completion-list">
        {renderRow(overall, 'completion-row-overall')}
        {lines.map((row) => renderRow(row))}
      </ul>
    </section>
  );
}
