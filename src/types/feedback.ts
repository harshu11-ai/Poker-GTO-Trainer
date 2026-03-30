import type { ActionType } from './game';

export type ActionRating = 'BEST' | 'GOOD' | 'OKAY' | 'MISTAKE';

export type MistakeCategory =
  | 'FOLD_TOO_MUCH'
  | 'CALL_TOO_WIDE'
  | 'OVERBET'
  | 'UNDERBET'
  | 'MISSED_VALUE'
  | 'BLUFF_TOO_MUCH'
  | 'BLUFF_TOO_LITTLE'
  | 'IGNORED_POSITION'
  | 'IGNORED_SPR'
  | 'MULTIWAY_ERROR'
  | 'INITIATIVE_MISTAKE'
  | 'CORRECT_PLAY';

export const MISTAKE_LABELS: Record<MistakeCategory, string> = {
  FOLD_TOO_MUCH: 'Folding Too Much',
  CALL_TOO_WIDE: 'Calling Too Wide',
  OVERBET: 'Overbetting',
  UNDERBET: 'Underbetting',
  MISSED_VALUE: 'Missed Value',
  BLUFF_TOO_MUCH: 'Overbluffing',
  BLUFF_TOO_LITTLE: 'Not Bluffing Enough',
  IGNORED_POSITION: 'Ignoring Position',
  IGNORED_SPR: 'Ignoring Stack-to-Pot Ratio',
  MULTIWAY_ERROR: 'Multiway Pot Error',
  INITIATIVE_MISTAKE: 'Initiative Mistake',
  CORRECT_PLAY: 'Correct Play',
};

export type BoardTexture =
  | 'DRY'
  | 'SEMI_WET'
  | 'WET'
  | 'MONOTONE'
  | 'PAIRED'
  | 'DOUBLE_PAIRED';

export type HandCategory =
  | 'PREMIUM'
  | 'STRONG_MADE'
  | 'MEDIUM_MADE'
  | 'WEAK_MADE'
  | 'STRONG_DRAW'
  | 'WEAK_DRAW'
  | 'BLUFF_CATCHER'
  | 'AIR'
  | 'PREFLOP_STRONG'
  | 'PREFLOP_MEDIUM'
  | 'PREFLOP_SPECULATIVE'
  | 'PREFLOP_WEAK';

export interface FeedbackResult {
  rating: ActionRating;
  actionTaken: ActionType;
  recommendedAction: ActionType;
  recommendedAmount?: number;
  mistakeCategory: MistakeCategory;
  reasoning: string; // 2-3 sentence explanation
  keyLesson: string; // One-liner takeaway
  boardTexture: BoardTexture | null; // null preflop
  handCategory: HandCategory;
  spr: number | null; // null preflop
  wasInPosition: boolean;
  hadInitiative: boolean;
  activePlayerCount: number;
}
