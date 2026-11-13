import type { CznFragmentBuildPreferences, CznTrackedCombatant } from '@/types';
import { ALL_CZN_FRAGMENT_SETS } from '@/data/chaos-zero-nightmare/fragment_sets';
import {
  CZN_FRAGMENT_FIXED_MAINS,
  CZN_FRAGMENT_MAIN_STATS,
  CZN_FRAGMENT_SLOT_NAMES,
  CZN_FRAGMENT_SLOT_NUMERALS,
  CZN_FRAGMENT_SLOTS,
  CZN_FRAGMENT_SUB_STATS,
  CZN_VARIABLE_MAIN_SLOTS,
  type CznEquippedFragment,
  type CznFixedMainSlot,
  type CznFragmentSlot,
  type CznVariableMainSlot,
} from '@/data/chaos-zero-nightmare/fragments';
import { EquipmentEditorShell } from '@/components/EquipmentEditorShell';
import { useScrollAnchor } from '@/hooks/useScrollAnchor';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SubStatList } from '@/components/SubStatList';

const emptyPiece: CznEquippedFragment = { setId: null, mainStat: null, subStats: [] };

// Every slot may hold any set; the piece count is shown so the player can see
// how much of the six-slot budget a set takes in the Target Build.
const SET_OPTIONS = ALL_CZN_FRAGMENT_SETS.map((set) => ({
  value: set.id,
  label: `${set.name} [${set.pieces}-PC]`,
}));

// The Target Build composition: up to three set rows sharing a six-piece
// budget (4+2, 2+2+2, 4, 2+2, 2). Three rows suffice because no legal
// composition holds more than three sets.
const COMPOSITION_ROWS = [0, 1, 2] as const;
const COMPOSITION_BUDGET = CZN_FRAGMENT_SLOTS.length;

const piecesOf = (setId: string) => ALL_CZN_FRAGMENT_SETS.find((s) => s.id === setId)?.pieces ?? 0;

/**
 * Options for composition row `row`: catalog sets that fit the budget left by
 * the other rows and are not already chosen elsewhere. The row's own current
 * value always stays offered so a stored value is never invisible.
 */
function compositionOptions(targetSetIds: string[], row: number) {
  const own = targetSetIds[row];
  const others = targetSetIds.filter((_, i) => i !== row);
  const remaining = COMPOSITION_BUDGET - others.reduce((sum, id) => sum + piecesOf(id), 0);
  return SET_OPTIONS.filter(
    (o) => o.value === own || (!others.includes(o.value) && piecesOf(o.value) <= remaining),
  );
}

/** Rebuild the composition from the three row values, dropping blanks (no holes). */
function withCompositionRow(targetSetIds: string[], row: number, value: string): string[] {
  const rows = COMPOSITION_ROWS.map((r) => (r === row ? value : (targetSetIds[r] ?? '')));
  return rows.filter((id) => id !== '');
}

const isFixedSlot = (slot: CznFragmentSlot): slot is CznFixedMainSlot => slot <= 3;

const slotLabel = (slot: CznFragmentSlot) =>
  `${CZN_FRAGMENT_SLOT_NUMERALS[slot]} · ${CZN_FRAGMENT_SLOT_NAMES[slot]}`;

interface FragmentEditorModalProps {
  combatant: CznTrackedCombatant;
  anchorSlot?: CznFragmentSlot;
  onSaveFragment: (slot: CznFragmentSlot, piece: CznEquippedFragment) => void;
  onRemoveFragment: (slot: CznFragmentSlot) => void;
  onUpdateBuildPreferences: (newPrefs: CznFragmentBuildPreferences) => void;
  onClose: () => void;
}

export function FragmentEditorModal({
  combatant,
  anchorSlot,
  onSaveFragment,
  onRemoveFragment,
  onUpdateBuildPreferences,
  onClose,
}: FragmentEditorModalProps) {
  return (
    <EquipmentEditorShell
      title={`Memory Fragments — ${combatant.name}`}
      equipTabLabel="Equip Fragments"
      className="fragment-editor"
      bodyClassName="fragment-editor-body"
      onClose={onClose}
      equipContent={
        <EquipTab
          combatant={combatant}
          anchorSlot={anchorSlot}
          onSaveFragment={onSaveFragment}
          onRemoveFragment={onRemoveFragment}
        />
      }
      preferencesContent={
        <PreferencesTab combatant={combatant} onUpdateBuildPreferences={onUpdateBuildPreferences} />
      }
    />
  );
}

