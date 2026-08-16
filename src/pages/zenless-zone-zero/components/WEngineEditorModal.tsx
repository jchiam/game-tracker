import type { ZzzTrackedAgent } from '@/types';
import { ALL_ZZZ_WENGINES } from '@/data/zenless-zone-zero/wengines';
import { Modal } from '@/components/Modal';
import { PreferenceChain } from '@/components/PreferenceChain';
import './WEngineEditorModal.css';

interface WEngineEditorModalProps {
  agent: ZzzTrackedAgent;
  onUpdatePreferences: (wEnginePreferences: string[]) => void;
  onClose: () => void;
}

const rarityLetter = (rarity: number) => (rarity === 4 ? 'S' : rarity === 3 ? 'A' : 'B');

/**
 * Dedicated W-Engine preferences dialog — a flow separate from the disc
 * editor, whose Build Preferences tab is disc-only. One ranked list, saved
 * through the plain field-update path (atomic array-column write).
 */
export function WEngineEditorModal({
  agent,
  onUpdatePreferences,
  onClose,
}: WEngineEditorModalProps) {
  // Same strict specialty filter and label format as the card's equip picker,
  // so the two W-Engine dropdowns read identically.
  const wengineOptions = ALL_ZZZ_WENGINES.filter((w) => w.specialty === agent.specialty).map(
    (w) => ({
      value: w.id,
      label: `${w.name} (${rarityLetter(w.rarity)})`,
    }),
  );

  return (
    <Modal
      title={`W-Engines — ${agent.name}`}
      onClose={onClose}
      className="wengine-editor"
      bodyClassName="modal-body wengine-editor-body"
      footer={
        <button className="btn primary-action" onClick={onClose}>
          Done
        </button>
      }
    >
      <p className="tab-description">
        Rank the W-Engines you want for this agent, first choice on top.
      </p>
      <PreferenceChain
        variant="ranked-list"
        values={agent.wEnginePreferences}
        options={wengineOptions}
        namePrefix="pref-wengine"
        addLabel="+ Add W-Engine"
        onChange={onUpdatePreferences}
      />
    </Modal>
  );
}
