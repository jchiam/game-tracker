import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './GameSwitcher.css';

const GAMES = [
  {
    id: 'hsr',
    name: 'Honkai Star Rail',
    path: '/honkai-star-rail',
    icon: '/assets/icons/hsr-icon.webp',
    color: '#00ccff',
  },
  {
    id: 'r1999',
    name: 'Reverse: 1999',
    path: '/reverse-1999',
    icon: '/assets/icons/r1999-icon.png',
    color: '#deb887',
  },
  {
    id: 'n2e',
    name: 'Neverness to Everness',
    path: '/neverness-to-everness',
    icon: '/assets/icons/n2e-icon.webp',
    color: '#7b2dff',
  },
  {
    id: 'endfield',
    name: 'Arknights: Endfield',
    path: '/arknights-endfield',
    icon: '/assets/icons/endfield-icon.webp',
    color: '#47c7fd',
  },
];

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
        aria-label="Switch Game"
      >
        <div className="current-game-icon-container">
          <img src={currentGame?.icon} alt="" className="current-game-icon-img" />
        </div>
        <span className="chevron">▾</span>
      </button>

      {isOpen && (
        <div className="switcher-dropdown">
          <div className="dropdown-header">Switch Game</div>
          <div className="dropdown-list">
            {GAMES.map((game) => (
              <Link
                key={game.id}
                to={game.path}
                className={`dropdown-item ${location.pathname.startsWith(game.path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <div className="game-icon-container">
                  <img src={game.icon} alt="" className="game-icon-img" />
                </div>
                <span className="game-name">{game.name}</span>
                {location.pathname.startsWith(game.path) && (
                  <span className="active-indicator">●</span>
                )}
              </Link>
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
