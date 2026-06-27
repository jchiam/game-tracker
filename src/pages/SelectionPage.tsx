import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import './SelectionPage.css';

const GAMES = [
  {
    id: 'honkai-star-rail',
    name: 'Honkai Star Rail',
    path: '/honkai-star-rail',
    bgClass: 'bg-honkai-star-rail-sel',
    imageUrl: '/assets/honkai-star-rail/selection-cover.png',
    description: 'Track trailblazers, relics, and warp progress.',
    tag: 'HoYoverse',
  },
  {
    id: 'reverse-1999',
    name: 'Reverse: 1999',
    path: '/reverse-1999',
    bgClass: 'bg-r1999-sel',
    imageUrl: '/assets/reverse-1999/selection-cover.jpg',
    description: 'Track arcanists, psychubes, and wilderness materials.',
    tag: 'Bluepoch',
  },
  {
    id: 'neverness-to-everness',
    name: 'Neverness to Everness',
    path: '/neverness-to-everness',
    bgClass: 'bg-n2e-sel',
    imageUrl: '/assets/neverness-to-everness/selection-cover.png',
    description: 'Track espers, awakenings, and team compositions.',
    tag: 'Hotta Studio',
  },
  {
    id: 'arknights-endfield',
    name: 'Arknights: Endfield',
    path: '/arknights-endfield',
    bgClass: 'bg-ae-sel',
    imageUrl: '/assets/arknights-endfield/selection-cover.png',
    description: 'Track operators, levels, and squad compositions.',
    tag: 'Hypergryph',
  },
];

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
    return (
      <div className="selection-empty">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <main className="main-content" style={{ minHeight: '100vh', padding: 'var(--spacing-xl)' }}>
      <header className="selection-hero">
        <h1 className="selection-title">Select Game</h1>
        <p className="selection-subtitle">
          Choose a game to track your progress and manage your inventory.
        </p>
      </header>

      <section className="selection-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameSelect(game.path)}
            className="selection-card"
          >
            <div className={`selection-card-header ${game.bgClass}`}>
              <img
                src={game.imageUrl}
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
                <h2 className="game-name">{game.name}</h2>
                <span className="game-tag-badge">{game.tag}</span>
              </div>
              <p className="game-description">{game.description}</p>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}
