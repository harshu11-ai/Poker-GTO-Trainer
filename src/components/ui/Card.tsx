import type { Card as CardType } from '@/types/cards';
import { SUIT_SYMBOLS, SUIT_COLORS } from '@/utils/cardDisplay';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-12 h-16 text-sm',
  md: 'w-16 h-22 text-base',
  lg: 'w-20 h-28 text-lg',
};

export function Card({ card, size = 'md', className = '' }: CardProps) {
  const suitColor = SUIT_COLORS[card.suit];
  const sizeClass = SIZE_CLASSES[size];
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <div
      className={`${sizeClass} bg-white rounded-lg border border-gray-300 shadow-md flex flex-col items-start justify-between p-1 select-none ${className}`}
    >
      <div className={`font-bold leading-none ${suitColor}`}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>
      <div className={`font-bold leading-none rotate-180 self-end ${suitColor}`}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
}
