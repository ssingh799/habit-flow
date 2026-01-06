import { Trophy, Flame, Star, Target, Droplet, Moon, Smile, Crown, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  target: Target,
  droplet: Droplet,
  moon: Moon,
  smile: Smile,
  crown: Crown,
  sunrise: Sunrise,
};

export function AchievementCard({ name, description, icon, unlocked, unlockedAt }: AchievementCardProps) {
  const IconComponent = iconMap[icon] || Trophy;

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border transition-all duration-300',
        unlocked
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg'
          : 'bg-muted/30 border-border opacity-50 grayscale'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            unlocked ? 'bg-primary/20' : 'bg-muted'
          )}
        >
          <IconComponent
            className={cn(
              'h-6 w-6',
              unlocked ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          {unlocked && unlockedAt && (
            <p className="text-xs text-primary mt-1">
              Unlocked {format(new Date(unlockedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
      {unlocked && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}
