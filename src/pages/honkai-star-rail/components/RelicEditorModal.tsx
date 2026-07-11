import type { HsrTrackedCharacter } from '@/types';
import type { RelicSet, EquippedRelic } from '@/data/honkai-star-rail/relics';
import { EquipmentEditorShell } from '@/components/EquipmentEditorShell';
import { useScrollAnchor } from '@/hooks/useScrollAnchor';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SubStatList } from '@/components/SubStatList';
import './RelicEditorModal.css';

type RelicSlot = keyof HsrTrackedCharacter['relics'];

const RELIC_SLOTS: RelicSlot[] = ['head', 'hands', 'body', 'feet', 'sphere', 'rope'];
const PLANAR_SLOTS: RelicSlot[] = ['sphere', 'rope'];
const VARIABLE_MAIN_SLOTS = ['body', 'feet', 'sphere', 'rope'] as const;

const VALID_MAIN_STATS: Record<string, string[]> = {
  head: ['HP'],
  hands: ['ATK'],
  body: [
    'HP%',
    'DEF%',
    'ATK%',
    'CRIT Rate',
    'CRIT DMG',
    'Effect Hit Rate',
    'Outgoing Healing Boost',
  ],
  feet: ['HP%', 'DEF%', 'ATK%', 'SPD'],
  sphere: [
    'HP%',
    'DEF%',
    'ATK%',
    'Physical DMG Boost',
    'Fire DMG Boost',
    'Ice DMG Boost',
    'Lightning DMG Boost',
    'Wind DMG Boost',
    'Quantum DMG Boost',
    'Imaginary DMG Boost',
  ],
  rope: ['HP%', 'DEF%', 'ATK%', 'Break Effect', 'Energy Regeneration Rate'],
};

const ALL_SUB_STATS = [
  'HP',
  'HP%',
  'DEF',
  'DEF%',
  'ATK',
  'ATK%',
  'SPD',
  'CRIT Rate',
  'CRIT DMG',
  'Break Effect',
  'Effect Hit Rate',
  'Effect RES',
];

const slotLabel = (slot: RelicSlot) => slot.charAt(0).toUpperCase() + slot.slice(1);

interface RelicEditorModalProps {
  char: HsrTrackedCharacter;
  anchorSlot?: RelicSlot;
  availableRelicSets: RelicSet[];
  emptyRelic: EquippedRelic;
  onSaveRelic: (slot: RelicSlot, relicData: EquippedRelic) => void;
  onRemoveRelic: (slot: RelicSlot) => void;
  onUpdateBuildPreferences: (newPrefs: HsrTrackedCharacter['buildPreferences']) => void;
  onClose: () => void;
}

export function RelicEditorModal({
  char,
  anchorSlot,
  availableRelicSets,
  emptyRelic,
  onSaveRelic,
  onRemoveRelic,
  onUpdateBuildPreferences,
  onClose,
}: RelicEditorModalProps) {
  return (
    <EquipmentEditorShell
      title={`Relics — ${char.name}`}
      equipTabLabel="Equip Relics"
      className="relic-editor"
      bodyClassName="relic-editor-body"
      onClose={onClose}
      equipContent={
        <EquipTab
          char={char}
          anchorSlot={anchorSlot}
          availableRelicSets={availableRelicSets}
          emptyRelic={emptyRelic}
          onSaveRelic={onSaveRelic}
          onRemoveRelic={onRemoveRelic}
        />
      }
      preferencesContent={
        <PreferencesTab
          char={char}
          availableRelicSets={availableRelicSets}
          onUpdateBuildPreferences={onUpdateBuildPreferences}
        />
      }
    />
  );
}

