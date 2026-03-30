import type { Card as CardType } from '@/types/cards';
import { Card } from '@/components/ui/Card';
import { formatBBs } from '@/utils/cardDisplay';

interface CommunityCardsProps {
  cards: CardType[];
  pot: number;
  phase: string;
}

export function CommunityCards({ cards, pot, phase }: CommunityCardsProps) {
  const showCards = cards.length > 0 && phase !== 'PREFLOP' && phase !== 'WAITING' && phase !== 'DEALING';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Community cards */}
      <div className="flex gap-2 items-center min-h-[64px]">
        {showCards ? (
          cards.map((card) => (
            <Card key={card.id} card={card} size="md" />
          ))
        ) : (
          <div className="text-gray-500 text-sm italic">
            {phase === 'PREFLOP' || phase === 'WAITING' || phase === 'DEALING'
              ? 'Waiting for flop...'
              : ''}
          </div>
        )}
      </div>

      {/* Pot */}
      <div className="bg-black/40 px-4 py-1.5 rounded-full border border-gray-600">
        <span className="text-gray-400 text-xs">Pot: </span>
        <span className="text-white font-bold text-sm">{formatBBs(pot)}bb</span>
      </div>

      {/* Street indicator */}
      <div className="text-gray-500 text-xs uppercase tracking-wider">
        {phase === 'PREFLOP' ? 'Pre-Flop' :
         phase === 'FLOP' ? 'Flop' :
         phase === 'TURN' ? 'Turn' :
         phase === 'RIVER' ? 'River' :
         phase === 'SHOWDOWN' || phase === 'HAND_COMPLETE' ? 'Showdown' : ''}
      </div>
    </div>
  );
}
