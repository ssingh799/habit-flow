import { useState } from 'react';
import { Habit, Category } from '@/types/habit';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Heart, Briefcase, User, Dumbbell, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  health: <Heart className="h-4 w-4" />,
  work: <Briefcase className="h-4 w-4" />,
  personal: <User className="h-4 w-4" />,
  fitness: <Dumbbell className="h-4 w-4" />,
  learning: <BookOpen className="h-4 w-4" />,
};

const categoryStyles: Record<Category, string> = {
  health: 'bg-category-health/10 text-category-health',
  work: 'bg-category-work/10 text-category-work',
  personal: 'bg-category-personal/10 text-category-personal',
  fitness: 'bg-category-fitness/10 text-category-fitness',
  learning: 'bg-category-learning/10 text-category-learning',
};

export function HabitCard({ habit, isCompleted, onToggle, onEdit, onDelete }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (!isCompleted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    onToggle();
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl bg-card shadow-card transition-all duration-300",
        "hover:shadow-card-hover",
        isCompleted && "bg-accent/5 border border-accent/20"
      )}
    >
      {/* Completion indicator line */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300",
          isCompleted ? "bg-accent" : "bg-muted"
        )}
      />

      {/* Checkbox */}
      <div className={cn("relative", isAnimating && "animate-check-bounce")}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className="h-6 w-6"
        />
        {isAnimating && (
          <div className="absolute inset-0 rounded-md bg-accent/30 animate-pulse-ring" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-semibold text-foreground transition-all duration-200",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {habit.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              categoryStyles[habit.category]
            )}
          >
            {categoryIcons[habit.category]}
            {habit.category}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {habit.frequency}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
