import type { P5xTrackedThief } from '@/types';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import './ThiefCard.css';

const AWARENESS_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((a) => ({ value: String(a), label: `A${a}` }));

/** Badge modifiers derive from the verbatim source values (e.g. "Single-target"). */
const toModifier = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

interface ThiefCardProps {
  thief: P5xTrackedThief;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdateAwareness: (id: string, awareness: number) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
}

export function ThiefCard({
  thief,
  onRemove,
  onUpdateLevel,
  onUpdateAwareness,
  onToggleFavorite,
}: ThiefCardProps) {
  // Investment chips + slider share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(thief.level, 1, 80);
  const awarenessPs = getProgressStyle(thief.awareness, 0, 6);

  return (
    <GameCardShell
      name={thief.name}
      imageUrl={thief.imageUrl}
      entityNoun="Phantom Thief"
      isFavorited={thief.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(thief.id, value)}
      onRemove={(e) => onRemove(thief.id, e)}
      badges={
        <>
          <GameBadge label={thief.role} variant="p5x-role" modifier={toModifier(thief.role)} />
          <GameBadge
            label={thief.element}
            variant="p5x-element"
            modifier={toModifier(thief.element)}
          />
        </>
      }
      summaryStats={
        <>
          <StatChip
            label={`Lv ${thief.level}`}
            style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
          />
          <StatChip
            label={`A${thief.awareness}`}
            style={{ color: awarenessPs.color, borderColor: awarenessPs.borderColor }}
          />
        </>
      }
      summaryLine={<span className="persona-line">{thief.personaName}</span>}
      editBody={
        <>
          <ProgressSection label="Level" value={`${thief.level} / 80`}>
            <LevelSlider
              name={`level-${thief.id}`}
              value={thief.level}
              min={1}
              max={80}
              onChange={(n) => onUpdateLevel(thief.id, n)}
            />
          </ProgressSection>

          <ProgressSection label="Awareness" value={`A${thief.awareness}`}>
            <SegmentedButtons
              className="awareness-row"
              options={AWARENESS_OPTIONS}
              value={String(thief.awareness)}
              coloring="investment"
              onChange={(v) => onUpdateAwareness(thief.id, Number(v))}
            />
          </ProgressSection>
        </>
      }
    />
  );
}
