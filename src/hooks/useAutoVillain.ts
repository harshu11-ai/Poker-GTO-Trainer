'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getVillainAction } from '@/engine/villainEngine';
import type { Villain } from '@/types/player';

// Watches game state and triggers villain actions with a realistic delay
export function useAutoVillain() {
  const gameState = useGameStore((s) => s.gameState);
  const pendingFeedback = useGameStore((s) => s.pendingFeedback);
  const isVillainThinking = useGameStore((s) => s.isVillainThinking);
  const villainAction = useGameStore((s) => s.villainAction);
  const setVillainThinking = useGameStore((s) => s.setVillainThinking);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't act while:
    // - Hero's turn (wait for hero input)
    // - Pending feedback is showing (wait for user to dismiss)
    // - Already thinking (debounce)
    // - Hand is over
    if (
      gameState.isHeroTurn ||
      pendingFeedback !== null ||
      isVillainThinking ||
      gameState.phase === 'HAND_COMPLETE' ||
      gameState.phase === 'WAITING' ||
      gameState.phase === 'SHOWDOWN' ||
      gameState.phase === 'DEALING'
    ) {
      return;
    }

    const currentPlayer = gameState.players[gameState.activePlayerIndex];
    if (!currentPlayer || currentPlayer.isHero || currentPlayer.isFolded || currentPlayer.isAllIn) {
      return;
    }

    const villain = currentPlayer as Villain;

    // Sanity: verify currentBettingRound exists
    if (!gameState.currentBettingRound) return;

    setVillainThinking(true);

    // Thinking delay: 150ms - 400ms
    const delay = 150 + Math.floor(Math.random() * 250);

    timeoutRef.current = setTimeout(() => {
      try {
        const action = getVillainAction(gameState, villain);
        villainAction(action);
      } catch (e) {
        console.error('Villain action error:', e);
      } finally {
        setVillainThinking(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    gameState.activePlayerIndex,
    gameState.isHeroTurn,
    gameState.phase,
    pendingFeedback,
    gameState,
    villainAction,
    setVillainThinking,
  ]);
}