function EquipTab({
  char,
  anchorSlot,
  availableRelicSets,
  emptyRelic,
  onSaveRelic,
  onRemoveRelic,
}: {
  char: HsrTrackedCharacter;
  anchorSlot?: RelicSlot;
  availableRelicSets: RelicSet[];
  emptyRelic: EquippedRelic;
  onSaveRelic: (slot: RelicSlot, relicData: EquippedRelic) => void;
  onRemoveRelic: (slot: RelicSlot) => void;
}) {
  const anchorRef = useScrollAnchor<HTMLDivElement>();

  const validateAndSave = (slot: RelicSlot, updates: Partial<EquippedRelic>) => {
    const newRelic = { ...(char.relics[slot] || emptyRelic), ...updates };

    // Enforce fixed Main Stats
    if (slot === 'head') newRelic.mainStat = 'HP';
    if (slot === 'hands') newRelic.mainStat = 'ATK';

    // Prune conflicting Substats
    if (newRelic.mainStat) {
      newRelic.subStats = newRelic.subStats.filter((sub) => sub !== newRelic.mainStat);
    }

    onSaveRelic(slot, newRelic);
  };

  return (
    <>
      {RELIC_SLOTS.map((slot) => {
        const currentRelic = char.relics[slot] || emptyRelic;
        const isPlanar = PLANAR_SLOTS.includes(slot);
        const isFixedSlot = slot === 'head' || slot === 'hands';
        // The equipped main stat must not also be offered as a sub-stat.
        const excludeSubStats = currentRelic.mainStat ? [currentRelic.mainStat] : [];
        // Editable stat controls are gated (dimmed + disabled) until a relic set is chosen;
        // fixed head/hands mains are read-only and stay ungated.
        const hasSet = Boolean(currentRelic.setId);
        const gatedClass = hasSet ? undefined : 'is-gated';

        return (
          <div
            key={slot}
            ref={slot === anchorSlot ? anchorRef : undefined}
            className="equip-slot-card"
            data-slot={slot}
          >
            <div className="equip-slot-header">{slotLabel(slot)}</div>
            <FormGroup label="Relic Set">
              <Select
                name={`relic-${slot}-set`}
                value={currentRelic.setId || ''}
                placeholder="-- No Set --"
                options={availableRelicSets
                  .filter((set) => (isPlanar ? set.id.startsWith('3') : set.id.startsWith('1')))
                  .map((set) => ({ value: set.id, label: set.name }))}
                onChange={(v) => (v ? validateAndSave(slot, { setId: v }) : onRemoveRelic(slot))}
              />
            </FormGroup>

            <FormGroup label="Main Stat" className={isFixedSlot ? undefined : gatedClass}>
              {isFixedSlot ? (
                // Head/hands mains are fixed — read-only, always shown, never gated.
                <span className="readonly-stat">{slot === 'head' ? 'HP' : 'ATK'} (Fixed)</span>
              ) : (
                <Select
                  name={`relic-${slot}-main-stat`}
                  value={currentRelic.mainStat || ''}
                  placeholder="-- No Main Stat --"
                  options={VALID_MAIN_STATS[slot]}
                  onChange={(v) => validateAndSave(slot, { mainStat: v })}
                  disabled={!hasSet}
                />
              )}
            </FormGroup>

            <div className={gatedClass}>
              <SubStatList
                values={currentRelic.subStats}
                options={ALL_SUB_STATS}
                namePrefix={`relic-${slot}-substat`}
                label="Substats (Max 4)"
                addLabel="+ Add Substat"
                excludeValues={excludeSubStats}
                onChange={(subStats) => validateAndSave(slot, { subStats })}
                disabled={!hasSet}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function PreferencesTab({
  char,
  availableRelicSets,
  onUpdateBuildPreferences,
}: {
  char: HsrTrackedCharacter;
  availableRelicSets: RelicSet[];
  onUpdateBuildPreferences: (newPrefs: HsrTrackedCharacter['buildPreferences']) => void;
}) {
  const currentPrefs = char.buildPreferences || {
    mainStats: { body: [], feet: [], sphere: [], rope: [] },
    subStats: [],
  };

  return (
    <div className="preferences-tab">
      <p className="tab-description">Define the ideal stats you want to roll for this character.</p>

      <div className="pref-section">
        <h3>Preferred Sets</h3>
        <FormGroup label="Relic Set (4-piece)">
          <Select
            name="pref-relic-set"
            value={currentPrefs.relicSetId ?? ''}
            placeholder="-- None --"
            options={availableRelicSets
              .filter((set) => set.id.startsWith('1'))
              .map((set) => ({ value: set.id, label: set.name }))}
            onChange={(v) => onUpdateBuildPreferences({ ...currentPrefs, relicSetId: v || null })}
          />
        </FormGroup>
        <FormGroup label="Planar Set (2-piece)">
          <Select
            name="pref-planar-set"
            value={currentPrefs.planarSetId ?? ''}
            placeholder="-- None --"
            options={availableRelicSets
              .filter((set) => set.id.startsWith('3'))
              .map((set) => ({ value: set.id, label: set.name }))}
            onChange={(v) => onUpdateBuildPreferences({ ...currentPrefs, planarSetId: v || null })}
          />
        </FormGroup>
      </div>

      {VARIABLE_MAIN_SLOTS.map((slot) => (
        <div key={slot} className="pref-section">
          <h3>Preferred Main Stat ({slotLabel(slot)})</h3>
          <PreferenceChain
            values={currentPrefs.mainStats[slot]}
            options={VALID_MAIN_STATS[slot]}
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
          options={ALL_SUB_STATS}
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
