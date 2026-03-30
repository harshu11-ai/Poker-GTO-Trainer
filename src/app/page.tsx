'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useAutoVillain } from '@/hooks/useAutoVillain';
import { PokerTable } from '@/components/table/PokerTable';
import { ActionControls } from '@/components/action/ActionControls';
import { FeedbackPanel } from '@/components/feedback/FeedbackPanel';
import { ActionHistory } from '@/components/action/ActionHistory';
import { HandReview } from '@/components/review/HandReview';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ActionType } from '@/types/game';

export default function GamePage() {
  const gameState = useGameStore((s) => s.gameState);
  const pendingFeedback = useGameStore((s) => s.pendingFeedback);
  const handFeedbackHistory = useGameStore((s) => s.handFeedbackHistory);
  const isVillainThinking = useGameStore((s) => s.isVillainThinking);
  const initGame = useGameStore((s) => s.initGame);
  const startNewHand = useGameStore((s) => s.startNewHand);
  const heroAction = useGameStore((s) => s.heroAction);
  const advanceAfterFeedback = useGameStore((s) => s.advanceAfterFeedback);

  const [showReview, setShowReview] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Activate villain auto-play hook
  useAutoVillain();

  // Init game on mount
  useEffect(() => {
    initGame();
    setHasMounted(true);
  }, [initGame]);

  // Auto-show review when hand completes
  useEffect(() => {
    if (gameState.phase === 'HAND_COMPLETE' && !pendingFeedback) {
      const timer = setTimeout(() => setShowReview(true), 400);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, pendingFeedback]);

  const handleHeroAction = (actionType: string, amount?: number) => {
    heroAction(actionType as ActionType, amount ?? 0);
  };

  const handleNextHand = () => {
    setShowReview(false);
    startNewHand();
  };

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const isHandActive = gameState.phase !== 'WAITING' && gameState.phase !== 'HAND_COMPLETE';
  const hero = gameState.players.find((p) => p.id === gameState.heroId);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg tracking-tight">♠ GTO Trainer</span>
          {isHandActive && (
            <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">
              Hand #{gameState.handNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isVillainThinking && (
            <span className="text-yellow-400 text-xs animate-pulse">Thinking...</span>
          )}
          <Link href="/stats">
            <Button variant="ghost" size="sm">Stats</Button>
          </Link>
          {(gameState.phase === 'WAITING' || gameState.phase === 'HAND_COMPLETE') && (
            <Button variant="success" size="sm" onClick={startNewHand}>
              {gameState.handNumber === 0 ? 'Start Game' : 'New Hand'}
            </Button>
          )}
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 gap-0 overflow-hidden">
        {/* Left sidebar: action history */}
        <aside className="hidden lg:flex flex-col w-44 bg-gray-900/50 border-r border-gray-800 p-3 overflow-y-auto">
          <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Action Log</div>
          <ActionHistory actions={gameState.actionHistory} />
        </aside>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center gap-4 p-4 overflow-y-auto">

          {/* Welcome state */}
          {gameState.phase === 'WAITING' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="text-6xl">♠♥♦♣</div>
              <h1 className="text-2xl font-bold text-white">GTO Trainer</h1>
              <p className="text-gray-400 max-w-md text-sm leading-relaxed">
                Play 6-max No-Limit Hold&apos;em and get instant feedback on every decision.
                Learn simplified GTO principles through real hand experience.
              </p>
              <Button variant="success" size="lg" onClick={startNewHand}>
                Deal Hand
              </Button>
            </div>
          )}

          {/* Poker table */}
          {gameState.phase !== 'WAITING' && (
            <div className="w-full max-w-4xl">
              <PokerTable gameState={gameState} />
            </div>
          )}

          {/* Hero info bar */}
          {hero && isHandActive && (
            <div className="w-full max-w-4xl bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-blue-300 font-semibold">You ({hero.position})</span>
                <span className="text-gray-400">
                  Stack: <span className="text-green-300 font-mono font-bold">{hero.stack}bb</span>
                </span>
                {hero.holeCards.length > 0 && (
                  <div className="flex gap-1">
                    {hero.holeCards.map((c) => (
                      <Card key={c.id} card={c} size="sm" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                {gameState.isHeroTurn && !pendingFeedback && (
                  <span className="text-yellow-400 text-xs font-semibold animate-pulse">Your turn ▶</span>
                )}
                {isVillainThinking && !gameState.isHeroTurn && (
                  <span className="text-gray-500 text-xs">Opponents acting...</span>
                )}
              </div>
            </div>
          )}

          {/* Feedback panel (shown after hero action, before continuing) */}
          {pendingFeedback && (
            <div className="w-full max-w-2xl">
              <FeedbackPanel feedback={pendingFeedback} onContinue={advanceAfterFeedback} />
            </div>
          )}

          {/* Action controls (hero's turn) */}
          {gameState.isHeroTurn && !pendingFeedback && isHandActive && (
            <div className="w-full max-w-2xl">
              <ActionControls
                gameState={gameState}
                onAction={handleHeroAction}
                disabled={false}
              />
            </div>
          )}

          {/* Hand complete — show options */}
          {gameState.phase === 'HAND_COMPLETE' && !pendingFeedback && !showReview && (
            <div className="flex gap-3 py-4">
              <Button variant="ghost" onClick={() => setShowReview(true)}>
                View Hand Review
              </Button>
              <Button variant="success" onClick={handleNextHand}>
                Next Hand →
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Hand Review Modal */}
      <HandReview
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        onNextHand={handleNextHand}
        gameState={gameState}
        feedbackHistory={handFeedbackHistory}
      />
    </div>
  );
}
