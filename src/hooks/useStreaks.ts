import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, parseISO } from 'date-fns';

export interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export function useStreaks() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStreaks = useCallback(async () => {
    if (!user) {
      setStreaks([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setStreaks(data.map(s => ({
        habitId: s.habit_id,
        currentStreak: s.current_streak,
        longestStreak: s.longest_streak,
        lastCompletedDate: s.last_completed_date,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  const updateStreak = useCallback(async (habitId: string, completed: boolean) => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    const existing = streaks.find(s => s.habitId === habitId);

    if (completed) {
      let newCurrentStreak = 1;
      let newLongestStreak = existing?.longestStreak ?? 0;

      if (existing?.lastCompletedDate) {
        if (existing.lastCompletedDate === yesterday) {
          // Continuing streak
          newCurrentStreak = existing.currentStreak + 1;
        } else if (existing.lastCompletedDate === today) {
          // Already completed today
          return;
        }
        // Otherwise, streak resets to 1
      }

      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);

      const { error } = await supabase
        .from('user_streaks')
        .upsert({
          user_id: user.id,
          habit_id: habitId,
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_completed_date: today,
        }, { onConflict: 'user_id,habit_id' });

      if (!error) {
        setStreaks(prev => {
          const filtered = prev.filter(s => s.habitId !== habitId);
          return [...filtered, {
            habitId,
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastCompletedDate: today,
          }];
        });
      }
    }
  }, [user, streaks]);

  const getStreak = useCallback((habitId: string): Streak | undefined => {
    return streaks.find(s => s.habitId === habitId);
  }, [streaks]);

  const getLongestStreak = useCallback((): number => {
    if (streaks.length === 0) return 0;
    return Math.max(...streaks.map(s => s.longestStreak));
  }, [streaks]);

  const getTotalStreakDays = useCallback((): number => {
    return streaks.reduce((sum, s) => sum + s.currentStreak, 0);
  }, [streaks]);

  return {
    streaks,
    loading,
    updateStreak,
    getStreak,
    getLongestStreak,
    getTotalStreakDays,
    refetch: fetchStreaks,
  };
}
