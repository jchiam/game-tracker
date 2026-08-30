import { Fragment, useState } from 'react';
import type { ZzzTrackedAgent } from '@/types';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { PreferenceChainReadout } from '@/components/PreferenceChainReadout';
import { ScoreBadge } from '@/components/ScoreBadge';
import { getZzzAgentMugshotUrl, getZzzDiscSuitIconUrl, getZzzWEngineIconUrl } from '@/lib/imagekit';
import { LevelSlider } from '@/components/LevelSlider';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Select } from '@/components/Select';
import { StatChip } from '@/components/StatChip';
import { ToggleChips } from '@/components/ToggleChips';
import { getProgressStyle } from '@/utils/progressGradient';
import { calculateZzzBuildScore } from '@/utils/zzzBuildScore';
import { ALL_ZZZ_DISC_SUITS } from '@/data/zenless-zone-zero/disc_suits';
import { ALL_ZZZ_WENGINES } from '@/data/zenless-zone-zero/wengines';
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
  ZZZ_COMBAT_SKILLS,
  type ZzzSkillKey,
} from './agentBadges';
import './AgentCard.css';

const MINDSCAPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((m) => ({ value: String(m), label: `M${m}` }));

const PHASE_OPTIONS = [1, 2, 3, 4, 5].map((p) => ({ value: String(p), label: `P${p}` }));

// Content policy, not a visual token: the preference strip shows at most this
// many engine tiles before collapsing the rest into a +N overflow tile.
const WENGINE_STRIP_MAX = 5;

const wengineRarityLetter = (rarity: number) => (rarity === 4 ? 'S' : rarity === 3 ? 'A' : 'B');

// Core Skill rungs are edited A→F (A first, F max) as a cumulative ladder — each
// rung is a prerequisite of the next. Deselecting the selected rung returns to 0
// (unenhanced; the Core Passive itself is always active).
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
  /** One callback for all five flags — the page dispatches by skill key. */
  onToggleSkillMaxed: (id: string, skill: ZzzSkillKey, value: boolean) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onToggleDisc: (id: string, slot: ZzzDiscSlot) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse. */
  onEditCommit?: () => void;
  onUpdateWEngine: (id: string, wEngineId: string | null) => void;
  onUpdateWEngineLevel: (id: string, level: number) => void;
  onUpdateWEnginePhase: (id: string, phase: number) => void;
  onEditWEnginePrefs: (id: string) => void;
}

