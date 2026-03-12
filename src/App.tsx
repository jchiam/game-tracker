import './App.css';
import { Navbar } from '@/components/Navbar';
import { HsrPage } from '@/pages/hsr/HsrPage';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { session, isAuthLoading, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="layout">
      <Navbar
        userEmail={session?.user?.email}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />
      <HsrPage
        session={session}
        isAuthLoading={isAuthLoading}
        onSignIn={signInWithGoogle}
      />
    </div>
  );
}

export default App;
