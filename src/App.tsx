import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Navbar } from '@/components/Navbar';
import { HsrPage } from '@/pages/hsr/HsrPage';
import { SelectionPage } from '@/pages/SelectionPage';
import { Reverse1999Page } from '@/pages/reverse1999/Reverse1999Page';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { session, isAuthLoading, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="layout">
      <Navbar userEmail={session?.user?.email} onSignIn={signInWithGoogle} onSignOut={signOut} />
      <Routes>
        <Route path="/" element={<SelectionPage />} />
        <Route
          path="/hsr"
          element={
            <HsrPage session={session} isAuthLoading={isAuthLoading} onSignIn={signInWithGoogle} />
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
      </Routes>
    </div>
  );
}

export default App;
