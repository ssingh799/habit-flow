import { Droplet, Plus, Minus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function WaterTracker() {
  const { todayEntry, addGlass, removeGlass, setGoal, getProgress, loading } = useWaterIntake();
  const [goalInput, setGoalInput] = useState('8');

  const glasses = todayEntry?.glasses ?? 0;
  const goal = todayEntry?.goal ?? 8;
  const progress = getProgress();

  const handleSetGoal = () => {
    const newGoal = parseInt(goalInput);
    if (newGoal > 0 && newGoal <= 20) {
      setGoal(newGoal);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-foreground">Water Intake</h3>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <Label htmlFor="goal">Daily Goal (glasses)</Label>
              <div className="flex gap-2">
                <Input
                  id="goal"
                  type="number"
                  min="1"
                  max="20"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="h-8"
                />
                <Button size="sm" onClick={handleSetGoal}>Set</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={removeGlass}
          disabled={glasses <= 0}
          className="h-10 w-10 rounded-full"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-foreground">{glasses}</span>
            <span className="text-lg text-muted-foreground">/ {goal}</span>
          </div>
          <p className="text-sm text-muted-foreground">glasses</p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={addGlass}
          className="h-10 w-10 rounded-full bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
        >
          <Plus className="h-4 w-4 text-blue-500" />
        </Button>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {progress >= 100 ? '🎉 Goal reached!' : `${Math.round(progress)}% of daily goal`}
        </p>
      </div>
    </div>
  );
}
