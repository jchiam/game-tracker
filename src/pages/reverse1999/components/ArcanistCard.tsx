import type { R1999TrackedArcanist } from '@/types';
import { ALL_ARCANISTS } from '@/data/reverse1999/arcanists';
import { ALL_PSYCHUBES } from '@/data/reverse1999/psychubes';
import { GameBadge } from '@/components/GameBadge';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getMugshotUrl } from '@/lib/imagekit';
import { getProgressStyle } from '@/utils/progressGradient';
import { useState } from 'react';
import './ArcanistCard.css';

interface ArcanistCardProps {
  arcanist: R1999TrackedArcanist;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdatePortrait: (id: string, portraitLevel: number) => void;
  onUpdateResonance: (id: string, resonanceLevel: number) => void;
  onUpdateEuphoriaStage: (id: string, stage: number) => void;
  onUpdatePsychube: (id: string, psychubeName: string | null, psychubeLevel: number) => void;
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
  const [isEditing, setIsEditing] = useState(false);

  const staticArcanist = ALL_ARCANISTS.find((a) => a.name === arcanist.name);
  const hasEuphoria = staticArcanist?.hasEuphoria ?? false;

  const imageUrl = getMugshotUrl(arcanist.imageUrl);
  const selectedPsychube = arcanist.psychubeName
    ? (ALL_PSYCHUBES.find((p) => p.name === arcanist.psychubeName) ?? null)
    : null;

  // Progress color styles per dimension
  const levelPs = getProgressStyle(arcanist.level, 1, 60);
  const portraitPs = getProgressStyle(arcanist.portraitLevel, 0, 5);
  const resonancePs = getProgressStyle(arcanist.resonanceLevel, 0, 15);
  const euphoriaPs = getProgressStyle(arcanist.euphoriaStage, 0, 4);
  // Psychube line: name always teal (100%), level/amp colored individually
  const psychubeNamePs = arcanist.psychubeName
    ? getProgressStyle(60, 1, 60)
    : getProgressStyle(0, 0, 1); // rust when unequipped
  const psychubeLevelPs = arcanist.psychubeName
    ? getProgressStyle(arcanist.psychubeLevel, 1, 60)
    : getProgressStyle(arcanist.psychubeLevel, 1, 60); // always based on actual level
  const psychubeAmpPs = arcanist.psychubeName
    ? getProgressStyle(arcanist.psychubeAmplification, 1, 5)
    : getProgressStyle(0, 0, 1); // rust when unequipped

