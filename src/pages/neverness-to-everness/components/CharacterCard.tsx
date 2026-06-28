import type { N2ETrackedCharacter, N2ECartridgePatch } from '@/types';
import { ALL_ARCS } from '@/data/neverness-to-everness/arcs';
import { ALL_CARTRIDGES } from '@/data/neverness-to-everness/cartridges';
import { calculateCartridgeScore, getScoreGrade } from '@/utils/cartridgeScoring';
import { GameBadge } from '@/components/GameBadge';
import { getMugshotUrl } from '@/lib/imagekit';
import { getProgressStyle } from '@/utils/progressGradient';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { StatChip } from '@/components/StatChip';
import { useState } from 'react';
import { CartridgeEditorModal } from './CartridgeEditorModal';
import './CharacterCard.css';

const ARC_TIER_OPTIONS = [1, 2, 3, 4, 5].map((t) => ({ value: String(t), label: `T${t}` }));

interface CharacterCardProps {
  character: N2ETrackedCharacter;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onToggleAwakening: (id: string, slotIndex: number) => void;
  onUpdateArc: (id: string, arcId: string | null, arcLevel: number, arcTier: number) => void;
  onUpdateCartridge: (id: string, patch: N2ECartridgePatch) => void;
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
    (character.cartridgePreferences.cartridgeId != null ||
      character.cartridgePreferences.mainStats.length > 0 ||
      character.cartridgePreferences.subStats.length > 0);
  const cartridgeScore = hasCartridgePrefs ? calculateCartridgeScore(character) : -1;
  const scoreGrade = cartridgeScore >= 0 ? getScoreGrade(cartridgeScore) : '';
  const showCartridgeScore = cartridgeScore >= 0;

  // Progress color styles per dimension
  const levelPs = getProgressStyle(character.level, 1, 90);
  const awakeningPs = getProgressStyle(awakeningCount, 0, 6);
  const arcNamePs = character.arcId
    ? getProgressStyle(90, 1, 90) // teal when equipped
    : getProgressStyle(0, 0, 1); // rust when unequipped
  const arcLevelPs = getProgressStyle(character.arcLevel, 1, 80);

  const isCartridgeEquipped =
    !!character.cartridgeId || !!character.cartridgeMainStat || !!character.cartridgeRarity;
  const equippedCartridgeName = character.cartridgeId
    ? (ALL_CARTRIDGES.find((c) => c.id === character.cartridgeId)?.name ?? null)
    : null;

