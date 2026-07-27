import { Suspense } from 'react';
import { Routes, Route } from 'react-router';
import './App.css';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/ToastContainer';
import { SelectionPage } from '@/pages/SelectionPage';
import { useAuth } from '@/hooks/useAuth';
import { GAMES } from '@/lib/games';

function App() {
  const { session, isAuthLoading, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="layout">
      <Navbar userEmail={session?.user?.email} onSignIn={signInWithGoogle} onSignOut={signOut} />
      <ToastContainer />
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="/"
            element={
              <SelectionPage
                session={session}
                isAuthLoading={isAuthLoading}
                signInWithGoogle={signInWithGoogle}
              />
            }
          />
          {GAMES.map((game) => (
            <Route
              key={game.id}
              path={game.path}
              element={
                <game.Page
                  session={session}
                  isAuthLoading={isAuthLoading}
                  onSignIn={signInWithGoogle}
                />
              }
            />
          ))}
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
