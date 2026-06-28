import { useLayoutEffect, useRef, useState } from 'react';
import type { AeTrackedOperator } from '@/types';
import { ALL_WEAPONS } from '@/data/arknights-endfield/weapons';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { PreferenceChain } from '@/components/PreferenceChain';
import { getMugshotUrl } from '@/lib/imagekit';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
import { resolveWeaponRank } from './weaponMatch';
import './OperatorCard.css';

interface OperatorCardProps {
  operator: AeTrackedOperator;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdatePhase: (id: string, phase: number) => void;
  onUpdateSkillsMaxed: (id: string, value: boolean) => void;
  onUpdateWeapon: (id: string, weaponName: string | null, weaponLevel: number) => void;
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
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // The edit body is height-capped for its expand/collapse transition, so measure
  // the real content height (which grows with each preferred-weapon row) and use it
  // as the budget — the card lengthens to fit instead of clipping the bottom.
  const editInnerRef = useRef<HTMLDivElement>(null);
  const [editHeight, setEditHeight] = useState(0);
  useLayoutEffect(() => {
    if (editInnerRef.current) setEditHeight(editInnerRef.current.scrollHeight);
  }, [operator.weaponPreferences.length, operator.weaponName, isEditing]);

  const imageUrl = getMugshotUrl(operator.imageUrl);

  // Weapons equippable on this operator are filtered by class (exact type match)
  const equippableWeapons = ALL_WEAPONS.filter((w) => w.type === operator.weapon);
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
    <div
      className={`game-card ${isEditing ? 'is-editing' : ''}`}
      style={
        {
          '--game-card-summary-max-height': '80px',
          '--game-card-edit-max-height': `${editHeight}px`,
        } as React.CSSProperties
      }
    >
      <div className="game-card-header">
        <div className="game-card-image-wrapper">
          {imgLoading && !imgError && (
            <div className="game-card-image-spinner">
              <div className="spinner-dot" />
              <div className="spinner-dot" />
              <div className="spinner-dot" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={operator.name}
            className={`game-card-image ${imgLoading ? 'loading' : 'loaded'}`}
            onLoad={() => setImgLoading(false)}
            onError={(e) => {
              setImgLoading(false);
              setImgError(true);
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${operator.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
            }}
          />
        </div>
        <div className="game-card-overlay"></div>
        <div className="game-card-controls">
          <div className="game-card-controls-top">
            <button
              className={`favorite-btn ${operator.isFavorited ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(operator.id, !operator.isFavorited);
              }}
              title={operator.isFavorited ? 'Unfavorite' : 'Favorite'}
            >
              {operator.isFavorited ? '★' : '☆'}
            </button>
            <button
              className="remove-btn"
              onClick={(e) => onRemove(operator.id, e)}
              title="Remove Operator"
            >
              ✕
            </button>
          </div>
          <div className="game-card-controls-bottom">
            <div className="game-card-badges">
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
            </div>
            <button
              className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing((v) => !v)}
              title={isEditing ? 'Done editing' : 'Edit'}
            >
              {isEditing ? '✓' : '✎'}
            </button>
          </div>
        </div>
      </div>

      <div className={`game-card-body ${isEditing ? 'is-editing' : ''}`}>
        <h3 className="game-card-name">{operator.name}</h3>

        <div className="game-card-static-summary">
          <div className="game-card-static-stats">
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
          </div>
          <div className="game-card-static-line">
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
          </div>
        </div>

        <div className="game-card-edit-body" aria-hidden={!isEditing}>
          <div className="game-card-edit-body-inner" ref={editInnerRef}>
            <ProgressSection label="Level" value={`${operator.level} / 90`}>
              <input
                type="range"
                name={`level-${operator.id}`}
                min="1"
                max="90"
                value={operator.level}
                onChange={(e) => onUpdateLevel(operator.id, parseInt(e.target.value))}
                className="level-slider"
                style={
                  {
                    '--slider-fill-color': levelPs.color,
                    '--slider-fill-glow': levelPs.glowColor,
                    background: `linear-gradient(to right, ${levelPs.color} ${((operator.level - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((operator.level - 1) / 89) * 100}%)`,
                  } as React.CSSProperties
                }
              />
            </ProgressSection>

            <ProgressSection label="Phase" value={`${operator.phase} / 5`}>
              <div className="phase-row">
                {([0, 1, 2, 3, 4, 5] as const).map((p) => (
                  <button
                    key={p}
                    className={`phase-btn ${operator.phase >= p ? 'active' : ''}`}
                    onClick={() => onUpdatePhase(operator.id, p)}
                    title={`P${p}`}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </ProgressSection>

            <ProgressSection label="Skills">
              <ConfirmCheckbox
                checked={operator.skillsMaxed}
                onChange={(val) => onUpdateSkillsMaxed(operator.id, val)}
                label="All Skills Maxed"
              />
            </ProgressSection>

            <ProgressSection label="Weapon" value={`${operator.weaponLevel} / 90`}>
              <select
                name={`weapon-${operator.id}`}
                className="game-select"
                value={operator.weaponName ?? ''}
                onChange={(e) =>
                  onUpdateWeapon(operator.id, e.target.value || null, operator.weaponLevel)
                }
              >
                <option value="">No Weapon</option>
                {equippableWeapons.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name} ({w.rarity}★)
                  </option>
                ))}
              </select>
              <input
                type="range"
                name={`weapon-level-${operator.id}`}
                min="1"
                max="90"
                value={operator.weaponLevel}
                onChange={(e) =>
                  onUpdateWeapon(operator.id, operator.weaponName, parseInt(e.target.value))
                }
                className="level-slider"
                style={
                  {
                    '--slider-fill-color': weaponLevelPs.color,
                    '--slider-fill-glow': weaponLevelPs.glowColor,
                    background: `linear-gradient(to right, ${weaponLevelPs.color} ${((operator.weaponLevel - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((operator.weaponLevel - 1) / 89) * 100}%)`,
                  } as React.CSSProperties
                }
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
          </div>
        </div>
      </div>
    </div>
  );
}
