import type { R1999TrackedArcanist } from '@/types';
import { getMugshotUrl } from '@/lib/imagekit';
import { useState } from 'react';
import './ArcanistCard.css';

interface ArcanistCardProps {
  arcanist: R1999TrackedArcanist;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdateInsight: (id: string, insightLevel: 0 | 1 | 2 | 3) => void;
  onUpdatePortrait: (id: string, portraitLevel: number) => void;
  onUpdateResonance: (id: string, resonanceLevel: number) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
}

export function ArcanistCard({
  arcanist,
  onRemove,
  onUpdateLevel,
  onUpdateInsight,
  onUpdatePortrait,
  onUpdateResonance,
  onToggleFavorite,
}: ArcanistCardProps) {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const imageUrl = getMugshotUrl(arcanist.imageUrl);

  return (
    <div className="arcanist-card">
      <div className="arcanist-card-header">
        <div className="arcanist-image-wrapper">
          {imgLoading && !imgError && (
            <div className="arcanist-image-spinner">
              <div className="spinner-dot" />
              <div className="spinner-dot" />
              <div className="spinner-dot" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={arcanist.name}
            className={`arcanist-image ${imgLoading ? 'loading' : 'loaded'}`}
            onLoad={() => setImgLoading(false)}
            onError={(e) => {
              setImgLoading(false);
              setImgError(true);
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${arcanist.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
            }}
          />
        </div>
        <div className="arcanist-card-header-overlay"></div>
        <div className="arcanist-card-overlay-controls">
          <div className="arcanist-overlay-top">
            <button
              className={`favorite-btn ${arcanist.isFavorited ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(arcanist.id!, !arcanist.isFavorited);
              }}
              title={arcanist.isFavorited ? 'Unfavorite Arcanist' : 'Favorite Arcanist'}
            >
              {arcanist.isFavorited ? '★' : '☆'}
            </button>
            <button
              className="remove-btn"
              onClick={(e) => onRemove(arcanist.id!, e)}
              title="Remove Arcanist"
            >
              ✕
            </button>
          </div>
          <div className="arcanist-overlay-bottom">
            <div className="arcanist-overlay-badges">
              <span className={`afflatus-badge afflatus-${arcanist.afflatus.toLowerCase()}`}>
                {arcanist.afflatus}
              </span>
              <span className={`damage-badge damage-${arcanist.damageType.toLowerCase()}`}>
                {arcanist.damageType}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="arcanist-card-body">
        <h3 className="arcanist-name">{arcanist.name}</h3>

        <div className="progress-section">
          <div className="section-header">
            <span>Level</span>
            <span className="section-value">{arcanist.level} / 60</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={arcanist.level}
            onChange={(e) => onUpdateLevel(arcanist.id!, parseInt(e.target.value))}
            className="level-slider"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${(arcanist.level / 60) * 100}%, rgba(255,255,255,0.1) ${(arcanist.level / 60) * 100}%)`,
            }}
          />
        </div>

        <div className="progress-section">
          <div className="section-header">Insight Level</div>
          <div className="insight-row">
            {([0, 1, 2, 3] as const).map((level) => (
              <button
                key={level}
                className={`insight-btn ${arcanist.insightLevel === level ? 'active' : ''}`}
                onClick={() => onUpdateInsight(arcanist.id!, level)}
              >
                I{level}
              </button>
            ))}
          </div>
        </div>

        <div className="progress-section">
          <div className="section-header">
            <span>Portrait Level</span>
            <span className="section-value">{arcanist.portraitLevel} / 5</span>
          </div>
          <div className="portrait-row">
            {([0, 1, 2, 3, 4, 5] as const).map((level) => (
              <button
                key={level}
                className={`portrait-btn ${level === 0 ? 'portrait-reset' : ''} ${arcanist.portraitLevel === level ? 'active' : ''}`}
                onClick={() => onUpdatePortrait(arcanist.id!, level)}
                title={level === 0 ? 'Reset portrait level' : `Portrait ${level}`}
              >
                P{level}
              </button>
            ))}
          </div>
        </div>

        <div className="progress-section">
          <div className="section-header">
            <span>Resonance Level</span>
            <span className="section-value">{arcanist.resonanceLevel} / 15</span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            value={arcanist.resonanceLevel}
            onChange={(e) => onUpdateResonance(arcanist.id!, parseInt(e.target.value))}
            className="resonance-slider"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${(arcanist.resonanceLevel / 15) * 100}%, rgba(255,255,255,0.1) ${(arcanist.resonanceLevel / 15) * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
