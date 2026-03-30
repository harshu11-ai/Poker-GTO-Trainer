import type { AnyPlayer } from '@/types/player';
import { POSITION_LABELS } from '@/types/player';
import { HoleCards } from './HoleCards';
import { formatBBs } from '@/utils/cardDisplay';
import type { Archetype } from '@/types/player';

interface SeatDisplayProps {
  player: AnyPlayer;
  isDealer: boolean;
  isActive: boolean; // Currently acting
  showVillainCards: boolean;
  streetBet: number; // Amount bet this street (from bettingRound)
}

const ARCHETYPE_COLORS: Record<Archetype, string> = {
  TAG: 'text-blue-400',
  LAG: 'text-red-400',
  TIGHT_PASSIVE: 'text-gray-400',
  LOOSE_PASSIVE: 'text-yellow-400',
};

export function SeatDisplay({
  player,
  isDealer,
  isActive,
  showVillainCards,
  streetBet,
}: SeatDisplayProps) {
  const faceUp = player.isHero || showVillainCards;
  const posLabel = POSITION_LABELS[player.position];

  const seatBg = player.isFolded
    ? 'bg-gray-800/60 border-gray-700/50'
    : isActive
    ? 'bg-gray-800 border-yellow-400 shadow-lg shadow-yellow-400/20'
    : player.isHero
    ? 'bg-gray-800 border-blue-500'
    : 'bg-gray-800 border-gray-600';

  return (
    <div
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-200 min-w-[80px] ${seatBg}`}
    >
      {/* Dealer button */}
      {isDealer && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center shadow border border-gray-300 z-10">
          D
        </div>
      )}

      {/* Player name & position */}
      <div className="text-center leading-none">
        <div className={`text-xs font-bold truncate max-w-[72px] ${player.isHero ? 'text-blue-300' : 'text-gray-200'}`}>
          {player.name}
        </div>
        <div className="text-[10px] text-gray-400">{posLabel}</div>
        {!player.isHero && (
          <div className={`text-[9px] ${ARCHETYPE_COLORS[('archetype' in player ? player.archetype : 'TAG') as Archetype]}`}>
            {'archetype' in player ? player.archetype.replace('_', ' ') : ''}
          </div>
        )}
      </div>

      {/* Hole cards */}
      <HoleCards
        cards={player.holeCards}
        faceUp={faceUp}
        size="sm"
        isFolded={player.isFolded}
      />

      {/* Stack */}
      <div className="text-xs font-mono text-green-300">
        {player.isAllIn ? (
          <span className="text-yellow-400 font-bold text-[10px]">ALL IN</span>
        ) : (
          `${formatBBs(player.stack)}bb`
        )}
      </div>

      {/* Street bet chip */}
      {streetBet > 0 && !player.isFolded && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
          <div className="bg-yellow-600 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-400 shadow whitespace-nowrap">
            {formatBBs(streetBet)}bb
          </div>
        </div>
      )}

      {/* Folded overlay */}
      {player.isFolded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="text-gray-500 text-[10px] font-bold rotate-[-15deg]">FOLDED</span>
        </div>
      )}
    </div>
  );
}
