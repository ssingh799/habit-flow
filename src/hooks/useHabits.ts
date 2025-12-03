import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitCompletion, Category, Frequency, DailyProgress } from '@/types/habit';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO } from 'date-fns';

const HABITS_KEY = 'habit-tracker-habits';
const COMPLETIONS_KEY = 'habit-tracker-completions';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  // Load from localStorage
  useEffect(() => {
    const storedHabits = localStorage.getItem(HABITS_KEY);
    const storedCompletions = localStorage.getItem(COMPLETIONS_KEY);
    
    if (storedHabits) setHabits(JSON.parse(storedHabits));
    if (storedCompletions) setCompletions(JSON.parse(storedCompletions));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  }, [completions]);

  const addHabit = useCallback((name: string, category: Category, frequency: Frequency) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      category,
      frequency,
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => prev.filter(c => c.habitId !== id));
  }, []);

  const toggleCompletion = useCallback((habitId: string, date: string) => {
    setCompletions(prev => {
      const existing = prev.find(c => c.habitId === habitId && c.date === date);
      if (existing) {
        return prev.map(c => 
          c.habitId === habitId && c.date === date 
            ? { ...c, completed: !c.completed }
            : c
        );
      }
      return [...prev, { habitId, date, completed: true }];
    });
  }, []);

  const isCompleted = useCallback((habitId: string, date: string) => {
    const completion = completions.find(c => c.habitId === habitId && c.date === date);
    return completion?.completed ?? false;
  }, [completions]);

  const getDailyProgress = useCallback((date: string): DailyProgress => {
    const dayHabits = habits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekly') {
        const dayOfWeek = parseISO(date).getDay();
        return dayOfWeek === 1; // Monday
      }
      if (h.frequency === 'monthly') {
        const dayOfMonth = parseISO(date).getDate();
        return dayOfMonth === 1;
      }
      return false;
    });

    const completed = dayHabits.filter(h => isCompleted(h.id, date)).length;
    const total = dayHabits.length;

    return {
      date,
      completed,
      total,
      rate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [habits, isCompleted]);

  const getWeekProgress = useCallback((date: Date = new Date()): DailyProgress[] => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => getDailyProgress(format(day, 'yyyy-MM-dd')));
  }, [getDailyProgress]);

  const getMonthProgress = useCallback((days: number = 30): DailyProgress[] => {
    const today = new Date();
    const progress: DailyProgress[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      progress.push(getDailyProgress(format(date, 'yyyy-MM-dd')));
    }
    
    return progress;
  }, [getDailyProgress]);

  const getHabitsByCategory = useCallback((category?: Category) => {
    if (!category) return habits;
    return habits.filter(h => h.category === category);
  }, [habits]);

  const getTodayStats = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    const completed = dailyHabits.filter(h => isCompleted(h.id, today)).length;
    
    return {
      total: dailyHabits.length,
      completed,
      pending: dailyHabits.length - completed,
      rate: dailyHabits.length > 0 ? Math.round((completed / dailyHabits.length) * 100) : 0,
    };
  }, [habits, isCompleted]);

  return {
    habits,
    completions,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    getDailyProgress,
    getWeekProgress,
    getMonthProgress,
    getHabitsByCategory,
    getTodayStats,
  };
}
