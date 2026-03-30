import type { Archetype } from '@/types/player';

export interface ArchetypeProfile {
  name: string;
  description: string;
  cBetFrequencyIP: number;   // 0-1: how often c-bets in position
  cBetFrequencyOOP: number;  // 0-1: how often c-bets out of position
  foldToCBetIP: number;      // how often folds to c-bet when in position
  foldToCBetOOP: number;     // how often folds to c-bet when out of position
  checkRaiseFrequency: number;
  bluffFrequency: number;
  valueBetThreshold: number; // 0-1: min normalized hand strength to value bet
  foldEquityThreshold: number; // min estimated fold equity to bluff
  betSizingFactor: number;   // multiplier on base bet size (0.7 = smaller, 1.3 = bigger)
  callThresholdAdjustment: number; // added to pot odds before calling (positive = looser)
}

export const ARCHETYPE_PROFILES: Record<Archetype, ArchetypeProfile> = {
  TAG: {
    name: 'Tight-Aggressive',
    description: 'Opens a solid range, bets and raises with purpose, folds marginal hands to aggression.',
    cBetFrequencyIP: 0.65,
    cBetFrequencyOOP: 0.45,
    foldToCBetIP: 0.40,
    foldToCBetOOP: 0.50,
    checkRaiseFrequency: 0.12,
    bluffFrequency: 0.22,
    valueBetThreshold: 0.20, // bets PAIR or better
    foldEquityThreshold: 0.40,
    betSizingFactor: 1.0,
    callThresholdAdjustment: 0.06, // calls slightly looser than pure pot odds
  },

  LAG: {
    name: 'Loose-Aggressive',
    description: 'Opens very wide, frequently bluffs, puts maximum pressure on opponents.',
    cBetFrequencyIP: 0.80,
    cBetFrequencyOOP: 0.65,
    foldToCBetIP: 0.30,
    foldToCBetOOP: 0.40,
    checkRaiseFrequency: 0.20,
    bluffFrequency: 0.40,
    valueBetThreshold: 0.12, // bets weak pairs and draws
    foldEquityThreshold: 0.30,
    betSizingFactor: 1.15,
    callThresholdAdjustment: 0.14,
  },

  TIGHT_PASSIVE: {
    name: 'Tight-Passive',
    description: 'Plays few hands, rarely bets without the nuts, calls more than raises.',
    cBetFrequencyIP: 0.30,
    cBetFrequencyOOP: 0.20,
    foldToCBetIP: 0.55,
    foldToCBetOOP: 0.65,
    checkRaiseFrequency: 0.05,
    bluffFrequency: 0.08,
    valueBetThreshold: 0.40, // needs two pair to bet
    foldEquityThreshold: 0.60,
    betSizingFactor: 0.75,
    callThresholdAdjustment: 0.02, // calls close to pot odds
  },

  LOOSE_PASSIVE: {
    name: 'Loose-Passive',
    description: 'Calls with almost anything, rarely bets or raises, chases draws.',
    cBetFrequencyIP: 0.20,
    cBetFrequencyOOP: 0.15,
    foldToCBetIP: 0.40,
    foldToCBetOOP: 0.45,
    checkRaiseFrequency: 0.06,
    bluffFrequency: 0.06,
    valueBetThreshold: 0.10, // bets very wide when it does bet
    foldEquityThreshold: 0.70,
    betSizingFactor: 0.65,
    callThresholdAdjustment: 0.22, // very loose calls
  },
};

// Standard villain names by archetype
export const VILLAIN_NAMES: Record<Archetype, string[]> = {
  TAG: ['Alex', 'Morgan', 'Jordan', 'Casey'],
  LAG: ['Blake', 'Riley', 'Quinn', 'Drew'],
  TIGHT_PASSIVE: ['Pat', 'Terry', 'Lee', 'Chris'],
  LOOSE_PASSIVE: ['Sam', 'Jamie', 'Robin', 'Avery'],
};
