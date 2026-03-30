import type { Card, Suit, Rank } from '@/types/cards';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-gray-900',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
};

export function rankLabel(rank: Rank): string {
  return rank; // T, J, Q, K, A are already display-ready
}

export function cardToString(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function cardColor(card: Card): string {
  return SUIT_COLORS[card.suit];
}

export function positionDisplayName(position: string): string {
  const names: Record<string, string> = {
    UTG: 'UTG',
    UTG1: 'UTG+1',
    HJ: 'HJ',
    CO: 'CO',
    BTN: 'BTN',
    SB: 'SB',
    BB: 'BB',
  };
  return names[position] ?? position;
}

export function formatBBs(amount: number): string {
  if (amount === 0) return '0';
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(1);
}

export function actionLabel(actionType: string, amount?: number): string {
  switch (actionType) {
    case 'FOLD': return 'Folds';
    case 'CHECK': return 'Checks';
    case 'CALL': return `Calls ${amount ? formatBBs(amount) + 'bb' : ''}`.trim();
    case 'BET': return `Bets ${amount ? formatBBs(amount) + 'bb' : ''}`.trim();
    case 'RAISE': return `Raises to ${amount ? formatBBs(amount) + 'bb' : ''}`.trim();
    case 'ALL_IN': return `All-In ${amount ? formatBBs(amount) + 'bb' : ''}`.trim();
    case 'POST_SB': return `Posts SB ${amount ? formatBBs(amount) + 'bb' : ''}`.trim();
    case 'POST_BB': return `Posts BB ${amount ? formatBBs(amount) + 'bb' : ''}`.trim();
    default: return actionType;
  }
}
