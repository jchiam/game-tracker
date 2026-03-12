interface AuthGateProps {
  onSignIn: () => void;
}

export function AuthGate({ onSignIn }: AuthGateProps) {
  return (
    <div className="empty-state auth-gate">
      <h2>Welcome to the Astral Express</h2>
      <p>
        Securely sync your character builds, trace tracking, and relics across
        all your devices using Google Authentication.
      </p>
      <button className="primary-action auth-gate-btn" onClick={onSignIn}>
        Sign In with Google
      </button>
    </div>
  );
}
