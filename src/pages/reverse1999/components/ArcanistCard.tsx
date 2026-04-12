import type { R1999TrackedArcanist } from '@/types';
import { ALL_PSYCHUBES } from '@/data/reverse1999/psychubes';
import { getMugshotUrl } from '@/lib/imagekit';
import { useState } from 'react';
import './ArcanistCard.css';

interface ArcanistCardProps {
  arcanist: R1999TrackedArcanist;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdatePortrait: (id: string, portraitLevel: number) => void;
  onUpdateResonance: (id: string, resonanceLevel: number) => void;
  onUpdateEuphoriaStage: (id: string, stage: number) => void;
  onUpdatePsychube: (id: string, psychubeId: number | null, psychubeLevel: number) => void;
  onUpdatePsychubeAmplification: (id: string, level: number) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
}

export function ArcanistCard({
  arcanist,
  onRemove,
  onUpdateLevel,
  onUpdatePortrait,
  onUpdateResonance,
  onUpdateEuphoriaStage,
  onUpdatePsychube,
  onUpdatePsychubeAmplification,
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

        <div className="progress-section">
          <div className="section-header">Euphoria</div>
          <div className="euphoria-row">
            {([0, 1, 2, 3, 4] as const).map((stage) => (
              <button
                key={stage}
                className={`euphoria-btn ${arcanist.euphoriaStage === stage ? 'active' : ''}`}
                onClick={() => onUpdateEuphoriaStage(arcanist.id!, stage)}
              >
                E{stage}
              </button>
            ))}
          </div>
        </div>

        <div className="progress-section">
          <div className="section-header">
            <span>Psychube</span>
            <span className="section-value">{arcanist.psychubeLevel} / 80</span>
          </div>
          <select
            className="psychube-select"
            value={arcanist.psychubeId ?? ''}
            onChange={(e) =>
              onUpdatePsychube(
                arcanist.id!,
                e.target.value ? Number(e.target.value) : null,
                arcanist.psychubeLevel,
              )
            }
          >
            <option value="">No Psychube</option>
            {ALL_PSYCHUBES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.rarity}★)
              </option>
            ))}
          </select>
          <input
            type="range"
            min="1"
            max="80"
            value={arcanist.psychubeLevel}
            onChange={(e) =>
              onUpdatePsychube(
                arcanist.id!,
                arcanist.psychubeId,
                parseInt(e.target.value),
              )
            }
            className="psychube-slider"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${((arcanist.psychubeLevel - 1) / 79) * 100}%, rgba(255,255,255,0.1) ${((arcanist.psychubeLevel - 1) / 79) * 100}%)`,
            }}
          />
          <div className="amplification-row">
            <span className="section-sublabel">Amplify</span>
            {([0, 1, 2, 3, 4, 5] as const).map((lvl) => (
              <button
                key={lvl}
                className={`amplify-btn ${lvl === 0 ? 'amplify-reset' : ''} ${arcanist.psychubeAmplification === lvl ? 'active' : ''}`}
                onClick={() => onUpdatePsychubeAmplification(arcanist.id!, lvl)}
                title={lvl === 0 ? 'Clear amplification' : `A${lvl}`}
              >
                {lvl === 0 ? '—' : `A${lvl}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
