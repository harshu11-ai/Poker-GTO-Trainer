import type { Card, HandRank, HandRankCategory } from '@/types/cards';
import { HAND_RANK_VALUE } from '@/types/cards';
import {
  getSortedRanks,
  getRankCounts,
  isFlush,
  isStraight,
  encodeValue,
  combinations,
} from './handEvaluatorHelpers';

export function evaluateFiveCards(cards: Card[]): HandRank {
  const sorted = [...cards].sort(
    (a, b) => (b.rank === 'A' ? 14 : 0) - (a.rank === 'A' ? 14 : 0),
  );
  const sortedRanks = getSortedRanks(cards);
  const rankCounts = getRankCounts(cards);
  const { flush, suit: flushSuit } = isFlush(cards);
  const { straight, highCard: straightHigh } = isStraight(sortedRanks);

  // Sort by frequency descending, then by rank descending
  const grouped = [...rankCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const frequencies = grouped.map(([, count]) => count);
  const ranksByFreq = grouped.map(([rank]) => rank);

  let category: HandRankCategory;
  let value: number;
  let bestFive: Card[];
  let description: string;

  if (flush && straight) {
    const flushCards = cards.filter((c) => c.suit === flushSuit);
    const flushRanks = getSortedRanks(flushCards);
    const { straight: sf, highCard: sfHigh } = isStraight(flushRanks);
    if (sf) {
      category = sfHigh === 14 ? 'ROYAL_FLUSH' : 'STRAIGHT_FLUSH';
      value = encodeValue(HAND_RANK_VALUE[category], [sfHigh]);
      bestFive = flushCards
        .sort((a, b) => getSortedRanks([b])[0] - getSortedRanks([a])[0])
        .slice(0, 5);
      description = category === 'ROYAL_FLUSH' ? 'Royal Flush' : `Straight Flush, ${rankName(sfHigh)} high`;
      return { category, value, bestFive, description };
    }
  }

  if (frequencies[0] === 4) {
    category = 'FOUR_OF_A_KIND';
    const quad = ranksByFreq[0];
    const kicker = ranksByFreq[1];
    value = encodeValue(HAND_RANK_VALUE[category], [quad, kicker]);
    bestFive = sorted.filter((c) => getSortedRanks([c])[0] === quad).concat(
      sorted.filter((c) => getSortedRanks([c])[0] === kicker).slice(0, 1),
    );
    description = `Four of a Kind, ${rankName(quad)}s`;
    return { category, value, bestFive, description };
  }

  if (frequencies[0] === 3 && frequencies[1] === 2) {
    category = 'FULL_HOUSE';
    const trips = ranksByFreq[0];
    const pair = ranksByFreq[1];
    value = encodeValue(HAND_RANK_VALUE[category], [trips, pair]);
    bestFive = [
      ...cards.filter((c) => getSortedRanks([c])[0] === trips),
      ...cards.filter((c) => getSortedRanks([c])[0] === pair),
    ].slice(0, 5);
    description = `Full House, ${rankName(trips)}s full of ${rankName(pair)}s`;
    return { category, value, bestFive, description };
  }

  if (flush) {
    category = 'FLUSH';
    const flushCards = cards
      .filter((c) => c.suit === flushSuit)
      .sort((a, b) => getSortedRanks([b])[0] - getSortedRanks([a])[0])
      .slice(0, 5);
    const flushRanks = getSortedRanks(flushCards);
    value = encodeValue(HAND_RANK_VALUE[category], flushRanks);
    bestFive = flushCards;
    description = `Flush, ${rankName(flushRanks[0])} high`;
    return { category, value, bestFive, description };
  }

  if (straight) {
    category = 'STRAIGHT';
    value = encodeValue(HAND_RANK_VALUE[category], [straightHigh]);
    // Build best five for straight
    const uniqueRanks = [...new Set(sortedRanks)];
    const startIdx = uniqueRanks.indexOf(straightHigh);
    const straightRanks = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const r = straightHigh === 5 && i === 4 ? 14 : straightHigh - i; // wheel ace
      straightRanks.add(r);
    }
    bestFive = cards
      .filter((c) => straightRanks.has(getSortedRanks([c])[0]))
      .sort((a, b) => getSortedRanks([b])[0] - getSortedRanks([a])[0])
      .slice(0, 5);
    description = `Straight, ${rankName(straightHigh)} high`;
    void startIdx;
    return { category, value, bestFive, description };
  }

  if (frequencies[0] === 3) {
    category = 'THREE_OF_A_KIND';
    const trips = ranksByFreq[0];
    const kickers = ranksByFreq.slice(1, 3);
    value = encodeValue(HAND_RANK_VALUE[category], [trips, ...kickers]);
    bestFive = [
      ...cards.filter((c) => getSortedRanks([c])[0] === trips),
      ...cards.filter((c) => getSortedRanks([c])[0] !== trips).sort(
        (a, b) => getSortedRanks([b])[0] - getSortedRanks([a])[0],
      ).slice(0, 2),
    ];
    description = `Three of a Kind, ${rankName(trips)}s`;
    return { category, value, bestFive, description };
  }

  if (frequencies[0] === 2 && frequencies[1] === 2) {
    category = 'TWO_PAIR';
    const highPair = ranksByFreq[0];
    const lowPair = ranksByFreq[1];
    const kicker = ranksByFreq[2] ?? 0;
    value = encodeValue(HAND_RANK_VALUE[category], [highPair, lowPair, kicker]);
    bestFive = [
      ...cards.filter((c) => getSortedRanks([c])[0] === highPair),
      ...cards.filter((c) => getSortedRanks([c])[0] === lowPair),
      ...cards.filter((c) => getSortedRanks([c])[0] === kicker).slice(0, 1),
    ].slice(0, 5);
    description = `Two Pair, ${rankName(highPair)}s and ${rankName(lowPair)}s`;
    return { category, value, bestFive, description };
  }

  if (frequencies[0] === 2) {
    category = 'PAIR';
    const pair = ranksByFreq[0];
    const kickers = ranksByFreq.slice(1, 4);
    value = encodeValue(HAND_RANK_VALUE[category], [pair, ...kickers]);
    bestFive = [
      ...cards.filter((c) => getSortedRanks([c])[0] === pair),
      ...cards.filter((c) => getSortedRanks([c])[0] !== pair).sort(
        (a, b) => getSortedRanks([b])[0] - getSortedRanks([a])[0],
      ).slice(0, 3),
    ];
    description = `Pair of ${rankName(pair)}s`;
    return { category, value, bestFive, description };
  }

  // High card
  category = 'HIGH_CARD';
  const topFive = [...sortedRanks].slice(0, 5);
  value = encodeValue(HAND_RANK_VALUE[category], topFive);
  bestFive = cards
    .sort((a, b) => getSortedRanks([b])[0] - getSortedRanks([a])[0])
    .slice(0, 5);
  description = `${rankName(topFive[0])} high`;
  return { category, value, bestFive, description };
}

// Evaluate best 5-card hand from up to 7 cards
export function evaluateHand(cards: Card[]): HandRank {
  if (cards.length < 5) {
    // Can't evaluate — return placeholder
    return {
      category: 'HIGH_CARD',
      value: 0,
      bestFive: cards,
      description: 'Incomplete hand',
    };
  }
  if (cards.length === 5) return evaluateFiveCards(cards);

  const combos = combinations(cards, 5);
  let best: HandRank | null = null;
  for (const combo of combos) {
    const rank = evaluateFiveCards(combo);
    if (!best || rank.value > best.value) best = rank;
  }
  return best!;
}

export function compareHands(a: HandRank, b: HandRank): -1 | 0 | 1 {
  if (a.value > b.value) return 1;
  if (a.value < b.value) return -1;
  return 0;
}

function rankName(r: number): string {
  const names: Record<number, string> = {
    14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack',
    10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven',
    6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two', 1: 'Ace',
  };
  return names[r] ?? String(r);
}
