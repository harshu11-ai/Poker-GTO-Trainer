'use client';

import type { SessionStats as SessionStatsType } from '@/types/session';
import { MISTAKE_LABELS } from '@/types/feedback';
import type { MistakeCategory } from '@/types/feedback';
import { formatBBs } from '@/utils/cardDisplay';

interface SessionStatsProps {
  stats: SessionStatsType;
  onReset?: () => void;
}

export function SessionStats({ stats, onReset }: SessionStatsProps) {
  const { handsPlayed, handsWon, totalNetBBs, winRate, mistakeBreakdown, ratingDistribution } = stats;

  const totalMistakes = Object.values(mistakeBreakdown).reduce((a, b) => a + (b ?? 0), 0);
  const totalRatings = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  const mistakeEntries = (Object.entries(mistakeBreakdown) as [MistakeCategory, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6 text-white">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Hands Played" value={String(handsPlayed)} />
        <StatCard
          label="Net BB"
          value={`${totalNetBBs >= 0 ? '+' : ''}${formatBBs(totalNetBBs)}`}
          valueColor={totalNetBBs >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate >= 0 ? '+' : ''}${winRate.toFixed(1)} bb/100`}
          valueColor={winRate >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          label="Win %"
          value={handsPlayed > 0 ? `${Math.round((handsWon / handsPlayed) * 100)}%` : '—'}
        />
      </div>

      {/* Decision Quality */}
      {totalRatings > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Decision Quality</h3>
          <div className="space-y-1.5">
            {(['BEST', 'GOOD', 'OKAY', 'MISTAKE'] as const).map((rating) => {
              const count = ratingDistribution[rating] ?? 0;
              const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              const barColors = {
                BEST: 'bg-green-500',
                GOOD: 'bg-blue-500',
                OKAY: 'bg-yellow-500',
                MISTAKE: 'bg-red-500',
              };
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <div className="w-16 text-gray-400 text-xs text-right">{rating}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${barColors[rating]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs text-gray-300">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mistake breakdown */}
      {mistakeEntries.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Leak Analysis</h3>
          <div className="space-y-1.5">
            {mistakeEntries.map(([cat, count]) => {
              const pct = totalMistakes > 0 ? (count / totalMistakes) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  <div className="w-36 text-gray-400 text-xs truncate">{MISTAKE_LABELS[cat as MistakeCategory]}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-right text-xs text-gray-300">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {handsPlayed === 0 && (
        <div className="text-center text-gray-500 py-8">
          Play some hands to see your stats!
        </div>
      )}

      {onReset && handsPlayed > 0 && (
        <button
          onClick={onReset}
          className="text-xs text-gray-500 hover:text-gray-300 underline mt-2"
        >
          Reset session stats
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, valueColor = 'text-white' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${valueColor}`}>{value}</div>
    </div>
  );
}
