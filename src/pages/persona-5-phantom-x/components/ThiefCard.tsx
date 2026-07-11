import type { P5xThiefPatch, P5xTrackedThief } from '@/types';
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
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
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
  onUpdateSkillProgress: (
    id: string,
    patch: Pick<P5xThiefPatch, 'skillsLeveled' | 'roseMaxed'>,
  ) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onToggleMindscapeMaxed: (id: string, value: boolean) => void;
  onUpdateWeaponRarity: (id: string, value: number | null) => void;
  onUpdateWeaponLevel: (id: string, value: number) => void;
  onUpdateWeaponForge: (id: string, value: number) => void;
  onOpenRevelations: (id: string, slot: RevelationSlot) => void;
}

export function ThiefCard({
  thief,
  onRemove,
  onUpdateLevel,
  onUpdateAwareness,
  onUpdateSkillProgress,
  onToggleFavorite,
  onToggleMindscapeMaxed,
  onUpdateWeaponRarity,
  onUpdateWeaponLevel,
  onUpdateWeaponForge,
  onOpenRevelations,
}: ThiefCardProps) {
  // Investment chips + slider share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(thief.level, 1, 80);
  const awarenessPs = getProgressStyle(thief.awareness, 0, 6);
  // Skill progress collapses to one summary chip: maxed (teal) vs rose-gated at
  // Lv8 (mid rust→teal). Untouched Thieves show no chip, keeping early cards clean.
  const roseGated = thief.skillsLeveled && !thief.roseMaxed;
  const skillsPs = getProgressStyle(thief.roseMaxed ? 1 : roseGated ? 0.5 : 0, 0, 1);
  const miPs = getProgressStyle(1, 0, 1);
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

  const hasAnyRevCard = REVELATION_SLOTS.some((slot) => thief.revelations[slot]?.setId);

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
          {thief.weaponRarity !== null && (
            <StatChip
              label={`⚔ ${thief.weaponRarity}★ F${thief.weaponForge}`}
              style={{ color: weaponForgePs.color, borderColor: weaponForgePs.borderColor }}
            />
          )}
          {thief.mindscapeMaxed && (
            <StatChip label="MS ✓" style={{ color: miPs.color, borderColor: miPs.borderColor }} />
          )}
          {hasRevSets && (
            <StatChip
              className="p5x-revelation-chip"
              label={revSummaryLabel}
              style={{ color: revPs.color, borderColor: revPs.borderColor }}
            />
          )}
          {(thief.skillsLeveled || thief.roseMaxed) && (
            <StatChip
              label={thief.roseMaxed ? 'Skills ✓' : '🌹 Gated'}
              style={{ color: skillsPs.color, borderColor: skillsPs.borderColor }}
            />
          )}
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

          <ProgressSection
            label="Weapon"
            value={
              thief.weaponRarity !== null
                ? `${thief.weaponRarity}★ · Lv ${thief.weaponLevel} · F${thief.weaponForge}`
                : '—'
            }
          >
            <SegmentedButtons
              className="weapon-rarity-row"
              options={WEAPON_RARITY_OPTIONS}
              value={thief.weaponRarity !== null ? String(thief.weaponRarity) : null}
              coloring="static"
              allowDeselect
              onChange={(v) => onUpdateWeaponRarity(thief.id, v !== null ? Number(v) : null)}
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

          <ProgressSection label="Mindscape" value={thief.mindscapeMaxed ? 'Maxed' : '—'}>
            <ConfirmCheckbox
              checked={thief.mindscapeMaxed}
              onChange={(val) => onToggleMindscapeMaxed(thief.id, val)}
              label="Fully Unlocked"
            />
          </ProgressSection>

          <ProgressSection
            label="Skills"
            value={thief.roseMaxed ? 'Maxed' : roseGated ? 'Rose-gated' : '—'}
          >
            <div className="skill-toggles">
              <ConfirmCheckbox
                checked={thief.skillsLeveled}
                onChange={(val) => onUpdateSkillProgress(thief.id, { skillsLeveled: val })}
                label="Skills Leveled (Lv8)"
              />
              <ConfirmCheckbox
                checked={thief.roseMaxed}
                onChange={(val) => onUpdateSkillProgress(thief.id, { roseMaxed: val })}
                label="Rose Maxed (Lv10)"
              />
            </div>
          </ProgressSection>
        </>
      }
    />
  );
}
