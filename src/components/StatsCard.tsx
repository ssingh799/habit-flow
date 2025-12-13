import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "mt-0.5 sm:mt-1 text-[10px] sm:text-sm truncate",
                trend === 'up' && "text-accent",
                trend === 'down' && "text-destructive",
                trend === 'neutral' && "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-1.5 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 h-16 sm:h-24 w-16 sm:w-24 rounded-full bg-primary/5" />
    </div>
  );
}
