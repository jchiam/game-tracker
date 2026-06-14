import { type Character } from '@/data/honkai-star-rail/characters';
import { type EquippedRelic } from '@/data/honkai-star-rail/relics';
import { type Arcanist } from '@/data/reverse1999/arcanists';
import { type N2ECharacter } from '@/data/neverness-to-everness/characters';

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

/** Typed partial update for an HSR tracked character row (camelCase keys). */
export interface HsrCharacterPatch {
  level?: number;
  tracesAttained?: boolean;
  isFavorited?: boolean;
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
  portraitLevel: number; // 0–5 (varies by rarity: 6★=5, 5★=3, 4★=2, 3★=1)
  resonanceLevel: number; // 0–15 (recommended stop at 10 for max 7x7 grid)
  euphoriaStage: number; // 0–4 (post-v2.0 "E" system upgrade stages)
  psychubeName: string | null; // name of equipped Psychube — stable key (from psychubes.ts)
  psychubeLevel: number; // 1–60
  psychubeAmplification: number; // 1–5 (A1–A5)
}

/** Typed partial update for an R1999 tracked arcanist row (camelCase keys). */
export interface R1999ArcanistPatch {
  level?: number;
  portraitLevel?: number;
  resonanceLevel?: number;
  euphoriaStage?: number;
  psychubeName?: string | null;
  psychubeLevel?: number;
  psychubeAmplification?: number;
  isFavorited?: boolean;
}

export interface R1999Party {
  id: string;
  profileId: string;
  name: string;
  notes: string | null;
  tier: string | null;
  isFavorited: boolean;
  members: R1999PartyMember[];
  createdAt: string;
}

export interface R1999PartyMember {
  arcanistId: string;
  slotIndex: number; // 0–3
}

export interface N2ETrackedCharacter extends N2ECharacter {
  dbId?: string;
  isFavorited: boolean;
  level: number;
  awakening: boolean[]; // 6 individual toggle slots
  resonanceCount: number; // 0–6
  arcId: string | null;
  arcLevel: number;
  arcTier: number; // 1–5 (T1–T5)
  cartridgeRarity: string | null; // 'B' | 'A' | 'S'
  cartridgeLevel: number; // 0–20
  cartridgeMainStat: string | null;
  cartridgeSubStats: string[]; // up to 4 stat type strings
  cartridgePreferences: {
    mainStats: { stat: string; operator: string | null; orderIndex: number }[];
    subStats: { stat: string; operator: string | null; orderIndex: number }[];
    comments?: string;
  };
}

/** Typed partial update for an N2E tracked character row (camelCase keys). */
export interface N2ECharacterPatch {
  level?: number;
  awakening?: boolean[];
  resonanceCount?: number;
  arcId?: string | null;
  arcLevel?: number;
  arcTier?: number;
  cartridgeRarity?: string | null;
  cartridgeLevel?: number;
  cartridgeMainStat?: string | null;
  cartridgeSubStats?: string[];
  isFavorited?: boolean;
}

export interface N2EParty {
  id: string;
  profileId: string;
  name: string;
  notes: string | null;
  tier: string | null;
  isFavorited: boolean;
  members: N2EPartyMember[];
  createdAt: string;
}

export interface N2EPartyMember {
  characterId: string;
  slotIndex: number; // 0–3
}
