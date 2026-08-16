import type { P5xTrackedThief } from '@/types';
import {
  ALL_HEAVENS_SETS,
  ALL_SPACE_SETS,
  REVELATION_SLOTS,
  getRevelationSummary,
  statLabel,
  type RevelationSlot,
} from '@/data/persona-5-phantom-x/revelations';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { PreferenceChainReadout } from '@/components/PreferenceChainReadout';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import { calculateRevelationScore } from '@/utils/revelationScoring';
import { ScoreBadge } from '@/components/ScoreBadge';
import './ThiefCard.css';

const AWARENESS_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((a) => ({ value: String(a), label: `A${a}` }));

const WEAPON_RARITY_OPTIONS = [2, 3, 4, 5].map((r) => ({
  value: String(r),
  label: `${r}★`,
  modifier: `rarity-${r}`,
}));

const WEAPON_FORGE_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((f) => ({
  value: String(f),
  label: `F${f}`,
}));

// Mindscape and Skills are both monotone two-milestone progressions (the second
// milestone gates behind the first), so each is a single ordered value edited by
// an identical segmented row; deselecting the active milestone returns to 0.
const MINDSCAPE_OPTIONS = [
  { value: '1', label: 'Outer' },
  { value: '2', label: 'Inner' },
];

const SKILL_OPTIONS = [
  { value: '1', label: 'Lv8' },
  { value: '2', label: 'Rose Lv10' },
];

/** Badge modifiers derive from the verbatim source values (e.g. "Single-target"). */
const toModifier = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

