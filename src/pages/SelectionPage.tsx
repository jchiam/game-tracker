import { useNavigate } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { gamesByModality } from '@/lib/modalities';
import { LoadingState } from '@/components/LoadingState';
import './SelectionPage.css';

interface SelectionPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  signInWithGoogle: (path: string) => void;
}

export function SelectionPage({ session, isAuthLoading, signInWithGoogle }: SelectionPageProps) {
  const navigate = useNavigate();

  const handleGameSelect = (path: string) => {
    if (!session) {
      signInWithGoogle(path);
    } else {
      navigate(path);
    }
  };

  if (isAuthLoading) {
    return <LoadingState label="Checking sign-in…" />;
  }

  return (
    <main
      className="main-content selection-content"
      style={{ minHeight: '100vh', padding: 'var(--spacing-xl)' }}
    >
      <header className="selection-hero">
        <h1 className="selection-title">Your Trackers</h1>
        <p className="selection-subtitle">Pick something to track.</p>
      </header>

      {gamesByModality().map(({ modality, games }) => (
        <section key={modality.id} className="selection-section">
          <header className="selection-section-header">
            <h2 className="selection-section-title">{modality.title}</h2>
            <p className="selection-section-subtitle">{modality.subtitle}</p>
          </header>
          <div className="selection-grid">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.path)}
                className="selection-card"
              >
                <div className={`selection-card-header ${game.bgClass}`}>
                  <img
                    src={game.coverImage}
                    alt={game.name}
                    className="game-character-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${game.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
                    }}
                  />
                  <div className="selection-card-overlay"></div>

                  {!session && (
                    <div className="selection-card-badges">
                      <span className="requires-login-badge">Requires Login</span>
                    </div>
                  )}
                </div>

                <div className="selection-card-body">
                  <div className="game-title-row">
                    <h3 className="game-name">{game.name}</h3>
                    <span className="game-tag-badge">{game.developer}</span>
                  </div>
                  <p className="game-description">{game.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
