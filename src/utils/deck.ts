import type { Card, Deck, Rank, Suit } from '@/types/cards';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

const SUIT_SHORT: Record<Suit, string> = {
  spades: 's',
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
};

export function createDeck(): Deck {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, id: `${rank}${SUIT_SHORT[suit]}` });
    }
  }
  return deck;
}

// Fisher-Yates shuffle — returns a new array, never mutates
export function shuffleDeck(deck: Deck): Deck {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function dealCards(deck: Deck, count: number): { cards: Card[]; remaining: Deck } {
  if (count > deck.length) throw new Error('Not enough cards in deck');
  return {
    cards: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

export function removeCards(deck: Deck, toRemove: Card[]): Deck {
  const removeIds = new Set(toRemove.map((c) => c.id));
  return deck.filter((c) => !removeIds.has(c.id));
}
