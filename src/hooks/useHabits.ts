import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitCompletion, Category, Frequency, DailyProgress } from '@/types/habit';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO, startOfMonth, endOfMonth, getDay, getDate } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Helper to check if a habit should be active on a given date based on its frequency
const isHabitActiveOnDate = (habit: Habit, date: Date): boolean => {
  const createdDate = parseISO(habit.createdAt.split('T')[0]);
  
  // Habit must exist on or before this date
  if (createdDate > date) return false;
  
  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      // Show weekly habits on the same day of the week they were created
      return getDay(date) === getDay(createdDate);
    case 'monthly':
      // Show monthly habits on the same day of the month they were created
      // Handle edge cases where the day doesn't exist in shorter months
      const createdDayOfMonth = getDate(createdDate);
      const currentDayOfMonth = getDate(date);
      const lastDayOfMonth = getDate(endOfMonth(date));
      // If the habit was created on day 31 but current month only has 30 days, show on last day
      if (createdDayOfMonth > lastDayOfMonth) {
        return currentDayOfMonth === lastDayOfMonth;
      }
      return currentDayOfMonth === createdDayOfMonth;
    default:
      return true;
  }
};

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch habits from database
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const [habitsRes, completionsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_completions').select('*').eq('user_id', user.id),
      ]);

      if (habitsRes.error) {
        toast({ title: 'Error loading habits', description: habitsRes.error.message, variant: 'destructive' });
      } else {
        setHabits(habitsRes.data.map(h => ({
          id: h.id,
          name: h.name,
          category: h.category as Category,
          frequency: h.frequency as Frequency,
          createdAt: h.created_at,
        })));
      }

      if (completionsRes.error) {
        toast({ title: 'Error loading completions', description: completionsRes.error.message, variant: 'destructive' });
      } else {
        setCompletions(completionsRes.data.map(c => ({
          habitId: c.habit_id,
          date: c.date,
          completed: c.completed,
          durationSeconds: c.duration_seconds,
        })));
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user, toast]);

  const addHabit = useCallback(async (name: string, category: Category, frequency: Frequency) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: user.id, name, category, frequency })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error adding habit', description: error.message, variant: 'destructive' });
      return null;
    }

    const newHabit: Habit = {
      id: data.id,
      name: data.name,
      category: data.category as Category,
      frequency: data.frequency as Frequency,
      createdAt: data.created_at,
    };
    
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, [user, toast]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating habit', description: error.message, variant: 'destructive' });
      return;
    }

    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, [toast]);

  const deleteHabit = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting habit', description: error.message, variant: 'destructive' });
      return;
    }

    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => prev.filter(c => c.habitId !== id));
  }, [toast]);

  const toggleCompletion = useCallback(async (habitId: string, date: string, durationSeconds?: number) => {
    if (!user) return;

    const existing = completions.find(c => c.habitId === habitId && c.date === date);
    
    if (existing) {
      // Update existing completion
      const newCompleted = !existing.completed;
      const { error } = await supabase
        .from('habit_completions')
        .update({ 
          completed: newCompleted,
          duration_seconds: newCompleted ? (durationSeconds ?? existing.durationSeconds) : null
        })
        .eq('habit_id', habitId)
        .eq('date', date);

      if (error) {
        toast({ title: 'Error updating completion', description: error.message, variant: 'destructive' });
        return;
      }

      setCompletions(prev => 
        prev.map(c => 
          c.habitId === habitId && c.date === date 
            ? { ...c, completed: newCompleted, durationSeconds: newCompleted ? (durationSeconds ?? c.durationSeconds) : null }
            : c
        )
      );
    } else {
      // Create new completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({ 
          user_id: user.id, 
          habit_id: habitId, 
          date, 
          completed: true,
          duration_seconds: durationSeconds ?? null
        });

      if (error) {
        toast({ title: 'Error saving completion', description: error.message, variant: 'destructive' });
        return;
      }

      setCompletions(prev => [...prev, { habitId, date, completed: true, durationSeconds: durationSeconds ?? null }]);
    }
  }, [user, completions, toast]);

  const getCompletionDuration = useCallback((habitId: string, date: string): number | null => {
    const completion = completions.find(c => c.habitId === habitId && c.date === date);
    return completion?.durationSeconds ?? null;
  }, [completions]);

  const isCompleted = useCallback((habitId: string, date: string) => {
    const completion = completions.find(c => c.habitId === habitId && c.date === date);
    return completion?.completed ?? false;
  }, [completions]);

  // Get habits that should be active on a specific date (considering frequency)
  const getHabitsForDate = useCallback((date: Date): Habit[] => {
    return habits.filter(h => isHabitActiveOnDate(h, date));
  }, [habits]);

  const getDailyProgress = useCallback((date: string): DailyProgress => {
    const dateObj = parseISO(date);
    const dayHabits = getHabitsForDate(dateObj);

    const completed = dayHabits.filter(h => isCompleted(h.id, date)).length;
    const total = dayHabits.length;

    return {
      date,
      completed,
      total,
      rate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [getHabitsForDate, isCompleted]);

  const getWeekProgress = useCallback((date: Date = new Date()): DailyProgress[] => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => getDailyProgress(format(day, 'yyyy-MM-dd')));
  }, [getDailyProgress]);

  const getMonthProgress = useCallback((referenceDate: Date = new Date()): DailyProgress[] => {
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);
    const today = new Date();
    
    // For current month, only show up to today; for past months, show full month
    const endDate = monthEnd > today ? today : monthEnd;
    
    const days = eachDayOfInterval({ start: monthStart, end: endDate });
    
    return days.map(day => getDailyProgress(format(day, 'yyyy-MM-dd')));
  }, [getDailyProgress]);

  const getHabitsByCategory = useCallback((category?: Category) => {
    if (!category) return habits;
    return habits.filter(h => h.category === category);
  }, [habits]);

  const getTodayStats = useCallback(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayHabits = getHabitsForDate(today);
    const completed = todayHabits.filter(h => isCompleted(h.id, todayStr)).length;
    
    return {
      total: todayHabits.length,
      completed,
      pending: todayHabits.length - completed,
      rate: todayHabits.length > 0 ? Math.round((completed / todayHabits.length) * 100) : 0,
    };
  }, [getHabitsForDate, isCompleted]);

  return {
    habits,
    completions,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    getCompletionDuration,
    getHabitsForDate,
    getDailyProgress,
    getWeekProgress,
    getMonthProgress,
    getHabitsByCategory,
    getTodayStats,
  };
}
