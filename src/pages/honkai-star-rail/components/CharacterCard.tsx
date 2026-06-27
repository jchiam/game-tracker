import type { HsrTrackedCharacter } from '@/types';
import type { RelicSet } from '@/data/honkai-star-rail/relics';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getMugshotUrl, getRelicIconUrl } from '@/lib/imagekit';
import { calculateRelicScore } from '@/utils/relicScoring';
import { getProgressStyle } from '@/utils/progressGradient';
import { useState } from 'react';
import './CharacterCard.css';

interface CharacterCardProps {
  char: HsrTrackedCharacter;
  availableRelicSets: RelicSet[];
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onToggleTraces: (id: string, value: boolean) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onToggleRelic: (id: string, part: keyof HsrTrackedCharacter['relics']) => void;
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
  const hasPreferences =
    char.buildPreferences?.subStats?.length > 0 ||
    ['body', 'feet', 'sphere', 'rope'].some(
      (s) =>
        char.buildPreferences?.mainStats[s as keyof typeof char.buildPreferences.mainStats]
          ?.length > 0,
    );
  const score = hasPreferences ? calculateRelicScore(char) : 0;
  const showScore = hasPreferences;
  let tierClass = 'tier-b';
  if (score >= 80) tierClass = 'tier-s';
  else if (score >= 50) tierClass = 'tier-a';

  const [isEditing, setIsEditing] = useState(false);

  // Collapsed-summary investment chips (shared gradient color language)
  const relicCount = (['head', 'hands', 'body', 'feet', 'sphere', 'rope'] as const).filter(
    (slot) => char.relics[slot]?.setId,
  ).length;
  const levelPs = getProgressStyle(char.level, 1, 80);
  const tracesPs = getProgressStyle(char.tracesAttained ? 1 : 0, 0, 1);
  const relicsPs = getProgressStyle(relicCount, 0, 6);

  // Relic set counts for the gear one-liner
  const relicSetCounts = (['head', 'hands', 'body', 'feet', 'sphere', 'rope'] as const).reduce(
    (acc, slot) => {
      const setId = char.relics[slot]?.setId;
      if (setId) acc.set(setId, (acc.get(setId) ?? 0) + 1);
      return acc;
    },
    new Map<string, number>(),
  );
  const sortedSets = [...relicSetCounts.entries()].sort((a, b) => b[1] - a[1]);
  const equippedColor = getProgressStyle(90, 1, 90).color;
  const emptyColor = getProgressStyle(0, 0, 1).color;

