import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthGate } from '@/components/AuthGate';
import { LoadErrorState } from '@/components/LoadErrorState';
import { SavingToast } from '@/components/SavingToast';
import './RosterPageLayout.css';

interface RosterPageLayoutProps {
  title: string;
  subtitle: string;
  /** Label for the second view tab — e.g. "Lineups" or "Parties". */
  secondViewLabel: string;
  view: 'roster' | 'second';
  onViewChange: (view: 'roster' | 'second') => void;

  // Auth / load lifecycle flags driving the roster render ladder
  session: Session | null;
  isAuthLoading: boolean;
  isInitialLoad: boolean;
  isLoadError: boolean;
  onRetry: () => void;
  onSignIn: () => void;

  hasTracked: boolean;
  hasMatches: boolean;
  emptyMessage: string;
  noMatchMessage: string;

  // Roster controls (shown only on the roster view when signed in)
  search: { value: string; placeholder: string; onChange: (value: string) => void };
  sort: { active: boolean; label: string; title: string; onToggle: () => void };
  add: { title: string; onClick: () => void; disabled: boolean };

  /** The mapped roster cards (rendered only when there are matches). */
  cards: ReactNode;
  /** The parties/lineups tab content. */
  partiesTab: ReactNode;
  pendingSaveCount: number;
  /** Extra overlays the page owns — add modal, equipment editor modal, etc. */
  children?: ReactNode;
}

/**
 * Shared shell for the per-game roster pages. Concentrates the header, view
 * selector, search/sort controls, the auth/load/empty/no-match render ladder,
 * and the saving toast. Each game stays a thin wrapper that owns its search and
 * sort state, builds its own cards, and passes them in as slots — the layout is
 * controlled and presentational.
 */
export function RosterPageLayout({
  title,
  subtitle,
  secondViewLabel,
  view,
  onViewChange,
  session,
  isAuthLoading,
  isInitialLoad,
  isLoadError,
  onRetry,
  onSignIn,
  hasTracked,
  hasMatches,
  emptyMessage,
  noMatchMessage,
  search,
  sort,
  add,
  cards,
  partiesTab,
  pendingSaveCount,
  children,
}: RosterPageLayoutProps) {
  return (
    <main className="main-content">
      <header className="hero">
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>

        <div className="view-selector">
          <button
            className={`view-btn ${view === 'roster' ? 'active' : ''}`}
            onClick={() => onViewChange('roster')}
          >
            Roster
          </button>
          <button
            className={`view-btn ${view === 'second' ? 'active' : ''}`}
            onClick={() => onViewChange('second')}
          >
            {secondViewLabel}
          </button>
        </div>

        {view === 'roster' && session && (
          <div className="roster-controls">
            {hasTracked && (
              <>
                <input
                  type="text"
                  name="roster-search"
                  className="search-input"
                  placeholder={search.placeholder}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                />
                <button
                  className={`sort-btn ${sort.active ? 'active' : ''}`}
                  onClick={sort.onToggle}
                  title={sort.title}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 3h10M2 7h6M2 11h3" />
                    <path d="M10 6v6M10 12l-2-2M10 12l2-2" />
                  </svg>
                  <span className="sort-btn-label">{sort.label}</span>
                </button>
              </>
            )}
            <button
              className="roster-add-btn"
              onClick={add.onClick}
              title={add.title}
              disabled={add.disabled}
            >
              +
            </button>
          </div>
        )}
      </header>

      {view === 'roster' ? (
        <section className="roster-grid">
          {isAuthLoading ? (
            <div className="empty-state">
              <p>Authenticating...</p>
            </div>
          ) : isInitialLoad && session ? (
            <div className="empty-state">
              <p>Loading database sync...</p>
            </div>
          ) : isLoadError ? (
            <LoadErrorState onRetry={onRetry} />
          ) : !session ? (
            <AuthGate onSignIn={onSignIn} />
          ) : !hasTracked ? (
            <div className="empty-state">
              <p>{emptyMessage}</p>
            </div>
          ) : !hasMatches ? (
            <div className="empty-state">
              <p>{noMatchMessage}</p>
            </div>
          ) : (
            cards
          )}
        </section>
      ) : (
        partiesTab
      )}

      <SavingToast visible={pendingSaveCount > 0} />
      {children}
    </main>
  );
}
