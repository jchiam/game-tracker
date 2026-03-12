import { type Character } from './data/characters';
import { type EquippedRelic } from './data/relics';

export interface TrackedCharacter extends Character {
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
  }
}
