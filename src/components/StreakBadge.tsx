import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, className, size = 'sm' }: StreakBadgeProps) {
  if (streak <= 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        streak >= 30 ? 'bg-amber-500/20 text-amber-500' :
        streak >= 7 ? 'bg-orange-500/20 text-orange-500' :
        'bg-primary/20 text-primary',
        sizeClasses[size],
        className
      )}
    >
      <Flame className={cn(iconSizes[size], 'animate-pulse')} />
      <span>{streak}</span>
    </div>
  );
}