/** No set art exists for revelation sets — grid cells show per-slot glyphs. */
const REV_SLOT_GLYPHS: Record<RevelationSlot, string> = {
  sun: '☀',
  moon: '☽',
  star: '★',
  sky: '☁',
  space: '◈',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface ThiefCardProps {
  thief: P5xTrackedThief;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdateAwareness: (id: string, awareness: number) => void;
  onUpdateSkillProgress: (id: string, value: number) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onUpdateMindscapeProgress: (id: string, value: number) => void;
  onUpdateWeaponRarity: (id: string, value: number) => void;
  onUpdateWeaponLevel: (id: string, value: number) => void;
  onUpdateWeaponForge: (id: string, value: number) => void;
  onOpenRevelations: (id: string, slot: RevelationSlot) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse. */
  onEditCommit?: () => void;
  /** Ghost-tag copy while the card is held; null renders a normal card. */
  heldReason?: string | null;
  /** Plays the exit animation after an evicting release. */
  isExiting?: boolean;
  /** Commits the eviction when the exit animation completes. */
  onExitEnd?: () => void;
}

export function ThiefCard({
  thief,
  onRemove,
  onUpdateLevel,
  onUpdateAwareness,
  onUpdateSkillProgress,
  onToggleFavorite,
  onUpdateMindscapeProgress,
  onUpdateWeaponRarity,
  onUpdateWeaponLevel,
  onUpdateWeaponForge,
  onOpenRevelations,
  onEditCommit,
  heldReason,
  isExiting,
  onExitEnd,
}: ThiefCardProps) {
  // Investment chips + slider share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(thief.level, 1, 80);
  const awarenessPs = getProgressStyle(thief.awareness, 0, 6);
  // Skill progress collapses to one summary chip: maxed (teal) vs rose-gated at
  // Lv8 (mid rust→teal). Untouched Thieves show no chip, keeping early cards clean.
  const roseGated = thief.skillProgress === 1;
  const skillsPs = getProgressStyle(thief.skillProgress, 0, 2);
  const miPs = getProgressStyle(thief.mindscapeProgress, 0, 2);
  const weaponForgePs = getProgressStyle(thief.weaponForge, 0, 6);

  // Consolidated revelation set summary — Space-first, every active set bonus (not just the
  // dominant Heavens set). Same helper feeds the summary chip and the edit-mode readout.
  const revSummary = getRevelationSummary(thief.revelations);
  const revSetParts = [
    ...(revSummary.spaceSet ? [revSummary.spaceSet.name] : []),
    ...revSummary.heavensBonuses.map((b) => `${b.name} ${b.pieces}pc`),
  ];
  const revSummaryLabel = revSetParts.join(' · ');
  const hasRevSets = revSetParts.length > 0;

  // Revelation match score → header badge + chip color. -1 = insufficient data (no prefs / no
  // cards); the badge hides and the chip falls back to the best-Heavens-bonus piece gradient.
  const revScore = calculateRevelationScore(thief);
  const showScore = revScore >= 0;
  const revPs = showScore
    ? getProgressStyle(revScore, 0, 100)
    : getProgressStyle(revSummary.heavensBonuses[0]?.pieces ?? 0, 0, 4);

  const revCardCount = REVELATION_SLOTS.filter((slot) => thief.revelations[slot]?.setId).length;
  const hasAnyRevCard = revCardCount > 0;

  // Target Build readout — shown only when any revelation preference is set.
  const prefs = thief.revelationPreferences;
  const hasRevPrefs = Boolean(
    prefs.heavensSetId ||
    prefs.spaceSetId ||
    prefs.mainStats.moon.length > 0 ||
    prefs.mainStats.star.length > 0 ||
    prefs.mainStats.sky.length > 0 ||
    prefs.subStats.length > 0 ||
    prefs.comments,
  );
  const heavensPrefName = prefs.heavensSetId
    ? (ALL_HEAVENS_SETS.find((s) => s.id === prefs.heavensSetId)?.name ?? prefs.heavensSetId)
    : null;
  const spacePrefName = prefs.spaceSetId
    ? (ALL_SPACE_SETS.find((s) => s.id === prefs.spaceSetId)?.name ?? prefs.spaceSetId)
    : null;

  return (
    <GameCardShell
      name={thief.name}
      imageUrl={thief.imageUrl}
      entityNoun="Phantom Thief"
      reserveSummaryRows
      isFavorited={thief.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(thief.id, value)}
      onRemove={(e) => onRemove(thief.id, e)}
      onEditCommit={onEditCommit}
      heldReason={heldReason}
      isExiting={isExiting}
      onExitEnd={onExitEnd}
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
      headerExtra={<ScoreBadge score={revScore} />}
      temperScore={revScore}
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
          <StatChip
            label={`⚔ ${thief.weaponRarity}★ F${thief.weaponForge}`}
            style={{ color: weaponForgePs.color, borderColor: weaponForgePs.borderColor }}
          />
          {thief.mindscapeProgress > 0 && (
            <StatChip
              label={thief.mindscapeProgress === 2 ? 'MS ✓' : 'MS O'}
              style={{ color: miPs.color, borderColor: miPs.borderColor }}
            />
          )}
          {hasAnyRevCard && (
            <StatChip
              label={`Rev ${revCardCount}/5`}
              style={{ color: revPs.color, borderColor: revPs.borderColor }}
            />
          )}
          {thief.skillProgress > 0 && (
            <StatChip
              label={thief.skillProgress === 2 ? 'Skills ✓' : '🌹 Gated'}
              style={{ color: skillsPs.color, borderColor: skillsPs.borderColor }}
            />
          )}
        </>
      }
      summaryLine={
        <>
          {hasRevSets && (
            <>
              <span className="rev-set-summary" style={{ color: revPs.color }}>
                {revSummaryLabel}
              </span>
              <span className="summary-divider">|</span>
            </>
          )}
          <span className="persona-line">{thief.personaName}</span>
        </>
      }
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

          <ProgressSection
            label="Weapon"
            value={`${thief.weaponRarity}★ · Lv ${thief.weaponLevel} · F${thief.weaponForge}`}
          >
            <SegmentedButtons
              className="weapon-rarity-row"
              options={WEAPON_RARITY_OPTIONS}
              value={String(thief.weaponRarity)}
              coloring="static"
              // No allowDeselect, so v is never null; guard keeps the number type honest.
              onChange={(v) => v !== null && onUpdateWeaponRarity(thief.id, Number(v))}
            />
            <LevelSlider
              name={`weapon-level-${thief.id}`}
              value={thief.weaponLevel}
              min={1}
              max={80}
              onChange={(n) => onUpdateWeaponLevel(thief.id, n)}
            />
            <SegmentedButtons
              className="weapon-forge-row"
              options={WEAPON_FORGE_OPTIONS}
              value={String(thief.weaponForge)}
              coloring="investment"
              onChange={(v) => onUpdateWeaponForge(thief.id, Number(v))}
            />
          </ProgressSection>

          {/* Slot grid — clicking a cell opens the editor anchored to that slot. Set names
              live on the summary chip and inside the modal; the grid shows fill state. */}
          <ProgressSection label="Revelations" value={hasAnyRevCard ? undefined : '—'}>
            <div className="equip-slot-grid p5x-rev-grid">
              {REVELATION_SLOTS.map((slot) => {
                const isActive = Boolean(thief.revelations[slot]?.setId);
                return (
                  <div
                    key={slot}
                    className={`equip-slot-cell ${isActive ? 'active' : ''}`}
                    title={capitalize(slot)}
                    onClick={() => onOpenRevelations(thief.id, slot)}
                  >
                    <span className="equip-slot-icon">{REV_SLOT_GLYPHS[slot]}</span>
                  </div>
                );
              })}
            </div>
          </ProgressSection>

          {hasRevPrefs && (
            <ProgressSection label="Target Build" className="build-prefs-display">
              <div className="prefs-display-grid">
                {(spacePrefName || heavensPrefName) && (
                  <div className="pref-display-row">
                    <span className="pref-display-label">Sets</span>
                    <div className="pref-display-chain">
                      {spacePrefName && <span className="pref-stat-badge">{spacePrefName}</span>}
                      {heavensPrefName && (
                        <span className="pref-stat-badge">{heavensPrefName}</span>
                      )}
                    </div>
                  </div>
                )}

                {(['moon', 'star', 'sky'] as const).map((slot) => (
                  <PreferenceChainReadout
                    key={slot}
                    label={capitalize(slot)}
                    chain={prefs.mainStats[slot]}
                    formatStat={statLabel}
                  />
                ))}

                <PreferenceChainReadout
                  label="Subs"
                  chain={prefs.subStats}
                  formatStat={statLabel}
                />

                {prefs.comments && (
                  <div className="pref-display-row build-comments-row">
                    <div className="pref-comments-text">{prefs.comments}</div>
                  </div>
                )}
              </div>
            </ProgressSection>
          )}

          <ProgressSection
            label="Mindscape"
            value={
              thief.mindscapeProgress === 2
                ? 'Maxed'
                : thief.mindscapeProgress === 1
                  ? 'Outer'
                  : '—'
            }
          >
            <SegmentedButtons
              className="mindscape-row"
              options={MINDSCAPE_OPTIONS}
              value={thief.mindscapeProgress > 0 ? String(thief.mindscapeProgress) : null}
              coloring="investment"
              allowDeselect
              onChange={(v) => onUpdateMindscapeProgress(thief.id, v === null ? 0 : Number(v))}
            />
          </ProgressSection>

          <ProgressSection
            label="Skills"
            value={thief.skillProgress === 2 ? 'Maxed' : roseGated ? 'Rose-gated' : '—'}
          >
            <SegmentedButtons
              className="skills-row"
              options={SKILL_OPTIONS}
              value={thief.skillProgress > 0 ? String(thief.skillProgress) : null}
              coloring="investment"
              allowDeselect
              onChange={(v) => onUpdateSkillProgress(thief.id, v === null ? 0 : Number(v))}
            />
          </ProgressSection>
        </>
      }
    />
  );
}
