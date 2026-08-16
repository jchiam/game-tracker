import type { ZzzDiscBuildPreferences, ZzzTrackedAgent } from '@/types';
import { ALL_ZZZ_DISC_SUITS } from '@/data/zenless-zone-zero/disc_suits';
import {
  ZZZ_DISC_FIXED_MAINS,
  ZZZ_DISC_MAIN_STATS,
  ZZZ_DISC_SLOTS,
  ZZZ_DISC_SUB_STATS,
  ZZZ_VARIABLE_MAIN_SLOTS,
  type ZzzDiscSlot,
  type ZzzEquippedDisc,
  type ZzzFixedMainSlot,
  type ZzzVariableMainSlot,
} from '@/data/zenless-zone-zero/discs';
import { EquipmentEditorShell } from '@/components/EquipmentEditorShell';
import { useScrollAnchor } from '@/hooks/useScrollAnchor';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SubStatList } from '@/components/SubStatList';

const emptyDisc: ZzzEquippedDisc = { suitId: null, mainStat: null, subStats: [] };

const SUIT_OPTIONS = ALL_ZZZ_DISC_SUITS.map((suit) => ({ value: suit.id, label: suit.name }));

const isFixedSlot = (slot: ZzzDiscSlot): slot is ZzzFixedMainSlot => slot <= 3;

interface DiscEditorModalProps {
  agent: ZzzTrackedAgent;
  anchorSlot?: ZzzDiscSlot;
  onSaveDisc: (slot: ZzzDiscSlot, discData: ZzzEquippedDisc) => void;
  onRemoveDisc: (slot: ZzzDiscSlot) => void;
  onUpdateBuildPreferences: (newPrefs: ZzzDiscBuildPreferences) => void;
  onClose: () => void;
}

export function DiscEditorModal({
  agent,
  anchorSlot,
  onSaveDisc,
  onRemoveDisc,
  onUpdateBuildPreferences,
  onClose,
}: DiscEditorModalProps) {
  return (
    <EquipmentEditorShell
      title={`Drive Discs — ${agent.name}`}
      equipTabLabel="Equip Discs"
      className="disc-editor"
      bodyClassName="disc-editor-body"
      onClose={onClose}
      equipContent={
        <EquipTab
          agent={agent}
          anchorSlot={anchorSlot}
          onSaveDisc={onSaveDisc}
          onRemoveDisc={onRemoveDisc}
        />
      }
      preferencesContent={
        <PreferencesTab agent={agent} onUpdateBuildPreferences={onUpdateBuildPreferences} />
      }
    />
  );
}

