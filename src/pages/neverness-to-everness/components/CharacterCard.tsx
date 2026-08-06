import type { N2ETrackedCharacter, N2ECartridgePatch } from '@/types';
import { ALL_ARCS } from '@/data/neverness-to-everness/arcs';
import { ALL_CARTRIDGES } from '@/data/neverness-to-everness/cartridges';
import { calculateCartridgeScore } from '@/utils/cartridgeScoring';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { ScoreBadge } from '@/components/ScoreBadge';
import { Select } from '@/components/Select';
import { getProgressStyle } from '@/utils/progressGradient';
import { PreferenceChainReadout } from '@/components/PreferenceChainReadout';
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
  onToggleModules: (id: string, value: boolean) => void;
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
  onToggleModules,
  onToggleAwakening,
  onUpdateArc,
  onUpdateCartridge,
  onToggleFavorite,
  onSaveCartridgePreferences,
}: CharacterCardProps) {
  const [isCartridgeEditorOpen, setIsCartridgeEditorOpen] = useState(false);

  const selectedArc = character.arcId
    ? (ALL_ARCS.find((a) => a.id === character.arcId) ?? null)
    : null;

  const awakeningCount = character.awakening.filter(Boolean).length;

  // The scorer owns the insufficient-data decision: -1 when no preferences or no cartridge.
  const cartridgeScore = calculateCartridgeScore(character);

  // Target Build readout — shown only when any cartridge preference is set.
  const hasCartridgePrefs =
    character.cartridgePreferences &&
    (character.cartridgePreferences.cartridgeId != null ||
      character.cartridgePreferences.mainStats.length > 0 ||
      character.cartridgePreferences.subStats.length > 0 ||
      Boolean(character.cartridgePreferences.comments));

  // Progress color styles per dimension
  const levelPs = getProgressStyle(character.level, 1, 90);
  const modulesPs = getProgressStyle(character.modulesConfigured ? 1 : 0, 0, 1);
  const awakeningPs = getProgressStyle(awakeningCount, 0, 6);
  const arcNamePs = character.arcId
    ? getProgressStyle(90, 1, 90) // teal when equipped
    : getProgressStyle(0, 0, 1); // rust when unequipped

  const isCartridgeEquipped =
    !!character.cartridgeId || !!character.cartridgeMainStat || !!character.cartridgeRarity;
  const equippedCartridgeName = character.cartridgeId
    ? (ALL_CARTRIDGES.find((c) => c.id === character.cartridgeId)?.name ?? null)
    : null;

  return (
    <>
      <GameCardShell
        name={character.name}
        imageUrl={character.imageUrl}
        entityNoun="Character"
        isFavorited={character.isFavorited}
        onToggleFavorite={(value) => onToggleFavorite(character.id!, value)}
        onRemove={(e) => onRemove(character.id!, e)}
        badges={
          <>
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
          </>
        }
        headerExtra={<ScoreBadge score={cartridgeScore} />}
        temperScore={cartridgeScore}
        summaryStats={
          <>
            <StatChip
              label={`Lv ${character.level}`}
              style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
            />
            <StatChip
              label={`A ${awakeningCount}/6`}
              style={{ color: awakeningPs.color, borderColor: awakeningPs.borderColor }}
            />
            <StatChip
              label={`Modules ${character.modulesConfigured ? '✓' : '✗'}`}
              style={{ color: modulesPs.color, borderColor: modulesPs.borderColor }}
            />
          </>
        }
        summaryLine={
          selectedArc ? (
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
          )
        }
        editBody={
          <>
            {/* ── Level ─────────────────────────────────────────── */}
            <ProgressSection label="Level" value={`${character.level} / 90`}>
              <LevelSlider
                name={`level-${character.id}`}
                value={character.level}
                min={1}
                max={90}
                onChange={(n) => onUpdateLevel(character.id!, n)}
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
              <Select
                name={`arc-${character.id}`}
                value={character.arcId ?? ''}
                placeholder="No Arc"
                options={ALL_ARCS.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.rarity} · ${a.arcType})`,
                }))}
                onChange={(v) =>
                  onUpdateArc(character.id!, v || null, character.arcLevel, character.arcTier)
                }
              />
              <LevelSlider
                name={`arc-level-${character.id}`}
                value={character.arcLevel}
                min={1}
                max={80}
                onChange={(n) => onUpdateArc(character.id!, character.arcId, n, character.arcTier)}
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

            {/* ── Console (cartridge + modules + Target Build) ─────── */}
            <div className="card-section-group">
              <div className="card-section-group-header">Console</div>

              {/* ── Cartridge slot (clickable, opens modal) ──────────── */}
              <ProgressSection label="Cartridge">
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
              </ProgressSection>

              {/* ── Modules ───────────────────────────────────────── */}
              <ProgressSection label="Modules">
                <ConfirmCheckbox
                  checked={character.modulesConfigured}
                  onChange={(val) => onToggleModules(character.id!, val)}
                  label="Modules Configured"
                />
              </ProgressSection>

              {/* ── Target Build (read-only preferences display) ─────── */}
              {hasCartridgePrefs && (
                <ProgressSection label="Target Build" className="build-prefs-display">
                  <div className="prefs-display-grid">
                    {character.cartridgePreferences.cartridgeId && (
                      <div className="pref-display-row">
                        <span className="pref-display-label">Set</span>
                        <div className="pref-display-chain">
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
                      </div>
                    )}
                    <PreferenceChainReadout
                      label="Main"
                      chain={character.cartridgePreferences.mainStats}
                    />
                    <PreferenceChainReadout
                      label="Subs"
                      chain={character.cartridgePreferences.subStats}
                    />
                    {character.cartridgePreferences.comments && (
                      <div className="pref-display-row build-comments-row">
                        <div className="pref-comments-text">
                          {character.cartridgePreferences.comments}
                        </div>
                      </div>
                    )}
                  </div>
                </ProgressSection>
              )}
            </div>
          </>
        }
      />

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
