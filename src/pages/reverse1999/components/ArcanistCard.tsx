import type { R1999TrackedArcanist } from '@/types';
import { ALL_ARCANISTS } from '@/data/reverse1999/arcanists';
import { ALL_PSYCHUBES } from '@/data/reverse1999/psychubes';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Select } from '@/components/Select';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import './ArcanistCard.css';

const PORTRAIT_OPTIONS = [0, 1, 2, 3, 4, 5].map((level) => ({
  value: String(level),
  label: `P${level}`,
  modifier: level === 0 ? 'portrait-reset' : undefined,
}));
const EUPHORIA_OPTIONS = [0, 1, 2, 3, 4].map((stage) => ({
  value: String(stage),
  label: `E${stage}`,
}));
const AMPLIFICATION_OPTIONS = [1, 2, 3, 4, 5].map((lvl) => ({
  value: String(lvl),
  label: `A${lvl}`,
}));

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
  const staticArcanist = ALL_ARCANISTS.find((a) => a.name === arcanist.name);
  const hasEuphoria = staticArcanist?.hasEuphoria ?? false;

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
    <GameCardShell
      name={arcanist.name}
      imageUrl={arcanist.imageUrl}
      entityNoun="Arcanist"
      isFavorited={arcanist.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(arcanist.id!, value)}
      onRemove={(e) => onRemove(arcanist.id!, e)}
      badges={
        <>
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
        </>
      }
      summaryStats={
        <>
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
        </>
      }
      summaryLine={
        selectedPsychube ? (
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
        )
      }
      editBody={
        <>
          <ProgressSection label="Level" value={`${arcanist.level} / 60`}>
            <LevelSlider
              name={`level-${arcanist.id}`}
              value={arcanist.level}
              min={1}
              max={60}
              onChange={(n) => onUpdateLevel(arcanist.id!, n)}
            />
          </ProgressSection>

          <ProgressSection label="Portrait Level" value={`${arcanist.portraitLevel} / 5`}>
            <SegmentedButtons
              className="portrait-row"
              options={PORTRAIT_OPTIONS}
              value={String(arcanist.portraitLevel)}
              coloring="investment"
              onChange={(v) => onUpdatePortrait(arcanist.id!, Number(v))}
            />
          </ProgressSection>

          <ProgressSection label="Resonance Level" value={`${arcanist.resonanceLevel} / 15`}>
            <LevelSlider
              name={`resonance-${arcanist.id}`}
              value={arcanist.resonanceLevel}
              min={0}
              max={15}
              onChange={(n) => onUpdateResonance(arcanist.id!, n)}
            />
          </ProgressSection>

          {hasEuphoria && (
            <ProgressSection label="Euphoria">
              <SegmentedButtons
                className="euphoria-row"
                options={EUPHORIA_OPTIONS}
                value={String(arcanist.euphoriaStage)}
                coloring="investment"
                onChange={(v) => onUpdateEuphoriaStage(arcanist.id!, Number(v))}
              />
            </ProgressSection>
          )}

          <ProgressSection label="Psychube" value={`${arcanist.psychubeLevel} / 60`}>
            <Select
              name={`psychube-${arcanist.id}`}
              size="sm"
              value={arcanist.psychubeName ?? ''}
              placeholder="No Psychube"
              options={ALL_PSYCHUBES.map((p) => ({
                value: p.name,
                label: `${p.name} (${p.rarity}★)`,
              }))}
              onChange={(v) => onUpdatePsychube(arcanist.id!, v || null, arcanist.psychubeLevel)}
            />
            <LevelSlider
              name={`psychube-level-${arcanist.id}`}
              value={arcanist.psychubeLevel}
              min={1}
              max={60}
              onChange={(n) => onUpdatePsychube(arcanist.id!, arcanist.psychubeName, n)}
            />
            <div className="amplification-row">
              <span className="section-sublabel">Amplify</span>
              <SegmentedButtons
                options={AMPLIFICATION_OPTIONS}
                value={String(arcanist.psychubeAmplification)}
                coloring="investment"
                size="compact"
                onChange={(v) => onUpdatePsychubeAmplification(arcanist.id!, Number(v))}
              />
            </div>
          </ProgressSection>
        </>
      }
    />
  );
}
