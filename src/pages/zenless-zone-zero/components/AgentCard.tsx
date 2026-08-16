import type { ZzzTrackedAgent } from '@/types';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import {
  getCoreSkillLetter,
  getElementBadge,
  getRarityBadge,
  getSpecialtyBadge,
} from './agentBadges';
import './AgentCard.css';

const MINDSCAPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((m) => ({ value: String(m), label: `M${m}` }));

// Core Skill rungs are edited F→A; deselecting the active rung returns to 0 (locked).
const CORE_SKILL_OPTIONS = [1, 2, 3, 4, 5, 6].map((c) => ({
  value: String(c),
  label: getCoreSkillLetter(c),
}));

interface AgentCardProps {
  agent: ZzzTrackedAgent;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdateMindscape: (id: string, mindscape: number) => void;
  onUpdateCoreSkill: (id: string, coreSkill: number) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
}

export function AgentCard({
  agent,
  onRemove,
  onUpdateLevel,
  onUpdateMindscape,
  onUpdateCoreSkill,
  onToggleFavorite,
}: AgentCardProps) {
  const rarity = getRarityBadge(agent.rarity);
  const specialty = getSpecialtyBadge(agent.specialty);
  const element = getElementBadge(agent.element);

  // Investment chips + slider share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(agent.level, 1, 60);
  const mindscapePs = getProgressStyle(agent.mindscape, 0, 6);
  const coreSkillPs = getProgressStyle(agent.coreSkill, 0, 6);

  return (
    <GameCardShell
      name={agent.name}
      imageUrl={agent.imageUrl}
      entityNoun="Agent"
      isFavorited={agent.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(agent.id, value)}
      onRemove={(e) => onRemove(agent.id, e)}
      badges={
        <>
          <GameBadge label={rarity.label} variant="zzz-rarity" modifier={rarity.modifier} />
          <GameBadge
            label={specialty.label}
            variant="zzz-specialty"
            modifier={specialty.modifier}
          />
          <GameBadge label={element.label} variant="zzz-element" modifier={element.modifier} />
        </>
      }
      summaryStats={
        <>
          <StatChip
            label={`Lv ${agent.level}`}
            style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
          />
          <StatChip
            label={`M${agent.mindscape}`}
            style={{ color: mindscapePs.color, borderColor: mindscapePs.borderColor }}
          />
          <StatChip
            label={`Core ${getCoreSkillLetter(agent.coreSkill)}`}
            style={{ color: coreSkillPs.color, borderColor: coreSkillPs.borderColor }}
          />
        </>
      }
      summaryLine={[]}
      editBody={
        <>
          <ProgressSection label="Level" value={`${agent.level} / 60`}>
            <LevelSlider
              name={`level-${agent.id}`}
              value={agent.level}
              min={1}
              max={60}
              onChange={(n) => onUpdateLevel(agent.id, n)}
            />
          </ProgressSection>

          <ProgressSection label="Mindscape" value={`M${agent.mindscape}`}>
            <SegmentedButtons
              className="mindscape-row"
              options={MINDSCAPE_OPTIONS}
              value={String(agent.mindscape)}
              coloring="investment"
              onChange={(v) => onUpdateMindscape(agent.id, Number(v))}
            />
          </ProgressSection>

          <ProgressSection label="Core Skill" value={getCoreSkillLetter(agent.coreSkill)}>
            <SegmentedButtons
              className="core-skill-row"
              options={CORE_SKILL_OPTIONS}
              value={agent.coreSkill > 0 ? String(agent.coreSkill) : null}
              coloring="investment"
              allowDeselect
              onChange={(v) => onUpdateCoreSkill(agent.id, v === null ? 0 : Number(v))}
            />
          </ProgressSection>
        </>
      }
    />
  );
}
