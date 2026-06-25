import { useState } from 'react';
import type { EndfieldTrackedOperator } from '@/types';
import { GameBadge } from '@/components/GameBadge';
import { getMugshotUrl } from '@/lib/imagekit';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import './OperatorCard.css';

interface OperatorCardProps {
  operator: EndfieldTrackedOperator;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdatePotential: (id: string, potential: number) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
}

const RARITY_STARS: Record<number, string> = { 4: '★★★★', 5: '★★★★★', 6: '★★★★★★' };

export function OperatorCard({
  operator,
  onRemove,
  onUpdateLevel,
  onUpdatePotential,
  onToggleFavorite,
}: OperatorCardProps) {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const imageUrl = getMugshotUrl(operator.imageUrl);

  return (
    <div className={`game-card ${isEditing ? 'is-editing' : ''}`}>
      <div className="game-card-header">
        <div className="game-card-image-wrapper">
          {imgLoading && !imgError && (
            <div className="game-card-image-spinner">
              <div className="spinner-dot" />
              <div className="spinner-dot" />
              <div className="spinner-dot" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={operator.name}
            className={`game-card-image ${imgLoading ? 'loading' : 'loaded'}`}
            onLoad={() => setImgLoading(false)}
            onError={(e) => {
              setImgLoading(false);
              setImgError(true);
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${operator.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
            }}
          />
        </div>
        <div className="game-card-overlay"></div>
        <div className="game-card-controls">
          <div className="game-card-controls-top">
            <button
              className={`favorite-btn ${operator.isFavorited ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(operator.id, !operator.isFavorited);
              }}
              title={operator.isFavorited ? 'Unfavorite' : 'Favorite'}
            >
              {operator.isFavorited ? '★' : '☆'}
            </button>
            <button
              className="remove-btn"
              onClick={(e) => onRemove(operator.id, e)}
              title="Remove Operator"
            >
              ✕
            </button>
          </div>
          <div className="game-card-controls-bottom">
            <div className="game-card-badges">
              <GameBadge
                label={operator.class}
                variant="endfield-class"
                modifier={operator.class.toLowerCase()}
              />
              <GameBadge
                label={operator.element}
                variant="endfield-element"
                modifier={operator.element.toLowerCase()}
              />
              <GameBadge
                label={operator.weapon}
                variant="endfield-weapon"
                modifier={operator.weapon.toLowerCase().replace(' ', '-')}
              />
            </div>
            <button
              className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing((v) => !v)}
              title={isEditing ? 'Done editing' : 'Edit'}
            >
              {isEditing ? '✓' : '✎'}
            </button>
          </div>
        </div>
      </div>

      <div className={`game-card-body ${isEditing ? 'is-editing' : ''}`}>
        <h3 className="game-card-name">{operator.name}</h3>

        <div className="game-card-static-summary">
          <div className="game-card-static-stats">
            <StatChip label={`Lv ${operator.level}`} />
            <StatChip label={`P${operator.potential}`} />
            <span className={`rarity-indicator rarity-${operator.rarity}`}>
              {RARITY_STARS[operator.rarity]}
            </span>
          </div>
        </div>

        <div className="game-card-edit-body" aria-hidden={!isEditing}>
          <div className="game-card-edit-body-inner">
            <ProgressSection label="Level" value={`${operator.level} / 90`}>
              <input
                type="range"
                name={`level-${operator.id}`}
                min="1"
                max="90"
                value={operator.level}
                onChange={(e) => onUpdateLevel(operator.id, parseInt(e.target.value))}
                className="character-slider"
                style={{
                  background: `linear-gradient(to right, var(--color-brand-primary) ${((operator.level - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((operator.level - 1) / 89) * 100}%)`,
                }}
              />
            </ProgressSection>

            <ProgressSection label="Potential" value={`${operator.potential} / 5`}>
              <div className="potential-row">
                {([0, 1, 2, 3, 4, 5] as const).map((p) => (
                  <button
                    key={p}
                    className={`potential-btn ${operator.potential >= p ? 'active' : ''}`}
                    onClick={() => onUpdatePotential(operator.id, p)}
                    title={`P${p}`}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </ProgressSection>
          </div>
        </div>
      </div>
    </div>
  );
}
