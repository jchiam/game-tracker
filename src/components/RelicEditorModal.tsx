import { type TrackedCharacter } from '../types';
import { type RelicSet, type EquippedRelic } from '../data/relics';
import './Modal.css';
import './RelicEditorModal.css';

interface RelicEditorModalProps {
  char: TrackedCharacter;
  slot: keyof TrackedCharacter['relics'];
  availableRelicSets: RelicSet[];
  emptyRelic: EquippedRelic;
  onSave: (relicData: EquippedRelic) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function RelicEditorModal({
  char,
  slot,
  availableRelicSets,
  emptyRelic,
  onSave,
  onRemove,
  onClose,
}: RelicEditorModalProps) {
  const currentRelic = char.relics[slot] || emptyRelic;

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relic-editor" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {slot.charAt(0).toUpperCase() + slot.slice(1)}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="relic-editor-body">
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

        </div>

        <div className="modal-footer">
          <button className="secondary-action danger" onClick={onRemove}>Un-equip Relic</button>
          <button className="primary-action" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
