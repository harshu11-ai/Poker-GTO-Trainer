'use client';

import { useState } from 'react';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/Button';
import { getLegalActions, getPresetSizes } from '@/engine/bettingEngine';
import { formatBBs } from '@/utils/cardDisplay';

interface ActionControlsProps {
  gameState: GameState;
  onAction: (actionType: string, amount?: number) => void;
  disabled?: boolean;
}

export function ActionControls({ gameState, onAction, disabled = false }: ActionControlsProps) {
  const [showRaise, setShowRaise] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);

  const hero = gameState.players.find((p) => p.id === gameState.heroId);
  if (!hero || !gameState.isHeroTurn || !gameState.currentBettingRound) return null;

  const legal = getLegalActions(gameState, hero.id);
  const round = gameState.currentBettingRound;
  const presets = getPresetSizes(
    gameState.pot,
    round.currentBet,
    round.betsThisRound[hero.id] ?? 0,
    hero.stack,
    gameState.bigBlindAmount,
  );

  const initRaise = () => {
    const defaultPreset = presets[1] ?? presets[0];
    if (defaultPreset) setRaiseAmount(defaultPreset.amount);
    setShowRaise(true);
  };

  const handleRaise = () => {
    const actionType = round.currentBet > 0 ? 'RAISE' : 'BET';
    onAction(actionType, raiseAmount);
    setShowRaise(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {showRaise ? (
        <div className="flex flex-col gap-2 bg-gray-800 rounded-xl p-3 border border-gray-600">
          <div className="text-gray-300 text-sm font-semibold">
            {round.currentBet > 0 ? 'Raise to' : 'Bet'}: <span className="text-white font-bold">{formatBBs(raiseAmount)}bb</span>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setRaiseAmount(preset.amount)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors
                  ${raiseAmount === preset.amount
                    ? 'bg-yellow-500 border-yellow-400 text-black'
                    : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={legal.minRaiseTotal}
            max={legal.maxRaiseTotal}
            step={0.5}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-full accent-yellow-400"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Min: {formatBBs(legal.minRaiseTotal)}bb</span>
            <span>All-In: {formatBBs(legal.maxRaiseTotal)}bb</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaise(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleRaise}
              className="flex-1"
              disabled={disabled}
            >
              {round.currentBet > 0 ? 'Raise' : 'Bet'} {formatBBs(raiseAmount)}bb
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap justify-center">
          {legal.canFold && (
            <Button
              variant="danger"
              size="md"
              onClick={() => onAction('FOLD')}
              disabled={disabled}
              className="min-w-[80px]"
            >
              Fold
            </Button>
          )}
          {legal.canCheck && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onAction('CHECK')}
              disabled={disabled}
              className="min-w-[80px]"
            >
              Check
            </Button>
          )}
          {legal.canCall && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onAction('CALL', legal.callAmount)}
              disabled={disabled}
              className="min-w-[100px]"
            >
              Call {formatBBs(legal.callAmount)}bb
            </Button>
          )}
          {(legal.canBet || legal.canRaise) && (
            <Button
              variant="success"
              size="md"
              onClick={initRaise}
              disabled={disabled}
              className="min-w-[80px]"
            >
              {legal.canRaise ? 'Raise' : 'Bet'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
