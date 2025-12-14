import { useState, useEffect, useCallback } from 'react';
import { MoodEntry, MoodTag } from '@/types/habit';
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DailyMoodData {
  date: string;
  displayDate: string;
  mood: number | null;
}

export function useMood() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch mood entries from database
  useEffect(() => {
    if (!user) {
      setMoodEntries([]);
      setLoading(false);
      return;
    }

    const fetchMoodEntries = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'Error loading mood entries', description: error.message, variant: 'destructive' });
      } else {
        setMoodEntries(data.map(e => ({
          date: e.date,
          mood: e.mood,
          notes: e.notes ?? undefined,
          tags: (e.tags ?? []) as MoodTag[],
          createdAt: e.created_at,
        })));
      }
      
      setLoading(false);
    };

    fetchMoodEntries();
  }, [user, toast]);

  const setMood = useCallback(async (date: string, mood: number, notes?: string, tags: MoodTag[] = []) => {
    if (!user) return;

    const existing = moodEntries.find(e => e.date === date);
    
    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('mood_entries')
        .update({ mood, notes, tags })
        .eq('user_id', user.id)
        .eq('date', date);

      if (error) {
        toast({ title: 'Error updating mood', description: error.message, variant: 'destructive' });
        return;
      }

      setMoodEntries(prev => prev.map(e =>
        e.date === date
          ? { ...e, mood, notes, tags, createdAt: new Date().toISOString() }
          : e
      ));
    } else {
      // Create new entry
      const { error } = await supabase
        .from('mood_entries')
        .insert({ user_id: user.id, date, mood, notes, tags });

      if (error) {
        toast({ title: 'Error saving mood', description: error.message, variant: 'destructive' });
        return;
      }

      setMoodEntries(prev => [...prev, { date, mood, notes, tags, createdAt: new Date().toISOString() }]);
    }
  }, [user, moodEntries, toast]);

  const getMoodForDate = useCallback((date: string): MoodEntry | undefined => {
    return moodEntries.find(e => e.date === date);
  }, [moodEntries]);

  const getTodayMood = useCallback((): MoodEntry | undefined => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return getMoodForDate(today);
  }, [getMoodForDate]);

  const getWeekMoodData = useCallback((): DailyMoodData[] => {
    const data: DailyMoodData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = getMoodForDate(dateStr);
      data.push({
        date: dateStr,
        displayDate: format(date, 'EEE'),
        mood: entry?.mood ?? null,
      });
    }
    return data;
  }, [getMoodForDate]);

  const getMonthMoodData = useCallback((referenceDate: Date = new Date()): DailyMoodData[] => {
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);
    const today = new Date();
    
    // For current month, only show up to today; for past months, show full month
    const endDate = monthEnd > today ? today : monthEnd;
    
    const days = eachDayOfInterval({ start: monthStart, end: endDate });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = getMoodForDate(dateStr);
      return {
        date: dateStr,
        displayDate: format(day, 'MMM d'),
        mood: entry?.mood ?? null,
      };
    });
  }, [getMoodForDate]);

  const getAverageMood = useCallback((days: number = 7): number | null => {
    const recentEntries = moodEntries.filter(e => {
      const entryDate = parseISO(e.date);
      const cutoff = subDays(new Date(), days);
      return entryDate >= cutoff;
    });
    if (recentEntries.length === 0) return null;
    const sum = recentEntries.reduce((acc, e) => acc + e.mood, 0);
    return Math.round((sum / recentEntries.length) * 10) / 10;
  }, [moodEntries]);

  return {
    moodEntries,
    loading,
    setMood,
    getMoodForDate,
    getTodayMood,
    getWeekMoodData,
    getMonthMoodData,
    getAverageMood,
  };
}
