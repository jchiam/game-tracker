import { useState } from 'react';
import type { HsrTrackedCharacter } from '@/types';
import type { RelicSet, EquippedRelic } from '@/data/honkai-star-rail/relics';
import { Modal } from '@/components/Modal';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SubStatList } from '@/components/SubStatList';
import './RelicEditorModal.css';

interface RelicEditorModalProps {
  char: HsrTrackedCharacter;
  slot: keyof HsrTrackedCharacter['relics'];
  availableRelicSets: RelicSet[];
  emptyRelic: EquippedRelic;
  onSave: (relicData: EquippedRelic) => void;
  onRemove: () => void;
  onUpdateBuildPreferences: (newPrefs: HsrTrackedCharacter['buildPreferences']) => void;
  onClose: () => void;
}

export function RelicEditorModal({
  char,
  slot,
  availableRelicSets,
  emptyRelic,
  onSave,
  onRemove,
  onUpdateBuildPreferences,
  onClose,
}: RelicEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'equip' | 'preferences'>('equip');
  const currentRelic = char.relics[slot] || emptyRelic;
  const currentPrefs = char.buildPreferences || {
    mainStats: { body: [], feet: [], sphere: [], rope: [] },
    subStats: [],
  };

  const validMainStats: Record<string, string[]> = {
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

  const allSubStats = [
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

  const validateAndSave = (updates: Partial<EquippedRelic>) => {
    const newRelic = { ...currentRelic, ...updates };

    // Enforce fixed Main Stats
    if (slot === 'head') newRelic.mainStat = 'HP';
    if (slot === 'hands') newRelic.mainStat = 'ATK';

    // Prune conflicting Substats
    if (newRelic.mainStat) {
      newRelic.subStats = newRelic.subStats.filter((sub) => sub !== newRelic.mainStat);
    }

    onSave(newRelic);
  };

  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
  const isFixedSlot = slot === 'head' || slot === 'hands';
  // The equipped main stat must not also be offered as a sub-stat.
  const excludeSubStats = currentRelic.mainStat ? [currentRelic.mainStat] : [];
  // Editable stat controls are gated (dimmed + disabled) until a relic set is chosen;
  // fixed head/hands mains are read-only and stay ungated.
  const hasSet = Boolean(currentRelic.setId);
  const gatedClass = hasSet ? undefined : 'is-gated';

  return (
    <Modal
      title={`Edit ${slotLabel}`}
      onClose={onClose}
      className="relic-editor"
      footer={
        <>
          {activeTab === 'equip' && (
            <button className="btn secondary-action danger" onClick={onRemove}>
              Un-equip Relic
            </button>
          )}
          <button className="btn primary-action" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="modal-tabs">
        <button
          className={`tab-btn ${activeTab === 'equip' ? 'active' : ''}`}
          onClick={() => setActiveTab('equip')}
        >
          Equip Relic
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Build Preferences
        </button>
      </div>

      <div className="relic-editor-body">
        {activeTab === 'equip' ? (
          <>
            <FormGroup label="Relic Set">
              <Select
                name="relic-set"
                value={currentRelic.setId || ''}
                placeholder="-- No Set --"
                options={availableRelicSets
                  .filter((set) =>
                    slot === 'sphere' || slot === 'rope'
                      ? set.id.startsWith('3')
                      : set.id.startsWith('1'),
                  )
                  .map((set) => ({ value: set.id, label: set.name }))}
                onChange={(v) => validateAndSave({ setId: v })}
              />
            </FormGroup>

            <FormGroup label="Main Stat" className={isFixedSlot ? undefined : gatedClass}>
              {isFixedSlot ? (
                // Head/hands mains are fixed — read-only, always shown, never gated.
                <span className="readonly-stat">{slot === 'head' ? 'HP' : 'ATK'} (Fixed)</span>
              ) : (
                <Select
                  name="relic-main-stat"
                  value={currentRelic.mainStat || ''}
                  placeholder="-- No Main Stat --"
                  options={validMainStats[slot]}
                  onChange={(v) => validateAndSave({ mainStat: v })}
                  disabled={!hasSet}
                />
              )}
            </FormGroup>

            <div className={gatedClass}>
              <SubStatList
                values={currentRelic.subStats}
                options={allSubStats}
                namePrefix="substat"
                label="Substats (Max 4)"
                addLabel="+ Add Substat"
                excludeValues={excludeSubStats}
                onChange={(subStats) => validateAndSave({ subStats })}
                disabled={!hasSet}
              />
            </div>
          </>
        ) : (
          <div className="preferences-tab">
            <p className="tab-description">
              Define the ideal stats you want to roll for this character.
            </p>

            {!isFixedSlot && (
              <div className="pref-section">
                <h3>Preferred Main Stat ({slotLabel})</h3>
                <PreferenceChain
                  values={currentPrefs.mainStats[slot]}
                  options={validMainStats[slot]}
                  namePrefix="pref-main-stat"
                  onChange={(mainStatsForSlot) =>
                    onUpdateBuildPreferences({
                      ...currentPrefs,
                      mainStats: { ...currentPrefs.mainStats, [slot]: mainStatsForSlot },
                    })
                  }
                />
              </div>
            )}

            <div className="pref-section">
              <h3>Preferred Substats (Global)</h3>
              <PreferenceChain
                values={currentPrefs.subStats}
                options={allSubStats}
                namePrefix="pref-sub-stat"
                onChange={(subStats) => onUpdateBuildPreferences({ ...currentPrefs, subStats })}
              />
            </div>

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
                  onChange={(v) =>
                    onUpdateBuildPreferences({ ...currentPrefs, relicSetId: v || null })
                  }
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
                  onChange={(v) =>
                    onUpdateBuildPreferences({ ...currentPrefs, planarSetId: v || null })
                  }
                />
              </FormGroup>
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
        )}
      </div>
    </Modal>
  );
}
