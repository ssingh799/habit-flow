import { useState, useEffect, useCallback } from 'react';
import { MoodEntry, MoodTag } from '@/types/habit';
import { format, subDays, parseISO } from 'date-fns';

const MOOD_KEY = 'habit-tracker-mood';

export interface DailyMoodData {
  date: string;
  displayDate: string;
  mood: number | null;
}

export function useMood() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(MOOD_KEY);
    if (stored) setMoodEntries(JSON.parse(stored));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(MOOD_KEY, JSON.stringify(moodEntries));
  }, [moodEntries]);

  const setMood = useCallback((date: string, mood: number, notes?: string, tags: MoodTag[] = []) => {
    setMoodEntries(prev => {
      const existing = prev.find(e => e.date === date);
      if (existing) {
        return prev.map(e =>
          e.date === date
            ? { ...e, mood, notes, tags, createdAt: new Date().toISOString() }
            : e
        );
      }
      return [...prev, { date, mood, notes, tags, createdAt: new Date().toISOString() }];
    });
  }, []);

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

  const getMonthMoodData = useCallback((days: number = 30): DailyMoodData[] => {
    const data: DailyMoodData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = getMoodForDate(dateStr);
      data.push({
        date: dateStr,
        displayDate: format(date, 'MMM d'),
        mood: entry?.mood ?? null,
      });
    }
    return data;
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
    setMood,
    getMoodForDate,
    getTodayMood,
    getWeekMoodData,
    getMonthMoodData,
    getAverageMood,
  };
}
