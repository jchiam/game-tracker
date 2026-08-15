import { Fragment, useState } from 'react';
import type { HsrTrackedCharacter } from '@/types';
import type { RelicSet } from '@/data/honkai-star-rail/relics';
import { RELIC_SHORT_NAMES } from '@/data/honkai-star-rail/relic_short_names';
import { ALL_LIGHT_CONES } from '@/data/honkai-star-rail/light_cones';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { PreferenceChainReadout } from '@/components/PreferenceChainReadout';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Select } from '@/components/Select';
import { StatChip } from '@/components/StatChip';
import { getLightConeUrl, getRelicIconUrl } from '@/lib/imagekit';
import { calculateBuildScore } from '@/utils/buildScore';
import { ScoreBadge } from '@/components/ScoreBadge';
import { getProgressStyle } from '@/utils/progressGradient';
import './CharacterCard.css';

const SUPERIMPOSITION_OPTIONS = [1, 2, 3, 4, 5].map((rank) => ({
  value: String(rank),
  label: `S${rank}`,
}));

// Content policy, not a visual token: the preference strip shows at most this
// many cone tiles before collapsing the rest into a +N overflow tile.
const CONE_STRIP_MAX = 5;

interface CharacterCardProps {
  char: HsrTrackedCharacter;
  availableRelicSets: RelicSet[];
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onToggleTraces: (id: string, value: boolean) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onToggleRelic: (id: string, part: keyof HsrTrackedCharacter['relics']) => void;
  onUpdateLightCone: (id: string, lightConeId: string | null) => void;
  onUpdateLightConeLevel: (id: string, level: number) => void;
  onUpdateLightConeSuperimposition: (id: string, rank: number) => void;
  onEditLightConePrefs: (id: string) => void;
  onUpdateUseAltPortrait: (id: string, value: boolean) => void;
}

const PORTRAIT_OPTIONS = [
  { value: 'stelle', label: 'Stelle' },
  { value: 'caelus', label: 'Caelus' },
] as const;