  return (
    <>
      <div
        className={`game-card ${isEditing ? 'is-editing' : ''}`}
        style={
          {
            '--game-card-summary-max-height': '100px',
            '--game-card-edit-max-height': '1200px',
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
              alt={character.name}
              className={`game-card-image ${imgLoading ? 'loading' : 'loaded'}`}
              onLoad={() => setImgLoading(false)}
              onError={(e) => {
                setImgLoading(false);
                setImgError(true);
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${character.name.replace(' ', '+')}&background=1a1a1a&color=fff&size=250`;
              }}
            />
          </div>
          <div className="game-card-overlay"></div>
          <div className="game-card-controls">
            <div className="game-card-controls-top">
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
            <div className="game-card-controls-bottom">
              <div className="game-card-badges">
                <GameBadge
                  label={character.esperType}
                  variant="esper"
                  modifier={character.esperType.toLowerCase()}
                />
                <GameBadge
                  label={character.arcType}
                  variant="arc"
                  modifier={character.arcType.toLowerCase()}
                />
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

        <div className={`game-card-body ${isEditing ? 'is-editing' : ''}`}>
          <h3 className="game-card-name">{character.name}</h3>

          {/* Static summary -- visible in static mode, collapses when editing */}
          <div className="game-card-static-summary">
            <div className="game-card-static-stats">
              <StatChip
                label={`Lv ${character.level}`}
                style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
              />
              <StatChip
                label={`A ${awakeningCount}/6`}
                style={{ color: awakeningPs.color, borderColor: awakeningPs.borderColor }}
              />
              {showCartridgeScore && (
                <StatChip
                  label={`Cart ${cartridgeScore.toFixed(0)}%`}
                  style={{
                    color: getProgressStyle(cartridgeScore, 0, 100).color,
                    borderColor: getProgressStyle(cartridgeScore, 0, 100).borderColor,
                  }}
                />
              )}
            </div>
            <div className="game-card-static-line">
              {selectedArc ? (
                <>
                  <span style={{ color: arcNamePs.color }}>{selectedArc.name}</span>
                  {isCartridgeEquipped && (
                    <>
                      <span style={{ color: getProgressStyle(90, 1, 90).color }}>
                        &nbsp;&middot;&nbsp;
                      </span>
                      <span style={{ color: getProgressStyle(90, 1, 90).color }}>
                        {equippedCartridgeName || character.cartridgeMainStat}
                        {character.cartridgeRarity && ` ${character.cartridgeRarity}`}
                        {` Lv${character.cartridgeLevel}`}
                      </span>
                    </>
                  )}
                </>
              ) : isCartridgeEquipped ? (
                <span style={{ color: getProgressStyle(90, 1, 90).color }}>
                  {equippedCartridgeName || character.cartridgeMainStat}
                  {character.cartridgeRarity && ` ${character.cartridgeRarity}`}
                  {` Lv${character.cartridgeLevel}`}
                </span>
              ) : (
                <span className="no-equip" style={{ color: arcNamePs.color }}>
                  &mdash;
                </span>
              )}
            </div>
          </div>

          {/* Edit body -- always in DOM, expands when editing */}
          <div className="game-card-edit-body" aria-hidden={!isEditing}>
            <div className="game-card-edit-body-inner">
              {/* ── Level ─────────────────────────────────────────── */}
              <ProgressSection label="Level" value={`${character.level} / 90`}>
                <input
                  type="range"
                  name={`level-${character.id}`}
                  min="1"
                  max="90"
                  value={character.level}
                  onChange={(e) => onUpdateLevel(character.id!, parseInt(e.target.value))}
                  className="level-slider"
                  style={
                    {
                      '--slider-fill-color': levelPs.color,
                      '--slider-fill-glow': levelPs.glowColor,
                      background: `linear-gradient(to right, ${levelPs.color} ${((character.level - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((character.level - 1) / 89) * 100}%)`,
                    } as React.CSSProperties
                  }
                />
              </ProgressSection>

              {/* ── Awakening ─────────────────────────────────────── */}
              <ProgressSection label="Awakening" value={`${awakeningCount} / 6`}>
                <div className="awakening-row">
                  {([0, 1, 2, 3, 4, 5] as const).map((idx) => {
                    const isActive = character.awakening[idx];
                    const btnPs = getProgressStyle(idx + 1, 1, 6);
                    return (
                      <button
                        key={idx}
                        className={`toggle-btn ${isActive ? 'active' : ''}`}
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
              </ProgressSection>

              {/* ── Arc ───────────────────────────────────────────── */}
              <ProgressSection label="Arc" value={`${character.arcLevel} / 80`}>
                <select
                  name={`arc-${character.id}`}
                  className="game-select"
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
                  className="level-slider"
                  style={
                    {
                      '--slider-fill-color': arcLevelPs.color,
                      '--slider-fill-glow': arcLevelPs.glowColor,
                      background: `linear-gradient(to right, ${arcLevelPs.color} ${((character.arcLevel - 1) / 79) * 100}%, rgba(255,255,255,0.1) ${((character.arcLevel - 1) / 79) * 100}%)`,
                    } as React.CSSProperties
                  }
                />
                <span className="section-sublabel">Tier</span>
                <SegmentedButtons
                  className="arc-tier-row"
                  options={ARC_TIER_OPTIONS}
                  value={String(character.arcTier)}
                  coloring="investment"
                  size="compact"
                  onChange={(v) =>
                    onUpdateArc(character.id!, character.arcId, character.arcLevel, Number(v))
                  }
                />
              </ProgressSection>

              {/* ── Cartridge slot (clickable, opens modal) ──────────── */}
              <div className="cartridge-slot-section">
                <div className="section-header">
                  <span>Cartridge</span>
                </div>
                <div
                  className={`cartridge-slot ${isCartridgeEquipped ? 'active' : ''}`}
                  onClick={() => setIsCartridgeEditorOpen(true)}
                  title={
                    isCartridgeEquipped
                      ? `${character.cartridgeRarity || ''} ${equippedCartridgeName || character.cartridgeMainStat || 'Equipped'} Lv${character.cartridgeLevel}`
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
                        {equippedCartridgeName || character.cartridgeMainStat || 'No name'}
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

              {/* ── Target Build (read-only preferences display) ─────── */}
              {hasCartridgePrefs && (
                <div className="cartridge-target-build">
                  <div className="target-build-header">
                    <span className="target-build-label">Target Build</span>
                  </div>
                  {character.cartridgePreferences.cartridgeId && (
                    <div className="target-build-chain">
                      <span className="target-build-chain-label">Set</span>
                      <span className="pref-stat-badge">
                        {ALL_CARTRIDGES.find(
                          (c) => c.id === character.cartridgePreferences.cartridgeId,
                        )?.name ?? character.cartridgePreferences.cartridgeId}
                      </span>
                      <span
                        className={`cartridge-rarity-badge rarity-${(ALL_CARTRIDGES.find((c) => c.id === character.cartridgePreferences.cartridgeId)?.rarity ?? '').toLowerCase()}`}
                      >
                        {
                          ALL_CARTRIDGES.find(
                            (c) => c.id === character.cartridgePreferences.cartridgeId,
                          )?.rarity
                        }
                      </span>
                    </div>
                  )}
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
          </div>
        </div>
      </div>

      {isCartridgeEditorOpen && (
        <CartridgeEditorModal
          character={character}
          onSaveCartridge={(patch) => onUpdateCartridge(character.id!, patch)}
          onSavePreferences={(prefs) => onSaveCartridgePreferences(character.id!, prefs)}
          onClose={() => setIsCartridgeEditorOpen(false)}
        />
      )}
    </>
  );
}
