import type { Card, Rank } from '@/types/cards';
import { RANK_ORDER } from '@/types/cards';

const RANKS_DESC: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Expand shorthand range notation into explicit hand strings
// Supports: "AA", "AKs", "AKo", "TT+", "ATs+", "ATo+"
export function expandRangeShorthand(hands: string[]): Set<string> {
  const result = new Set<string>();

  for (const hand of hands) {
    if (hand.endsWith('+')) {
      const base = hand.slice(0, -1);
      if (base.length === 2 && base[0] === base[1]) {
        // Pair: "TT+" = TT, JJ, QQ, KK, AA
        const baseRank = base[0] as Rank;
        const baseValue = RANK_ORDER[baseRank];
        for (const r of RANKS_DESC) {
          if (RANK_ORDER[r] >= baseValue) {
            result.add(`${r}${r}`);
          }
        }
      } else if (base.endsWith('s')) {
        // Suited: "ATs+" = ATs, AJs, AQs, AKs
        const r1 = base[0] as Rank;
        const r2 = base[1] as Rank;
        const minValue = RANK_ORDER[r2];
        for (const r of RANKS_DESC) {
          const v = RANK_ORDER[r];
          if (v >= minValue && v < RANK_ORDER[r1]) {
            result.add(`${r1}${r}s`);
          }
        }
      } else if (base.endsWith('o')) {
        // Offsuit: "ATo+" = ATo, AJo, AQo, AKo
        const r1 = base[0] as Rank;
        const r2 = base[1] as Rank;
        const minValue = RANK_ORDER[r2];
        for (const r of RANKS_DESC) {
          const v = RANK_ORDER[r];
          if (v >= minValue && v < RANK_ORDER[r1]) {
            result.add(`${r1}${r}o`);
          }
        }
      } else {
        // Two different ranks, no suit specified: expand both
        const r1 = base[0] as Rank;
        const r2 = base[1] as Rank;
        const minValue = RANK_ORDER[r2];
        for (const r of RANKS_DESC) {
          const v = RANK_ORDER[r];
          if (v >= minValue && v < RANK_ORDER[r1]) {
            result.add(`${r1}${r}s`);
            result.add(`${r1}${r}o`);
          }
        }
      }
    } else {
      result.add(hand);
    }
  }

  return result;
}

// Check if two hole cards match a hand in an expanded range set
export function handMatchesRange(card1: Card, card2: Card, expandedRange: Set<string>): boolean {
  const r1 = card1.rank;
  const r2 = card2.rank;
  const v1 = RANK_ORDER[r1];
  const v2 = RANK_ORDER[r2];

  // Normalize so higher rank is first
  const highRank = v1 >= v2 ? r1 : r2;
  const lowRank = v1 >= v2 ? r2 : r1;

  const isPair = r1 === r2;
  const isSuited = card1.suit === card2.suit;

  if (isPair) {
    return expandedRange.has(`${highRank}${lowRank}`);
  }

  if (isSuited) {
    return expandedRange.has(`${highRank}${lowRank}s`);
  }

  return expandedRange.has(`${highRank}${lowRank}o`);
}

// Classify a hand string from two cards (e.g., "AKs", "77", "T9o")
export function classifyHoleCards(card1: Card, card2: Card): string {
  const r1 = card1.rank;
  const r2 = card2.rank;
  const v1 = RANK_ORDER[r1];
  const v2 = RANK_ORDER[r2];

  const highRank = v1 >= v2 ? r1 : r2;
  const lowRank = v1 >= v2 ? r2 : r1;

  if (r1 === r2) return `${highRank}${lowRank}`;
  if (card1.suit === card2.suit) return `${highRank}${lowRank}s`;
  return `${highRank}${lowRank}o`;
}
