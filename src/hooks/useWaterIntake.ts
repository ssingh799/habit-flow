import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface WaterEntry {
  date: string;
  glasses: number;
  goal: number;
}

export function useWaterIntake() {
  const [todayEntry, setTodayEntry] = useState<WaterEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchTodayWater = useCallback(async () => {
    if (!user) {
      setTodayEntry(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (!error && data) {
      setTodayEntry({
        date: data.date,
        glasses: data.glasses,
        goal: data.goal,
      });
    } else {
      setTodayEntry(null);
    }
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchTodayWater();
  }, [fetchTodayWater]);

  const addGlass = useCallback(async () => {
    if (!user) return;

    const currentGlasses = todayEntry?.glasses ?? 0;
    const newGlasses = currentGlasses + 1;

    const { error } = await supabase
      .from('water_intake')
      .upsert({
        user_id: user.id,
        date: today,
        glasses: newGlasses,
        goal: todayEntry?.goal ?? 8,
      }, { onConflict: 'user_id,date' });

    if (!error) {
      setTodayEntry(prev => ({
        date: today,
        glasses: newGlasses,
        goal: prev?.goal ?? 8,
      }));
    }
  }, [user, today, todayEntry]);

  const removeGlass = useCallback(async () => {
    if (!user || !todayEntry || todayEntry.glasses <= 0) return;

    const newGlasses = todayEntry.glasses - 1;

    const { error } = await supabase
      .from('water_intake')
      .update({ glasses: newGlasses })
      .eq('user_id', user.id)
      .eq('date', today);

    if (!error) {
      setTodayEntry(prev => prev ? { ...prev, glasses: newGlasses } : null);
    }
  }, [user, today, todayEntry]);

  const setGoal = useCallback(async (goal: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('water_intake')
      .upsert({
        user_id: user.id,
        date: today,
        glasses: todayEntry?.glasses ?? 0,
        goal,
      }, { onConflict: 'user_id,date' });

    if (!error) {
      setTodayEntry(prev => ({
        date: today,
        glasses: prev?.glasses ?? 0,
        goal,
      }));
    }
  }, [user, today, todayEntry]);

  const getProgress = useCallback((): number => {
    if (!todayEntry || todayEntry.goal === 0) return 0;
    return Math.min(100, (todayEntry.glasses / todayEntry.goal) * 100);
  }, [todayEntry]);

  return {
    todayEntry,
    loading,
    addGlass,
    removeGlass,
    setGoal,
    getProgress,
    refetch: fetchTodayWater,
  };
}
