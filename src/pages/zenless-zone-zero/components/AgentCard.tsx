import type { ZzzTrackedAgent } from '@/types';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { PreferenceChainReadout } from '@/components/PreferenceChainReadout';
import { ScoreBadge } from '@/components/ScoreBadge';
import { getZzzAgentMugshotUrl, getZzzDiscSuitIconUrl } from '@/lib/imagekit';
import { LevelSlider } from '@/components/LevelSlider';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import { calculateDiscScore } from '@/utils/discScoring';
import { ALL_ZZZ_DISC_SUITS } from '@/data/zenless-zone-zero/disc_suits';
import { ZZZ_DISC_SUIT_SHORT_NAMES } from '@/data/zenless-zone-zero/disc_suit_short_names';
import {
  ZZZ_DISC_SLOTS,
  ZZZ_VARIABLE_MAIN_SLOTS,
  type ZzzDiscSlot,
} from '@/data/zenless-zone-zero/discs';
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
  onToggleDisc: (id: string, slot: ZzzDiscSlot) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse. */
  onEditCommit?: () => void;
}

export function AgentCard({
  agent,
  onRemove,
  onUpdateLevel,
  onUpdateMindscape,
  onUpdateCoreSkill,
  onToggleFavorite,
  onToggleDisc,
  onEditCommit,
}: AgentCardProps) {
  const rarity = getRarityBadge(agent.rarity);
  const specialty = getSpecialtyBadge(agent.specialty);
  const element = getElementBadge(agent.element);

  const score = calculateDiscScore(agent);

  // Investment chips + slider share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(agent.level, 1, 60);
  const mindscapePs = getProgressStyle(agent.mindscape, 0, 6);
  const coreSkillPs = getProgressStyle(agent.coreSkill, 0, 6);

  // Suit counts for the gear one-liner
  const suitCounts = ZZZ_DISC_SLOTS.reduce((acc, slot) => {
    const suitId = agent.discs[slot]?.suitId;
    if (suitId) acc.set(suitId, (acc.get(suitId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  const sortedSuits = [...suitCounts.entries()].sort((a, b) => b[1] - a[1]);
  const equippedColor = getProgressStyle(90, 1, 90).color;
  const emptyColor = getProgressStyle(0, 0, 1).color;

  const bp = agent.buildPreferences;
  const hasAnyPreference =
    Boolean(bp.discSuit4Id) ||
    Boolean(bp.discSuit2Id) ||
    bp.subStats.length > 0 ||
    Boolean(bp.comments) ||
    ZZZ_VARIABLE_MAIN_SLOTS.some((s) => bp.mainStats[s].length > 0);

  const suitName = (suitId: string) =>
    ALL_ZZZ_DISC_SUITS.find((s) => s.id === suitId)?.name ?? suitId;

  return (
    <GameCardShell
      name={agent.name}
      imageUrl={agent.imageUrl}
      resolveImage={getZzzAgentMugshotUrl}
      entityNoun="Agent"
      isFavorited={agent.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(agent.id, value)}
      onEditCommit={onEditCommit}
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
      headerExtra={<ScoreBadge score={score} />}
      temperScore={score}
      summaryLine={[
        // Suit digest — always rendered so collapsed heights stay uniform.
        sortedSuits.length > 0 ? (
          <>
            {sortedSuits.map(([suitId, count], i) => (
              <span key={suitId}>
                {i > 0 && <span style={{ color: equippedColor }}>&nbsp;&middot;&nbsp;</span>}
                <span style={{ color: equippedColor }}>
                  {ZZZ_DISC_SUIT_SHORT_NAMES[suitId] ?? suitName(suitId)} {count}
                </span>
              </span>
            ))}
          </>
        ) : (
          <span className="no-equip" style={{ color: emptyColor }}>
            &mdash;
          </span>
        ),
      ]}
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

          {/* ── Drive Discs (slot grid + Target Build) ────────────── */}
          <div className="card-section-group">
            <div className="card-section-group-header">Drive Discs</div>

            <ProgressSection label="Disc Suits">
              <div className="equip-slot-grid">
                {ZZZ_DISC_SLOTS.map((slot) => {
                  const equipped = agent.discs[slot];
                  const isActive = equipped && equipped.suitId;
                  const suit = isActive
                    ? ALL_ZZZ_DISC_SUITS.find((s) => s.id === equipped.suitId)
                    : undefined;
                  return (
                    <div
                      key={slot}
                      className={`equip-slot-cell ${isActive ? 'active' : ''}`}
                      onClick={() => onToggleDisc(agent.id, slot)}
                      title={`Slot ${slot}${isActive ? ` - ${equipped.mainStat}` : ''}`}
                    >
                      {suit ? (
                        <img
                          src={getZzzDiscSuitIconUrl(suit.icon)}
                          alt="Disc"
                          className="equip-slot-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="equip-slot-icon">◍</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ProgressSection>

            {hasAnyPreference && (
              <ProgressSection label="Target Build" className="build-prefs-display">
                <div className="prefs-display-grid">
                  {(bp.discSuit4Id || bp.discSuit2Id) && (
                    <div className="pref-display-row">
                      <span className="pref-display-label">Suits</span>
                      <div className="pref-display-chain">
                        {bp.discSuit4Id && (
                          <span className="pref-stat-badge">{suitName(bp.discSuit4Id)}</span>
                        )}
                        {bp.discSuit2Id && (
                          <span className="pref-stat-badge">{suitName(bp.discSuit2Id)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {ZZZ_VARIABLE_MAIN_SLOTS.map((slot) => (
                    <PreferenceChainReadout
                      key={slot}
                      label={`Slot ${slot}`}
                      chain={bp.mainStats[slot]}
                    />
                  ))}

                  <PreferenceChainReadout label="Subs" chain={bp.subStats} />

                  {bp.comments && (
                    <div className="pref-display-row build-comments-row">
                      <div className="pref-comments-text">{bp.comments}</div>
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
