import type { FeedbackResult, ActionRating, MistakeCategory } from './feedback';
import type { Action } from './game';
import type { Card } from './cards';

export interface HandSummary {
  handNumber: number;
  heroHoleCards: Card[];
  communityCards: Card[];
  result: 'WIN' | 'LOSS' | 'SPLIT' | 'FOLD';
  netBBs: number;
  feedbackItems: FeedbackResult[];
  overallRating: ActionRating;
  actions: Action[];
  timestamp: number;
}

export type MistakeBreakdown = Partial<Record<MistakeCategory, number>>;

export interface SessionStats {
  handsPlayed: number;
  handsWon: number;
  totalNetBBs: number;
  winRate: number; // BB/100 hands
  mistakeBreakdown: MistakeBreakdown;
  ratingDistribution: Record<ActionRating, number>;
  handHistory: HandSummary[];
  sessionStartTime: number;
}
