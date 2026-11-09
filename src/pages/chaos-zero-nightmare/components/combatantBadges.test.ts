import { describe, it, expect } from 'vitest';
import { formatEgo, getClassBadge, getElementBadge, getRarityBadge } from './combatantBadges';

describe('combatantBadges', () => {
  it('maps every known attribute to a lowercase modifier with the verbatim label', () => {
    for (const element of ['Passion', 'Order', 'Justice', 'Void', 'Instinct']) {
      expect(getElementBadge(element)).toEqual({ label: element, modifier: element.toLowerCase() });
    }
  });

  it('maps every known class to a lowercase modifier with the verbatim label', () => {
    for (const cls of ['Striker', 'Vanguard', 'Ranger', 'Hunter', 'Psionic', 'Controller']) {
      expect(getClassBadge(cls)).toEqual({ label: cls, modifier: cls.toLowerCase() });
    }
  });

  it('falls back to the neutral modifier for an unknown attribute or class, keeping the raw label', () => {
    expect(getElementBadge('Chaos')).toEqual({ label: 'Chaos', modifier: 'unknown' });
    expect(getClassBadge('Oracle')).toEqual({ label: 'Oracle', modifier: 'unknown' });
  });

  it('renders rarity 5 and 4 with star labels and numeric modifiers', () => {
    expect(getRarityBadge(5)).toEqual({ label: '5★', modifier: '5' });
    expect(getRarityBadge(4)).toEqual({ label: '4★', modifier: '4' });
  });

  it('renders an out-of-range rarity with the neutral modifier', () => {
    expect(getRarityBadge(3)).toEqual({ label: '3★', modifier: 'unknown' });
  });

  it('formats Manifest Ego ranks with the T prefix', () => {
    expect(formatEgo(0)).toBe('T0');
    expect(formatEgo(6)).toBe('T6');
  });
});
