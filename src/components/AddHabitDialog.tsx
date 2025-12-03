import { useState } from 'react';
import { Category, Frequency, Habit } from '@/types/habit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Briefcase, User, Dumbbell, BookOpen } from 'lucide-react';

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, category: Category, frequency: Frequency) => void;
  editingHabit?: Habit | null;
  onUpdate?: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
}

const categories: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: 'health', label: 'Health', icon: <Heart className="h-4 w-4" /> },
  { value: 'work', label: 'Work', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'personal', label: 'Personal', icon: <User className="h-4 w-4" /> },
  { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="h-4 w-4" /> },
  { value: 'learning', label: 'Learning', icon: <BookOpen className="h-4 w-4" /> },
];

const frequencies: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function AddHabitDialog({ open, onOpenChange, onAdd, editingHabit, onUpdate }: AddHabitDialogProps) {
  const [name, setName] = useState(editingHabit?.name ?? '');
  const [category, setCategory] = useState<Category>(editingHabit?.category ?? 'health');
  const [frequency, setFrequency] = useState<Frequency>(editingHabit?.frequency ?? 'daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingHabit && onUpdate) {
      onUpdate(editingHabit.id, { name: name.trim(), category, frequency });
    } else {
      onAdd(name.trim(), category, frequency);
    }

    setName('');
    setCategory('health');
    setFrequency('daily');
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
      setCategory('health');
      setFrequency('daily');
    } else if (editingHabit) {
      setName(editingHabit.name);
      setCategory(editingHabit.category);
      setFrequency(editingHabit.frequency);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingHabit ? 'Edit Habit' : 'Add New Habit'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Habit Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary text-primary-foreground"
              disabled={!name.trim()}
            >
              {editingHabit ? 'Update' : 'Add Habit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
