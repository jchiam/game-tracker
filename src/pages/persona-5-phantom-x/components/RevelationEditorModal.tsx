import { useState } from 'react';
import type { P5xTrackedThief, P5xRevelationPreferences } from '@/types';
import type { EquippedRevelation, RevelationSlot } from '@/data/persona-5-phantom-x/revelations';
import {
  ALL_HEAVENS_SETS,
  ALL_SPACE_SETS,
  REVELATION_SLOTS,
  MAIN_STATS,
  SUB_STATS,
} from '@/data/persona-5-phantom-x/revelations';
import { Modal } from '@/components/Modal';
import { FormGroup } from '@/components/FormGroup';
import { Select } from '@/components/Select';
import { SubStatList } from '@/components/SubStatList';
import { PreferenceChain } from '@/components/PreferenceChain';
import './RevelationEditorModal.css';

interface RevelationEditorModalProps {
  thief: P5xTrackedThief;
  onUpdateSlot: (slot: RevelationSlot, data: EquippedRevelation | null) => void;
  onSavePreferences: (prefs: P5xRevelationPreferences) => void;
  onClose: () => void;
}

export function RevelationEditorModal({
  thief,
  onUpdateSlot,
  onSavePreferences,
  onClose,
}: RevelationEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'equip' | 'preferences'>('equip');

  return (
    <Modal
      title={`Revelations — ${thief.name}`}
      onClose={onClose}
      className="revelation-editor-modal"
      footer={
        <button className="btn primary-action" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="modal-tabs">
        <button
          className={`tab-btn ${activeTab === 'equip' ? 'active' : ''}`}
          onClick={() => setActiveTab('equip')}
        >
          Equip Cards
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Build Preferences
        </button>
      </div>

      <div className="revelation-editor-body">
        {activeTab === 'equip' ? (
          <EquipTab thief={thief} onUpdateSlot={onUpdateSlot} />
        ) : (
          <PreferencesTab prefs={thief.revelationPreferences} onSave={onSavePreferences} />
        )}
      </div>
    </Modal>
  );
}

function EquipTab({
  thief,
  onUpdateSlot,
}: {
  thief: P5xTrackedThief;
  onUpdateSlot: (slot: RevelationSlot, data: EquippedRevelation | null) => void;
}) {
  return (
    <>
      {REVELATION_SLOTS.map((slot) => {
        const card = thief.revelations[slot];
        const isSpace = slot === 'space';
        const setOptions = isSpace
          ? ALL_SPACE_SETS.map((s) => ({ value: s.id, label: s.name }))
          : ALL_HEAVENS_SETS.map((s) => ({ value: s.id, label: s.name }));
        const slotMainStats = MAIN_STATS[slot.toUpperCase() as Uppercase<RevelationSlot>];
        const isFixedMain = slotMainStats.length === 1;
        const mainStat = card?.mainStat ?? (isFixedMain ? slotMainStats[0] : '');
        const availableSubStats = SUB_STATS.filter((s) => s !== mainStat);

        const handleSetChange = (setId: string) => {
          const updated: EquippedRevelation = {
            setId: setId || null,
            mainStat: card?.mainStat ?? (isFixedMain ? slotMainStats[0] : null),
            subStats: card?.subStats ?? [],
          };
          onUpdateSlot(slot, setId ? updated : null);
        };

        const handleMainStatChange = (stat: string) => {
          const updated: EquippedRevelation = {
            setId: card?.setId ?? null,
            mainStat: stat || null,
            subStats: (card?.subStats ?? []).filter((s) => s.type !== stat),
          };
          onUpdateSlot(slot, updated);
        };

        const handleSubStatsChange = (subStats: Array<{ type: string; value: number }>) => {
          const updated: EquippedRevelation = {
            setId: card?.setId ?? null,
            mainStat: card?.mainStat ?? null,
            subStats,
          };
          onUpdateSlot(slot, updated);
        };

        return (
          <FormGroup key={slot} label={slot.charAt(0).toUpperCase() + slot.slice(1)}>
            <Select
              name={`rev-${slot}-set`}
              value={card?.setId ?? ''}
              options={setOptions}
              onChange={handleSetChange}
              placeholder="-- No Set --"
            />
            <Select
              name={`rev-${slot}-main`}
              value={mainStat}
              options={slotMainStats}
              onChange={handleMainStatChange}
              disabled={isFixedMain}
            />
            <SubStatList
              variant="stat-value"
              namePrefix={`rev-${slot}-sub`}
              options={availableSubStats}
              values={card?.subStats?.map((s) => ({ type: s.type, value: s.value })) ?? []}
              onChange={(vals) =>
                handleSubStatsChange(vals.map((v) => ({ type: v.type, value: v.value })))
              }
              max={4}
              addLabel="+ Substat"
            />
          </FormGroup>
        );
      })}
    </>
  );
}

function PreferencesTab({
  prefs,
  onSave,
}: {
  prefs: P5xRevelationPreferences;
  onSave: (prefs: P5xRevelationPreferences) => void;
}) {
  return (
    <>
      <FormGroup label="Preferred Heavens Set">
        <Select
          name="rev-pref-heavens"
          value={prefs.heavensSetId ?? ''}
          options={ALL_HEAVENS_SETS.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => onSave({ ...prefs, heavensSetId: v || null })}
          placeholder="-- None --"
        />
      </FormGroup>

      <FormGroup label="Preferred Space Set">
        <Select
          name="rev-pref-space"
          value={prefs.spaceSetId ?? ''}
          options={ALL_SPACE_SETS.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => onSave({ ...prefs, spaceSetId: v || null })}
          placeholder="-- None --"
        />
      </FormGroup>

      <FormGroup label="Moon Main Stat">
        <PreferenceChain
          values={prefs.mainStats.moon}
          options={MAIN_STATS.MOON}
          namePrefix="rev-pref-moon"
          onChange={(values) =>
            onSave({ ...prefs, mainStats: { ...prefs.mainStats, moon: values } })
          }
        />
      </FormGroup>

      <FormGroup label="Star Main Stat">
        <PreferenceChain
          values={prefs.mainStats.star}
          options={MAIN_STATS.STAR}
          namePrefix="rev-pref-star"
          onChange={(values) =>
            onSave({ ...prefs, mainStats: { ...prefs.mainStats, star: values } })
          }
        />
      </FormGroup>

      <FormGroup label="Sky Main Stat">
        <PreferenceChain
          values={prefs.mainStats.sky}
          options={MAIN_STATS.SKY}
          namePrefix="rev-pref-sky"
          onChange={(values) =>
            onSave({ ...prefs, mainStats: { ...prefs.mainStats, sky: values } })
          }
        />
      </FormGroup>

      <FormGroup label="Substats">
        <PreferenceChain
          values={prefs.subStats}
          options={SUB_STATS}
          namePrefix="rev-pref-sub"
          onChange={(values) => onSave({ ...prefs, subStats: values })}
        />
      </FormGroup>
    </>
  );
}
