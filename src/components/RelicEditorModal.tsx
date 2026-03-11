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
              onChange={e => onSave({...currentRelic, setId: e.target.value})}
            >
              <option value="">-- No Set --</option>
              {availableRelicSets.map(set => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Main Stat</label>
            <select 
              value={currentRelic.mainStat || ''} 
              onChange={e => onSave({...currentRelic, mainStat: e.target.value})}
            >
              <option value="">-- No Main Stat --</option>
              {['HP', 'ATK', 'HP%', 'ATK%', 'DEF%', 'CRIT Rate', 'CRIT DMG', 'SPD', 'Break Effect', 'Energy Regeneration Rate', 'Lightning DMG Boost'].map(stat => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
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
                    onSave({...currentRelic, subStats: newSubs});
                  }}
                >
                  <option value="">- Stat -</option>
                  {['HP', 'ATK', 'DEF', 'HP%', 'ATK%', 'DEF%', 'SPD', 'CRIT Rate', 'CRIT DMG', 'Effect Hit Rate', 'Effect RES', 'Break Effect'].map(s => (
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
                    onSave({...currentRelic, subStats: newSubs});
                  }}
                />
                <button className="remove-substat" onClick={() => {
                  const newSubs = currentRelic.subStats.filter((_, i) => i !== idx);
                  onSave({...currentRelic, subStats: newSubs});
                }}>✕</button>
              </div>
            ))}
            
            {currentRelic.subStats.length < 4 && (
              <button 
                className="add-substat-btn"
                onClick={() => onSave({...currentRelic, subStats: [...currentRelic.subStats, {type: 'CRIT Rate', value: '2.5%'}]})}
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
