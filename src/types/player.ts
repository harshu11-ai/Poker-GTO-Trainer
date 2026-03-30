import type { Card } from './cards';

export type Archetype = 'TAG' | 'LAG' | 'TIGHT_PASSIVE' | 'LOOSE_PASSIVE';

export type Position = 'UTG' | 'UTG1' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export const POSITION_LABELS: Record<Position, string> = {
  UTG: 'UTG',
  UTG1: 'UTG+1',
  HJ: 'HJ',
  CO: 'CO',
  BTN: 'BTN',
  SB: 'SB',
  BB: 'BB',
};

// Preflop action order (index 0 acts first)
export const PREFLOP_ACTION_ORDER: Position[] = ['UTG', 'UTG1', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Postflop action order (SB first)
export const POSTFLOP_ACTION_ORDER: Position[] = ['SB', 'BB', 'UTG', 'UTG1', 'HJ', 'CO', 'BTN'];

export interface Player {
  id: string;
  name: string;
  stack: number; // In big blinds
  holeCards: Card[];
  isActive: boolean; // Still in the hand (not folded, not all-in handled separately)
  isFolded: boolean;
  isAllIn: boolean;
  currentStreetBet: number; // Amount bet/called on current street
  totalInvestedThisHand: number;
  position: Position;
  seatIndex: number; // 0-5 for visual placement
}

export interface Hero extends Player {
  isHero: true;
}

export interface Villain extends Player {
  isHero: false;
  archetype: Archetype;
}

export type AnyPlayer = Hero | Villain;
