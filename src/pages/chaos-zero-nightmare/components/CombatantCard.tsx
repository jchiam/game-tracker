import type { CznPartnerPatch, CznTrackedCombatant } from '@/types';
import { ALL_CZN_PARTNERS } from '@/data/chaos-zero-nightmare/partners';
import { ALL_CZN_FRAGMENT_SETS } from '@/data/chaos-zero-nightmare/fragment_sets';
import { CZN_FRAGMENT_SET_SHORT_NAMES } from '@/data/chaos-zero-nightmare/fragment_set_short_names';
import {
  CZN_FRAGMENT_SLOT_NAMES,
  CZN_FRAGMENT_SLOT_NUMERALS,
  CZN_FRAGMENT_SLOTS,
  CZN_VARIABLE_MAIN_SLOTS,
  type CznFragmentSlot,
} from '@/data/chaos-zero-nightmare/fragments';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { PreferenceChain } from '@/components/PreferenceChain';
import { PreferenceChainReadout } from '@/components/PreferenceChainReadout';
import { ProgressSection } from '@/components/ProgressSection';
import { ScoreBadge } from '@/components/ScoreBadge';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Select } from '@/components/Select';
import { StatChip } from '@/components/StatChip';
import { getCznFragmentSetIconUrl } from '@/lib/imagekit';
import { getProgressStyle } from '@/utils/progressGradient';
import { calculateCznBuildScore } from '@/utils/cznBuildScore';
import {
  CZN_MAX_EGO,
  CZN_MAX_LEVEL,
  CZN_PARTNER_MAX_EGO,
  CZN_PARTNER_MAX_LEVEL,
} from '@/hooks/chaos-zero-nightmare/combatantLimits';
import { formatEgo, getClassBadge, getElementBadge, getRarityBadge } from './combatantBadges';
import { resolvePartnerRank } from './partnerMatch';
import { sortPartnersForDisplay } from './partnerSort';
import './CombatantCard.css';

// Manifest Ego is a single rung 0–6: T0 is the base state, T1–T6 the dupe unlocks.
const EGO_OPTIONS = Array.from({ length: CZN_MAX_EGO + 1 }, (_, e) => ({
  value: String(e),
  label: formatEgo(e),
}));

// Partners take four dupes: T0 base, T1–T4.
const PARTNER_EGO_OPTIONS = Array.from({ length: CZN_PARTNER_MAX_EGO + 1 }, (_, e) => ({
  value: String(e),
  label: formatEgo(e),
}));

interface CombatantCardProps {
  combatant: CznTrackedCombatant;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateLevel: (id: string, level: number) => void;
  onUpdateEgo: (id: string, ego: number) => void;
  onTogglePotential: (id: string, value: boolean) => void;
  onUpdatePartner: (id: string, patch: CznPartnerPatch) => void;
  onUpdatePartnerPreferences: (id: string, preferences: string[]) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  /** Opens the Memory Fragment editor anchored to the clicked slot. */
  onToggleFragment: (id: string, slot: CznFragmentSlot) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse. */
  onEditCommit?: () => void;
  /** Ghost-tag copy while the card is held; null renders a normal card. */
  heldReason?: string | null;
  /** Plays the exit animation after an evicting release. */
  isExiting?: boolean;
  /** Commits the eviction when the exit animation completes. */
  onExitEnd?: () => void;
}

