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
        "relative overflow-hidden p-5 rounded-2xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "mt-1 text-sm",
                trend === 'up' && "text-accent",
                trend === 'down' && "text-destructive",
                trend === 'neutral' && "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5" />
    </div>
  );
}
