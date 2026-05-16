import type { N2ETrackedCharacter } from '@/types';
import { ALL_ARCS } from '@/data/neverness-to-everness/arcs';
import { calculateCartridgeScore, getScoreGrade } from '@/utils/cartridgeScoring';
import { getMugshotUrl } from '@/lib/imagekit';
import { useState } from 'react';
import { CartridgeEditorModal } from './CartridgeEditorModal';
import './CharacterCard.css';

// ─── Progress color gradient utilities ──────────────────────────────

interface ProgressStyle {
  color: string;
  borderColor: string;
  glowColor: string;
  activeBg: string;
}

// Anchor points for the continuous gradient
// Rust → Amber → Gold → Teal (absence → radiance)
const COLOR_STOPS = [
  { pct: 0, r: 138, g: 96, b: 80 }, // #8a6050 dull rust, lacking / uninvested
  { pct: 0.33, r: 200, g: 128, b: 64 }, // #c88040 warm amber, kindling
  { pct: 0.67, r: 212, g: 175, b: 55 }, // #d4af37 gold, forged
  { pct: 1, r: 64, g: 200, b: 160 }, // #40c8a0 teal, complete
];

function lerpColor(pct: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, pct));
  let lo = COLOR_STOPS[0];
  let hi = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].pct && clamped <= COLOR_STOPS[i + 1].pct) {
      lo = COLOR_STOPS[i];
      hi = COLOR_STOPS[i + 1];
      break;
    }
  }
  const span = hi.pct - lo.pct;
  const t = span === 0 ? 1 : (clamped - lo.pct) / span;
  return [
    Math.round(lo.r + t * (hi.r - lo.r)),
    Math.round(lo.g + t * (hi.g - lo.g)),
    Math.round(lo.b + t * (hi.b - lo.b)),
  ];
}

function getProgressStyle(value: number, min: number, max: number): ProgressStyle {
  const pct = max === min ? 1 : (value - min) / (max - min);
  const [r, g, b] = lerpColor(pct);
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
    glowColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
    activeBg: `rgba(${r}, ${g}, ${b}, 0.12)`,
  };
}

interface CharacterCardProps {
  character: N2ETrackedCharacter;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onToggleAwakening: (id: string, slotIndex: number) => void;
  onUpdateResonance: (id: string, count: number) => void;
  onUpdateArc: (id: string, arcId: string | null, arcLevel: number, arcTier: number) => void;
  onUpdateCartridge: (
    id: string,
    rarity: string | null,
    level: number,
    mainStat: string | null,
    subStats: string[],
  ) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onSaveCartridgePreferences: (
    id: string,
    prefs: N2ETrackedCharacter['cartridgePreferences'],
  ) => void;
}

