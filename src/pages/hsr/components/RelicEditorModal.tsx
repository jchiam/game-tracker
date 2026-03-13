import { useState } from 'react';
import type { TrackedCharacter } from '@/types';
import type { RelicSet, EquippedRelic } from '@/data/relics';
import './Modal.css';
import './RelicEditorModal.css';

interface RelicEditorModalProps {
  char: TrackedCharacter;
  slot: keyof TrackedCharacter['relics'];
  availableRelicSets: RelicSet[];
  emptyRelic: EquippedRelic;
  onSave: (relicData: EquippedRelic) => void;
  onRemove: () => void;
  onUpdateBuildPreferences: (newPrefs: TrackedCharacter['buildPreferences']) => void;
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
  const currentPrefs = char.buildPreferences || { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] };

  const validMainStats: Record<string, string[]> = {
    head: ['HP'],
    hands: ['ATK'],
    body: ['HP%', 'DEF%', 'ATK%', 'CRIT Rate', 'CRIT DMG', 'Effect Hit Rate', 'Outgoing Healing Boost'],
    feet: ['HP%', 'DEF%', 'ATK%', 'SPD'],
    sphere: ['HP%', 'DEF%', 'ATK%', 'Physical DMG Boost', 'Fire DMG Boost', 'Ice DMG Boost', 'Lightning DMG Boost', 'Wind DMG Boost', 'Quantum DMG Boost', 'Imaginary DMG Boost'],
    rope: ['HP%', 'DEF%', 'ATK%', 'Break Effect', 'Energy Regeneration Rate']
  };

  const allSubStats = [
    'HP', 'HP%', 
    'DEF', 'DEF%', 
    'ATK', 'ATK%', 
    'SPD', 'CRIT Rate', 'CRIT DMG', 
    'Break Effect', 'Effect Hit Rate', 'Effect RES'
  ];

  const validateAndSave = (updates: Partial<EquippedRelic>) => {
    let newRelic = { ...currentRelic, ...updates };

    // Enforce fixed Main Stats
    if (slot === 'head') newRelic.mainStat = 'HP';
    if (slot === 'hands') newRelic.mainStat = 'ATK';

    // Prune conflicting Substats
    if (newRelic.mainStat) {
      newRelic.subStats = newRelic.subStats.filter(sub => sub.type !== newRelic.mainStat);
    }
    
    onSave(newRelic);
  };

  const addMainStatPref = () => {
    if (slot === 'head' || slot === 'hands') return;
    const newPrefs = { ...currentPrefs };
    const arr = [...newPrefs.mainStats[slot]];
    if (arr.length > 0) arr[arr.length - 1].operator = '>';
    arr.push({ stat: validMainStats[slot][0], operator: null, orderIndex: arr.length });
    newPrefs.mainStats[slot] = arr;
    onUpdateBuildPreferences(newPrefs);
  };

  const updateMainStatPref = (idx: number, updates: Partial<typeof currentPrefs.mainStats['body'][0]>) => {
    if (slot === 'head' || slot === 'hands') return;
    const newPrefs = { ...currentPrefs };
    newPrefs.mainStats[slot][idx] = { ...newPrefs.mainStats[slot][idx], ...updates };
    onUpdateBuildPreferences(newPrefs);
  };

  const removeMainStatPref = (idx: number) => {
    if (slot === 'head' || slot === 'hands') return;
    const newPrefs = { ...currentPrefs };
    newPrefs.mainStats[slot].splice(idx, 1);
    if (newPrefs.mainStats[slot].length > 0) newPrefs.mainStats[slot][newPrefs.mainStats[slot].length - 1].operator = null;
    onUpdateBuildPreferences(newPrefs);
  };

  const addSubStatPref = () => {
    const newPrefs = { ...currentPrefs };
    const arr = [...newPrefs.subStats];
    if (arr.length > 0) arr[arr.length - 1].operator = '>';
    arr.push({ stat: allSubStats[0], operator: null, orderIndex: arr.length });
    newPrefs.subStats = arr;
    onUpdateBuildPreferences(newPrefs);
  };

  const updateSubStatPref = (idx: number, updates: Partial<typeof currentPrefs.subStats[0]>) => {
    const newPrefs = { ...currentPrefs };
    newPrefs.subStats[idx] = { ...newPrefs.subStats[idx], ...updates };
    onUpdateBuildPreferences(newPrefs);
  };

  const removeSubStatPref = (idx: number) => {
    const newPrefs = { ...currentPrefs };
    newPrefs.subStats.splice(idx, 1);
    if (newPrefs.subStats.length > 0) newPrefs.subStats[newPrefs.subStats.length - 1].operator = null;
    onUpdateBuildPreferences(newPrefs);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relic-editor" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {slot.charAt(0).toUpperCase() + slot.slice(1)}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button className={`tab-btn ${activeTab === 'equip' ? 'active' : ''}`} onClick={() => setActiveTab('equip')}>Equip Relic</button>
          <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>Build Preferences</button>
        </div>
        
        <div className="relic-editor-body">
          {activeTab === 'equip' ? (
            <>
          <div className="form-group">
            <label>Relic Set</label>
            <select 
              value={currentRelic.setId || ''} 
              onChange={e => validateAndSave({ setId: e.target.value })}
            >
              <option value="">-- No Set --</option>
              {availableRelicSets
                .filter(set => {
                  if (slot === 'sphere' || slot === 'rope') {
                    return set.id.startsWith('3');
                  } else {
                    return set.id.startsWith('1');
                  }
                })
                .map(set => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Main Stat</label>
            {(slot === 'head' || slot === 'hands') ? (
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
                {slot === 'head' ? 'HP' : 'ATK'} (Fixed)
              </div>
            ) : (
              <select 
                value={currentRelic.mainStat || ''} 
                onChange={e => validateAndSave({ mainStat: e.target.value })}
              >
                <option value="">-- No Main Stat --</option>
                {validMainStats[slot].map(stat => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="substats-section">
            <label>Substats (Max 4)</label>
            {currentRelic.subStats.map((sub, idx) => (
              <div key={idx} className="substat-row">
                <select 
                  value={sub.type} 
                  onChange={e => {
                    const newSubs = [...currentRelic.subStats];
                    newSubs[idx] = { ...newSubs[idx], type: e.target.value };
                    validateAndSave({ subStats: newSubs });
                  }}
                >
                  <option value="">- Stat -</option>
                  {allSubStats
                    .filter(s => s !== currentRelic.mainStat || (slot === 'head' && s === 'HP') || (slot === 'hands' && s === 'ATK')) // Allow raw versions if main stat matches but type differs, wait actually HP == HP so block it.
                    .filter(s => s !== currentRelic.mainStat)
                    .map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Value" 
                  value={sub.value} 
                  onChange={e => {
                    const newSubs = [...currentRelic.subStats];
                    newSubs[idx] = { ...newSubs[idx], value: e.target.value };
                    validateAndSave({ subStats: newSubs });
                  }}
                />
                <button className="remove-substat" onClick={() => {
                  const newSubs = currentRelic.subStats.filter((_, i) => i !== idx);
                  validateAndSave({ subStats: newSubs });
                }}>✕</button>
              </div>
            ))}
            
            {currentRelic.subStats.length < 4 && (
              <button 
                className="add-substat-btn"
                onClick={() => Object.assign(() => {
                  const defaultSafeStat = allSubStats.find(s => s !== currentRelic.mainStat) || 'CRIT Rate';
                  validateAndSave({ subStats: [...currentRelic.subStats, {type: defaultSafeStat, value: '2.5%'}] });
                })()}
              >
                + Add Substat
              </button>
            )}
          </div>

          </>
          ) : (
            <div className="preferences-tab">
              <p className="tab-description">Define the ideal stats you want to roll for this character.</p>
              
              {(slot !== 'head' && slot !== 'hands') && (
                <div className="pref-section">
                  <h3>Preferred Main Stat ({slot.charAt(0).toUpperCase() + slot.slice(1)})</h3>
                  <div className="pref-chain">
                    {currentPrefs.mainStats[slot].map((pref, idx) => (
                      <div key={idx} className="pref-item">
                        <select value={pref.stat} onChange={e => updateMainStatPref(idx, { stat: e.target.value })}>
                          {validMainStats[slot].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {idx < currentPrefs.mainStats[slot].length - 1 ? (
                          <select className="operator-select" value={pref.operator || '>'} onChange={e => updateMainStatPref(idx, { operator: e.target.value })}>
                            <option value=">">&gt;</option>
                            <option value=">=">&ge;</option>
                            <option value="OR">OR</option>
                          </select>
                        ) : (
                          <button className="remove-pref-btn" onClick={() => removeMainStatPref(idx)}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="add-pref-btn" onClick={addMainStatPref}>+ Add Priority</button>
                </div>
              )}

              <div className="pref-section">
                <h3>Preferred Substats (Global)</h3>
                <div className="pref-chain">
                  {currentPrefs.subStats.map((pref, idx) => (
                    <div key={idx} className="pref-item">
                      <select value={pref.stat} onChange={e => updateSubStatPref(idx, { stat: e.target.value })}>
                        {allSubStats.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {idx < currentPrefs.subStats.length - 1 ? (
                        <select className="operator-select" value={pref.operator || '>'} onChange={e => updateSubStatPref(idx, { operator: e.target.value })}>
                          <option value=">">&gt;</option>
                          <option value=">=">&ge;</option>
                          <option value="OR">OR</option>
                        </select>
                      ) : (
                        <button className="remove-pref-btn" onClick={() => removeSubStatPref(idx)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="add-pref-btn" onClick={addSubStatPref}>+ Add Priority</button>
              </div>

              <div className="pref-section">
                <h3>Build Comments</h3>
                <textarea 
                  className="build-comments-textarea"
                  placeholder="Additional notes about this build..."
                  value={currentPrefs.comments || ''}
                  onChange={e => {
                    const newPrefs = { ...currentPrefs, comments: e.target.value };
                    onUpdateBuildPreferences(newPrefs);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {activeTab === 'equip' && <button className="secondary-action danger" onClick={onRemove}>Un-equip Relic</button>}
          <button className="primary-action" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
