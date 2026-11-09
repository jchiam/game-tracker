import { describe, it, expect } from 'vitest';
import { resolvePartnerRank } from './partnerMatch';

describe('resolvePartnerRank', () => {
  it('returns the 0-based rank of the equipped Partner', () => {
    expect(resolvePartnerRank('zeta', ['akad', 'zeta', 'janet'])).toBe(1);
    expect(resolvePartnerRank('akad', ['akad'])).toBe(0);
  });

  it('returns null when no Partner is equipped', () => {
    expect(resolvePartnerRank(null, ['akad'])).toBeNull();
  });

  it('returns null when the equipped Partner is not preferred', () => {
    expect(resolvePartnerRank('zeta', ['akad', 'janet'])).toBeNull();
    expect(resolvePartnerRank('zeta', [])).toBeNull();
  });
});
