import type { CznTrackedCombatant } from '@/types';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import { CZN_MAX_EGO, CZN_MAX_LEVEL } from '@/hooks/chaos-zero-nightmare/combatantLimits';
import { formatEgo, getClassBadge, getElementBadge, getRarityBadge } from './combatantBadges';
import './CombatantCard.css';

// Manifest Ego is a single rung 0–6: T0 is the base state, T1–T6 the dupe unlocks.
const EGO_OPTIONS = Array.from({ length: CZN_MAX_EGO + 1 }, (_, e) => ({
  value: String(e),
  label: formatEgo(e),
}));

interface CombatantCardProps {
  combatant: CznTrackedCombatant;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdateEgo: (id: string, ego: number) => void;
  onTogglePotential: (id: string, value: boolean) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse. */
  onEditCommit?: () => void;
  /** Ghost-tag copy while the card is held; null renders a normal card. */
  heldReason?: string | null;
  /** Plays the exit animation after an evicting release. */
  isExiting?: boolean;
  /** Commits the eviction when the exit animation completes. */
  onExitEnd?: () => void;
}

export function CombatantCard({
  combatant,
  onRemove,
  onUpdateLevel,
  onUpdateEgo,
  onTogglePotential,
  onToggleFavorite,
  onEditCommit,
  heldReason,
  isExiting,
  onExitEnd,
}: CombatantCardProps) {
  const rarity = getRarityBadge(combatant.rarity);
  const cls = getClassBadge(combatant.class);
  const element = getElementBadge(combatant.element);

  // Investment chips + slider share the cross-game rust→teal gradient.
  const levelPs = getProgressStyle(combatant.level, 1, CZN_MAX_LEVEL);
  const egoPs = getProgressStyle(combatant.ego, 0, CZN_MAX_EGO);
  const potentialPs = getProgressStyle(combatant.potentialAttained ? 1 : 0, 0, 1);

  return (
    <GameCardShell
      name={combatant.name}
      imageUrl={combatant.imageUrl}
      entityNoun="Combatant"
      isFavorited={combatant.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(combatant.id, value)}
      onEditCommit={onEditCommit}
      onRemove={(e) => onRemove(combatant.id, e)}
      heldReason={heldReason}
      isExiting={isExiting}
      onExitEnd={onExitEnd}
      badges={
        <>
          <GameBadge label={rarity.label} variant="czn-rarity" modifier={rarity.modifier} />
          <GameBadge label={cls.label} variant="czn-class" modifier={cls.modifier} />
          <GameBadge label={element.label} variant="czn-element" modifier={element.modifier} />
        </>
      }
      summaryStats={
        <>
          <StatChip
            label={`Lv ${combatant.level}`}
            style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
          />
          <StatChip
            label={formatEgo(combatant.ego)}
            style={{ color: egoPs.color, borderColor: egoPs.borderColor }}
          />
          <StatChip
            label={`Potential ${combatant.potentialAttained ? '✓' : '✗'}`}
            style={{ color: potentialPs.color, borderColor: potentialPs.borderColor }}
          />
        </>
      }
      // No equipment digest in Phase 1 — an empty array renders zero summary lines.
      summaryLine={[]}
      editBody={
        <>
          <ProgressSection label="Level" value={`${combatant.level} / ${CZN_MAX_LEVEL}`}>
            <LevelSlider
              name={`level-${combatant.id}`}
              value={combatant.level}
              min={1}
              max={CZN_MAX_LEVEL}
              onChange={(n) => onUpdateLevel(combatant.id, n)}
            />
          </ProgressSection>

          <ProgressSection label="Manifest Ego" value={formatEgo(combatant.ego)}>
            <SegmentedButtons
              className="ego-row"
              options={EGO_OPTIONS}
              value={String(combatant.ego)}
              coloring="investment"
              onChange={(v) => onUpdateEgo(combatant.id, Number(v))}
            />
          </ProgressSection>

          <ProgressSection label="Potential">
            <ConfirmCheckbox
              checked={combatant.potentialAttained}
              onChange={(val) => onTogglePotential(combatant.id, val)}
              label="Potential Fully Unlocked"
            />
          </ProgressSection>
        </>
      }
    />
  );
}
