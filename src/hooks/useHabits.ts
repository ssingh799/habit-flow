import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitCompletion, Category, Frequency, DailyProgress } from '@/types/habit';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  const getDailyProgress = useCallback((date: string): DailyProgress => {
    const dayHabits = habits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekly') {
        const dayOfWeek = parseISO(date).getDay();
        return dayOfWeek === 1;
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
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    getCompletionDuration,
    getDailyProgress,
    getWeekProgress,
    getMonthProgress,
    getHabitsByCategory,
    getTodayStats,
  };
}
