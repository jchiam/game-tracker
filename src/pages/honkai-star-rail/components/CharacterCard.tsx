import type { HsrTrackedCharacter } from '@/types';
import type { RelicSet } from '@/data/honkai-star-rail/relics';
import { RELIC_SHORT_NAMES } from '@/data/honkai-star-rail/relic_short_names';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getRelicIconUrl } from '@/lib/imagekit';
import { calculateRelicScore } from '@/utils/relicScoring';
import { ScoreBadge } from '@/components/ScoreBadge';
import { getProgressStyle } from '@/utils/progressGradient';
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
  // The scorer owns the insufficient-data decision: -1 when no preferences or no relics.
  const score = calculateRelicScore(char);

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
    <GameCardShell
      name={char.name}
      imageUrl={char.imageUrl}
      entityNoun="Character"
      isFavorited={char.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(char.id, value)}
      onRemove={(e) => onRemove(char.id, e)}
      badges={
        <>
          <GameBadge label={char.element} variant="element" modifier={char.element.toLowerCase()} />
          {char.path && (
            <GameBadge
              label={char.path}
              variant="path"
              modifier={char.path.toLowerCase().replace(/\s+/g, '-')}
            />
          )}
        </>
      }
      headerExtra={<ScoreBadge score={score} />}
      summaryStats={
        <>
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
        </>
      }
      summaryLine={
        sortedSets.length > 0 ? (
          sortedSets.map(([setId, count], i) => {
            const setName =
              RELIC_SHORT_NAMES[setId] ??
              availableRelicSets.find((s) => s.id === setId)?.name ??
              setId;
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
        )
      }
      editBody={
        <>
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
        </>
      }
    />
  );
}
