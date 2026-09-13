import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { GAMES } from '@/lib/games';
import { gamesByModality } from '@/lib/modalities';
import './GameSwitcher.css';

export function GameSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show on the selection page - move AFTER hooks
  if (location.pathname === '/') return null;

  const currentGame = GAMES.find((g) => location.pathname.startsWith(g.path));

  return (
    <div className="game-switcher" ref={dropdownRef}>
      <button
        className={`switcher-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch Tracker"
      >
        <div className="current-game-icon-container">
          <img src={currentGame?.icon} alt="" className="current-game-icon-img" />
        </div>
        <span className="chevron">▾</span>
      </button>

      {isOpen && (
        <div className="switcher-dropdown">
          <div className="dropdown-header">Switch Tracker</div>
          <div className="dropdown-list">
            {gamesByModality().map(({ modality, games }) => (
              <div key={modality.id} className="dropdown-group">
                <div className="dropdown-group-label">{modality.title}</div>
                {games.map((game) => (
                  <Link
                    key={game.id}
                    to={game.path}
                    className={`dropdown-item ${location.pathname.startsWith(game.path) ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="game-icon-container">
                      <img src={game.icon} alt="" className="game-icon-img" />
                    </div>
                    <span className="switcher-game-name">{game.name}</span>
                    {location.pathname.startsWith(game.path) && (
                      <span className="active-indicator">●</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="dropdown-footer">
            <Link to="/" className="back-link" onClick={() => setIsOpen(false)}>
              Back to Selection
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
