import { AuthGate } from '@/components/AuthGate';
import type { Session } from '@supabase/supabase-js';

interface Reverse1999PageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function Reverse1999Page({ session, isAuthLoading, onSignIn }: Reverse1999PageProps) {
  return (
    <main className="main-content">
      <header className="hero">
        <h1 className="title">Reverse: 1999 Arcanists</h1>
        <p className="subtitle">Track your arcanists, psychubes, and materials.</p>
        <div className="action-group">
          <button className="secondary-action" disabled>
            Force Sync Arcanists
          </button>
          {session && <button className="primary-action">Add Arcanist</button>}
        </div>
      </header>

      <section className="roster-grid">
        {isAuthLoading ? (
          <div className="empty-state">
            <p>Authenticating...</p>
          </div>
        ) : !session ? (
          <AuthGate onSignIn={onSignIn} />
        ) : (
          <div className="empty-state">
            <p>No arcanists tracked yet. Click "Add Arcanist" to begin!</p>
          </div>
        )}
      </section>
    </main>
  );
}
