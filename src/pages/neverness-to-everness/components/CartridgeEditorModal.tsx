import { useState } from 'react';
import type { N2ETrackedCharacter } from '@/types';
import {
  CARTRIDGE_MAIN_STATS,
  CARTRIDGE_SUB_STATS,
  CARTRIDGE_RARITIES,
} from '@/data/neverness-to-everness/cartridge-stats';
import { Modal } from '@/components/Modal';
import { PreferenceChain } from '@/components/PreferenceChain';
import './CartridgeEditorModal.css';

interface CartridgeEditorModalProps {
  character: N2ETrackedCharacter;
  onSaveCartridge: (
    rarity: string | null,
    level: number,
    mainStat: string | null,
    subStats: string[],
  ) => void;
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

  const currentRarity = character.cartridgeRarity;
  const currentLevel = character.cartridgeLevel;
  const currentMainStat = character.cartridgeMainStat;
  const currentSubStats = character.cartridgeSubStats;

  const currentPrefs = character.cartridgePreferences || {
    mainStats: [],
    subStats: [],
    comments: '',
  };

  // ─── Equip tab helpers ──────────────────────────────────────────

  const handleUnequip = () => {
    onSaveCartridge(null, 0, null, []);
  };

  // ─── Preferences tab helpers ────────────────────────────────────

  const addMainStatPref = () => {
    const newPrefs = { ...currentPrefs };
    const arr = [...newPrefs.mainStats];
    if (arr.length > 0) arr[arr.length - 1].operator = '>';
    arr.push({ stat: CARTRIDGE_MAIN_STATS[0], operator: null, orderIndex: arr.length });
    newPrefs.mainStats = arr;
    onSavePreferences(newPrefs);
  };

  const updateMainStatPref = (
    idx: number,
    updates: Partial<(typeof currentPrefs.mainStats)[0]>,
  ) => {
    const newPrefs = { ...currentPrefs };
    newPrefs.mainStats = [...newPrefs.mainStats];
    newPrefs.mainStats[idx] = { ...newPrefs.mainStats[idx], ...updates };
    onSavePreferences(newPrefs);
  };

  const removeMainStatPref = (idx: number) => {
    const newPrefs = { ...currentPrefs };
    const arr = [...newPrefs.mainStats];
    arr.splice(idx, 1);
    if (arr.length > 0) arr[arr.length - 1].operator = null;
    newPrefs.mainStats = arr;
    onSavePreferences(newPrefs);
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
            <div className="form-group">
              <label>Rarity</label>
              <select
                name="cartridge-rarity"
                value={currentRarity || ''}
                onChange={(e) =>
                  onSaveCartridge(
                    e.target.value || null,
                    currentLevel,
                    currentMainStat,
                    currentSubStats,
                  )
                }
              >
                <option value="">-- No Rarity --</option>
                {CARTRIDGE_RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Main Stat</label>
              <select
                name="cartridge-main-stat"
                value={currentMainStat || ''}
                onChange={(e) =>
                  onSaveCartridge(
                    currentRarity,
                    currentLevel,
                    e.target.value || null,
                    currentSubStats,
                  )
                }
              >
                <option value="">-- No Main Stat --</option>
                {CARTRIDGE_MAIN_STATS.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Level</label>
              <div className="level-slider-row">
                <input
                  type="range"
                  name="cartridge-level"
                  min="0"
                  max="20"
                  value={currentLevel}
                  onChange={(e) =>
                    onSaveCartridge(
                      currentRarity,
                      parseInt(e.target.value),
                      currentMainStat,
                      currentSubStats,
                    )
                  }
                  className="cartridge-level-slider"
                  style={{
                    background: `linear-gradient(to right, var(--color-brand-primary) ${(currentLevel / 20) * 100}%, rgba(255,255,255,0.1) ${(currentLevel / 20) * 100}%)`,
                  }}
                />
                <span className="level-value">{currentLevel}</span>
              </div>
            </div>

            <div className="substats-section">
              <label>Sub Stats (Max 4)</label>
              {currentSubStats.map((sub, idx) => (
                <div key={idx} className="substat-row">
                  <select
                    name={`substat-type-${idx}`}
                    value={sub}
                    onChange={(e) => {
                      const newSubs = [...currentSubStats];
                      newSubs[idx] = e.target.value;
                      onSaveCartridge(currentRarity, currentLevel, currentMainStat, newSubs);
                    }}
                  >
                    <option value="">- Stat -</option>
                    {CARTRIDGE_SUB_STATS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    className="remove-substat"
                    onClick={() => {
                      const newSubs = currentSubStats.filter((_, i) => i !== idx);
                      onSaveCartridge(currentRarity, currentLevel, currentMainStat, newSubs);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {currentSubStats.length < 4 && (
                <button
                  className="add-substat-btn"
                  onClick={() => {
                    const defaultStat = CARTRIDGE_SUB_STATS[0];
                    onSaveCartridge(currentRarity, currentLevel, currentMainStat, [
                      ...currentSubStats,
                      defaultStat,
                    ]);
                  }}
                >
                  + Add Sub Stat
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="preferences-tab">
            <p className="tab-description">
              Define the ideal cartridge stats for {character.name}.
            </p>

            <div className="pref-section">
              <h3>Main Stat Priority</h3>
              <div className="pref-chain">
                {currentPrefs.mainStats.map((pref, idx) => (
                  <div key={idx} className="pref-item">
                    <select
                      name={`pref-main-stat-${idx}`}
                      value={pref.stat}
                      onChange={(e) => updateMainStatPref(idx, { stat: e.target.value })}
                    >
                      {CARTRIDGE_MAIN_STATS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {idx < currentPrefs.mainStats.length - 1 ? (
                      <select
                        name={`pref-main-stat-operator-${idx}`}
                        className="operator-select"
                        value={pref.operator || '>'}
                        onChange={(e) => updateMainStatPref(idx, { operator: e.target.value })}
                      >
                        <option value=">">&gt;</option>
                        <option value=">=">&ge;</option>
                        <option value="OR">OR</option>
                      </select>
                    ) : (
                      <button className="remove-pref-btn" onClick={() => removeMainStatPref(idx)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="add-pref-btn" onClick={addMainStatPref}>
                + Add Priority
              </button>
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
              <h3>Build Comments</h3>
              <textarea
                className="build-comments-textarea"
                placeholder="Additional notes about this cartridge build..."
                value={currentPrefs.comments || ''}
                onChange={(e) => {
                  const newPrefs = { ...currentPrefs, comments: e.target.value };
                  onSavePreferences(newPrefs);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