function EquipTab({
  agent,
  anchorSlot,
  onSaveDisc,
  onRemoveDisc,
}: {
  agent: ZzzTrackedAgent;
  anchorSlot?: ZzzDiscSlot;
  onSaveDisc: (slot: ZzzDiscSlot, discData: ZzzEquippedDisc) => void;
  onRemoveDisc: (slot: ZzzDiscSlot) => void;
}) {
  const anchorRef = useScrollAnchor<HTMLDivElement>();

  const validateAndSave = (slot: ZzzDiscSlot, updates: Partial<ZzzEquippedDisc>) => {
    const newDisc = { ...(agent.discs[slot] || emptyDisc), ...updates };

    // Enforce fixed Main Stats on slots 1-3
    if (isFixedSlot(slot)) newDisc.mainStat = ZZZ_DISC_FIXED_MAINS[slot];

    // Prune conflicting Substats
    if (newDisc.mainStat) {
      newDisc.subStats = newDisc.subStats.filter((sub) => sub !== newDisc.mainStat);
    }

    onSaveDisc(slot, newDisc);
  };

  return (
    <>
      {ZZZ_DISC_SLOTS.map((slot) => {
        const currentDisc = agent.discs[slot] || emptyDisc;
        const fixed = isFixedSlot(slot);
        // The equipped main stat must not also be offered as a sub-stat.
        const excludeSubStats = currentDisc.mainStat ? [currentDisc.mainStat] : [];
        // Editable stat controls are gated (dimmed + disabled) until a suit is chosen;
        // fixed slot 1-3 mains are read-only and stay ungated.
        const hasSuit = Boolean(currentDisc.suitId);
        const gatedClass = hasSuit ? undefined : 'is-gated';
        // Substats are additionally gated behind the main on variable-main slots — a
        // substat may never equal the main. Fixed mains are always known, so slots
        // 1-3 stay suit-gated only.
        const subsEnabled = hasSuit && (fixed || Boolean(currentDisc.mainStat));
        const subGatedClass = subsEnabled ? undefined : 'is-gated';

        return (
          <div
            key={slot}
            ref={slot === anchorSlot ? anchorRef : undefined}
            className="equip-slot-card"
            data-slot={slot}
          >
            <div className="equip-slot-header">Slot {slot}</div>
            <FormGroup label="Disc Suit">
              <Select
                name={`disc-${slot}-suit`}
                value={currentDisc.suitId || ''}
                placeholder="-- No Suit --"
                options={SUIT_OPTIONS}
                onChange={(v) => (v ? validateAndSave(slot, { suitId: v }) : onRemoveDisc(slot))}
              />
            </FormGroup>

            <FormGroup label="Main Stat" className={fixed ? undefined : gatedClass}>
              {fixed ? (
                // Slot 1-3 mains are fixed — read-only, always shown, never gated.
                <span className="readonly-stat">{ZZZ_DISC_FIXED_MAINS[slot]} (Fixed)</span>
              ) : (
                <Select
                  name={`disc-${slot}-main-stat`}
                  value={currentDisc.mainStat || ''}
                  placeholder="-- No Main Stat --"
                  options={ZZZ_DISC_MAIN_STATS[slot]}
                  onChange={(v) => validateAndSave(slot, { mainStat: v })}
                  disabled={!hasSuit}
                />
              )}
            </FormGroup>

            <div className={subGatedClass}>
              <SubStatList
                values={currentDisc.subStats}
                options={ZZZ_DISC_SUB_STATS}
                namePrefix={`disc-${slot}-substat`}
                label="Substats (Max 4)"
                addLabel="+ Add Substat"
                excludeValues={excludeSubStats}
                onChange={(subStats) => validateAndSave(slot, { subStats })}
                disabled={!subsEnabled}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function PreferencesTab({
  agent,
  onUpdateBuildPreferences,
}: {
  agent: ZzzTrackedAgent;
  onUpdateBuildPreferences: (newPrefs: ZzzDiscBuildPreferences) => void;
}) {
  const currentPrefs = agent.buildPreferences || {
    mainStats: { 4: [], 5: [], 6: [] },
    subStats: [],
  };

  return (
    <div className="preferences-tab">
      <p className="tab-description">Define the ideal stats you want to roll for this agent.</p>

      <div className="pref-section">
        <h3>Preferred Suits</h3>
        <FormGroup label="Suit (4-piece)">
          <Select
            name="pref-suit-4"
            value={currentPrefs.discSuit4Id ?? ''}
            placeholder="-- None --"
            options={SUIT_OPTIONS}
            onChange={(v) => onUpdateBuildPreferences({ ...currentPrefs, discSuit4Id: v || null })}
          />
        </FormGroup>
        <FormGroup label="Suit (2-piece)">
          <Select
            name="pref-suit-2"
            value={currentPrefs.discSuit2Id ?? ''}
            placeholder="-- None --"
            options={SUIT_OPTIONS}
            onChange={(v) => onUpdateBuildPreferences({ ...currentPrefs, discSuit2Id: v || null })}
          />
        </FormGroup>
      </div>

      {ZZZ_VARIABLE_MAIN_SLOTS.map((slot: ZzzVariableMainSlot) => (
        <div key={slot} className="pref-section">
          <h3>Preferred Main Stat (Slot {slot})</h3>
          <PreferenceChain
            values={currentPrefs.mainStats[slot]}
            options={ZZZ_DISC_MAIN_STATS[slot]}
            namePrefix={`pref-main-stat-${slot}`}
            onChange={(mainStatsForSlot) =>
              onUpdateBuildPreferences({
                ...currentPrefs,
                mainStats: { ...currentPrefs.mainStats, [slot]: mainStatsForSlot },
              })
            }
          />
        </div>
      ))}

      <div className="pref-section">
        <h3>Preferred Substats (Global)</h3>
        <PreferenceChain
          values={currentPrefs.subStats}
          options={ZZZ_DISC_SUB_STATS}
          namePrefix="pref-sub-stat"
          onChange={(subStats) => onUpdateBuildPreferences({ ...currentPrefs, subStats })}
        />
      </div>

      <div className="pref-section">
        <BuildComments
          label="Build Comments"
          value={currentPrefs.comments || ''}
          placeholder="Additional notes about this build..."
          onChange={(comments) => onUpdateBuildPreferences({ ...currentPrefs, comments })}
        />
      </div>
    </div>
  );
}
