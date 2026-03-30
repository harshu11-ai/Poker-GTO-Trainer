import type { Card, Suit } from '@/types/cards';
import { RANK_ORDER } from '@/types/cards';

export function getSortedRanks(cards: Card[]): number[] {
  return cards.map((c) => RANK_ORDER[c.rank]).sort((a, b) => b - a);
}

export function getRankCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const card of cards) {
    const r = RANK_ORDER[card.rank];
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return counts;
}

export function isFlush(cards: Card[]): { flush: boolean; suit: Suit | null } {
  const suitCount = new Map<Suit, number>();
  for (const card of cards) {
    suitCount.set(card.suit, (suitCount.get(card.suit) ?? 0) + 1);
  }
  for (const [suit, count] of suitCount) {
    if (count >= 5) return { flush: true, suit };
  }
  return { flush: false, suit: null };
}

export function isStraight(sortedRanks: number[]): { straight: boolean; highCard: number } {
  // Remove duplicates
  const unique = [...new Set(sortedRanks)];

  // Check for wheel (A-2-3-4-5): treat A as 1
  if (unique.includes(14)) {
    const withLowAce = [...unique, 1].sort((a, b) => b - a);
    const result = checkConsecutive(withLowAce);
    if (result.straight) return result;
  }

  return checkConsecutive(unique);
}

function checkConsecutive(unique: number[]): { straight: boolean; highCard: number } {
  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) {
      // Check all consecutive
      let consecutive = true;
      for (let j = i; j < i + 4; j++) {
        if (unique[j] - unique[j + 1] !== 1) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) return { straight: true, highCard: unique[i] };
    }
  }
  return { straight: false, highCard: 0 };
}

// Encode hand value as a single comparable number
// Format: category(1) * 10^10 + r1 * 10^8 + r2 * 10^6 + r3 * 10^4 + r4 * 10^2 + r5
export function encodeValue(
  category: number,
  ranks: number[],
): number {
  const [r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0] = ranks;
  return (
    category * 10_000_000_000 +
    r1 * 100_000_000 +
    r2 * 1_000_000 +
    r3 * 10_000 +
    r4 * 100 +
    r5
  );
}

// Get all C(n, k) combinations
export function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}
