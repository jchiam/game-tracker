import type { AeTrackedOperator, AeWeaponPatch } from '@/types';
import { ALL_WEAPONS } from '@/data/arknights-endfield/weapons';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import { resolveWeaponRank } from './weaponMatch';
import { sortWeaponsForDisplay } from './weaponSort';
import './OperatorCard.css';

const PHASE_OPTIONS = [0, 1, 2, 3, 4, 5].map((p) => ({ value: String(p), label: `P${p}` }));

interface OperatorCardProps {
  operator: AeTrackedOperator;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdatePhase: (id: string, phase: number) => void;
  onUpdateSkillsMaxed: (id: string, value: boolean) => void;
  onUpdateWeapon: (id: string, patch: AeWeaponPatch) => void;
  onUpdateWeaponPreferences: (id: string, preferences: string[]) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
}

export function OperatorCard({
  operator,
  onRemove,
  onUpdateLevel,
  onUpdatePhase,
  onUpdateSkillsMaxed,
  onUpdateWeapon,
  onUpdateWeaponPreferences,
  onToggleFavorite,
}: OperatorCardProps) {
  // Weapons equippable on this operator are filtered by class (exact type match)
  const equippableWeapons = sortWeaponsForDisplay(
    ALL_WEAPONS.filter((w) => w.type === operator.weapon),
  );
  // Preference editor works in id-space; the picker shows the same label as the
  // equip selector (name + rarity) so the two dropdowns read identically.
  const weaponPrefOptions = equippableWeapons.map((w) => ({
    value: w.id,
    label: `${w.name} (${w.rarity}★)`,
  }));

  // Match badge: where the equipped weapon ranks in the preference list.
  const prefCount = operator.weaponPreferences.length;
  const matchRank = resolveWeaponRank(operator.weaponName, operator.weaponPreferences);
  const showMatchBadge = prefCount > 0 && operator.weaponName !== null;
  // First choice reads full/teal; lower ranks step toward rust; not-listed = off-build rust.
  const matchPs =
    matchRank === null
      ? getProgressStyle(0, 0, 1)
      : getProgressStyle(prefCount - matchRank, 0, prefCount);
  const matchLabel = matchRank === null ? 'Off-build' : `#${matchRank + 1}`;

  // Investment chips + sliders share the cross-game rust→teal gradient
  const levelPs = getProgressStyle(operator.level, 1, 90);
  const phasePs = getProgressStyle(operator.phase, 0, 5);
  const skillsPs = getProgressStyle(operator.skillsMaxed ? 1 : 0, 0, 1);
  // Weapon line: name teal when equipped / rust when empty; level colored by its own level
  const weaponNamePs = operator.weaponName
    ? getProgressStyle(90, 1, 90)
    : getProgressStyle(0, 0, 1);
  const weaponLevelPs = getProgressStyle(operator.weaponLevel, 1, 90);

  return (
    <GameCardShell
      name={operator.name}
      imageUrl={operator.imageUrl}
      entityNoun="Operator"
      isFavorited={operator.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(operator.id, value)}
      onRemove={(e) => onRemove(operator.id, e)}
      badges={
        <>
          <GameBadge
            label={operator.class}
            variant="ae-class"
            modifier={operator.class.toLowerCase()}
          />
          <GameBadge
            label={operator.element}
            variant="ae-element"
            modifier={operator.element.toLowerCase()}
          />
          <GameBadge
            label={operator.weapon}
            variant="ae-weapon"
            modifier={operator.weapon.toLowerCase().replace(' ', '-')}
          />
        </>
      }
      summaryStats={
        <>
          <StatChip
            label={`Lv ${operator.level}`}
            style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
          />
          <StatChip
            label={`P${operator.phase}`}
            style={{ color: phasePs.color, borderColor: phasePs.borderColor }}
          />
          <StatChip
            label={`Skills ${operator.skillsMaxed ? '✓' : '✗'}`}
            style={{ color: skillsPs.color, borderColor: skillsPs.borderColor }}
          />
        </>
      }
      summaryLine={
        <>
          {operator.weaponName ? (
            <>
              <span style={{ color: weaponNamePs.color }}>{operator.weaponName}</span>
              <span style={{ color: weaponLevelPs.color }}>
                &nbsp;·&nbsp;Lv&nbsp;{operator.weaponLevel}
              </span>
            </>
          ) : (
            <span className="no-weapon" style={{ color: weaponNamePs.color }}>
              &mdash;
            </span>
          )}
          {showMatchBadge && (
            <span
              className="weapon-match-badge"
              style={{ color: matchPs.color, borderColor: matchPs.borderColor }}
              title="Equipped weapon vs preferred"
            >
              {matchLabel}
            </span>
          )}
        </>
      }
      editBody={
        <>
          <ProgressSection label="Level" value={`${operator.level} / 90`}>
            <LevelSlider
              name={`level-${operator.id}`}
              value={operator.level}
              min={1}
              max={90}
              onChange={(n) => onUpdateLevel(operator.id, n)}
            />
          </ProgressSection>

          <ProgressSection label="Phase" value={`${operator.phase} / 5`}>
            <SegmentedButtons
              className="phase-row"
              options={PHASE_OPTIONS}
              value={String(operator.phase)}
              coloring="investment"
              onChange={(v) => onUpdatePhase(operator.id, Number(v))}
            />
          </ProgressSection>

          <ProgressSection label="Skills">
            <ConfirmCheckbox
              checked={operator.skillsMaxed}
              onChange={(val) => onUpdateSkillsMaxed(operator.id, val)}
              label="All Skills Maxed"
            />
          </ProgressSection>

          <ProgressSection label="Weapon" value={`${operator.weaponLevel} / 90`}>
            <Select
              name={`weapon-${operator.id}`}
              size="sm"
              value={operator.weaponName ?? ''}
              placeholder="No Weapon"
              options={equippableWeapons.map((w) => ({
                value: w.name,
                label: `${w.name} (${w.rarity}★)`,
              }))}
              onChange={(v) => onUpdateWeapon(operator.id, { weaponName: v || null })}
            />
            <LevelSlider
              name={`weapon-level-${operator.id}`}
              value={operator.weaponLevel}
              min={1}
              max={90}
              onChange={(n) => onUpdateWeapon(operator.id, { weaponLevel: n })}
            />
          </ProgressSection>

          <ProgressSection label="Preferred Weapons">
            <PreferenceChain
              variant="ranked-list"
              values={operator.weaponPreferences}
              options={weaponPrefOptions}
              onChange={(prefs) => onUpdateWeaponPreferences(operator.id, prefs)}
              namePrefix={`weapon-pref-${operator.id}`}
              addLabel="+ Add Weapon"
            />
          </ProgressSection>
        </>
      }
    />
  );
}
