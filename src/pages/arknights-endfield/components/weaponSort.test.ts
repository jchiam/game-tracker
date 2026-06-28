import { describe, expect, it } from 'vitest';
import type { AeWeapon } from '@/data/arknights-endfield/weapons';
import { sortWeaponsForDisplay } from './weaponSort';

describe('sortWeaponsForDisplay', () => {
  it('sorts by rarity descending then name ascending', () => {
    const weapons: AeWeapon[] = [
      { id: 'a', name: 'Zephyr', rarity: 4, type: 'Sword' },
      { id: 'b', name: 'Alpha', rarity: 6, type: 'Sword' },
      { id: 'c', name: 'Beta', rarity: 6, type: 'Sword' },
      { id: 'd', name: 'Gamma', rarity: 3, type: 'Sword' },
      { id: 'e', name: 'Arc', rarity: 4, type: 'Sword' },
    ];

    const sorted = sortWeaponsForDisplay(weapons);

    expect(sorted.map((w) => `${w.rarity}-${w.name}`)).toEqual([
      '6-Alpha',
      '6-Beta',
      '4-Arc',
      '4-Zephyr',
      '3-Gamma',
    ]);
  });

  it('does not mutate the input array', () => {
    const weapons: AeWeapon[] = [
      { id: 'a', name: 'B', rarity: 5, type: 'Polearm' },
      { id: 'b', name: 'A', rarity: 6, type: 'Polearm' },
    ];
    const original = [...weapons];

    sortWeaponsForDisplay(weapons);

    expect(weapons).toEqual(original);
  });

  it('returns empty array for empty input', () => {
    expect(sortWeaponsForDisplay([])).toEqual([]);
  });
});
