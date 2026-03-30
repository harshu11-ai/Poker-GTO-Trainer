import type { ActionRating } from '@/types/feedback';

interface BadgeProps {
  rating: ActionRating;
  className?: string;
}

const RATING_CLASSES: Record<ActionRating, string> = {
  BEST: 'bg-green-500 text-white',
  GOOD: 'bg-blue-500 text-white',
  OKAY: 'bg-yellow-500 text-black',
  MISTAKE: 'bg-red-500 text-white',
};

const RATING_LABELS: Record<ActionRating, string> = {
  BEST: '✓ Best Play',
  GOOD: '↑ Good Play',
  OKAY: '~ Okay Play',
  MISTAKE: '✗ Mistake',
};

export function RatingBadge({ rating, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${RATING_CLASSES[rating]} ${className}`}
    >
      {RATING_LABELS[rating]}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  gray: 'bg-gray-600 text-gray-100',
  blue: 'bg-blue-600 text-white',
  green: 'bg-green-600 text-white',
  yellow: 'bg-yellow-500 text-black',
  red: 'bg-red-600 text-white',
  purple: 'bg-purple-600 text-white',
};

export function Badge({ children, color = 'gray', className = '' }: GenericBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  );
}
