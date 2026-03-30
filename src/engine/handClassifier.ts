import type { Card } from '@/types/cards';
import type { HandCategory } from '@/types/feedback';
import type { HandRank } from '@/types/cards';
import { RANK_ORDER } from '@/types/cards';
import { hasFlushDraw, hasStraightDraw } from './boardTextureEngine';

// Classify hero hand category based on hole cards, board, and evaluated hand rank
export function classifyHeroHand(
  holeCards: Card[],
  communityCards: Card[],
  handRank: HandRank,
): HandCategory {
  if (communityCards.length === 0) {
    return classifyPreflopHand(holeCards);
  }
  return classifyPostflopHand(holeCards, communityCards, handRank);
}

function classifyPreflopHand(holeCards: Card[]): HandCategory {
  if (holeCards.length < 2) return 'PREFLOP_WEAK';

  const [c1, c2] = holeCards;
  const v1 = RANK_ORDER[c1.rank];
  const v2 = RANK_ORDER[c2.rank];
  const highVal = Math.max(v1, v2);
  const lowVal = Math.min(v1, v2);
  const isPair = c1.rank === c2.rank;
  const isSuited = c1.suit === c2.suit;
  const gap = highVal - lowVal;

  // Premium: AA, KK, QQ, AKs/o
  if (isPair && highVal >= 12) return 'PREMIUM';
  if (!isPair && highVal === 14 && lowVal === 13) return 'PREMIUM';

  // Strong: JJ, TT, AQs, AJs, ATs, KQs
  if (isPair && highVal >= 10) return 'PREFLOP_STRONG';
  if (!isPair && highVal === 14 && lowVal >= 10 && isSuited) return 'PREFLOP_STRONG';
  if (!isPair && highVal === 14 && lowVal >= 12) return 'PREFLOP_STRONG'; // AQ+o
  if (!isPair && highVal === 13 && lowVal === 12 && isSuited) return 'PREFLOP_STRONG'; // KQs

  // Medium: 99-77, AXs, KQo, KJs
  if (isPair && highVal >= 7) return 'PREFLOP_MEDIUM';
  if (!isPair && highVal === 14 && isSuited) return 'PREFLOP_MEDIUM'; // AXs
  if (!isPair && highVal === 14 && lowVal >= 10) return 'PREFLOP_MEDIUM'; // ATo+
  if (!isPair && highVal >= 13 && lowVal >= 10) return 'PREFLOP_MEDIUM'; // KJo+, KTs+, QJs

  // Speculative: suited connectors, small pairs, suited aces
  if (isPair) return 'PREFLOP_SPECULATIVE';
  if (isSuited && gap <= 2 && lowVal >= 5) return 'PREFLOP_SPECULATIVE';
  if (isSuited && highVal >= 11 && gap <= 4) return 'PREFLOP_SPECULATIVE';

  return 'PREFLOP_WEAK';
}

function classifyPostflopHand(
  holeCards: Card[],
  communityCards: Card[],
  handRank: HandRank,
): HandCategory {
  const { category } = handRank;

  // Strong made hands
  if (
    category === 'ROYAL_FLUSH' ||
    category === 'STRAIGHT_FLUSH' ||
    category === 'FOUR_OF_A_KIND' ||
    category === 'FULL_HOUSE'
  ) {
    return 'STRONG_MADE';
  }

  if (category === 'FLUSH') return 'STRONG_MADE';
  if (category === 'STRAIGHT') return 'STRONG_MADE';
  if (category === 'THREE_OF_A_KIND') return 'STRONG_MADE';

  if (category === 'TWO_PAIR') {
    // Check if top two pair (using hole cards for both pairs)
    const boardRanks = communityCards.map((c) => c.rank);
    const holeRanks = holeCards.map((c) => c.rank);
    const holePairsWithBoard = holeRanks.filter((r) => boardRanks.includes(r));
    if (holePairsWithBoard.length >= 2) return 'STRONG_MADE';
    return 'MEDIUM_MADE';
  }

  if (category === 'PAIR') {
    return classifyPairStrength(holeCards, communityCards, handRank);
  }

  // High card — check for draws
  const allCards = [...holeCards, ...communityCards];
  const flushDraw = hasFlushDraw(allCards);
  const { oesd, gutshot } = hasStraightDraw(allCards);

  if (flushDraw && oesd) return 'STRONG_DRAW'; // Combo draw
  if (flushDraw) return 'STRONG_DRAW'; // Nut flush draw approximation
  if (oesd) return 'STRONG_DRAW';
  if (gutshot) return 'WEAK_DRAW';

  // Check for overcards (hero has two cards higher than any board card)
  const boardHighRank = Math.max(...communityCards.map((c) => RANK_ORDER[c.rank]));
  const heroRanks = holeCards.map((c) => RANK_ORDER[c.rank]);
  const overcards = heroRanks.filter((r) => r > boardHighRank).length;
  if (overcards >= 2) return 'BLUFF_CATCHER'; // Overcards have some equity
  if (overcards === 1) return 'AIR';

  return 'AIR';
}

function classifyPairStrength(
  holeCards: Card[],
  communityCards: Card[],
  handRank: HandRank,
): HandCategory {
  const sortedBoard = communityCards
    .map((c) => RANK_ORDER[c.rank])
    .sort((a, b) => b - a);

  // Find which pair we have
  const pairRankStr = handRank.bestFive
    .map((c) => RANK_ORDER[c.rank])
    .reduce((acc: Map<number, number>, r) => {
      acc.set(r, (acc.get(r) ?? 0) + 1);
      return acc;
    }, new Map());

  let pairRank = 0;
  pairRankStr.forEach((count, rank) => {
    if (count >= 2) pairRank = rank;
  });

  const holeRanks = holeCards.map((c) => RANK_ORDER[c.rank]);
  const pairMadeWithHoleCard = holeRanks.includes(pairRank);

  if (!pairMadeWithHoleCard) {
    // Paired board, we don't have a pair from our hole cards
    return 'BLUFF_CATCHER';
  }

  // Overpair: our pair is higher than any board card
  if (pairRank > (sortedBoard[0] ?? 0)) return 'STRONG_MADE';

  // Top pair: paired with the highest board card
  if (pairRank === sortedBoard[0]) {
    // Check kicker quality (average = 8)
    const kicker = Math.max(...holeRanks.filter((r) => r !== pairRank));
    if (kicker >= 10) return 'STRONG_MADE'; // TPTK
    return 'MEDIUM_MADE'; // TP weak kicker
  }

  // Middle or bottom pair
  if (pairRank === sortedBoard[1]) return 'MEDIUM_MADE';
  return 'WEAK_MADE';
}

export function handCategoryLabel(cat: HandCategory): string {
  const labels: Record<HandCategory, string> = {
    PREMIUM: 'Premium Hand',
    STRONG_MADE: 'Strong Made Hand',
    MEDIUM_MADE: 'Medium Made Hand',
    WEAK_MADE: 'Weak Made Hand',
    STRONG_DRAW: 'Strong Draw',
    WEAK_DRAW: 'Weak Draw',
    BLUFF_CATCHER: 'Bluff Catcher',
    AIR: 'Air / Missed',
    PREFLOP_STRONG: 'Strong Preflop Hand',
    PREFLOP_MEDIUM: 'Medium Preflop Hand',
    PREFLOP_SPECULATIVE: 'Speculative Hand',
    PREFLOP_WEAK: 'Weak Preflop Hand',
  } as Record<HandCategory, string>;
  return labels[cat] ?? cat;
}
