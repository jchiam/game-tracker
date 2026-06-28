import { useState } from 'react';
import type { N2ETrackedCharacter, N2ECartridgePatch } from '@/types';
import {
  CARTRIDGE_MAIN_STATS,
  CARTRIDGE_SUB_STATS,
} from '@/data/neverness-to-everness/cartridge-stats';
import { ALL_CARTRIDGES } from '@/data/neverness-to-everness/cartridges';
import { Modal } from '@/components/Modal';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { LevelSlider } from '@/components/LevelSlider';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { SubStatList } from '@/components/SubStatList';
import './CartridgeEditorModal.css';

// Deduplicated sorted list of cartridge names
const CARTRIDGE_NAMES = [...new Set(ALL_CARTRIDGES.map((c) => c.name))].sort();
const CARTRIDGE_RARITIES = ['B', 'A', 'S'] as const;
const RARITY_OPTIONS = CARTRIDGE_RARITIES.map((r) => ({ value: r, label: r }));

function cartridgeIdFromNameAndRarity(name: string, rarity: string): string | null {
  const entry = ALL_CARTRIDGES.find((c) => c.name === name && c.rarity === rarity);
  return entry?.id ?? null;
}

function nameFromCartridgeId(cartridgeId: string | null): string {
  if (!cartridgeId) return '';
  return ALL_CARTRIDGES.find((c) => c.id === cartridgeId)?.name ?? '';
}

function rarityFromCartridgeId(cartridgeId: string | null): string {
  if (!cartridgeId) return '';
  return ALL_CARTRIDGES.find((c) => c.id === cartridgeId)?.rarity ?? '';
}

interface CartridgeEditorModalProps {
  character: N2ETrackedCharacter;
  onSaveCartridge: (patch: N2ECartridgePatch) => void;
  onSavePreferences: (prefs: N2ETrackedCharacter['cartridgePreferences']) => void;
  onClose: () => void;
}

