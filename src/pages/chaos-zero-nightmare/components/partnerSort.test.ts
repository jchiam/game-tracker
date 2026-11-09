import { describe, it, expect } from 'vitest';
import { sortPartnersForDisplay } from './partnerSort';
import type { CznPartner } from '@/data/chaos-zero-nightmare/partners';

const partner = (id: string, name: string, rarity: 3 | 4 | 5): CznPartner => ({
  id,
  name,
  rarity,
  class: 'Striker',
  faction: null,
  imageUrl: `/assets/chaos-zero-nightmare/partners/${id}.webp`,
});

describe('sortPartnersForDisplay', () => {
  it('orders by rarity descending, then name ascending', () => {
    const input = [
      partner('douglas', 'Douglas', 3),
      partner('zeta', 'Zeta', 5),
      partner('lilian', 'Lilian', 4),
      partner('asteria', 'Asteria', 5),
    ];
    expect(sortPartnersForDisplay(input).map((p) => p.id)).toEqual([
      'asteria',
      'zeta',
      'lilian',
      'douglas',
    ]);
  });

  it('does not mutate the input', () => {
    const input = [partner('zeta', 'Zeta', 5), partner('asteria', 'Asteria', 5)];
    const snapshot = [...input];
    sortPartnersForDisplay(input);
    expect(input).toEqual(snapshot);
  });
});