export function CharacterCard({
  character,
  onRemove,
  onUpdateLevel,
  onToggleAwakening,
  onUpdateResonance,
  onUpdateArc,
  onUpdateCartridge,
  onToggleFavorite,
  onSaveCartridgePreferences,
}: CharacterCardProps) {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCartridgeEditorOpen, setIsCartridgeEditorOpen] = useState(false);

  const imageUrl = getMugshotUrl(character.imageUrl);
  const selectedArc = character.arcId
    ? (ALL_ARCS.find((a) => a.id === character.arcId) ?? null)
    : null;

  const awakeningCount = character.awakening.filter(Boolean).length;

  // Cartridge score
  const hasCartridgePrefs =
    character.cartridgePreferences &&
    (character.cartridgePreferences.mainStats.length > 0 ||
      character.cartridgePreferences.subStats.length > 0);
  const cartridgeScore = hasCartridgePrefs ? calculateCartridgeScore(character) : -1;
  const scoreGrade = cartridgeScore >= 0 ? getScoreGrade(cartridgeScore) : '';
  const showCartridgeScore = cartridgeScore >= 0;

  // Progress color styles per dimension
  const levelPs = getProgressStyle(character.level, 1, 90);
  const awakeningPs = getProgressStyle(awakeningCount, 0, 6);
  const resonancePs = getProgressStyle(character.resonanceCount, 0, 6);
  const arcNamePs = character.arcId
    ? getProgressStyle(90, 1, 90) // teal when equipped
    : getProgressStyle(0, 0, 1); // rust when unequipped
  const arcLevelPs = getProgressStyle(character.arcLevel, 1, 80);

  const isCartridgeEquipped = !!character.cartridgeMainStat || !!character.cartridgeRarity;

  return (
    <>
      <div className={`character-card ${isEditing ? 'is-editing' : ''}`}>
        <div className="character-card-header">
          <div className="character-image-wrapper">
            {imgLoading && !imgError && (
              <div className="character-image-spinner">
                <div className="spinner-dot" />
                <div className="spinner-dot" />
                <div className="spinner-dot" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={character.name}
              className={`character-image ${imgLoading ? 'loading' : 'loaded'}`}
              onLoad={() => setImgLoading(false)}
              onError={(e) => {
                setImgLoading(false);
                setImgError(true);
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${character.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
              }}
            />
          </div>
          <div className="character-card-header-overlay"></div>
          <div className="character-card-overlay-controls">
            <div className="character-overlay-top">
              <button
                className={`favorite-btn ${character.isFavorited ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(character.id!, !character.isFavorited);
                }}
                title={character.isFavorited ? 'Unfavorite Character' : 'Favorite Character'}
              >
                {character.isFavorited ? '★' : '☆'}
              </button>
              <button
                className="remove-btn"
                onClick={(e) => onRemove(character.id!, e)}
                title="Remove Character"
              >
                ✕
              </button>
            </div>
            <div className="character-overlay-bottom">
              <div className="character-overlay-badges">
                <span className={`esper-badge esper-${character.esperType.toLowerCase()}`}>
                  {character.esperType}
                </span>
                <span className={`arc-badge arc-${character.arcType.toLowerCase()}`}>
                  {character.arcType}
                </span>
              </div>
              <div className="character-overlay-right">
                {showCartridgeScore && (
                  <div className={`cartridge-score-badge grade-${scoreGrade.toLowerCase()}`}>
                    <span>{cartridgeScore.toFixed(0)}%</span>
                  </div>
                )}
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
        </div>

        <div className={`character-card-body ${isEditing ? 'is-editing' : ''}`}>
          <h3 className="character-name">{character.name}</h3>

          {/* Static summary -- visible in static mode, collapses when editing */}
          <div className="character-static-summary">
            <div className="character-static-stats">
              <span
                className="stat-chip"
                style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
              >
                Lv {character.level}
              </span>
              <span
                className="stat-chip"
                style={{ color: awakeningPs.color, borderColor: awakeningPs.borderColor }}
              >
                A {awakeningCount}/6
              </span>
              <span
                className="stat-chip"
                style={{ color: resonancePs.color, borderColor: resonancePs.borderColor }}
              >
                R{character.resonanceCount}
              </span>
            </div>
            <div className="character-static-equip">
              {selectedArc ? (
                <span style={{ color: arcNamePs.color }}>{selectedArc.name}</span>
              ) : character.cartridgeMainStat ? null : (
                <span className="no-equip" style={{ color: arcNamePs.color }}>
                  &mdash;
                </span>
              )}
              {character.cartridgeMainStat && (
                <>
                  {selectedArc && (
                    <span style={{ color: getProgressStyle(90, 1, 90).color }}>
                      &nbsp;&middot;&nbsp;
                    </span>
                  )}
                  <span style={{ color: getProgressStyle(90, 1, 90).color }}>
                    {character.cartridgeMainStat}
                  </span>
                </>
              )}
            </div>

            {/* Cartridge slot -- clickable, opens CartridgeEditorModal */}
            <div className="cartridge-slot-section">
              <div className="section-header">
                <span>Cartridge</span>
              </div>
              <div
                className={`cartridge-slot ${isCartridgeEquipped ? 'active' : ''}`}
                onClick={() => setIsCartridgeEditorOpen(true)}
                title={
                  isCartridgeEquipped
                    ? `${character.cartridgeRarity || ''} ${character.cartridgeMainStat || 'Equipped'} Lv${character.cartridgeLevel}`
                    : 'Click to equip cartridge'
                }
              >
                {isCartridgeEquipped ? (
                  <div className="cartridge-slot-info">
                    {character.cartridgeRarity && (
                      <span
                        className={`cartridge-rarity-badge rarity-${character.cartridgeRarity.toLowerCase()}`}
                      >
                        {character.cartridgeRarity}
                      </span>
                    )}
                    <span className="cartridge-slot-stat">
                      {character.cartridgeMainStat || 'No main stat'}
                    </span>
                    <span className="cartridge-slot-level">Lv{character.cartridgeLevel}</span>
                    {character.cartridgeSubStats.length > 0 && (
                      <span className="cartridge-slot-subs">
                        {character.cartridgeSubStats.length} sub
                        {character.cartridgeSubStats.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="cartridge-slot-empty">+ Equip Cartridge</span>
                )}
              </div>
            </div>

            {/* Target Build display */}
            {hasCartridgePrefs && (
              <div className="cartridge-target-build">
                <div className="target-build-header">
                  <span className="target-build-label">Target Build</span>
                </div>
                {character.cartridgePreferences.mainStats.length > 0 && (
                  <div className="target-build-chain">
                    <span className="target-build-chain-label">Main</span>
                    {character.cartridgePreferences.mainStats.map((p, i) => (
                      <span key={i}>
                        <span className="pref-stat-badge">{p.stat}</span>
                        {p.operator && (
                          <span className="pref-operator-badge">
                            {p.operator === '>=' ? '≥' : p.operator}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {character.cartridgePreferences.subStats.length > 0 && (
                  <div className="target-build-chain">
                    <span className="target-build-chain-label">Subs</span>
                    {character.cartridgePreferences.subStats.map((p, i) => (
                      <span key={i}>
                        <span className="pref-stat-badge">{p.stat}</span>
                        {p.operator && (
                          <span className="pref-operator-badge">
                            {p.operator === '>=' ? '≥' : p.operator}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {character.cartridgePreferences.comments && (
                  <div className="target-build-comments">
                    {character.cartridgePreferences.comments}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit body -- always in DOM, expands when editing */}
          <div className="character-edit-body" aria-hidden={!isEditing}>
            <div className="character-edit-body-inner">
              {/* ── Level ─────────────────────────────────────────── */}
              <div className="progress-section">
                <div className="section-header">
                  <span>Level</span>
                  <span className="section-value">{character.level} / 90</span>
                </div>
                <input
                  type="range"
                  name={`level-${character.id}`}
                  min="1"
                  max="90"
                  value={character.level}
                  onChange={(e) => onUpdateLevel(character.id!, parseInt(e.target.value))}
                  className="character-slider"
                  style={
                    {
                      '--slider-fill-color': levelPs.color,
                      '--slider-fill-glow': levelPs.glowColor,
                      background: `linear-gradient(to right, ${levelPs.color} ${((character.level - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((character.level - 1) / 89) * 100}%)`,
                    } as React.CSSProperties
                  }
                />
              </div>

              {/* ── Awakening ─────────────────────────────────────── */}
              <div className="progress-section">
                <div className="section-header">
                  <span>Awakening</span>
                  <span className="section-value">{awakeningCount} / 6</span>
                </div>
                <div className="awakening-row">
                  {([0, 1, 2, 3, 4, 5] as const).map((idx) => {
                    const isActive = character.awakening[idx];
                    const btnPs = getProgressStyle(idx + 1, 1, 6);
                    return (
                      <button
                        key={idx}
                        className={`awakening-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onToggleAwakening(character.id!, idx)}
                        title={`Toggle A${idx + 1}`}
                        style={
                          isActive
                            ? {
                                color: btnPs.color,
                                borderColor: btnPs.borderColor,
                                background: btnPs.activeBg,
                                boxShadow: `0 0 8px ${btnPs.glowColor} inset`,
                              }
                            : undefined
                        }
                      >
                        A{idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Resonance ─────────────────────────────────────── */}
              <div className="progress-section">
                <div className="section-header">
                  <span>Resonance</span>
                  <span className="section-value">{character.resonanceCount} / 6</span>
                </div>
                <input
                  type="range"
                  name={`resonance-${character.id}`}
                  min="0"
                  max="6"
                  value={character.resonanceCount}
                  onChange={(e) => onUpdateResonance(character.id!, parseInt(e.target.value))}
                  className="character-slider"
                  style={
                    {
                      '--slider-fill-color': resonancePs.color,
                      '--slider-fill-glow': resonancePs.glowColor,
                      background: `linear-gradient(to right, ${resonancePs.color} ${(character.resonanceCount / 6) * 100}%, rgba(255,255,255,0.1) ${(character.resonanceCount / 6) * 100}%)`,
                    } as React.CSSProperties
                  }
                />
              </div>

              {/* ── Arc ───────────────────────────────────────────── */}
              <div className="progress-section">
                <div className="section-header">
                  <span>Arc</span>
                  <span className="section-value">{character.arcLevel} / 80</span>
                </div>
                <select
                  name={`arc-${character.id}`}
                  className="character-select"
                  value={character.arcId ?? ''}
                  onChange={(e) =>
                    onUpdateArc(
                      character.id!,
                      e.target.value || null,
                      character.arcLevel,
                      character.arcTier,
                    )
                  }
                >
                  <option value="">No Arc</option>
                  {ALL_ARCS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.rarity} &middot; {a.arcType})
                    </option>
                  ))}
                </select>
                <input
                  type="range"
                  name={`arc-level-${character.id}`}
                  min="1"
                  max="80"
                  value={character.arcLevel}
                  onChange={(e) =>
                    onUpdateArc(
                      character.id!,
                      character.arcId,
                      parseInt(e.target.value),
                      character.arcTier,
                    )
                  }
                  className="character-slider"
                  style={
                    {
                      '--slider-fill-color': arcLevelPs.color,
                      '--slider-fill-glow': arcLevelPs.glowColor,
                      background: `linear-gradient(to right, ${arcLevelPs.color} ${((character.arcLevel - 1) / 79) * 100}%, rgba(255,255,255,0.1) ${((character.arcLevel - 1) / 79) * 100}%)`,
                    } as React.CSSProperties
                  }
                />
                <div className="arc-tier-row">
                  <span className="section-sublabel">Tier</span>
                  {([1, 2, 3, 4, 5] as const).map((tier) => {
                    const btnPs = getProgressStyle(tier, 1, 5);
                    const isActive = character.arcTier === tier;
                    const isPassed = tier < character.arcTier;
                    return (
                      <button
                        key={tier}
                        className={`arc-tier-btn ${isActive ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateArc(character.id!, character.arcId, character.arcLevel, tier)
                        }
                        title={`T${tier}`}
                        style={
                          isActive
                            ? {
                                color: btnPs.color,
                                borderColor: btnPs.borderColor,
                                background: btnPs.activeBg,
                                boxShadow: `0 0 8px ${btnPs.glowColor} inset`,
                              }
                            : isPassed
                              ? {
                                  color: btnPs.color,
                                  borderColor: btnPs.borderColor,
                                  opacity: 0.35,
                                }
                              : undefined
                        }
                      >
                        T{tier}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCartridgeEditorOpen && (
        <CartridgeEditorModal
          character={character}
          onSaveCartridge={(rarity, level, mainStat, subStats) =>
            onUpdateCartridge(character.id!, rarity, level, mainStat, subStats)
          }
          onSavePreferences={(prefs) => onSaveCartridgePreferences(character.id!, prefs)}
          onClose={() => setIsCartridgeEditorOpen(false)}
        />
      )}
    </>
  );
}