export function CartridgeEditorModal({
  character,
  onSaveCartridge,
  onSavePreferences,
  onClose,
}: CartridgeEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'equip' | 'preferences'>('equip');

  const currentCartridgeId = character.cartridgeId;
  const currentLevel = character.cartridgeLevel;
  const currentMainStat = character.cartridgeMainStat;
  const currentSubStats = character.cartridgeSubStats;

  const currentPrefs = character.cartridgePreferences ?? {
    cartridgeId: null,
    mainStats: [],
    subStats: [],
    comments: '',
  };

  // Local state for two-step picker — keeps name visible while rarity not yet chosen.
  // Initialized from character data so reopening the modal shows the current selection.
  const [equipName, setEquipName] = useState(() => nameFromCartridgeId(currentCartridgeId) || '');
  const [equipRarity, setEquipRarity] = useState(
    () => rarityFromCartridgeId(currentCartridgeId) || character.cartridgeRarity || '',
  );
  const [prefName, setPrefName] = useState(() =>
    nameFromCartridgeId(currentPrefs.cartridgeId ?? null),
  );

  // ─── Equip tab helpers ──────────────────────────────────────────

  const handleNameChange = (name: string) => {
    setEquipName(name);
    if (!name) {
      setEquipRarity('');
      onSaveCartridge({ cartridgeId: null, cartridgeRarity: null });
      return;
    }
    if (equipRarity) {
      const newId = cartridgeIdFromNameAndRarity(name, equipRarity);
      onSaveCartridge({ cartridgeId: newId, cartridgeRarity: newId ? equipRarity : null });
    }
    // No rarity yet — name is staged in local state; don't persist until rarity is chosen
  };

  const handleRarityChange = (rarity: string) => {
    setEquipRarity(rarity);
    if (!equipName) return;
    const newId = cartridgeIdFromNameAndRarity(equipName, rarity);
    onSaveCartridge({ cartridgeId: newId, cartridgeRarity: rarity });
  };

  const handleUnequip = () => {
    setEquipName('');
    setEquipRarity('');
    onSaveCartridge({
      cartridgeId: null,
      cartridgeRarity: null,
      cartridgeLevel: 0,
      cartridgeMainStat: null,
      cartridgeSubStats: [],
    });
  };

  // ─── Preferences tab helpers ────────────────────────────────────

  const handlePrefNameChange = (name: string) => {
    setPrefName(name);
    if (!name) {
      onSavePreferences({ ...currentPrefs, cartridgeId: null });
      return;
    }
    // Always target S rarity
    const newId = cartridgeIdFromNameAndRarity(name, 'S');
    onSavePreferences({ ...currentPrefs, cartridgeId: newId });
  };

  return (
    <Modal
      title={`Edit Cartridge - ${character.name}`}
      onClose={onClose}
      className="cartridge-editor"
      footer={
        <>
          {activeTab === 'equip' && (
            <button className="secondary-action danger" onClick={handleUnequip}>
              Un-equip Cartridge
            </button>
          )}
          <button className="primary-action" onClick={onClose}>
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
          Equip Cartridge
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Build Preferences
        </button>
      </div>

      <div className="cartridge-editor-body">
        {activeTab === 'equip' ? (
          <>
            <FormGroup label="Cartridge">
              <Select
                name="cartridge-name"
                value={equipName}
                placeholder="-- No Cartridge --"
                options={CARTRIDGE_NAMES}
                onChange={handleNameChange}
              />
            </FormGroup>

            <FormGroup label="Rarity">
              <SegmentedButtons
                className="rarity-btn-row"
                options={RARITY_OPTIONS}
                value={equipRarity || null}
                disabled={!equipName}
                onChange={(v) => v && handleRarityChange(v)}
              />
            </FormGroup>

            <FormGroup label="Main Stat">
              <Select
                name="cartridge-main-stat"
                value={currentMainStat || ''}
                placeholder="-- No Main Stat --"
                options={CARTRIDGE_MAIN_STATS}
                onChange={(v) => onSaveCartridge({ cartridgeMainStat: v || null })}
              />
            </FormGroup>

            <FormGroup label="Level">
              <LevelSlider
                name="cartridge-level"
                value={currentLevel}
                min={0}
                max={20}
                showValue
                onChange={(n) => onSaveCartridge({ cartridgeLevel: n })}
              />
            </FormGroup>

            <SubStatList
              variant="stat-only"
              values={currentSubStats}
              options={CARTRIDGE_SUB_STATS}
              namePrefix="substat"
              label="Sub Stats (Max 4)"
              addLabel="+ Add Sub Stat"
              onChange={(subs) => onSaveCartridge({ cartridgeSubStats: subs })}
            />
          </>
        ) : (
          <div className="preferences-tab">
            <p className="tab-description">
              Define the ideal cartridge build for {character.name}.
            </p>

            <div className="pref-section">
              <h3>Target Cartridge</h3>
              <div className="form-group">
                <Select
                  name="pref-cartridge-name"
                  value={prefName}
                  placeholder="-- No Preference --"
                  options={CARTRIDGE_NAMES}
                  onChange={handlePrefNameChange}
                />
              </div>
            </div>

            <div className="pref-section">
              <h3>Main Stat Priority</h3>
              <PreferenceChain
                values={currentPrefs.mainStats}
                options={CARTRIDGE_MAIN_STATS}
                namePrefix="pref-main-stat"
                onChange={(mainStats) => onSavePreferences({ ...currentPrefs, mainStats })}
              />
            </div>

            <div className="pref-section">
              <h3>Sub Stat Priority</h3>
              <PreferenceChain
                values={currentPrefs.subStats}
                options={CARTRIDGE_SUB_STATS}
                namePrefix="pref-sub-stat"
                onChange={(subStats) => onSavePreferences({ ...currentPrefs, subStats })}
              />
            </div>

            <div className="pref-section">
              <BuildComments
                label="Build Comments"
                value={currentPrefs.comments || ''}
                placeholder="Additional notes about this cartridge build..."
                onChange={(comments) => onSavePreferences({ ...currentPrefs, comments })}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
