'use client';

import { useGameStore } from '@/store/gameStore';

export function useFeedback() {
  const pendingFeedback = useGameStore((s) => s.pendingFeedback);
  const advanceAfterFeedback = useGameStore((s) => s.advanceAfterFeedback);

  return { pendingFeedback, advanceAfterFeedback };
}
