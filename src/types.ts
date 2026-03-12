import { type Character } from './data/characters';
import { type EquippedRelic } from './data/relics';

export interface TrackedCharacter extends Character {
  dbId?: string;
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
}
