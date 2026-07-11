import { describe, it, expect } from 'vitest';
import { MAIN_STATS as HSR_MAIN, SUB_STATS as HSR_SUB } from './honkai-star-rail/relics';
import {
  CARTRIDGE_MAIN_STATS as N2E_MAIN,
  CARTRIDGE_SUB_STATS as N2E_SUB,
} from './neverness-to-everness/cartridge-stats';
import { MAIN_STATS as P5X_MAIN, SUB_STATS as P5X_SUB } from './persona-5-phantom-x/revelations';

// Pins every game's stat pools to their exact semantic order (Offensive → Defensive →
// Tempo → Supporting; flat before its percent). Ordering is explicit data — no classifier —
// so this test is a literal-array snapshot. If N2E regenerates and a new stat is unlisted it
// lands at the end and this pin fails, forcing manual placement. See the shared
// `Semantic stat-option ordering` requirement (shared-ui-components).

describe('semantic stat ordering — HSR', () => {
  it('SUB_STATS', () => {
    expect(HSR_SUB).toEqual([
      'ATK',
      'ATK%',
      'CRIT Rate',
      'CRIT DMG',
      'Break Effect',
      'HP',
      'HP%',
      'DEF',
      'DEF%',
      'Effect RES',
      'SPD',
      'Effect Hit Rate',
    ]);
  });

  it('MAIN_STATS per slot', () => {
    expect(HSR_MAIN.HEAD).toEqual(['HP']);
    expect(HSR_MAIN.HANDS).toEqual(['ATK']);
    expect(HSR_MAIN.BODY).toEqual([
      'ATK%',
      'CRIT Rate',
      'CRIT DMG',
      'HP%',
      'DEF%',
      'Outgoing Healing Boost',
      'Effect Hit Rate',
    ]);
    expect(HSR_MAIN.FEET).toEqual(['ATK%', 'HP%', 'DEF%', 'SPD']);
    expect(HSR_MAIN.SPHERE).toEqual([
      'ATK%',
      'Physical DMG Boost',
      'Fire DMG Boost',
      'Ice DMG Boost',
      'Lightning DMG Boost',
      'Wind DMG Boost',
      'Quantum DMG Boost',
      'Imaginary DMG Boost',
      'HP%',
      'DEF%',
    ]);
    expect(HSR_MAIN.ROPE).toEqual([
      'ATK%',
      'Break Effect',
      'HP%',
      'DEF%',
      'Energy Regeneration Rate',
    ]);
  });
});

describe('semantic stat ordering — N2E', () => {
  it('CARTRIDGE_SUB_STATS', () => {
    expect(N2E_SUB).toEqual([
      'ATK',
      'ATK%',
      'CRIT Rate',
      'CRIT DMG',
      'DMG%',
      'Break Intensity',
      'HP',
      'HP%',
      'DEF',
      'DEF%',
      'Cycle Intensity',
    ]);
  });

  it('CARTRIDGE_MAIN_STATS', () => {
    expect(N2E_MAIN).toEqual([
      'ATK%',
      'CRIT Rate',
      'CRIT DMG',
      'Cosmos DMG Bonus',
      'Anima DMG Bonus',
      'Incantation DMG Bonus',
      'Psyche DMG Bonus',
      'Chaos DMG Bonus',
      'Lakshana DMG Bonus',
      'Mental DMG Bonus',
      'Break Intensity',
      'HP%',
      'DEF%',
      'Cycle Intensity',
      'Healing Bonus',
    ]);
  });
});

describe('semantic stat ordering — P5X', () => {
  it('SUB_STATS (ids)', () => {
    expect(P5X_SUB).toEqual([
      'attack',
      'attack-pct',
      'crit-rate',
      'crit-mult',
      'damage-mult',
      'pierce-rate',
      'hp',
      'hp-pct',
      'defense',
      'defense-pct',
      'speed',
      'sp-recovery',
      'ailment-acc',
    ]);
  });

  it('MAIN_STATS per slot (ids)', () => {
    expect(P5X_MAIN.SUN).toEqual(['hp']);
    expect(P5X_MAIN.MOON).toEqual([
      'attack-pct',
      'damage-mult',
      'hp-pct',
      'defense-pct',
      'hp-recovery',
    ]);
    expect(P5X_MAIN.STAR).toEqual([
      'attack-pct',
      'crit-rate',
      'crit-mult',
      'hp-pct',
      'defense-pct',
      'ailment-acc',
    ]);
    expect(P5X_MAIN.SKY).toEqual(['attack-pct', 'hp-pct', 'defense-pct', 'speed', 'sp-recovery']);
    expect(P5X_MAIN.SPACE).toEqual(['attack', 'defense']);
  });
});
