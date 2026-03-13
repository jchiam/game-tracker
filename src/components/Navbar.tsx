import './Navbar.css';

interface NavbarProps {
  userEmail?: string;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Navbar({ userEmail, onSignIn, onSignOut }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">✧</span> Astral Express Tracker
      </div>
      <div className="nav-auth">
        {userEmail ? (
          <>
            <span className="user-email">{userEmail}</span>
            <button className="secondary-action" onClick={onSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button className="primary-action" onClick={onSignIn}>
            Sign In with Google
          </button>
        )}
      </div>
    </nav>
  );
}