  return (
    <div
      className={`game-card ${isEditing ? 'is-editing' : ''}`}
      style={
        {
          '--game-card-summary-max-height': '100px',
          '--game-card-edit-max-height': '900px',
        } as React.CSSProperties
      }
    >
      <div className="game-card-header">
        <img
          src={getMugshotUrl(char.imageUrl)}
          alt={char.name}
          className="game-card-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${char.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
          }}
        />
        <div className="game-card-overlay"></div>
        <div className="game-card-controls">
          <div className="game-card-controls-top">
            <button
              className={`favorite-btn ${char.isFavorited ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(char.id, !char.isFavorited);
              }}
              title={char.isFavorited ? 'Unfavorite Character' : 'Favorite Character'}
            >
              {char.isFavorited ? '★' : '☆'}
            </button>
            <button
              className="remove-btn"
              onClick={(e) => onRemove(char.id, e)}
              title="Remove Character"
            >
              ✕
            </button>
          </div>
          <div className="game-card-controls-bottom">
            <div className="game-card-badges">
              <GameBadge
                label={char.element}
                variant="element"
                modifier={char.element.toLowerCase()}
              />
              {char.path && (
                <GameBadge
                  label={char.path}
                  variant="path"
                  modifier={char.path.toLowerCase().replace(/\s+/g, '-')}
                />
              )}
            </div>
            <div className="hsr-overlay-right">
              {showScore && (
                <div className={`score-badge ${tierClass}`}>
                  <span>{score.toFixed(1)}%</span>
                </div>
              )}
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
      </div>
      <div className={`game-card-body ${isEditing ? 'is-editing' : ''}`}>
        <h3 className="game-card-name">{char.name}</h3>

        {/* Static summary — visible when collapsed */}
        <div className="game-card-static-summary">
          <div className="game-card-static-stats">
            <StatChip
              label={`Lv ${char.level}`}
              style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
            />
            <StatChip
              label={`Traces ${char.tracesAttained ? '✓' : '✗'}`}
              style={{ color: tracesPs.color, borderColor: tracesPs.borderColor }}
            />
            <StatChip
              label={`Relics ${relicCount}/6`}
              style={{ color: relicsPs.color, borderColor: relicsPs.borderColor }}
            />
          </div>
          <div className="game-card-static-line">
            {sortedSets.length > 0 ? (
              sortedSets.map(([setId, count], i) => {
                const setName = availableRelicSets.find((s) => s.id === setId)?.name ?? setId;
                return (
                  <span key={setId}>
                    {i > 0 && <span style={{ color: equippedColor }}>&nbsp;&middot;&nbsp;</span>}
                    <span style={{ color: equippedColor }}>
                      {setName} {count}
                    </span>
                  </span>
                );
              })
            ) : (
              <span className="no-equip" style={{ color: emptyColor }}>
                &mdash;
              </span>
            )}
          </div>
        </div>

        {/* Edit body — always in DOM, expands when editing */}
        <div className="game-card-edit-body" aria-hidden={!isEditing}>
          <div className="game-card-edit-body-inner">
            <ProgressSection label="Level" value={`${char.level} / 80`}>
              <input
                type="range"
                name={`level-${char.id}`}
                min="1"
                max="80"
                value={char.level}
                onChange={(e) => onUpdateLevel(char.id, parseInt(e.target.value))}
                className="level-slider"
                style={
                  {
                    '--slider-fill-color': levelPs.color,
                    '--slider-fill-glow': levelPs.glowColor,
                    background: `linear-gradient(to right, ${levelPs.color} ${(char.level / 80) * 100}%, rgba(255,255,255,0.1) ${(char.level / 80) * 100}%)`,
                  } as React.CSSProperties
                }
              />
            </ProgressSection>

            <ProgressSection label="Traces">
              <ConfirmCheckbox
                checked={char.tracesAttained}
                onChange={(val) => onToggleTraces(char.id, val)}
                label="All Traces Attained"
              />
            </ProgressSection>

            <ProgressSection label="Relic Sets">
              <div className="relics-grid">
                {(['head', 'hands', 'body', 'feet', 'sphere', 'rope'] as const).map((relic) => {
                  const equipped = char.relics[relic];
                  const isActive = equipped && equipped.setId;
                  return (
                    <div
                      key={relic}
                      className={`relic-slot ${isActive ? 'active' : ''}`}
                      onClick={() => onToggleRelic(char.id, relic)}
                      title={`${relic.charAt(0).toUpperCase() + relic.slice(1)}${isActive ? ` - ${equipped.mainStat}` : ''}`}
                    >
                      {isActive && availableRelicSets.length > 0 ? (
                        (() => {
                          const set = availableRelicSets.find((s) => s.id === equipped.setId);
                          if (!set)
                            return (
                              <span
                                className={`relic-icon ${relic === 'sphere' || relic === 'rope' ? 'planar' : 'cavern'}`}
                              >
                                {relic === 'sphere' || relic === 'rope' ? '○' : '⬡'}
                              </span>
                            );
                          return (
                            <img
                              src={getRelicIconUrl(set.icon)}
                              alt="Relic"
                              className="relic-set-icon"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          );
                        })()
                      ) : (
                        <span
                          className={`relic-icon ${relic === 'sphere' || relic === 'rope' ? 'planar' : 'cavern'}`}
                        >
                          {relic === 'sphere' || relic === 'rope' ? '○' : '⬡'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ProgressSection>

            {char.buildPreferences &&
              (char.buildPreferences.subStats.length > 0 ||
                ['body', 'feet', 'sphere', 'rope'].some(
                  (s) =>
                    char.buildPreferences?.mainStats[
                      s as keyof typeof char.buildPreferences.mainStats
                    ]?.length > 0,
                )) && (
                <ProgressSection label="Target Build" className="build-prefs-display">
                  <div className="prefs-display-grid">
                    {(['body', 'feet', 'sphere', 'rope'] as const).map((slot) => {
                      const prefs = char.buildPreferences?.mainStats[slot];
                      if (!prefs || prefs.length === 0) return null;
                      return (
                        <div key={slot} className="pref-display-row">
                          <span className="pref-display-label">
                            {slot.charAt(0).toUpperCase() + slot.slice(1)}
                          </span>
                          <div className="pref-display-chain">
                            {prefs.map((p, i) => (
                              <span key={i}>
                                <span className="pref-stat-badge">{p.stat}</span>
                                {p.operator && (
                                  <span className="pref-operator-badge">
                                    {p.operator === '>=' ? '≥' : p.operator}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {char.buildPreferences?.subStats.length > 0 && (
                      <div className="pref-display-row">
                        <span className="pref-display-label">Subs</span>
                        <div className="pref-display-chain">
                          {char.buildPreferences.subStats.map((p, i) => (
                            <span key={i}>
                              <span className="pref-stat-badge">{p.stat}</span>
                              {p.operator && (
                                <span className="pref-operator-badge">
                                  {p.operator === '>=' ? '≥' : p.operator}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {char.buildPreferences?.comments && (
                      <div className="pref-display-row build-comments-row">
                        <div className="pref-comments-text">{char.buildPreferences.comments}</div>
                      </div>
                    )}
                  </div>
                </ProgressSection>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
