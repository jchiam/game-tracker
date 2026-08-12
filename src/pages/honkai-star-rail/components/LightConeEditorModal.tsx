import type { HsrTrackedCharacter } from '@/types';
import { ALL_LIGHT_CONES } from '@/data/honkai-star-rail/light_cones';
import { Modal } from '@/components/Modal';
import { PreferenceChain } from '@/components/PreferenceChain';
import './LightConeEditorModal.css';

interface LightConeEditorModalProps {
  char: HsrTrackedCharacter;
  onUpdatePreferences: (lightConePreferences: string[]) => void;
  onClose: () => void;
}

/**
 * Dedicated Light Cone preferences dialog — a flow separate from the relic
 * editor, whose Build Preferences tab is relic-only. One ranked list, saved
 * through the plain field-update path (atomic array-column write).
 */
export function LightConeEditorModal({
  char,
  onUpdatePreferences,
  onClose,
}: LightConeEditorModalProps) {
  // Same strict path filter and label format as the card's equip picker, so the
  // two Light Cone dropdowns read identically.
  const lightConeOptions = ALL_LIGHT_CONES.filter((lc) => lc.path === char.path).map((lc) => ({
    value: lc.id,
    label: `${lc.name} (${lc.rarity}★)`,
  }));

  return (
    <Modal
      title={`Light Cones — ${char.name}`}
      onClose={onClose}
      className="light-cone-editor"
      bodyClassName="modal-body light-cone-editor-body"
      footer={
        <button className="btn primary-action" onClick={onClose}>
          Done
        </button>
      }
    >
      <p className="tab-description">
        Rank the Light Cones you want for this character, first choice on top.
      </p>
      <PreferenceChain
        variant="ranked-list"
        values={char.lightConePreferences}
        options={lightConeOptions}
        namePrefix="pref-light-cone"
        addLabel="+ Add Light Cone"
        onChange={onUpdatePreferences}
      />
    </Modal>
  );
}
