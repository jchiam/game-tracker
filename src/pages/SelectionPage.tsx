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
    description: 'Track arcanists, psychubes, and wilderness materials.',
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
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white relative overflow-hidden selection-bg">
      <div className="z-10 text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">Select Game</h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Choose a game to track your progress and manage your inventory.
        </p>
      </div>

      <div className="z-10 grid gap-8 md:grid-cols-2 max-w-4xl w-full">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameSelect(game.path)}
            className={`group relative h-64 overflow-hidden rounded-2xl border-2 border-transparent bg-gray-800 transition-all hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20`}
          >
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 ${game.bgClass}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent opacity-80 transition-opacity group-hover:opacity-70" />

            <div className="absolute bottom-0 left-0 p-6 text-left">
              <h2 className="mb-2 text-3xl font-bold text-white transition-colors group-hover:text-blue-400">
                {game.name}
              </h2>
              <p className="text-sm text-gray-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {game.description}
              </p>
            </div>

            {!session && (
              <div className="absolute right-4 top-4 rounded-full bg-blue-600/80 px-3 py-1 text-xs font-semibold backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                Requires Login
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
