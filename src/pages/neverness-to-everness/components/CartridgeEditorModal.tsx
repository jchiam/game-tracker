import { useState } from 'react';
import type { N2ETrackedCharacter, N2ECartridgePatch } from '@/types';
import { EquipmentEditorShell } from '@/components/EquipmentEditorShell';
import {
  CARTRIDGE_MAIN_STATS,
  CARTRIDGE_SUB_STATS,
} from '@/data/neverness-to-everness/cartridge-stats';
import { ALL_CARTRIDGES } from '@/data/neverness-to-everness/cartridges';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { LevelSlider } from '@/components/LevelSlider';
import { PreferenceChain } from '@/components/PreferenceChain';
import { Select } from '@/components/Select';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { SubStatList } from '@/components/SubStatList';

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
  const currentCartridgeId = character.cartridgeId;
  const currentLevel = character.cartridgeLevel;
  const currentMainStat = character.cartridgeMainStat;
  const currentSubStats = character.cartridgeSubStats;

  // Editable stat controls (main stat, level, substats) are gated until a cartridge
  // is selected — a valid cartridgeId requires both a name and a rarity.
  const hasCartridge = Boolean(currentCartridgeId);
  const gatedClass = hasCartridge ? undefined : 'is-gated';
  // Substats are additionally gated behind the (variable) main stat for consistent user flow —
  // pick a main before entering substats. N2E main and sub stats roll independently, so a substat
  // MAY equal the main; the gate is a flow choice, not an exclusion rule.
  const subsEnabled = hasCartridge && Boolean(currentMainStat);
  const subGatedClass = subsEnabled ? undefined : 'is-gated';

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
    <EquipmentEditorShell
      title={`Edit Cartridge - ${character.name}`}
      equipTabLabel="Equip Cartridge"
      className="cartridge-editor"
      bodyClassName="cartridge-editor-body"
      onClose={onClose}
      equipFooterExtra={
        <button className="btn secondary-action danger" onClick={handleUnequip}>
          Un-equip Cartridge
        </button>
      }
      equipContent={
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

          <FormGroup label="Main Stat" className={gatedClass}>
            <Select
              name="cartridge-main-stat"
              value={currentMainStat || ''}
              placeholder="-- No Main Stat --"
              options={CARTRIDGE_MAIN_STATS}
              onChange={(v) =>
                // N2E main and sub roll independently — a substat may equal the main, so no prune.
                onSaveCartridge({ cartridgeMainStat: v || null })
              }
              disabled={!hasCartridge}
            />
          </FormGroup>

          <FormGroup label="Level" className={gatedClass}>
            <LevelSlider
              name="cartridge-level"
              value={currentLevel}
              min={0}
              max={20}
              showValue
              disabled={!hasCartridge}
              onChange={(n) => onSaveCartridge({ cartridgeLevel: n })}
            />
          </FormGroup>

          <div className={subGatedClass}>
            <SubStatList
              values={currentSubStats}
              options={CARTRIDGE_SUB_STATS}
              namePrefix="substat"
              label="Sub Stats (Max 4)"
              addLabel="+ Add Sub Stat"
              disabled={!subsEnabled}
              onChange={(subs) => onSaveCartridge({ cartridgeSubStats: subs })}
            />
          </div>
        </>
      }
      preferencesContent={
        <div className="preferences-tab">
          <p className="tab-description">Define the ideal cartridge build for {character.name}.</p>

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
      }
    />
  );
}