export function CharacterCard({
  char,
  availableRelicSets,
  onRemove,
  onUpdateLevel,
  onToggleTraces,
  onToggleFavorite,
  onToggleRelic,
  onUpdateLightCone,
  onUpdateLightConeLevel,
  onUpdateLightConeSuperimposition,
  onEditLightConePrefs,
  onUpdateUseAltPortrait,
}: CharacterCardProps) {
  // The scorer owns the insufficient-data decision: -1 when neither the relic
  // side nor the Light Cone preference side has enough data.
  const score = calculateBuildScore(char);

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

  // Light cone summary segments — name teal when equipped, level/superimposition
  // colored by their own progress (psychube line convention).
  const selectedLightCone = char.lightConeId
    ? (ALL_LIGHT_CONES.find((lc) => lc.id === char.lightConeId) ?? null)
    : null;
  const equippableLightCones = ALL_LIGHT_CONES.filter((lc) => lc.path === char.path);
  const coneNamePs = selectedLightCone ? getProgressStyle(80, 1, 80) : getProgressStyle(0, 0, 1);
  const coneLevelPs = getProgressStyle(char.lightConeLevel, 1, 80);
  const coneSuperPs = selectedLightCone
    ? getProgressStyle(char.lightConeSuperimposition, 1, 5)
    : getProgressStyle(0, 0, 1);

  // Match badge: where the equipped cone ranks in the preference list.
  // First choice reads full/teal; lower ranks step toward rust; not-listed = off-build rust.
  const conePrefs = char.lightConePreferences;
  // Tapped strip tile whose name caption is shown — tiles are display-only
  // (equipping stays in the picker); tap reveals the name where hover can't.
  const [captionConeId, setCaptionConeId] = useState<string | null>(null);
  const coneRank = char.lightConeId ? conePrefs.indexOf(char.lightConeId) : -1;
  const showConeMatchBadge = conePrefs.length > 0 && char.lightConeId !== null;
  const coneMatchPs =
    coneRank === -1
      ? getProgressStyle(0, 0, 1)
      : getProgressStyle(conePrefs.length - coneRank, 0, conePrefs.length);
  const coneMatchLabel = coneRank === -1 ? 'Off-build' : `#${coneRank + 1}`;

  return (
    <GameCardShell
      name={char.name}
      imageUrl={char.useAltPortrait && char.altImageUrl ? char.altImageUrl : char.imageUrl}
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
      temperScore={score}
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
      summaryLine={[
        // Line 1: Light Cone readout. Always rendered so every card shows the
        // same two summary lines and collapsed heights stay uniform.
        selectedLightCone ? (
          <>
            <img
              src={getLightConeUrl(selectedLightCone.imageUrl)}
              alt=""
              className="cone-icon"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span style={{ color: coneNamePs.color }}>{selectedLightCone.name}</span>
            <span style={{ color: coneLevelPs.color }}>
              &nbsp;&middot;&nbsp;Lv&nbsp;{char.lightConeLevel}
            </span>
            <span style={{ color: coneSuperPs.color }}>
              &nbsp;&middot;&nbsp;S{char.lightConeSuperimposition}
            </span>
            {showConeMatchBadge && (
              <span
                className="cone-match-badge"
                style={{ color: coneMatchPs.color, borderColor: coneMatchPs.borderColor }}
                title="Equipped Light Cone vs preferred"
              >
                {coneMatchLabel}
              </span>
            )}
          </>
        ) : (
          <span className="no-equip" style={{ color: emptyColor }}>
            &mdash;
          </span>
        ),
        // Line 2: relic set digest.
        sortedSets.length > 0 ? (
          <>
            {sortedSets.map(([setId, count], i) => {
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
            })}
          </>
        ) : (
          <span className="no-equip" style={{ color: emptyColor }}>
            &mdash;
          </span>
        ),
      ]}
      editBody={
        <>
          {char.altImageUrl && (
            <ProgressSection label="Portrait">
              <SegmentedButtons
                name={`portrait-${char.id}`}
                options={PORTRAIT_OPTIONS}
                value={char.useAltPortrait ? 'caelus' : 'stelle'}
                onChange={(v) => onUpdateUseAltPortrait(char.id, v === 'caelus')}
              />
            </ProgressSection>
          )}

          <ProgressSection label="Level" value={`${char.level} / 80`}>
            <LevelSlider
              name={`level-${char.id}`}
              value={char.level}
              min={1}
              max={80}
              onChange={(n) => onUpdateLevel(char.id, n)}
            />
          </ProgressSection>

          <ProgressSection label="Traces">
            <ConfirmCheckbox
              checked={char.tracesAttained}
              onChange={(val) => onToggleTraces(char.id, val)}
              label="All Traces Attained"
            />
          </ProgressSection>

          {/* ── Light Cone (equip + preferences) ─────────────────── */}
          <div className="card-section-group">
            <div className="card-section-group-header">Light Cone</div>

            <ProgressSection label="Equipped" value={`${char.lightConeLevel} / 80`}>
              <Select
                name={`light-cone-${char.id}`}
                size="sm"
                value={char.lightConeId ?? ''}
                placeholder="No Light Cone"
                options={equippableLightCones.map((lc) => ({
                  value: lc.id,
                  label: `${lc.name} (${lc.rarity}★)`,
                }))}
                onChange={(v) => onUpdateLightCone(char.id, v || null)}
              />
              <LevelSlider
                name={`light-cone-level-${char.id}`}
                value={char.lightConeLevel}
                min={1}
                max={80}
                onChange={(n) => onUpdateLightConeLevel(char.id, n)}
              />
              <span className="section-sublabel">Superimpose</span>
              <SegmentedButtons
                options={SUPERIMPOSITION_OPTIONS}
                value={String(char.lightConeSuperimposition)}
                coloring="investment"
                size="compact"
                onChange={(v) => onUpdateLightConeSuperimposition(char.id, Number(v))}
              />
            </ProgressSection>

            <ProgressSection
              label="Preferences"
              value={conePrefs.length > 0 ? `${conePrefs.length} ranked` : undefined}
            >
              {conePrefs.length > 0 && (
                <div className="cone-pref-strip">
                  {conePrefs.slice(0, CONE_STRIP_MAX).map((coneId, idx) => {
                    const cone = ALL_LIGHT_CONES.find((lc) => lc.id === coneId);
                    const isEquipped = char.lightConeId === coneId;
                    return (
                      <Fragment key={coneId}>
                        {idx > 0 && <span className="pref-operator-badge">&gt;</span>}
                        <div
                          className={`equip-slot-cell cone-pref-tile ${isEquipped ? 'active' : ''}`}
                          style={
                            isEquipped
                              ? { borderColor: coneMatchPs.borderColor, color: coneMatchPs.color }
                              : undefined
                          }
                          title={cone ? `${cone.name} (${cone.rarity}★)` : coneId}
                          onClick={() => {
                            setCaptionConeId((prev) => (prev === coneId ? null : coneId));
                          }}
                        >
                          {cone && (
                            <img
                              src={getLightConeUrl(cone.imageUrl)}
                              alt=""
                              className="equip-slot-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="cone-pref-rank">#{idx + 1}</span>
                        </div>
                      </Fragment>
                    );
                  })}
                  {conePrefs.length > CONE_STRIP_MAX && (
                    <div
                      className="equip-slot-cell cone-pref-tile cone-pref-overflow"
                      title="Edit preferences"
                      onClick={() => onEditLightConePrefs(char.id)}
                    >
                      +{conePrefs.length - CONE_STRIP_MAX}
                    </div>
                  )}
                </div>
              )}
              {captionConeId && conePrefs.includes(captionConeId) && (
                <div className="cone-pref-caption">
                  #{conePrefs.indexOf(captionConeId) + 1}{' '}
                  {(() => {
                    const cone = ALL_LIGHT_CONES.find((lc) => lc.id === captionConeId);
                    return cone ? `${cone.name} (${cone.rarity}★)` : captionConeId;
                  })()}
                </div>
              )}
              <button
                className="btn secondary-action"
                onClick={() => onEditLightConePrefs(char.id)}
              >
                Edit Preferences
              </button>
            </ProgressSection>
          </div>

          {/* ── Relics (slot grid + Target Build) ────────────────── */}
          <div className="card-section-group">
            <div className="card-section-group-header">Relics</div>

            <ProgressSection label="Relic Sets">
              <div className="equip-slot-grid">
                {(['head', 'hands', 'body', 'feet', 'sphere', 'rope'] as const).map((relic) => {
                  const equipped = char.relics[relic];
                  const isActive = equipped && equipped.setId;
                  return (
                    <div
                      key={relic}
                      className={`equip-slot-cell ${isActive ? 'active' : ''}`}
                      onClick={() => onToggleRelic(char.id, relic)}
                      title={`${relic.charAt(0).toUpperCase() + relic.slice(1)}${isActive ? ` - ${equipped.mainStat}` : ''}`}
                    >
                      {isActive && availableRelicSets.length > 0 ? (
                        (() => {
                          const set = availableRelicSets.find((s) => s.id === equipped.setId);
                          if (!set)
                            return (
                              <span
                                className={`equip-slot-icon ${relic === 'sphere' || relic === 'rope' ? 'planar' : 'cavern'}`}
                              >
                                {relic === 'sphere' || relic === 'rope' ? '○' : '⬡'}
                              </span>
                            );
                          return (
                            <img
                              src={getRelicIconUrl(set.icon)}
                              alt="Relic"
                              className="equip-slot-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          );
                        })()
                      ) : (
                        <span
                          className={`equip-slot-icon ${relic === 'sphere' || relic === 'rope' ? 'planar' : 'cavern'}`}
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
                char.buildPreferences.relicSetId ||
                char.buildPreferences.planarSetId ||
                char.buildPreferences.comments ||
                ['body', 'feet', 'sphere', 'rope'].some(
                  (s) =>
                    char.buildPreferences?.mainStats[
                      s as keyof typeof char.buildPreferences.mainStats
                    ]?.length > 0,
                )) && (
                <ProgressSection label="Target Build" className="build-prefs-display">
                  <div className="prefs-display-grid">
                    {(char.buildPreferences.relicSetId || char.buildPreferences.planarSetId) && (
                      <div className="pref-display-row">
                        <span className="pref-display-label">Sets</span>
                        <div className="pref-display-chain">
                          {char.buildPreferences.relicSetId && (
                            <span className="pref-stat-badge">
                              {availableRelicSets.find(
                                (s) => s.id === char.buildPreferences?.relicSetId,
                              )?.name ?? char.buildPreferences.relicSetId}
                            </span>
                          )}
                          {char.buildPreferences.planarSetId && (
                            <span className="pref-stat-badge">
                              {availableRelicSets.find(
                                (s) => s.id === char.buildPreferences?.planarSetId,
                              )?.name ?? char.buildPreferences.planarSetId}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {(['body', 'feet', 'sphere', 'rope'] as const).map((slot) => (
                      <PreferenceChainReadout
                        key={slot}
                        label={slot.charAt(0).toUpperCase() + slot.slice(1)}
                        chain={char.buildPreferences?.mainStats[slot] ?? []}
                      />
                    ))}

                    <PreferenceChainReadout label="Subs" chain={char.buildPreferences.subStats} />

                    {char.buildPreferences?.comments && (
                      <div className="pref-display-row build-comments-row">
                        <div className="pref-comments-text">{char.buildPreferences.comments}</div>
                      </div>
                    )}
                  </div>
                </ProgressSection>
              )}
          </div>
        </>
      }
    />
  );
}