function EquipTab({
  combatant,
  anchorSlot,
  onSaveFragment,
  onRemoveFragment,
}: {
  combatant: CznTrackedCombatant;
  anchorSlot?: CznFragmentSlot;
  onSaveFragment: (slot: CznFragmentSlot, piece: CznEquippedFragment) => void;
  onRemoveFragment: (slot: CznFragmentSlot) => void;
}) {
  const anchorRef = useScrollAnchor<HTMLDivElement>();

  const validateAndSave = (slot: CznFragmentSlot, updates: Partial<CznEquippedFragment>) => {
    const piece = { ...(combatant.fragments[slot] || emptyPiece), ...updates };

    // Enforce fixed Main Stats on slots I–III
    if (isFixedSlot(slot)) piece.mainStat = CZN_FRAGMENT_FIXED_MAINS[slot];

    // A substat may never equal the main
    if (piece.mainStat) {
      piece.subStats = piece.subStats.filter((sub) => sub !== piece.mainStat);
    }

    onSaveFragment(slot, piece);
  };

  return (
    <>
      {CZN_FRAGMENT_SLOTS.map((slot) => {
        const current = combatant.fragments[slot] || emptyPiece;
        const fixed = isFixedSlot(slot);
        // The equipped main stat must not also be offered as a substat.
        const excludeSubStats = current.mainStat ? [current.mainStat] : [];
        // Editable stat controls are gated (dimmed + disabled) until a set is chosen;
        // fixed slot I–III mains are read-only and stay ungated.
        const hasSet = Boolean(current.setId);
        const gatedClass = hasSet ? undefined : 'is-gated';
        // Substats are additionally gated behind the main on variable-main slots.
        // Fixed mains are always known, so slots I–III stay set-gated only.
        const subsEnabled = hasSet && (fixed || Boolean(current.mainStat));
        const subGatedClass = subsEnabled ? undefined : 'is-gated';

        return (
          <div
            key={slot}
            ref={slot === anchorSlot ? anchorRef : undefined}
            className="equip-slot-card"
            data-slot={slot}
          >
            <div className="equip-slot-header">{slotLabel(slot)}</div>
            <FormGroup label="Set">
              <Select
                name={`fragment-${slot}-set`}
                value={current.setId || ''}
                placeholder="-- No Set --"
                options={SET_OPTIONS}
                onChange={(v) => (v ? validateAndSave(slot, { setId: v }) : onRemoveFragment(slot))}
              />
            </FormGroup>

            <FormGroup label="Main Stat" className={fixed ? undefined : gatedClass}>
              {fixed ? (
                // Slot I–III mains are fixed — read-only, always shown, never gated.
                <span className="readonly-stat">{CZN_FRAGMENT_FIXED_MAINS[slot]} (Fixed)</span>
              ) : (
                <Select
                  name={`fragment-${slot}-main-stat`}
                  value={current.mainStat || ''}
                  placeholder="-- No Main Stat --"
                  options={CZN_FRAGMENT_MAIN_STATS[slot]}
                  onChange={(v) => validateAndSave(slot, { mainStat: v })}
                  disabled={!hasSet}
                />
              )}
            </FormGroup>

            <div className={subGatedClass}>
              <SubStatList
                values={current.subStats}
                options={CZN_FRAGMENT_SUB_STATS}
                namePrefix={`fragment-${slot}-substat`}
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
  combatant,
  onUpdateBuildPreferences,
}: {
  combatant: CznTrackedCombatant;
  onUpdateBuildPreferences: (newPrefs: CznFragmentBuildPreferences) => void;
}) {
  const currentPrefs = combatant.fragmentPreferences || {
    mainStats: { 4: [], 5: [], 6: [] },
    subStats: [],
    targetSetIds: [],
  };

  return (
    <div className="preferences-tab">
      <p className="tab-description">Define the ideal stats you want to roll for this combatant.</p>

      <div className="pref-section">
        <h3>Preferred Sets</h3>
        {COMPOSITION_ROWS.map((row) => {
          const options = compositionOptions(currentPrefs.targetSetIds, row);
          return (
            <FormGroup key={row} label={`Set ${row + 1}`}>
              <Select
                name={`pref-set-${row + 1}`}
                value={currentPrefs.targetSetIds[row] ?? ''}
                placeholder="-- None --"
                options={options}
                disabled={options.length === 0}
                onChange={(v) =>
                  onUpdateBuildPreferences({
                    ...currentPrefs,
                    targetSetIds: withCompositionRow(currentPrefs.targetSetIds, row, v),
                  })
                }
              />
            </FormGroup>
          );
        })}
      </div>

      {CZN_VARIABLE_MAIN_SLOTS.map((slot: CznVariableMainSlot) => (
        <div key={slot} className="pref-section">
          <h3>Preferred Main Stat ({slotLabel(slot)})</h3>
          <PreferenceChain
            values={currentPrefs.mainStats[slot]}
            options={CZN_FRAGMENT_MAIN_STATS[slot]}
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
          options={CZN_FRAGMENT_SUB_STATS}
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
