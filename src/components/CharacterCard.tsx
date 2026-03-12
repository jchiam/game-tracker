import { type TrackedCharacter } from '../types';
import { type RelicSet } from '../data/relics';
import { ConfirmCheckbox } from './ConfirmCheckbox';
import './CharacterCard.css';

interface CharacterCardProps {
  char: TrackedCharacter;
  availableRelicSets: RelicSet[];
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onToggleTraces: (id: string, value: boolean) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onToggleRelic: (id: string, part: keyof TrackedCharacter['relics']) => void;
}

export function CharacterCard({
  char,
  availableRelicSets,
  onRemove,
  onUpdateLevel,
  onToggleTraces,
  onToggleFavorite,
  onToggleRelic,
}: CharacterCardProps) {
  return (
    <div className="character-card">
      <div className="card-header">
        <button 
          className={`favorite-btn ${char.isFavorited ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(char.id, !char.isFavorited); }}
          title={char.isFavorited ? "Unfavorite Character" : "Favorite Character"}
        >
          {char.isFavorited ? '★' : '☆'}
        </button>
        <img
          src={char.imageUrl}
          alt={char.name}
          className="character-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${char.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
          }}
        />
        <div className="card-header-overlay"></div>
        <span className={`element-badge element-${char.element.toLowerCase()}`}>{char.element}</span>
        <button className="remove-btn" onClick={(e) => onRemove(char.id, e)} title="Remove Character">✕</button>
      </div>
      <div className="card-body">
        <h3 className="character-name">{char.name}</h3>

        <div className="progress-section">
          <div className="section-header">
            <span>Level</span>
            <span className="section-value">{char.level} / 80</span>
          </div>
          <input
            type="range"
            min="1"
            max="80"
            value={char.level}
            onChange={(e) => onUpdateLevel(char.id, parseInt(e.target.value))}
            className="level-slider"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${(char.level / 80) * 100}%, rgba(255,255,255,0.1) ${(char.level / 80) * 100}%)`
            }}
          />
        </div>

        <div className="progress-section">
          <div className="section-header">Traces</div>
          <ConfirmCheckbox
            checked={char.tracesAttained}
            onChange={(val) => onToggleTraces(char.id, val)}
            label="All Traces Attained"
          />
        </div>

        <div className="progress-section">
          <div className="section-header">Relic Sets</div>
          <div className="relics-grid">
            {(['head', 'hands', 'body', 'feet', 'sphere', 'rope'] as const).map(relic => {
              const equipped = char.relics[relic];
              const isActive = equipped && equipped.setId;
              return (
                <div
                  key={relic}
                  className={`relic-slot ${isActive ? 'active' : ''}`}
                  onClick={() => onToggleRelic(char.id, relic)}
                  title={`${relic.charAt(0).toUpperCase() + relic.slice(1)}${isActive ? ` - ${equipped.mainStat}` : ''}`}
                >
                  {isActive && availableRelicSets.length > 0 ? (() => {
                    const set = availableRelicSets.find(s => s.id === equipped.setId);
                    if (!set) return <span className={`relic-icon ${(relic === 'sphere' || relic === 'rope') ? 'planar' : 'cavern'}`}>{(relic === 'sphere' || relic === 'rope') ? '○' : '⬡'}</span>;
                    const iconUrl = set.icon.startsWith('/') || set.icon.startsWith('http')
                      ? set.icon
                      : `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${set.icon}`;
                    return (
                      <img
                        src={iconUrl}
                        alt="Relic"
                        className="relic-set-icon"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    );
                  })() : (
                    <span className={`relic-icon ${(relic === 'sphere' || relic === 'rope') ? 'planar' : 'cavern'}`}>
                      {(relic === 'sphere' || relic === 'rope') ? '○' : '⬡'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
