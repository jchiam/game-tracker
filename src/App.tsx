import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/ToastContainer';
import { SelectionPage } from '@/pages/SelectionPage';
import { useAuth } from '@/hooks/useAuth';

const HsrPage = lazy(() =>
  import('@/pages/honkai-star-rail/HsrPage').then((m) => ({ default: m.HsrPage })),
);
const Reverse1999Page = lazy(() =>
  import('@/pages/reverse1999/Reverse1999Page').then((m) => ({ default: m.Reverse1999Page })),
);
const N2ePage = lazy(() =>
  import('@/pages/neverness-to-everness/N2ePage').then((m) => ({ default: m.N2ePage })),
);
const ArknightsEndfieldPage = lazy(() =>
  import('@/pages/arknights-endfield/ArknightsEndfieldPage').then((m) => ({
    default: m.ArknightsEndfieldPage,
  })),
);

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
          <Route
            path="/honkai-star-rail"
            element={
              <HsrPage
                session={session}
                isAuthLoading={isAuthLoading}
                onSignIn={signInWithGoogle}
              />
            }
          />
          <Route
            path="/reverse-1999"
            element={
              <Reverse1999Page
                session={session}
                isAuthLoading={isAuthLoading}
                onSignIn={signInWithGoogle}
              />
            }
          />
          <Route
            path="/neverness-to-everness"
            element={
              <N2ePage
                session={session}
                isAuthLoading={isAuthLoading}
                onSignIn={signInWithGoogle}
              />
            }
          />
          <Route
            path="/arknights-endfield"
            element={
              <ArknightsEndfieldPage
                session={session}
                isAuthLoading={isAuthLoading}
                onSignIn={signInWithGoogle}
              />
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
