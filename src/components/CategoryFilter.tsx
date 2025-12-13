import { Category } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, Briefcase, User, Dumbbell, BookOpen, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  selected: Category | 'all';
  onSelect: (category: Category | 'all') => void;
}

const categories: { value: Category | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" /> },
  { value: 'health', label: 'Health', icon: <Heart className="h-3 w-3 sm:h-4 sm:w-4" /> },
  { value: 'work', label: 'Work', icon: <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" /> },
  { value: 'personal', label: 'Personal', icon: <User className="h-3 w-3 sm:h-4 sm:w-4" /> },
  { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" /> },
  { value: 'learning', label: 'Learning', icon: <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" /> },
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {categories.map((cat) => (
        <Button
          key={cat.value}
          variant={selected === cat.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(cat.value)}
          className={cn(
            "gap-1 sm:gap-1.5 transition-all duration-200 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs",
            selected === cat.value && "gradient-primary shadow-glow"
          )}
        >
          {cat.icon}
          <span className="hidden xs:inline sm:inline">{cat.label}</span>
        </Button>
      ))}
    </div>
  );
}
