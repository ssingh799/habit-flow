import { Category } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, Briefcase, User, Dumbbell, BookOpen, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  selected: Category | 'all';
  onSelect: (category: Category | 'all') => void;
}

const categories: { value: Category | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <LayoutGrid className="h-4 w-4" /> },
  { value: 'health', label: 'Health', icon: <Heart className="h-4 w-4" /> },
  { value: 'work', label: 'Work', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'personal', label: 'Personal', icon: <User className="h-4 w-4" /> },
  { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="h-4 w-4" /> },
  { value: 'learning', label: 'Learning', icon: <BookOpen className="h-4 w-4" /> },
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Button
          key={cat.value}
          variant={selected === cat.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(cat.value)}
          className={cn(
            "gap-1.5 transition-all duration-200",
            selected === cat.value && "gradient-primary shadow-glow"
          )}
        >
          {cat.icon}
          {cat.label}
        </Button>
      ))}
    </div>
  );
}