export function AgentCard({
  agent,
  onRemove,
  onUpdateLevel,
  onUpdateMindscape,
  onUpdateCoreSkill,
  onToggleSkillMaxed,
  onToggleFavorite,
  onToggleDisc,
  onEditCommit,
  onUpdateWEngine,
  onUpdateWEngineLevel,
  onUpdateWEnginePhase,
  onEditWEnginePrefs,
}: AgentCardProps) {
  const [captionWEngineId, setCaptionWEngineId] = useState<string | null>(null);
  const rarity = getRarityBadge(agent.rarity);
  const specialty = getSpecialtyBadge(agent.specialty);
  const element = getElementBadge(agent.element);

  const score = calculateZzzBuildScore(agent);

  // Investment chips + slider share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(agent.level, 1, 60);
  const mindscapePs = getProgressStyle(agent.mindscape, 0, 6);
  const coreSkillPs = getProgressStyle(agent.coreSkill, 0, 6);

  // Combat skill flags: the row's on-values and the maxed count they summarise.
  const maxedSkillValues = ZZZ_COMBAT_SKILLS.filter(({ key }) => agent[key]).map(
    ({ value }) => value,
  );
  const skillsPs = getProgressStyle(maxedSkillValues.length, 0, ZZZ_COMBAT_SKILLS.length);

  // W-Engine summary segments — name teal when equipped, level/Phase on the
  // shared gradient. Only same-specialty engines are offered (off-specialty
  // engines lose their passive in game).
  const selectedWEngine = agent.wEngineId
    ? (ALL_ZZZ_WENGINES.find((w) => w.id === agent.wEngineId) ?? null)
    : null;
  const equippableWEngines = ALL_ZZZ_WENGINES.filter((w) => w.specialty === agent.specialty);
  const wengineNamePs = selectedWEngine ? getProgressStyle(60, 0, 60) : getProgressStyle(0, 0, 1);
  const wengineLevelPs = getProgressStyle(agent.wEngineLevel, 0, 60);
  const wenginePhasePs = selectedWEngine
    ? getProgressStyle(agent.wEnginePhase, 1, 5)
    : getProgressStyle(0, 0, 1);

  // Match badge: where the equipped engine ranks in the preference list.
  const wenginePrefs = agent.wEnginePreferences;
  const wengineRank = agent.wEngineId ? wenginePrefs.indexOf(agent.wEngineId) : -1;
  const showWEngineMatchBadge = wenginePrefs.length > 0 && agent.wEngineId !== null;
  const wengineMatchPs =
    wengineRank === -1
      ? getProgressStyle(0, 0, 1)
      : getProgressStyle(wenginePrefs.length - wengineRank, 0, wenginePrefs.length);
  const wengineMatchLabel = wengineRank === -1 ? 'Off-build' : `#${wengineRank + 1}`;

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
          <StatChip
            label={`Skl ${maxedSkillValues.length}/${ZZZ_COMBAT_SKILLS.length}`}
            style={{ color: skillsPs.color, borderColor: skillsPs.borderColor }}
          />
        </>
      }
      headerExtra={<ScoreBadge score={score} />}
      temperScore={score}
      summaryLine={[
        // Line 1: W-Engine readout. Always rendered so every card shows the
        // same two summary lines and collapsed heights stay uniform.
        selectedWEngine ? (
          <>
            <img
              src={getZzzWEngineIconUrl(selectedWEngine.imageUrl)}
              alt=""
              className="wengine-icon"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span style={{ color: wengineNamePs.color }}>{selectedWEngine.name}</span>
            <span style={{ color: wengineLevelPs.color }}>
              &nbsp;&middot;&nbsp;Lv&nbsp;{agent.wEngineLevel}
            </span>
            <span style={{ color: wenginePhasePs.color }}>
              &nbsp;&middot;&nbsp;P{agent.wEnginePhase}
            </span>
            {showWEngineMatchBadge && (
              <span
                className="wengine-match-badge"
                style={{ color: wengineMatchPs.color, borderColor: wengineMatchPs.borderColor }}
                title="Equipped W-Engine vs preferred"
              >
                {wengineMatchLabel}
              </span>
            )}
          </>
        ) : (
          <span className="no-equip" style={{ color: emptyColor }}>
            &mdash;
          </span>
        ),
        // Line 2: suit digest — always rendered so collapsed heights stay uniform.
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
              fill="cumulative"
              allowDeselect
              onChange={(v) => onUpdateCoreSkill(agent.id, v === null ? 0 : Number(v))}
            />
          </ProgressSection>

          <ProgressSection
            label="Skills at Lv12"
            value={`${maxedSkillValues.length} / ${ZZZ_COMBAT_SKILLS.length}`}
          >
            <ToggleChips
              className="combat-skill-row"
              size="compact"
              options={ZZZ_COMBAT_SKILLS.map(({ value, label }) => ({ value, label }))}
              values={maxedSkillValues}
              onToggle={(v) => onToggleSkillMaxed(agent.id, v, !maxedSkillValues.includes(v))}
            />
          </ProgressSection>

          {/* ── W-Engine (equip + preferences) ───────────────────── */}
          <div className="card-section-group">
            <div className="card-section-group-header">W-Engine</div>

            <ProgressSection label="Equipped" value={`${agent.wEngineLevel} / 60`}>
              <Select
                name={`wengine-${agent.id}`}
                size="sm"
                value={agent.wEngineId ?? ''}
                placeholder="No W-Engine"
                options={equippableWEngines.map((w) => ({
                  value: w.id,
                  label: `${w.name} (${wengineRarityLetter(w.rarity)})`,
                }))}
                onChange={(v) => onUpdateWEngine(agent.id, v || null)}
              />
              <LevelSlider
                name={`wengine-level-${agent.id}`}
                value={agent.wEngineLevel}
                min={0}
                max={60}
                onChange={(n) => onUpdateWEngineLevel(agent.id, n)}
              />
              <span className="section-sublabel">Phase</span>
              <SegmentedButtons
                options={PHASE_OPTIONS}
                value={String(agent.wEnginePhase)}
                coloring="investment"
                size="compact"
                onChange={(v) => onUpdateWEnginePhase(agent.id, Number(v))}
              />
            </ProgressSection>

            <ProgressSection
              label="Preferences"
              value={wenginePrefs.length > 0 ? `${wenginePrefs.length} ranked` : undefined}
            >
              {wenginePrefs.length > 0 && (
                <div className="wengine-pref-strip">
                  {wenginePrefs.slice(0, WENGINE_STRIP_MAX).map((wengineId, idx) => {
                    const wengine = ALL_ZZZ_WENGINES.find((w) => w.id === wengineId);
                    const isEquipped = agent.wEngineId === wengineId;
                    return (
                      <Fragment key={wengineId}>
                        {idx > 0 && <span className="pref-operator-badge">&gt;</span>}
                        <div
                          className={`equip-slot-cell wengine-pref-tile ${isEquipped ? 'active' : ''}`}
                          style={
                            isEquipped
                              ? {
                                  borderColor: wengineMatchPs.borderColor,
                                  color: wengineMatchPs.color,
                                }
                              : undefined
                          }
                          title={
                            wengine
                              ? `${wengine.name} (${wengineRarityLetter(wengine.rarity)})`
                              : wengineId
                          }
                          onClick={() => {
                            setCaptionWEngineId((prev) => (prev === wengineId ? null : wengineId));
                          }}
                        >
                          {wengine && (
                            <img
                              src={getZzzWEngineIconUrl(wengine.imageUrl)}
                              alt=""
                              className="equip-slot-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="wengine-pref-rank">#{idx + 1}</span>
                        </div>
                      </Fragment>
                    );
                  })}
                  {wenginePrefs.length > WENGINE_STRIP_MAX && (
                    <div
                      className="equip-slot-cell wengine-pref-tile wengine-pref-overflow"
                      title="Edit preferences"
                      onClick={() => onEditWEnginePrefs(agent.id)}
                    >
                      +{wenginePrefs.length - WENGINE_STRIP_MAX}
                    </div>
                  )}
                </div>
              )}
              {captionWEngineId && wenginePrefs.includes(captionWEngineId) && (
                <div className="wengine-pref-caption">
                  #{wenginePrefs.indexOf(captionWEngineId) + 1}{' '}
                  {(() => {
                    const wengine = ALL_ZZZ_WENGINES.find((w) => w.id === captionWEngineId);
                    return wengine
                      ? `${wengine.name} (${wengineRarityLetter(wengine.rarity)})`
                      : captionWEngineId;
                  })()}
                </div>
              )}
              <button className="btn secondary-action" onClick={() => onEditWEnginePrefs(agent.id)}>
                Edit Preferences
              </button>
            </ProgressSection>
          </div>

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
