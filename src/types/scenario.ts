import type { Archetype, Position } from './player';
import type { Card } from './cards';

export interface VillainSeed {
  position: Position;
  archetype: Archetype;
  stack?: number; // bb, default 100
}

export interface ScenarioSeed {
  id: string;
  name: string;
  description: string;
  heroPosition: Position;
  heroCards?: Card[]; // If undefined, deal randomly
  communityCards?: Card[]; // Pre-set board
  villains: VillainSeed[];
  targetConcept: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
