import type { Card as CardType } from '@/types/cards';
import { Card } from '@/components/ui/Card';
import { CardBack } from '@/components/ui/CardBack';

interface HoleCardsProps {
  cards: CardType[];
  faceUp: boolean;
  size?: 'sm' | 'md' | 'lg';
  isFolded?: boolean;
}

export function HoleCards({ cards, faceUp, size = 'sm', isFolded = false }: HoleCardsProps) {
  if (cards.length === 0) {
    return (
      <div className="flex gap-0.5">
        <CardBack size={size} className={isFolded ? 'opacity-30' : ''} />
        <CardBack size={size} className={isFolded ? 'opacity-30' : ''} />
      </div>
    );
  }

  return (
    <div className={`flex gap-0.5 ${isFolded ? 'opacity-40' : ''}`}>
      {cards.map((card, i) =>
        faceUp ? (
          <Card key={card.id} card={card} size={size} />
        ) : (
          <CardBack key={i} size={size} />
        ),
      )}
    </div>
  );
}
