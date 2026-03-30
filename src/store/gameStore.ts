'use client';

import { create } from 'zustand';
import type { GameState, Action, ActionType } from '@/types/game';
import type { FeedbackResult } from '@/types/feedback';
import type { HandSummary } from '@/types/session';
import type { ActionRating } from '@/types/feedback';
import { createInitialGameState, startNewHand, applyAction } from '@/engine/gameEngine';
import { evaluateHeroAction } from '@/engine/feedbackEngine';
import { evaluateHand } from '@/utils/handEvaluator';
import { useSessionStore } from './sessionStore';

interface GameStore {
  gameState: GameState;
  pendingFeedback: FeedbackResult | null;
  handFeedbackHistory: FeedbackResult[]; // Feedback collected this hand
  isVillainThinking: boolean;

  // Actions
  initGame: () => void;
  startNewHand: () => void;
  heroAction: (actionType: ActionType, amount?: number) => void;
  advanceAfterFeedback: () => void;
  villainAction: (action: Action) => void;
  setVillainThinking: (thinking: boolean) => void;
  // Internal helper (exposed for store self-reference)
  _saveHandSummary: (state: GameState) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gameState: createInitialGameState(),
  pendingFeedback: null,
  handFeedbackHistory: [],
  isVillainThinking: false,

  initGame: () => {
    set({ gameState: createInitialGameState() });
  },

  startNewHand: () => {
    const state = get().gameState;
    const newState = startNewHand(state);
    set({
      gameState: newState,
      pendingFeedback: null,
      handFeedbackHistory: [],
      isVillainThinking: false,
    });
  },

  heroAction: (actionType: ActionType, amount = 0) => {
    const { gameState, handFeedbackHistory } = get();
    if (!gameState.isHeroTurn) return;

    const hero = gameState.players.find((p) => p.id === gameState.heroId);
    if (!hero) return;

    const round = gameState.currentBettingRound;
    if (!round) return;

    // Build the action
    const heroAction: Action = {
      playerId: hero.id,
      playerName: hero.name,
      position: hero.position,
      actionType,
      amount,
      street: round.street,
      timestamp: Date.now(),
    };

    // Evaluate hand rank for feedback
    const allCards = [...hero.holeCards, ...gameState.communityCards];
    const handRank = evaluateHand(allCards);

    // Evaluate feedback BEFORE applying the action (to capture pre-action state)
    const feedback = evaluateHeroAction(gameState, heroAction, handRank);

    // Apply the action
    const newState = applyAction(gameState, heroAction);

    // Record feedback in session store
    useSessionStore.getState().recordFeedback(feedback);

    set({
      gameState: newState,
      pendingFeedback: feedback,
      handFeedbackHistory: [...handFeedbackHistory, feedback],
    });

    // If hand is complete after hero action, save the hand summary
    if (newState.phase === 'HAND_COMPLETE') {
      get()._saveHandSummary(newState);
    }
  },

  advanceAfterFeedback: () => {
    const { gameState } = get();
    set({ pendingFeedback: null });

    // If hand is complete, nothing more to do
    if (gameState.phase === 'HAND_COMPLETE') return;

    // Otherwise, check if we need villain actions
    // The useAutoVillain hook will pick this up via the state change
  },

  villainAction: (action: Action) => {
    const { gameState } = get();

    const newState = applyAction(gameState, action);
    set({ gameState: newState });

    if (newState.phase === 'HAND_COMPLETE') {
      get()._saveHandSummary(newState);
    }
  },

  setVillainThinking: (thinking: boolean) => {
    set({ isVillainThinking: thinking });
  },

  // Private helper
  _saveHandSummary: (state: GameState) => {
    const { handFeedbackHistory } = get();
    const hero = state.players.find((p) => p.id === state.heroId);
    if (!hero) return;

    const result = state.lastHandResult;
    if (!result) return;

    const netBBs = result.heroNetBBs;
    const handResult = netBBs > 0 ? 'WIN' : netBBs < 0 ? 'LOSS' : 'SPLIT';

    const ratings: ActionRating[] = handFeedbackHistory.map((f) => f.rating);
    const overallRating: ActionRating =
      ratings.includes('MISTAKE') ? 'MISTAKE' :
      ratings.includes('OKAY') ? 'OKAY' :
      ratings.includes('GOOD') ? 'GOOD' : 'BEST';

    const summary: HandSummary = {
      handNumber: state.handNumber,
      heroHoleCards: hero.holeCards,
      communityCards: state.communityCards,
      result: handResult,
      netBBs,
      feedbackItems: handFeedbackHistory,
      overallRating,
      actions: state.actionHistory,
      timestamp: Date.now(),
    };

    useSessionStore.getState().addHandResult(summary);
  },
}));
