import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./relicScoring', () => ({
  calculateRelicScore: vi.fn(),
}));

import { calculateBuildScore } from './buildScore';
import { calculateRelicScore } from './relicScoring';
import type { HsrTrackedCharacter } from '../types';

const mockRelicScore = vi.mocked(calculateRelicScore);

const getBaseCharacter = (): HsrTrackedCharacter => ({
  id: 'test',
  name: 'Test Character',
  element: 'Fire',
  path: 'Destruction',
  imageUrl: '',
  isFavorited: false,
  level: 80,
  tracesAttained: true,
  lightConeId: null,
  lightConeLevel: 1,
  lightConeSuperimposition: 1,
  lightConePreferences: [],
  relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
  buildPreferences: {
    mainStats: { body: [], feet: [], sphere: [], rope: [] },
    subStats: [],
  },
});

describe('calculateBuildScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blends both sides when cone preferences and relic score are active', () => {
    const char = getBaseCharacter();
    char.lightConePreferences = ['cone-a', 'cone-b'];
    char.lightConeId = 'cone-a';
    mockRelicScore.mockReturnValue(80);
    // 0.25 × 1.0 + 0.75 × 0.80 = 0.85
    expect(calculateBuildScore(char)).toBeCloseTo(85);
  });

  it('passes the relic score through unchanged when the cone preference list is empty', () => {
    const char = getBaseCharacter();
    char.lightConeId = 'cone-x'; // equipped cone irrelevant without preferences
    mockRelicScore.mockReturnValue(80);
    expect(calculateBuildScore(char)).toBe(80);
  });

  it('scores from the cone side alone when the relic score is -1', () => {
    const char = getBaseCharacter();
    char.lightConePreferences = ['cone-a'];
    char.lightConeId = 'cone-a';
    mockRelicScore.mockReturnValue(-1);
    expect(calculateBuildScore(char)).toBe(100);
  });

  it('steps the cone term down 0.25 per rank with a 0.25 floor', () => {
    const char = getBaseCharacter();
    char.lightConePreferences = ['c1', 'c2', 'c3', 'c4', 'c5'];
    mockRelicScore.mockReturnValue(-1);
    const scoreFor = (id: string) => {
      char.lightConeId = id;
      return calculateBuildScore(char);
    };
    expect(scoreFor('c1')).toBeCloseTo(100);
    expect(scoreFor('c2')).toBeCloseTo(75);
    expect(scoreFor('c3')).toBeCloseTo(50);
    expect(scoreFor('c4')).toBeCloseTo(25);
    expect(scoreFor('c5')).toBeCloseTo(25); // floor
  });

  it('is independent of preference-list length for the same rank', () => {
    const short = getBaseCharacter();
    short.lightConePreferences = ['c1', 'c2'];
    short.lightConeId = 'c2';
    const long = getBaseCharacter();
    long.lightConePreferences = ['c1', 'c2', 'c3', 'c4', 'c5'];
    long.lightConeId = 'c2';
    mockRelicScore.mockReturnValue(-1);
    expect(calculateBuildScore(short)).toBeCloseTo(75);
    expect(calculateBuildScore(long)).toBeCloseTo(75);
  });

  it('scores an off-build equipped cone as 0 on the cone side', () => {
    const char = getBaseCharacter();
    char.lightConePreferences = ['cone-a'];
    char.lightConeId = 'cone-z';
    mockRelicScore.mockReturnValue(80);
    // 0.25 × 0 + 0.75 × 0.80 = 0.60
    expect(calculateBuildScore(char)).toBeCloseTo(60);
  });

  it('scores no equipped cone as 0 on the cone side', () => {
    const char = getBaseCharacter();
    char.lightConePreferences = ['cone-a'];
    char.lightConeId = null;
    mockRelicScore.mockReturnValue(100);
    expect(calculateBuildScore(char)).toBeCloseTo(75);
  });

  it('ignores cone level and superimposition', () => {
    const s1 = getBaseCharacter();
    s1.lightConePreferences = ['cone-a'];
    s1.lightConeId = 'cone-a';
    s1.lightConeLevel = 1;
    s1.lightConeSuperimposition = 1;
    const s5 = getBaseCharacter();
    s5.lightConePreferences = ['cone-a'];
    s5.lightConeId = 'cone-a';
    s5.lightConeLevel = 80;
    s5.lightConeSuperimposition = 5;
    mockRelicScore.mockReturnValue(50);
    expect(calculateBuildScore(s1)).toBe(calculateBuildScore(s5));
  });

  it('returns -1 only when both sides are inactive', () => {
    const char = getBaseCharacter();
    mockRelicScore.mockReturnValue(-1);
    expect(calculateBuildScore(char)).toBe(-1);
  });

  it('returns 0 (not -1) when cone preferences are declared but gear misses', () => {
    const char = getBaseCharacter();
    char.lightConePreferences = ['cone-a'];
    char.lightConeId = 'cone-z'; // off-build
    mockRelicScore.mockReturnValue(-1);
    expect(calculateBuildScore(char)).toBe(0);
  });
});
