'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SessionStats, HandSummary, MistakeBreakdown } from '@/types/session';
import type { FeedbackResult, ActionRating, MistakeCategory } from '@/types/feedback';

const INITIAL_MISTAKE_BREAKDOWN: MistakeBreakdown = {};

const INITIAL_STATS: SessionStats = {
  handsPlayed: 0,
  handsWon: 0,
  totalNetBBs: 0,
  winRate: 0,
  mistakeBreakdown: INITIAL_MISTAKE_BREAKDOWN,
  ratingDistribution: { BEST: 0, GOOD: 0, OKAY: 0, MISTAKE: 0 },
  handHistory: [],
  sessionStartTime: Date.now(),
};

interface SessionStore {
  stats: SessionStats;
  addHandResult: (summary: HandSummary) => void;
  recordFeedback: (feedback: FeedbackResult) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      stats: INITIAL_STATS,

      addHandResult: (summary: HandSummary) =>
        set((state) => {
          const stats = state.stats;
          const newHandsPlayed = stats.handsPlayed + 1;
          const newHandsWon = stats.handsWon + (summary.result === 'WIN' ? 1 : 0);
          const newTotalNetBBs = stats.totalNetBBs + summary.netBBs;
          const winRate = newHandsPlayed > 0 ? (newTotalNetBBs / newHandsPlayed) * 100 : 0;

          // Accumulate feedback from the hand
          let mistakeBreakdown = { ...stats.mistakeBreakdown };
          let ratingDistribution = { ...stats.ratingDistribution };

          for (const fb of summary.feedbackItems) {
            const cat = fb.mistakeCategory as MistakeCategory;
            if (cat && cat !== 'CORRECT_PLAY') {
              mistakeBreakdown = {
                ...mistakeBreakdown,
                [cat]: (mistakeBreakdown[cat] ?? 0) + 1,
              };
            }
            const rating = fb.rating as ActionRating;
            ratingDistribution = {
              ...ratingDistribution,
              [rating]: (ratingDistribution[rating] ?? 0) + 1,
            };
          }

          const handHistory = [summary, ...stats.handHistory].slice(0, 50); // Keep last 50

          return {
            stats: {
              ...stats,
              handsPlayed: newHandsPlayed,
              handsWon: newHandsWon,
              totalNetBBs: newTotalNetBBs,
              winRate,
              mistakeBreakdown,
              ratingDistribution,
              handHistory,
            },
          };
        }),

      recordFeedback: (feedback: FeedbackResult) =>
        set((state) => {
          const stats = state.stats;
          const cat = feedback.mistakeCategory as MistakeCategory;
          const mistakeBreakdown = cat && cat !== 'CORRECT_PLAY'
            ? { ...stats.mistakeBreakdown, [cat]: (stats.mistakeBreakdown[cat] ?? 0) + 1 }
            : stats.mistakeBreakdown;

          const rating = feedback.rating as ActionRating;
          const ratingDistribution = {
            ...stats.ratingDistribution,
            [rating]: (stats.ratingDistribution[rating] ?? 0) + 1,
          };

          return { stats: { ...stats, mistakeBreakdown, ratingDistribution } };
        }),

      resetSession: () =>
        set({ stats: { ...INITIAL_STATS, sessionStartTime: Date.now() } }),
    }),
    {
      name: 'gto-trainer-session',
      storage: createJSONStorage(() => {
        // Safe localStorage access for SSR
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    },
  ),
);
