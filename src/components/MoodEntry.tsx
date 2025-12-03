import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Smile, Meh, Frown, Sparkles, Zap, Battery, Heart, AlertCircle, Wind, Target, CloudRain } from 'lucide-react';
import { MoodTag, MoodEntry as MoodEntryType } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MoodEntryProps {
  date?: Date;
  existingEntry?: MoodEntryType;
  onSave: (date: string, mood: number, notes?: string, tags?: MoodTag[]) => void;
}

const moodTags: { value: MoodTag; label: string; icon: React.ElementType }[] = [
  { value: 'stressed', label: 'Stressed', icon: AlertCircle },
  { value: 'energetic', label: 'Energetic', icon: Zap },
  { value: 'tired', label: 'Tired', icon: Battery },
  { value: 'happy', label: 'Happy', icon: Heart },
  { value: 'anxious', label: 'Anxious', icon: Wind },
  { value: 'calm', label: 'Calm', icon: Sparkles },
  { value: 'motivated', label: 'Motivated', icon: Target },
  { value: 'sad', label: 'Sad', icon: CloudRain },
];

const getMoodEmoji = (mood: number) => {
  if (mood <= 3) return { icon: Frown, color: 'text-destructive', label: 'Low' };
  if (mood <= 6) return { icon: Meh, color: 'text-warning', label: 'Okay' };
  return { icon: Smile, color: 'text-accent', label: 'Great' };
};

const getMoodColor = (mood: number) => {
  if (mood <= 3) return 'hsl(var(--destructive))';
  if (mood <= 6) return 'hsl(var(--warning))';
  return 'hsl(var(--accent))';
};

export function MoodEntry({ date = new Date(), existingEntry, onSave }: MoodEntryProps) {
  const [mood, setMood] = useState(existingEntry?.mood ?? 5);
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');
  const [selectedTags, setSelectedTags] = useState<MoodTag[]>(existingEntry?.tags ?? []);
  const [hasChanges, setHasChanges] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const moodInfo = getMoodEmoji(mood);
  const MoodIcon = moodInfo.icon;

  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood);
      setNotes(existingEntry.notes ?? '');
      setSelectedTags(existingEntry.tags ?? []);
      setHasChanges(false);
    }
  }, [existingEntry]);

  const toggleTag = (tag: MoodTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(dateStr, mood, notes || undefined, selectedTags);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Mood Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">How are you feeling?</span>
          <div className="flex items-center gap-2">
            <MoodIcon className={cn('h-6 w-6', moodInfo.color)} />
            <span className="text-2xl font-bold" style={{ color: getMoodColor(mood) }}>
              {mood}
            </span>
            <span className="text-sm text-muted-foreground">/10</span>
          </div>
        </div>
        
        <div className="relative pt-2 pb-4">
          <Slider
            value={[mood]}
            min={1}
            max={10}
            step={1}
            onValueChange={([value]) => {
              setMood(value);
              setHasChanges(true);
            }}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Visual mood indicator */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-full max-w-[24px] rounded-full transition-all duration-200',
                i < mood ? 'opacity-100' : 'opacity-20'
              )}
              style={{ backgroundColor: getMoodColor(mood) }}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-muted-foreground">Tags (optional)</span>
        <div className="flex flex-wrap gap-2">
          {moodTags.map(({ value, label, icon: Icon }) => (
            <Badge
              key={value}
              variant={selectedTags.includes(value) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:scale-105',
                selectedTags.includes(value)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
              onClick={() => toggleTag(value)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-muted-foreground">Notes (optional)</span>
        <Textarea
          placeholder="How was your day? What affected your mood?"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setHasChanges(true);
          }}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full gradient-primary text-primary-foreground"
        disabled={!hasChanges && !!existingEntry}
      >
        {existingEntry ? 'Update Mood' : 'Save Mood'}
      </Button>
    </div>
  );
}
