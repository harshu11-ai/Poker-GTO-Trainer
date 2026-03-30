import type { ScenarioSeed } from '@/types/scenario';

export const SCENARIO_SEEDS: ScenarioSeed[] = [
  {
    id: 'ip_cbet_dry',
    name: 'C-Betting in Position',
    description: 'You raised preflop from the BTN and got called. Practice c-betting on a dry board.',
    heroPosition: 'BTN',
    villains: [
      { position: 'BB', archetype: 'TAG' },
    ],
    targetConcept: 'C-betting dry boards in position',
    difficulty: 'BEGINNER',
  },
  {
    id: 'multiway_pot',
    name: 'Multiway Pot Dynamics',
    description: 'Three-way pot — learn when to bet and when to pot control.',
    heroPosition: 'CO',
    villains: [
      { position: 'BTN', archetype: 'TAG' },
      { position: 'BB', archetype: 'LOOSE_PASSIVE' },
    ],
    targetConcept: 'Multiway pot strategy',
    difficulty: 'INTERMEDIATE',
  },
  {
    id: 'preflop_3bet',
    name: '3-Bet Pot Dynamics',
    description: 'Navigate a 3-bet pot in position with a premium hand.',
    heroPosition: 'BTN',
    villains: [
      { position: 'CO', archetype: 'TAG' },
    ],
    targetConcept: '3-bet pot value betting and protection',
    difficulty: 'INTERMEDIATE',
  },
  {
    id: 'oop_defend',
    name: 'Defending the Big Blind',
    description: 'Face a steal from the BTN. Practice defending the BB with a range of hands.',
    heroPosition: 'BB',
    villains: [
      { position: 'BTN', archetype: 'LAG' },
    ],
    targetConcept: 'Big blind defense strategy',
    difficulty: 'BEGINNER',
  },
  {
    id: 'full_table',
    name: 'Full 6-Max Hand',
    description: 'A full 6-max hand with multiple players. Navigate from preflop to showdown.',
    heroPosition: 'HJ',
    villains: [
      { position: 'UTG', archetype: 'TIGHT_PASSIVE' },
      { position: 'CO', archetype: 'TAG' },
      { position: 'BTN', archetype: 'LAG' },
      { position: 'SB', archetype: 'LOOSE_PASSIVE' },
      { position: 'BB', archetype: 'TAG' },
    ],
    targetConcept: 'Full hand navigation in a 6-max game',
    difficulty: 'ADVANCED',
  },
];
