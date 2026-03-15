import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
];

export function SelectionPage() {
  const { session, signInWithGoogle, isAuthLoading } = useAuth();
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
      <div className="empty-state">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <main className="main-content" style={{ minHeight: '100vh', padding: 'var(--spacing-xl)' }}>
      <header className="hero" style={{ marginBottom: '3rem' }}>
        <h1 className="title">Select Game</h1>
        <p className="subtitle">Choose a game to track your progress and manage your inventory.</p>
      </header>

      <section
        className="roster-grid"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        {GAMES.map((game) => (
          <button key={game.id} onClick={() => handleGameSelect(game.path)} className="game-card">
            <div className={`game-card-header ${game.bgClass}`}>
              <img
                src={game.imageUrl}
                alt={game.name}
                className="game-character-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${game.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
                }}
              />
              <div className="game-card-overlay"></div>

              {!session && (
                <div className="game-card-badges">
                  <span className="requires-login-badge">Requires Login</span>
                </div>
              )}
            </div>

            <div className="game-card-body">
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
