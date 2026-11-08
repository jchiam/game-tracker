import { useId, type CSSProperties, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { RosterViewFilters } from '@/hooks/useRosterView';
import { AuthGate } from '@/components/AuthGate';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { SavingToast } from '@/components/SavingToast';
import './RosterPageLayout.css';

type RenderableChip = RosterViewFilters['rows'][number]['chips'][number];
type RenderableRow = RosterViewFilters['rows'][number];

function renderChip(chip: RenderableChip) {
  return (
    <button
      key={chip.key}
      className={`filter-chip ${chip.active ? 'active' : ''}`}
      onClick={chip.toggle}
      title={chip.title}
      aria-pressed={chip.active}
    >
      {chip.label}
    </button>
  );
}

/**
 * One matrix row of the filter block (Chip Facet in CONTEXT.md): a labelled
 * facet (`role="group"`) or an unlabelled run of bare chips. `one` rows join
 * their chips into a single segmented pill.
 */
function renderRow(row: RenderableRow) {
  const labelled = row.label !== undefined;
  return (
    <div
      key={row.key}
      className={`filter-facet ${labelled ? '' : 'is-unlabelled'}`}
      {...(labelled ? { role: 'group', 'aria-label': row.label } : {})}
    >
      {labelled && (
        <span className="filter-facet-label" aria-hidden="true">
          {row.label}
        </span>
      )}
      <div className={`filter-facet-chips mode-${row.mode}`}>{row.chips.map(renderChip)}</div>
    </div>
  );
}

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

  /**
   * Predicate-filter chips from `useRosterView`; the layout renders the
   * `.filter-row` between the controls and the card grid. Omit for games
   * without chips.
   */
  filters?: RosterViewFilters;
  /** The mapped roster cards (rendered only when there are matches). */
  cards: ReactNode;
  /** The second-view content — parties/lineups for roster games, completion for collections. */
  secondView: ReactNode;
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
  filters,
  cards,
  secondView,
  pendingSaveCount,
  children,
}: RosterPageLayoutProps) {
  // Disclosure target for the collapsible filter matrix (aria-controls).
  const filterMatrixId = useId();
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
          <div className="roster-toolbar">
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
            {hasTracked && filters && (
              <div
                className="filter-block"
                style={{ '--filter-chip-accent': filters.accent } as CSSProperties}
              >
                {filters.collapsible && (
                  <div className="filter-header">
                    <button
                      className="filter-chip filter-toggle"
                      aria-expanded={filters.open}
                      aria-controls={filterMatrixId}
                      onClick={filters.toggleOpen}
                    >
                      Filters
                      {filters.activeCount > 0 && (
                        <span className="filter-toggle-count">{filters.activeCount}</span>
                      )}
                      <span className="filter-toggle-chevron" aria-hidden="true">
                        ▾
                      </span>
                    </button>
                    {!filters.open &&
                      filters.active.map((chip) => (
                        <button
                          key={chip.key}
                          className="filter-chip active filter-summary"
                          aria-label={`Remove filter ${chip.label}`}
                          onClick={chip.remove}
                        >
                          {chip.label}
                          <span className="filter-summary-x" aria-hidden="true">
                            ×
                          </span>
                        </button>
                      ))}
                  </div>
                )}
                {(!filters.collapsible || filters.open) && (
                  <div id={filterMatrixId} className="filter-row">
                    {filters.rows.map(renderRow)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {view === 'roster' ? (
        <section className="roster-grid">
          {isAuthLoading ? (
            <LoadingState label="Checking sign-in…" />
          ) : isInitialLoad && session ? (
            <LoadingState label="Loading your roster…" />
          ) : isLoadError ? (
            <ErrorState message="Couldn't load your roster." onRetry={onRetry} />
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
        secondView
      )}

      <SavingToast visible={pendingSaveCount > 0} />
      {children}
    </main>
  );
}
