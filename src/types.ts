import { type Character } from '@/data/honkai-star-rail/characters';
import { type EquippedRelic } from '@/data/honkai-star-rail/relics';
import { type Arcanist } from '@/data/reverse1999/arcanists';

export interface HsrTrackedCharacter extends Character {
  dbId?: string;
  isFavorited: boolean;
  level: number;
  tracesAttained: boolean;
  relics: {
    head: EquippedRelic | null;
    hands: EquippedRelic | null;
    body: EquippedRelic | null;
    feet: EquippedRelic | null;
    sphere: EquippedRelic | null;
    rope: EquippedRelic | null;
  };
  buildPreferences: {
    mainStats: {
      body: { stat: string; operator: string | null; orderIndex: number }[];
      feet: { stat: string; operator: string | null; orderIndex: number }[];
      sphere: { stat: string; operator: string | null; orderIndex: number }[];
      rope: { stat: string; operator: string | null; orderIndex: number }[];
    };
    subStats: { stat: string; operator: string | null; orderIndex: number }[];
    comments?: string;
  };
}

export interface HsrParty {
  id: string;
  profileId: string;
  name: string;
  notes: string | null;
  members: HsrPartyMember[];
  createdAt: string;
}

export interface HsrPartyMember {
  characterId: string;
  slotIndex: number;
}

export interface R1999TrackedArcanist extends Arcanist {
  dbId?: string;
  isFavorited: boolean;
  level: number;
  insightLevel: 0 | 1 | 2 | 3;
  portraitLevel: number; // 0–5 (varies by rarity: 6★=5, 5★=3, 4★=2, 3★=1)
  resonanceLevel: number; // 0–15 (recommended stop at 10 for max 7x7 grid)
  psychubeId: number | null; // reference to which Psychube is equipped (from psychubes.ts)
  psychubeLevel: number; // 0–30 (varies by Psychube rarity)
}
