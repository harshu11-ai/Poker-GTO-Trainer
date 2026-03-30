import type { Card } from './cards';
import type { AnyPlayer, Position } from './player';

export type GamePhase =
  | 'WAITING'
  | 'DEALING'
  | 'PREFLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'HAND_COMPLETE';

export type ActionType =
  | 'FOLD'
  | 'CHECK'
  | 'CALL'
  | 'RAISE'
  | 'BET'
  | 'ALL_IN'
  | 'POST_SB'
  | 'POST_BB';

export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export interface Action {
  playerId: string;
  playerName: string;
  position: Position;
  actionType: ActionType;
  amount: number; // 0 for fold/check; total bet amount on the street for raise/bet/call
  street: Street;
  timestamp: number;
}

export interface BettingRound {
  street: Street;
  actions: Action[];
  potAtStart: number;
  betsThisRound: Record<string, number>; // playerId -> total committed this street
  currentBet: number; // Highest bet to call this street
  minRaise: number; // Minimum raise size (total)
  lastAggressorId: string | null;
  actionsCount: number; // How many times action has gone around
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandResult {
  winners: Array<{
    playerId: string;
    playerName: string;
    amount: number;
    handDescription: string;
  }>;
  showdownHands: Array<{
    playerId: string;
    playerName: string;
    holeCards: Card[];
    handDescription: string;
  }>;
  wasShowdown: boolean;
  heroNetBBs: number; // Positive = won, negative = lost
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  canRaise: boolean;
  minRaiseTotal: number; // Total amount of the min raise
  maxRaiseTotal: number; // Total amount (all-in)
}

export interface GameState {
  phase: GamePhase;
  handNumber: number;
  deck: Card[];
  players: AnyPlayer[]; // Ordered by seatIndex 0-5
  heroId: string;
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentBettingRound: BettingRound | null;
  actionHistory: Action[]; // Full hand history
  dealerSeatIndex: number;
  smallBlindAmount: number; // Default 0.5
  bigBlindAmount: number; // Default 1
  activePlayerIndex: number; // Index into players array
  preflopAggressorId: string | null; // Who last raised preflop
  lastHandResult: HandResult | null;
  isHeroTurn: boolean;
  showVillainCards: boolean; // True at showdown
}