  return (
    <div
      className={`game-card ${isEditing ? 'is-editing' : ''}`}
      style={
        {
          '--game-card-summary-max-height': '80px',
          '--game-card-edit-max-height': '700px',
        } as React.CSSProperties
      }
    >
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
            alt={arcanist.name}
            className={`game-card-image ${imgLoading ? 'loading' : 'loaded'}`}
            onLoad={() => setImgLoading(false)}
            onError={(e) => {
              setImgLoading(false);
              setImgError(true);
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${arcanist.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
            }}
          />
        </div>
        <div className="game-card-overlay"></div>
        <div className="game-card-controls">
          <div className="game-card-controls-top">
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
          <div className="game-card-controls-bottom">
            <div className="game-card-badges">
              <GameBadge
                label={arcanist.afflatus}
                variant="afflatus"
                modifier={arcanist.afflatus.toLowerCase()}
              />
              <GameBadge
                label={arcanist.damageType}
                variant="damage"
                modifier={arcanist.damageType.toLowerCase()}
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
        <h3 className="game-card-name">{arcanist.name}</h3>

        {/* Static summary — visible in static mode, collapses when editing */}
        <div className="game-card-static-summary">
          <div className="game-card-static-stats">
            <StatChip
              label={`Lv ${arcanist.level}`}
              style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
            />
            <StatChip
              label={`P${arcanist.portraitLevel}`}
              style={{ color: portraitPs.color, borderColor: portraitPs.borderColor }}
            />
            <StatChip
              label={`R${arcanist.resonanceLevel}`}
              style={{ color: resonancePs.color, borderColor: resonancePs.borderColor }}
            />
            {hasEuphoria && (
              <StatChip
                label={`E${arcanist.euphoriaStage}`}
                style={{ color: euphoriaPs.color, borderColor: euphoriaPs.borderColor }}
              />
            )}
          </div>
          <div className="game-card-static-line">
            {selectedPsychube ? (
              <>
                <span style={{ color: psychubeNamePs.color }}>{selectedPsychube.name}</span>
                <span style={{ color: psychubeLevelPs.color }}>
                  &nbsp;·&nbsp;Lv&nbsp;{arcanist.psychubeLevel}
                </span>
                <span style={{ color: psychubeAmpPs.color }}>
                  &nbsp;·&nbsp;A{arcanist.psychubeAmplification}
                </span>
              </>
            ) : (
              <span className="no-psychube" style={{ color: psychubeNamePs.color }}>
                —
              </span>
            )}
          </div>
        </div>

        {/* Edit body — always in DOM, expands when editing */}
        <div className="game-card-edit-body" aria-hidden={!isEditing}>
          <div className="game-card-edit-body-inner">
            <ProgressSection label="Level" value={`${arcanist.level} / 60`}>
              <input
                type="range"
                name={`level-${arcanist.id}`}
                min="1"
                max="60"
                value={arcanist.level}
                onChange={(e) => onUpdateLevel(arcanist.id!, parseInt(e.target.value))}
                className="level-slider"
                style={
                  {
                    '--slider-fill-color': levelPs.color,
                    '--slider-fill-glow': levelPs.glowColor,
                    background: `linear-gradient(to right, ${levelPs.color} ${((arcanist.level - 1) / 59) * 100}%, rgba(255,255,255,0.1) ${((arcanist.level - 1) / 59) * 100}%)`,
                  } as React.CSSProperties
                }
              />
            </ProgressSection>

            <ProgressSection label="Portrait Level" value={`${arcanist.portraitLevel} / 5`}>
              <div className="portrait-row">
                {([0, 1, 2, 3, 4, 5] as const).map((level) => {
                  const btnPs = getProgressStyle(level, 0, 5);
                  const isActive = arcanist.portraitLevel === level;
                  const isPassed = level > 0 && level < arcanist.portraitLevel;
                  return (
                    <button
                      key={level}
                      className={`toggle-btn ${level === 0 ? 'portrait-reset' : ''} ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdatePortrait(arcanist.id!, level)}
                      title={level === 0 ? 'Reset portrait level' : `Portrait ${level}`}
                      style={
                        isActive
                          ? {
                              color: btnPs.color,
                              borderColor: btnPs.borderColor,
                              background: btnPs.activeBg,
                              boxShadow: `0 0 8px ${btnPs.glowColor} inset`,
                            }
                          : isPassed
                            ? {
                                color: btnPs.color,
                                borderColor: btnPs.borderColor,
                                opacity: 0.35,
                              }
                            : undefined
                      }
                    >
                      P{level}
                    </button>
                  );
                })}
              </div>
            </ProgressSection>

            <ProgressSection label="Resonance Level" value={`${arcanist.resonanceLevel} / 15`}>
              <input
                type="range"
                name={`resonance-${arcanist.id}`}
                min="0"
                max="15"
                value={arcanist.resonanceLevel}
                onChange={(e) => onUpdateResonance(arcanist.id!, parseInt(e.target.value))}
                className="level-slider"
                style={
                  {
                    '--slider-fill-color': resonancePs.color,
                    '--slider-fill-glow': resonancePs.glowColor,
                    background: `linear-gradient(to right, ${resonancePs.color} ${(arcanist.resonanceLevel / 15) * 100}%, rgba(255,255,255,0.1) ${(arcanist.resonanceLevel / 15) * 100}%)`,
                  } as React.CSSProperties
                }
              />
            </ProgressSection>

            {hasEuphoria && (
              <ProgressSection label="Euphoria">
                <div className="euphoria-row">
                  {([0, 1, 2, 3, 4] as const).map((stage) => {
                    const btnPs = getProgressStyle(stage, 0, 4);
                    const isActive = arcanist.euphoriaStage === stage;
                    const isPassed = stage < arcanist.euphoriaStage;
                    return (
                      <button
                        key={stage}
                        className={`toggle-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onUpdateEuphoriaStage(arcanist.id!, stage)}
                        style={
                          isActive
                            ? {
                                color: btnPs.color,
                                borderColor: btnPs.borderColor,
                                background: btnPs.activeBg,
                                boxShadow: `0 0 8px ${btnPs.glowColor} inset`,
                              }
                            : isPassed
                              ? {
                                  color: btnPs.color,
                                  borderColor: btnPs.borderColor,
                                  opacity: 0.35,
                                }
                              : undefined
                        }
                      >
                        E{stage}
                      </button>
                    );
                  })}
                </div>
              </ProgressSection>
            )}

            <ProgressSection label="Psychube" value={`${arcanist.psychubeLevel} / 60`}>
              <select
                name={`psychube-${arcanist.id}`}
                className="game-select"
                value={arcanist.psychubeName ?? ''}
                onChange={(e) =>
                  onUpdatePsychube(arcanist.id!, e.target.value || null, arcanist.psychubeLevel)
                }
              >
                <option value="">No Psychube</option>
                {ALL_PSYCHUBES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.rarity}★)
                  </option>
                ))}
              </select>
              <input
                type="range"
                name={`psychube-level-${arcanist.id}`}
                min="1"
                max="60"
                value={arcanist.psychubeLevel}
                onChange={(e) =>
                  onUpdatePsychube(arcanist.id!, arcanist.psychubeName, parseInt(e.target.value))
                }
                className="level-slider"
                style={
                  {
                    '--slider-fill-color': psychubeLevelPs.color,
                    '--slider-fill-glow': psychubeLevelPs.glowColor,
                    background: `linear-gradient(to right, ${psychubeLevelPs.color} ${((arcanist.psychubeLevel - 1) / 59) * 100}%, rgba(255,255,255,0.1) ${((arcanist.psychubeLevel - 1) / 59) * 100}%)`,
                  } as React.CSSProperties
                }
              />
              <div className="amplification-row">
                <span className="section-sublabel">Amplify</span>
                {([1, 2, 3, 4, 5] as const).map((lvl) => {
                  const btnPs = getProgressStyle(lvl, 1, 5);
                  const isActive = arcanist.psychubeAmplification === lvl;
                  const isPassed = lvl < arcanist.psychubeAmplification;
                  return (
                    <button
                      key={lvl}
                      className={`toggle-btn compact ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdatePsychubeAmplification(arcanist.id!, lvl)}
                      title={`A${lvl}`}
                      style={
                        isActive
                          ? {
                              color: btnPs.color,
                              borderColor: btnPs.borderColor,
                              background: btnPs.activeBg,
                              boxShadow: `0 0 8px ${btnPs.glowColor} inset`,
                            }
                          : isPassed
                            ? {
                                color: btnPs.color,
                                borderColor: btnPs.borderColor,
                                opacity: 0.35,
                              }
                            : undefined
                      }
                    >
                      {`A${lvl}`}
                    </button>
                  );
                })}
              </div>
            </ProgressSection>
          </div>
        </div>
      </div>
    </div>
  );
}
