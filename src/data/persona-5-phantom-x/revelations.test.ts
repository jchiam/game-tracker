import { describe, it, expect } from 'vitest';
import {
  MAIN_STATS,
  SUB_STATS,
  STAT_LABELS,
  FIXED_MAIN_SLOTS,
  REVELATION_SLOTS,
  HEAVENS_SLOTS,
  statLabel,
  toStatOptions,
  getRevelationSummary,
} from './revelations';
import type { EquippedRevelation, RevelationSlot } from './revelations';

const card = (setId: string): EquippedRevelation => ({ setId, mainStat: null, subStats: [] });

const revels = (
  partial: Partial<Record<RevelationSlot, EquippedRevelation | null>>,
): Record<RevelationSlot, EquippedRevelation | null> => ({
  sun: null,
  moon: null,
  star: null,
  sky: null,
  space: null,
  ...partial,
});

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

describe('REVELATION_SLOTS ordering', () => {
  it('is space-first', () => {
    expect(REVELATION_SLOTS).toEqual(['space', 'sun', 'moon', 'star', 'sky']);
  });

  it('HEAVENS_SLOTS is unchanged (independent of display order)', () => {
    expect(HEAVENS_SLOTS).toEqual(['sun', 'moon', 'star', 'sky']);
  });
});

describe('getRevelationSummary', () => {
  it('reports a 4-card Heavens set at 4pc', () => {
    const summary = getRevelationSummary(
      revels({ sun: card('power'), moon: card('power'), star: card('power'), sky: card('power') }),
    );
    expect(summary.spaceSet).toBeNull();
    expect(summary.heavensBonuses).toEqual([{ id: 'power', name: 'Power', pieces: 4 }]);
  });

  it('reports a 2pc+2pc split lossless, ordered by name', () => {
    const summary = getRevelationSummary(
      revels({ sun: card('power'), moon: card('power'), star: card('peace'), sky: card('peace') }),
    );
    expect(summary.heavensBonuses).toEqual([
      { id: 'peace', name: 'Peace', pieces: 2 },
      { id: 'power', name: 'Power', pieces: 2 },
    ]);
  });

  it('treats a 3-card set as 2pc and omits the single leftover', () => {
    const summary = getRevelationSummary(
      revels({ sun: card('power'), moon: card('power'), star: card('power'), sky: card('peace') }),
    );
    expect(summary.heavensBonuses).toEqual([{ id: 'power', name: 'Power', pieces: 2 }]);
  });

  it('resolves the space set independently of Heavens bonuses', () => {
    const summary = getRevelationSummary(
      revels({ space: card('meditation'), sun: card('power'), moon: card('power') }),
    );
    expect(summary.spaceSet).toEqual({ id: 'meditation', name: 'Meditation' });
    expect(summary.heavensBonuses).toEqual([{ id: 'power', name: 'Power', pieces: 2 }]);
  });

  it('returns empty when only single-card sets and no space set', () => {
    const summary = getRevelationSummary(
      revels({ sun: card('power'), moon: card('peace'), star: card('strife') }),
    );
    expect(summary.spaceSet).toBeNull();
    expect(summary.heavensBonuses).toEqual([]);
  });
});
