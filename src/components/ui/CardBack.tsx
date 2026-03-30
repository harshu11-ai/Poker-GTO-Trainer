interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-11',
  md: 'w-11 h-16',
  lg: 'w-14 h-20',
};

export function CardBack({ size = 'md', className = '' }: CardBackProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-lg border border-blue-900 shadow-md overflow-hidden select-none ${className}`}
      style={{
        background: 'repeating-diagonal-gradient(45deg, #1e3a5f 0px, #1e3a5f 4px, #2563eb 4px, #2563eb 8px)',
        backgroundImage: 'repeating-linear-gradient(45deg, #1e3a5f 0, #1e3a5f 4px, #2563eb 4px, #2563eb 8px)',
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3/4 h-3/4 border border-blue-400 rounded opacity-50" />
      </div>
    </div>
  );
}
