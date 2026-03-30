'use client';

import Link from 'next/link';
import { useSessionStats } from '@/hooks/useSessionStats';
import { SessionStats } from '@/components/stats/SessionStats';
import { Button } from '@/components/ui/Button';

export default function StatsPage() {
  const { stats, resetSession } = useSessionStats();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 sticky top-0 z-30">
        <span className="text-white font-bold text-lg tracking-tight">♠ GTO Trainer — Stats</span>
        <Link href="/">
          <Button variant="ghost" size="sm">← Back to Game</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6">
        <h1 className="text-xl font-bold text-white mb-6">Session Statistics</h1>
        <SessionStats stats={stats} onReset={resetSession} />
      </main>
    </div>
  );
}