export function CombatantCard({
  combatant,
  onRemove,
  onUpdateLevel,
  onUpdateEgo,
  onTogglePotential,
  onUpdatePartner,
  onUpdatePartnerPreferences,
  onToggleFavorite,
  onToggleFragment,
  onEditCommit,
  heldReason,
  isExiting,
  onExitEnd,
}: CombatantCardProps) {
  const rarity = getRarityBadge(combatant.rarity);
  const cls = getClassBadge(combatant.class);
  const element = getElementBadge(combatant.element);

  const score = calculateCznBuildScore(combatant);

  // A Partner's passive only activates when its class matches the Combatant's,
  // so the picker and the preference options are scoped to same-class Partners.
  // An equipped Partner that has drifted out of that set (catalog respelling)
  // is appended so the stored selection stays visible and changeable.
  const equipped = ALL_CZN_PARTNERS.find((p) => p.id === combatant.partnerId) ?? null;
  const sameClass = sortPartnersForDisplay(
    ALL_CZN_PARTNERS.filter((p) => p.class === combatant.class),
  );
  const equippablePartners =
    equipped && !sameClass.includes(equipped) ? [...sameClass, equipped] : sameClass;
  const partnerOptions = equippablePartners.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.rarity}★)`,
  }));

  // Match badge: where the equipped Partner ranks in the preference list.
  const prefCount = combatant.partnerPreferences.length;
  const matchRank = resolvePartnerRank(combatant.partnerId, combatant.partnerPreferences);
  const showMatchBadge = prefCount > 0 && combatant.partnerId !== null;
  // First choice reads full/teal; lower ranks step toward rust; not-listed = off-build rust.
  const matchPs =
    matchRank === null
      ? getProgressStyle(0, 0, 1)
      : getProgressStyle(prefCount - matchRank, 0, prefCount);
  const matchLabel = matchRank === null ? 'Off-build' : `#${matchRank + 1}`;

  // Investment chips + sliders share the cross-game rust→teal gradient.
  const levelPs = getProgressStyle(combatant.level, 1, CZN_MAX_LEVEL);
  const egoPs = getProgressStyle(combatant.ego, 0, CZN_MAX_EGO);
  const potentialPs = getProgressStyle(combatant.potentialAttained ? 1 : 0, 0, 1);
  // Partner line: name teal when equipped / rust when empty; level and Ego by their own rungs.
  const partnerNamePs = getProgressStyle(combatant.partnerId ? 1 : 0, 0, 1);
  const partnerLevelPs = getProgressStyle(combatant.partnerLevel, 1, CZN_PARTNER_MAX_LEVEL);
  const partnerEgoPs = getProgressStyle(combatant.partnerEgo, 0, CZN_PARTNER_MAX_EGO);

  // Set counts for the Memory Fragment digest line.
  const setCounts = CZN_FRAGMENT_SLOTS.reduce((acc, slot) => {
    const setId = combatant.fragments[slot]?.setId;
    if (setId) acc.set(setId, (acc.get(setId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  const sortedSets = [...setCounts.entries()].sort((a, b) => b[1] - a[1]);
  const equippedColor = getProgressStyle(1, 0, 1).color;
  const emptyColor = getProgressStyle(0, 0, 1).color;

  const setName = (setId: string) =>
    ALL_CZN_FRAGMENT_SETS.find((s) => s.id === setId)?.name ?? setId;

  const bp = combatant.fragmentPreferences;
  const hasAnyPreference =
    bp.targetSetIds.length > 0 ||
    bp.subStats.length > 0 ||
    Boolean(bp.comments) ||
    CZN_VARIABLE_MAIN_SLOTS.some((s) => bp.mainStats[s].length > 0);

  return (
    <GameCardShell
      name={combatant.name}
      imageUrl={combatant.imageUrl}
      entityNoun="Combatant"
      isFavorited={combatant.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(combatant.id, value)}
      onEditCommit={onEditCommit}
      onRemove={(e) => onRemove(combatant.id, e)}
      heldReason={heldReason}
      isExiting={isExiting}
      onExitEnd={onExitEnd}
      badges={
        <>
          <GameBadge label={rarity.label} variant="czn-rarity" modifier={rarity.modifier} />
          <GameBadge label={cls.label} variant="czn-class" modifier={cls.modifier} />
          <GameBadge label={element.label} variant="czn-element" modifier={element.modifier} />
        </>
      }
      summaryStats={
        <>
          <StatChip
            label={`Lv ${combatant.level}`}
            style={{ color: levelPs.color, borderColor: levelPs.borderColor }}
          />
          <StatChip
            label={formatEgo(combatant.ego)}
            style={{ color: egoPs.color, borderColor: egoPs.borderColor }}
          />
          <StatChip
            label={`Potential ${combatant.potentialAttained ? '✓' : '✗'}`}
            style={{ color: potentialPs.color, borderColor: potentialPs.borderColor }}
          />
        </>
      }
      headerExtra={<ScoreBadge score={score} />}
      temperScore={score}
      summaryLine={[
        // Line 1: Partner readout. Always rendered so every card shows the
        // same two summary lines and collapsed heights stay uniform.
        <>
          {combatant.partnerId ? (
            <>
              <span style={{ color: partnerNamePs.color }}>
                {equipped?.name ?? combatant.partnerId}
              </span>
              <span style={{ color: partnerLevelPs.color }}>
                &nbsp;·&nbsp;Lv&nbsp;{combatant.partnerLevel}
              </span>
              <span style={{ color: partnerEgoPs.color }}>
                &nbsp;·&nbsp;{formatEgo(combatant.partnerEgo)}
              </span>
            </>
          ) : (
            <span className="no-partner" style={{ color: partnerNamePs.color }}>
              &mdash;
            </span>
          )}
          {showMatchBadge && (
            <span
              className="pref-match-badge"
              style={{ color: matchPs.color, borderColor: matchPs.borderColor }}
              title="Equipped Partner vs preferred"
            >
              {matchLabel}
            </span>
          )}
        </>,
        // Line 2: Memory Fragment set digest — always rendered so collapsed heights stay uniform.
        sortedSets.length > 0 ? (
          <>
            {sortedSets.map(([setId, count], i) => (
              <span key={setId}>
                {i > 0 && <span style={{ color: equippedColor }}>&nbsp;&middot;&nbsp;</span>}
                <span style={{ color: equippedColor }}>
                  {CZN_FRAGMENT_SET_SHORT_NAMES[setId] ?? setName(setId)} ×{count}
                </span>
              </span>
            ))}
          </>
        ) : (
          <span className="no-fragments" style={{ color: emptyColor }}>
            &mdash;
          </span>
        ),
      ]}
      editBody={
        <>
          <ProgressSection label="Level" value={`${combatant.level} / ${CZN_MAX_LEVEL}`}>
            <LevelSlider
              name={`level-${combatant.id}`}
              value={combatant.level}
              min={1}
              max={CZN_MAX_LEVEL}
              onChange={(n) => onUpdateLevel(combatant.id, n)}
            />
          </ProgressSection>

          <ProgressSection label="Manifest Ego" value={formatEgo(combatant.ego)}>
            <SegmentedButtons
              className="ego-row"
              options={EGO_OPTIONS}
              value={String(combatant.ego)}
              coloring="investment"
              onChange={(v) => onUpdateEgo(combatant.id, Number(v))}
            />
          </ProgressSection>

          <ProgressSection label="Potential">
            <ConfirmCheckbox
              checked={combatant.potentialAttained}
              onChange={(val) => onTogglePotential(combatant.id, val)}
              label="Potential Fully Unlocked"
            />
          </ProgressSection>

          <ProgressSection
            label="Partner"
            value={`${combatant.partnerLevel} / ${CZN_PARTNER_MAX_LEVEL}`}
          >
            <Select
              name={`partner-${combatant.id}`}
              size="sm"
              value={combatant.partnerId ?? ''}
              placeholder="No Partner"
              options={partnerOptions}
              onChange={(v) => onUpdatePartner(combatant.id, { partnerId: v || null })}
            />
            <LevelSlider
              name={`partner-level-${combatant.id}`}
              value={combatant.partnerLevel}
              min={1}
              max={CZN_PARTNER_MAX_LEVEL}
              onChange={(n) => onUpdatePartner(combatant.id, { partnerLevel: n })}
            />
            <span className="section-sublabel">Manifest Ego</span>
            <SegmentedButtons
              className="partner-ego-row"
              options={PARTNER_EGO_OPTIONS}
              value={String(combatant.partnerEgo)}
              coloring="investment"
              size="compact"
              onChange={(v) => onUpdatePartner(combatant.id, { partnerEgo: Number(v) })}
            />
          </ProgressSection>

          <ProgressSection label="Preferred Partners">
            <PreferenceChain
              variant="ranked-list"
              values={combatant.partnerPreferences}
              options={partnerOptions}
              onChange={(prefs) => onUpdatePartnerPreferences(combatant.id, prefs)}
              namePrefix={`partner-pref-${combatant.id}`}
              addLabel="+ Add Partner"
            />
          </ProgressSection>

          {/* ── Memory Fragments (slot grid + Target Build) ───────── */}
          <div className="card-section-group">
            <div className="card-section-group-header">Memory Fragments</div>

            <ProgressSection label="Slots">
              <div className="equip-slot-grid">
                {CZN_FRAGMENT_SLOTS.map((slot) => {
                  const equipped = combatant.fragments[slot];
                  const isActive = Boolean(equipped?.setId);
                  const set = isActive
                    ? ALL_CZN_FRAGMENT_SETS.find((s) => s.id === equipped!.setId)
                    : undefined;
                  const slotTitle = `${CZN_FRAGMENT_SLOT_NUMERALS[slot]} ${CZN_FRAGMENT_SLOT_NAMES[slot]}`;
                  return (
                    <div
                      key={slot}
                      className={`equip-slot-cell ${isActive ? 'active' : ''}`}
                      onClick={() => onToggleFragment(combatant.id, slot)}
                      title={
                        isActive ? `${slotTitle} - ${set?.name ?? equipped!.setId}` : slotTitle
                      }
                    >
                      {set ? (
                        <img
                          src={getCznFragmentSetIconUrl(set.imageUrl)}
                          alt="Set"
                          className="equip-slot-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="equip-slot-icon">{CZN_FRAGMENT_SLOT_NUMERALS[slot]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ProgressSection>

            {hasAnyPreference && (
              <ProgressSection label="Target Build" className="build-prefs-display">
                <div className="prefs-display-grid">
                  {bp.targetSetIds.length > 0 && (
                    <div className="pref-display-row">
                      <span className="pref-display-label">Sets</span>
                      <div className="pref-display-chain">
                        {bp.targetSetIds.map((setId) => (
                          <span key={setId} className="pref-stat-badge">
                            {setName(setId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {CZN_VARIABLE_MAIN_SLOTS.map((slot) => (
                    <PreferenceChainReadout
                      key={slot}
                      label={CZN_FRAGMENT_SLOT_NUMERALS[slot]}
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
