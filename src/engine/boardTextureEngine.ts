import type { Card } from '@/types/cards';
import type { BoardTexture } from '@/types/feedback';
import { RANK_ORDER } from '@/types/cards';

export function classifyBoardTexture(communityCards: Card[]): BoardTexture {
  if (communityCards.length === 0) return 'DRY';

  const cards = communityCards.slice(0, Math.min(communityCards.length, 5));

  // Check for paired board
  const rankCounts = new Map<string, number>();
  for (const c of cards) {
    rankCounts.set(c.rank, (rankCounts.get(c.rank) ?? 0) + 1);
  }
  const maxPairCount = Math.max(...rankCounts.values());
  if (maxPairCount >= 2) {
    const pairCount = [...rankCounts.values()].filter((v) => v >= 2).length;
    return pairCount >= 2 ? 'DOUBLE_PAIRED' : 'PAIRED';
  }

  // Check for monotone (3 cards same suit)
  const suitCounts = new Map<string, number>();
  for (const c of cards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }
  if (Math.max(...suitCounts.values()) >= 3) return 'MONOTONE';

  // Check for two-tone (two cards same suit = flush draw possible)
  const hasTwoTone = Math.max(...suitCounts.values()) >= 2;

  // Check connectivity
  const sortedRanks = cards
    .map((c) => RANK_ORDER[c.rank])
    .sort((a, b) => b - a);
  const isConnected = checkConnectivity(sortedRanks);

  if (hasTwoTone && isConnected) return 'WET';
  if (hasTwoTone || isConnected) return 'SEMI_WET';
  return 'DRY';
}

function checkConnectivity(sortedRanks: number[]): boolean {
  if (sortedRanks.length < 2) return false;
  let gaps = 0;
  let connectedPairs = 0;
  for (let i = 0; i < sortedRanks.length - 1; i++) {
    const gap = sortedRanks[i] - sortedRanks[i + 1];
    if (gap <= 2) connectedPairs++;
    gaps += gap;
  }
  const avgGap = gaps / (sortedRanks.length - 1);
  return avgGap <= 2.5 || connectedPairs >= 2;
}

export function hasFlushDraw(cards: Card[]): boolean {
  const suitCounts = new Map<string, number>();
  for (const c of cards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }
  return Math.max(...suitCounts.values()) >= 4;
}

export function hasStraightDraw(cards: Card[]): { oesd: boolean; gutshot: boolean } {
  const ranks = [...new Set(cards.map((c) => RANK_ORDER[c.rank]))].sort((a, b) => b - a);
  // Add low ace
  if (ranks.includes(14)) ranks.push(1);

  let oesd = false;
  let gutshot = false;

  for (let i = 0; i < ranks.length - 3; i++) {
    const window = ranks.slice(i, i + 5);
    if (window.length < 4) continue;
    const span = window[0] - window[window.length - 1];
    const uniqueInWindow = new Set(window).size;
    if (span === 3 && uniqueInWindow === 4) oesd = true; // 4 consecutive
    if (span === 4 && uniqueInWindow === 4) gutshot = true; // 4 with 1 gap
  }

  return { oesd, gutshot };
}

export function boardTextureName(texture: BoardTexture): string {
  const names: Record<BoardTexture, string> = {
    DRY: 'Dry',
    SEMI_WET: 'Semi-Wet',
    WET: 'Wet',
    MONOTONE: 'Monotone',
    PAIRED: 'Paired',
    DOUBLE_PAIRED: 'Double-Paired',
  };
  return names[texture];
}
