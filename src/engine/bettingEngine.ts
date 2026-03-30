import type { GameState, LegalActions } from '@/types/game';

export function getLegalActions(state: GameState, playerId: string): LegalActions {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player ${playerId} not found`);

  const round = state.currentBettingRound;
  if (!round) {
    return {
      canFold: false, canCheck: true, canCall: false, callAmount: 0,
      canBet: false, canRaise: false, minRaiseTotal: 0, maxRaiseTotal: 0,
    };
  }

  const currentBet = round.currentBet;
  const myBet = round.betsThisRound[playerId] ?? 0;
  const toCall = currentBet - myBet;

  const canCheck = toCall === 0;
  const canFold = toCall > 0; // Can always fold when facing a bet; no point folding when free
  const canCall = toCall > 0 && player.stack > 0;

  const callAmount = Math.min(toCall, player.stack);

  // Raise/bet rules
  const lastRaiseSize = round.minRaise; // The raise increment
  const minRaiseTotal = currentBet + lastRaiseSize;
  const maxRaiseTotal = myBet + player.stack; // All-in

  const canRaise = currentBet > 0 && player.stack > toCall;
  const canBet = currentBet === 0 && player.stack > 0;

  return {
    canFold,
    canCheck,
    canCall,
    callAmount,
    canBet,
    canRaise,
    minRaiseTotal: Math.min(minRaiseTotal, maxRaiseTotal),
    maxRaiseTotal,
  };
}

// Calculate pot-sized bet amount
export function potSizeBet(pot: number, myCurrentBet: number): number {
  return pot + 2 * myCurrentBet; // Pot-size raise formula
}

// Preset raise/bet sizes as fractions of the pot
export function getPresetSizes(
  pot: number,
  currentBet: number,
  myBet: number,
  stack: number,
  bigBlind: number,
): Array<{ label: string; amount: number }> {
  const toCall = currentBet - myBet;
  const effectivePot = pot + toCall; // Pot if we call first (for raise sizing)

  if (currentBet === 0) {
    // Bet sizing
    return [
      { label: '33%', amount: Math.max(bigBlind, Math.round(effectivePot * 0.33)) },
      { label: '50%', amount: Math.max(bigBlind, Math.round(effectivePot * 0.5)) },
      { label: '75%', amount: Math.max(bigBlind, Math.round(effectivePot * 0.75)) },
      { label: 'Pot', amount: Math.max(bigBlind, Math.round(effectivePot)) },
      { label: 'All-In', amount: myBet + stack },
    ].filter((p) => p.amount <= myBet + stack);
  } else {
    // Raise sizing (total amount)
    return [
      { label: '2.5x', amount: Math.round(currentBet * 2.5) },
      { label: '3x', amount: currentBet * 3 },
      { label: 'Pot', amount: Math.min(currentBet + effectivePot, myBet + stack) },
      { label: 'All-In', amount: myBet + stack },
    ].filter((p) => p.amount <= myBet + stack && p.amount > currentBet);
  }
}
