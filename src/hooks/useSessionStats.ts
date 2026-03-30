'use client';

import { useSessionStore } from '@/store/sessionStore';

export function useSessionStats() {
  const stats = useSessionStore((s) => s.stats);
  const resetSession = useSessionStore((s) => s.resetSession);

  return { stats, resetSession };
}
