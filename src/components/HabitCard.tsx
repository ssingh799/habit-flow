import { useState } from 'react';
import { Habit, Category } from '@/types/habit';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Heart, Briefcase, User, Dumbbell, BookOpen, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { HabitTimer } from './HabitTimer';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  durationSeconds?: number | null;
  onToggle: (durationSeconds?: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  health: <Heart className="h-3 w-3 sm:h-4 sm:w-4" />,
  work: <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />,
  personal: <User className="h-3 w-3 sm:h-4 sm:w-4" />,
  fitness: <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />,
  learning: <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />,
};

const categoryStyles: Record<Category, string> = {
  health: 'bg-category-health/10 text-category-health',
  work: 'bg-category-work/10 text-category-work',
  personal: 'bg-category-personal/10 text-category-personal',
  fitness: 'bg-category-fitness/10 text-category-fitness',
  learning: 'bg-category-learning/10 text-category-learning',
};

// Format duration for display
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export function HabitCard({ habit, isCompleted, durationSeconds, onToggle, onEdit, onDelete }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const handleToggle = () => {
    if (!isCompleted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    onToggle();
  };

  const handleTimerComplete = (duration: number) => {
    setShowTimer(false);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggle(duration);
  };

  const handleOpenTimer = () => {
    setShowTimer(true);
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-card shadow-card transition-all duration-300",
          "hover:shadow-card-hover",
          isCompleted && "bg-accent/5 border border-accent/20"
        )}
      >
        {/* Completion indicator line */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg sm:rounded-l-xl transition-all duration-300",
            isCompleted ? "bg-accent" : "bg-muted"
          )}
        />

        {/* Checkbox */}
        <div className={cn("relative", isAnimating && "animate-check-bounce")}>
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggle}
            className="h-5 w-5 sm:h-6 sm:w-6"
          />
          {isAnimating && (
            <div className="absolute inset-0 rounded-md bg-accent/30 animate-pulse-ring" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold text-sm sm:text-base text-foreground transition-all duration-200 truncate",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {habit.name}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                categoryStyles[habit.category]
              )}
            >
              {categoryIcons[habit.category]}
              <span className="hidden xs:inline">{habit.category}</span>
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground capitalize">
              {habit.frequency}
            </span>
            {/* Duration display */}
            {isCompleted && durationSeconds && durationSeconds > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary">
                <Timer className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {formatDuration(durationSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Actions - Always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Timer button - only show when not completed */}
          {!isCompleted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:text-primary hover:bg-primary/10"
              onClick={handleOpenTimer}
              title="Start timer"
            >
              <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Timer Dialog */}
      <Dialog open={showTimer} onOpenChange={setShowTimer}>
        <DialogContent className="sm:max-w-md">
          <HabitTimer
            habitName={habit.name}
            onComplete={handleTimerComplete}
            onCancel={() => setShowTimer(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
