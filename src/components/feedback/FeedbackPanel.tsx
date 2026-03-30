'use client';

import type { FeedbackResult } from '@/types/feedback';
import { RatingBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { boardTextureName } from '@/engine/boardTextureEngine';
import { handCategoryLabel } from '@/engine/handClassifier';
import { MISTAKE_LABELS } from '@/types/feedback';
import { actionLabel } from '@/utils/cardDisplay';

interface FeedbackPanelProps {
  feedback: FeedbackResult;
  onContinue: () => void;
}

const RATING_BG: Record<string, string> = {
  BEST: 'border-green-500/50 bg-green-950/40',
  GOOD: 'border-blue-500/50 bg-blue-950/40',
  OKAY: 'border-yellow-500/50 bg-yellow-950/40',
  MISTAKE: 'border-red-500/50 bg-red-950/40',
};

export function FeedbackPanel({ feedback, onContinue }: FeedbackPanelProps) {
  const {
    rating,
    reasoning,
    keyLesson,
    recommendedAction,
    recommendedAmount,
    boardTexture,
    handCategory,
    mistakeCategory,
    spr,
    wasInPosition,
    hadInitiative,
    activePlayerCount,
  } = feedback;

  return (
    <div
      className={`rounded-xl border-2 p-4 ${RATING_BG[rating]} backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <RatingBadge rating={rating} />
        <div className="text-xs text-gray-400 space-x-2">
          {boardTexture && (
            <span className="bg-gray-700 px-2 py-0.5 rounded">
              Board: {boardTextureName(boardTexture)}
            </span>
          )}
          <span className="bg-gray-700 px-2 py-0.5 rounded">
            {handCategoryLabel(handCategory)}
          </span>
        </div>
      </div>

      {/* Recommended action */}
      {recommendedAction !== feedback.actionTaken && (
        <div className="mb-3 p-2 bg-gray-800/80 rounded-lg border border-gray-600 text-sm">
          <span className="text-gray-400">Recommended: </span>
          <span className="text-white font-semibold">
            {actionLabel(recommendedAction, recommendedAmount)}
          </span>
        </div>
      )}

      {/* Reasoning */}
      <p className="text-gray-200 text-sm leading-relaxed mb-3">{reasoning}</p>

      {/* Key Lesson */}
      <div className="bg-gray-900/60 border-l-4 border-yellow-400 pl-3 py-2 rounded-r mb-3">
        <div className="text-yellow-400 text-[10px] uppercase tracking-wider mb-0.5">Key Lesson</div>
        <p className="text-gray-100 text-sm font-medium">{keyLesson}</p>
      </div>

      {/* Context pills */}
      <div className="flex flex-wrap gap-1.5 mb-3 text-[10px]">
        {mistakeCategory !== 'CORRECT_PLAY' && (
          <span className="bg-red-900/50 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
            {MISTAKE_LABELS[mistakeCategory]}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full border ${wasInPosition ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
          {wasInPosition ? 'In Position' : 'Out of Position'}
        </span>
        {hadInitiative && (
          <span className="bg-purple-900/40 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full">
            Had Initiative
          </span>
        )}
        {spr !== null && (
          <span className="bg-gray-800 text-gray-400 border border-gray-600 px-2 py-0.5 rounded-full">
            SPR: {spr.toFixed(1)}
          </span>
        )}
        {activePlayerCount >= 3 && (
          <span className="bg-orange-900/40 text-orange-300 border border-orange-700 px-2 py-0.5 rounded-full">
            Multiway ({activePlayerCount} players)
          </span>
        )}
      </div>

      <Button variant="primary" onClick={onContinue} className="w-full">
        Continue →
      </Button>
    </div>
  );
}
