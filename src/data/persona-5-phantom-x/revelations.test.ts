import { describe, it, expect } from 'vitest';
import {
  MAIN_STATS,
  SUB_STATS,
  STAT_LABELS,
  FIXED_MAIN_SLOTS,
  statLabel,
  toStatOptions,
} from './revelations';

describe('P5X revelation stat catalog — id/label decoupling', () => {
  it('every main and sub id resolves to a verbatim in-game label', () => {
    const allIds = new Set<string>([...SUB_STATS, ...Object.values(MAIN_STATS).flat()]);
    for (const id of allIds) {
      expect(STAT_LABELS[id], `missing label for ${id}`).toBeTruthy();
    }
  });

  it('labels use no build-guide shorthand', () => {
    for (const label of Object.values(STAT_LABELS)) {
      expect(label).not.toMatch(/Multiplier|DMG|Accuracy|\bATK\b|\bDEF\b/);
    }
  });

  it('uses the game abbreviations (Mult., Acc.) and the pinned strings', () => {
    expect(STAT_LABELS['damage-mult']).toBe('Damage Mult. +');
    expect(STAT_LABELS['crit-mult']).toBe('Crit Mult.');
    expect(STAT_LABELS['ailment-acc']).toBe('Ailment Acc.');
    expect(STAT_LABELS['attack-pct']).toBe('Attack%');
    expect(STAT_LABELS['attack']).toBe('Attack');
  });

  it('has 13 substats, with a single multiplier and no Attack Mult.', () => {
    expect(SUB_STATS).toHaveLength(13);
    const labels = SUB_STATS.map(statLabel);
    expect(labels).toContain('Damage Mult. +');
    expect(labels).not.toContain('Attack Mult.');
    // Flat and percent variants stay distinct.
    expect(labels).toContain('Attack');
    expect(labels).toContain('Attack%');
  });

  it('Sun and Space are the fixed-main slots; Space has two fixed mains', () => {
    expect(FIXED_MAIN_SLOTS).toEqual(['sun', 'space']);
    expect(MAIN_STATS.SUN).toEqual(['hp']);
    expect(MAIN_STATS.SPACE).toEqual(['attack', 'defense']);
  });

  it('toStatOptions maps ids to { value, label } pairs', () => {
    expect(toStatOptions(['damage-mult', 'crit-rate'])).toEqual([
      { value: 'damage-mult', label: 'Damage Mult. +' },
      { value: 'crit-rate', label: 'Crit Rate' },
    ]);
  });

  it('statLabel falls back to the raw id when unknown', () => {
    expect(statLabel('not-a-stat')).toBe('not-a-stat');
  });
});
