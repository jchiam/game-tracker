import type { CznPartnerPatch, CznTrackedCombatant } from '@/types';
import { ALL_CZN_PARTNERS } from '@/data/chaos-zero-nightmare/partners';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { LevelSlider } from '@/components/LevelSlider';
import { PreferenceChain } from '@/components/PreferenceChain';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Select } from '@/components/Select';
import { StatChip } from '@/components/StatChip';
import { getProgressStyle } from '@/utils/progressGradient';
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
  onEditCommit,
  heldReason,
  isExiting,
  onExitEnd,
}: CombatantCardProps) {
  const rarity = getRarityBadge(combatant.rarity);
  const cls = getClassBadge(combatant.class);
  const element = getElementBadge(combatant.element);

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
      summaryLine={
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
        </>
      }
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
        </>
      }
    />
  );
}
