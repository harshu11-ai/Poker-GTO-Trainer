'use client';

import type { GameState } from '@/types/game';
import type { FeedbackResult } from '@/types/feedback';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RatingBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ActionHistory } from '@/components/action/ActionHistory';
import { formatBBs } from '@/utils/cardDisplay';
import { MISTAKE_LABELS } from '@/types/feedback';

interface HandReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onNextHand: () => void;
  gameState: GameState;
  feedbackHistory: FeedbackResult[];
}

export function HandReview({ isOpen, onClose, onNextHand, gameState, feedbackHistory }: HandReviewProps) {
  const result = gameState.lastHandResult;
  if (!result) return null;

  const heroNet = result.heroNetBBs;
  const isWin = heroNet > 0;
  const isSplit = heroNet === 0;

  // Find biggest mistake
  const mistakes = feedbackHistory.filter((f) => f.rating === 'MISTAKE');
  const biggestMistake = mistakes[0];

  // Overall rating
  const ratings = feedbackHistory.map((f) => f.rating);
  const overallRating = ratings.includes('MISTAKE') ? 'MISTAKE' :
    ratings.includes('OKAY') ? 'OKAY' :
    ratings.includes('GOOD') ? 'GOOD' : 'BEST';

  const heroPlayer = gameState.players.find((p) => p.id === gameState.heroId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hand Review" maxWidth="xl">
      <div className="space-y-5">
        {/* Result banner */}
        <div
          className={`rounded-xl p-4 text-center border-2 ${
            isWin ? 'bg-green-950/50 border-green-600' :
            isSplit ? 'bg-gray-800 border-gray-600' :
            'bg-red-950/50 border-red-700'
          }`}
        >
          <div className={`text-2xl font-bold ${isWin ? 'text-green-400' : isSplit ? 'text-gray-300' : 'text-red-400'}`}>
            {isWin ? `+${formatBBs(heroNet)} bb` : isSplit ? 'Split Pot' : `${formatBBs(heroNet)} bb`}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {result.wasShowdown ? 'Showdown' : 'Took the pot'}
          </div>
        </div>

        {/* Overall rating */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Overall performance:</span>
          <RatingBadge rating={overallRating} />
        </div>

        {/* Your cards + result */}
        {heroPlayer && heroPlayer.holeCards.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Your hand:</span>
            <div className="flex gap-1">
              {heroPlayer.holeCards.map((c) => <Card key={c.id} card={c} size="sm" />)}
            </div>
            {gameState.communityCards.length > 0 && (
              <>
                <span className="text-gray-600">|</span>
                <div className="flex gap-1">
                  {gameState.communityCards.map((c) => <Card key={c.id} card={c} size="sm" />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Showdown results */}
        {result.wasShowdown && result.showdownHands.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Showdown</div>
            {result.showdownHands.map((h) => {
              const isWinner = result.winners.some((w) => w.playerId === h.playerId);
              return (
                <div key={h.playerId} className={`flex items-center gap-2 text-sm ${isWinner ? 'text-green-300' : 'text-gray-400'}`}>
                  <div className="flex gap-0.5">
                    {h.holeCards.map((c) => <Card key={c.id} card={c} size="sm" />)}
                  </div>
                  <span className="font-medium">{h.playerName}</span>
                  <span className="text-gray-500">— {h.handDescription}</span>
                  {isWinner && <span className="text-green-400 font-bold">🏆</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Decision feedback */}
        {feedbackHistory.length > 0 && (
          <div className="space-y-2">
            <div className="text-gray-400 text-xs uppercase tracking-wider">Your Decisions</div>
            {feedbackHistory.map((fb, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border text-sm space-y-1 ${
                  fb.rating === 'MISTAKE' ? 'border-red-700/50 bg-red-950/30' :
                  fb.rating === 'OKAY' ? 'border-yellow-700/50 bg-yellow-950/30' :
                  'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RatingBadge rating={fb.rating} />
                  <span className="text-gray-400 text-xs">
                    {fb.boardTexture ? `${fb.boardTexture} board` : 'Preflop'} · {fb.actionTaken}
                  </span>
                </div>
                <p className="text-gray-300 text-xs">{fb.reasoning}</p>
                <p className="text-yellow-300 text-xs font-medium">{fb.keyLesson}</p>
              </div>
            ))}
          </div>
        )}

        {/* Biggest mistake */}
        {biggestMistake && (
          <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4">
            <div className="text-red-400 text-xs uppercase tracking-wider mb-1">Biggest Mistake</div>
            <div className="text-white text-sm font-medium mb-1">
              {MISTAKE_LABELS[biggestMistake.mistakeCategory]}
            </div>
            <p className="text-gray-300 text-sm">{biggestMistake.keyLesson}</p>
          </div>
        )}

        {/* Action log */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Action Log</div>
          <ActionHistory actions={gameState.actionHistory} />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button variant="primary" onClick={onNextHand} className="flex-1">
            Next Hand →
          </Button>
        </div>
      </div>
    </Modal>
  );
}
