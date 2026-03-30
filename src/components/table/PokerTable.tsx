'use client';

import type { GameState } from '@/types/game';
import { SeatDisplay } from '@/components/seat/SeatDisplay';
import { CommunityCards } from './CommunityCards';

interface PokerTableProps {
  gameState: GameState;
}

// Positions for 6 seats evenly distributed around the oval table.
// Container aspect ratio: 100% wide × 56% tall (paddingBottom trick).
// Parametric ellipse: left = 50 + rx*sin(α), top = 50 - ry*cos(α)
// rx=42% of width, ry=32% of height. α clockwise from 12 o'clock.
// Seat 0 (hero) at 6 o'clock (α=180°), then clockwise: 4, 2, 12, 10, 8.
const SEAT_POSITIONS = [
  { top: '82%', left: '50%',   transform: 'translate(-50%, -50%)' }, // Seat 0 — 6 o'clock  (bottom center)
  { top: '66%', left: '86%',   transform: 'translate(-50%, -50%)' }, // Seat 1 — 4 o'clock  (bottom right)
  { top: '34%', left: '86%',   transform: 'translate(-50%, -50%)' }, // Seat 2 — 2 o'clock  (top right)
  { top: '18%', left: '50%',   transform: 'translate(-50%, -50%)' }, // Seat 3 — 12 o'clock (top center)
  { top: '34%', left: '14%',   transform: 'translate(-50%, -50%)' }, // Seat 4 — 10 o'clock (top left)
  { top: '66%', left: '14%',   transform: 'translate(-50%, -50%)' }, // Seat 5 — 8 o'clock  (bottom left)
];

export function PokerTable({ gameState }: PokerTableProps) {
  const { players, dealerSeatIndex, communityCards, pot, phase, currentBettingRound, showVillainCards, activePlayerIndex } = gameState;

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ paddingBottom: '56%' }}>
      {/* Felt table */}
      <div
        className="absolute inset-0 rounded-[50%] border-8 border-[#3d2b1f] shadow-2xl"
        style={{ background: 'radial-gradient(ellipse at center, #0a5c2a 0%, #064d22 60%, #053d1b 100%)' }}
      >
        {/* Inner rail */}
        <div
          className="absolute inset-4 rounded-[50%] border-2 border-[#2a1a0f]/60"
          style={{ background: 'transparent' }}
        />

        {/* Community cards in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <CommunityCards cards={communityCards} pot={pot} phase={phase} />
        </div>
      </div>

      {/* Seats positioned around the table */}
      {players.map((player) => {
        const pos = SEAT_POSITIONS[player.seatIndex];
        const isDealer = player.seatIndex === dealerSeatIndex;
        const isActing = !player.isFolded && !player.isAllIn && players[activePlayerIndex]?.id === player.id && phase !== 'HAND_COMPLETE';
        const streetBet = currentBettingRound?.betsThisRound[player.id] ?? 0;

        return (
          <div
            key={player.id}
            className="absolute"
            style={{
              top: pos.top,
              left: pos.left,
              transform: pos.transform,
              zIndex: isActing ? 20 : 10,
            }}
          >
            <SeatDisplay
              player={player}
              isDealer={isDealer}
              isActive={isActing}
              showVillainCards={showVillainCards}
              streetBet={streetBet}
            />
          </div>
        );
      })}
    </div>
  );
}
