import { Moon, Sun, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSleep } from '@/hooks/useSleep';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function SleepTracker() {
  const { getTodaySleep, logSleep, getAverageDuration, getAverageQuality, loading } = useSleep();
  const todaySleep = getTodaySleep();

  const [bedtime, setBedtime] = useState(todaySleep?.bedtime ?? '');
  const [wakeTime, setWakeTime] = useState(todaySleep?.wakeTime ?? '');
  const [quality, setQuality] = useState(todaySleep?.quality ?? 0);

  useEffect(() => {
    if (todaySleep) {
      setBedtime(todaySleep.bedtime ?? '');
      setWakeTime(todaySleep.wakeTime ?? '');
      setQuality(todaySleep.quality ?? 0);
    }
  }, [todaySleep]);

  const handleSave = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    logSleep(
      today,
      bedtime || null,
      wakeTime || null,
      quality > 0 ? quality : null
    );
  };

  const avgDuration = getAverageDuration();
  const avgQuality = getAverageQuality();

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 animate-pulse">
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Moon className="h-5 w-5 text-indigo-500" />
        <h3 className="font-semibold text-foreground">Sleep Tracker</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <Label htmlFor="bedtime" className="text-xs flex items-center gap-1">
            <Moon className="h-3 w-3" /> Bedtime
          </Label>
          <Input
            id="bedtime"
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="waketime" className="text-xs flex items-center gap-1">
            <Sun className="h-3 w-3" /> Wake Time
          </Label>
          <Input
            id="waketime"
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="mb-4">
        <Label className="text-xs flex items-center gap-1 mb-2">
          <Star className="h-3 w-3" /> Sleep Quality
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setQuality(star)}
              className={cn(
                'p-1 rounded transition-colors',
                quality >= star ? 'text-yellow-500' : 'text-muted-foreground/30'
              )}
            >
              <Star className={cn('h-6 w-6', quality >= star && 'fill-current')} />
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full mb-4" size="sm">
        {todaySleep ? 'Update' : 'Log Sleep'}
      </Button>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-semibold text-foreground">
            {avgDuration !== null ? `${avgDuration}h` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">Avg Duration</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-semibold text-foreground">
            {avgQuality !== null ? `${avgQuality}/5` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">Avg Quality</p>
        </div>
      </div>
    </div>
  );
}
