import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string | null;
  wakeTime: string | null;
  durationHours: number | null;
  quality: number | null;
  notes: string | null;
}

export function useSleep() {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSleepEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo)
      .order('date', { ascending: false });

    if (!error && data) {
      setEntries(data.map(s => ({
        id: s.id,
        date: s.date,
        bedtime: s.bedtime,
        wakeTime: s.wake_time,
        durationHours: s.duration_hours ? Number(s.duration_hours) : null,
        quality: s.quality,
        notes: s.notes,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSleepEntries();
  }, [fetchSleepEntries]);

  const logSleep = useCallback(async (
    date: string,
    bedtime: string | null,
    wakeTime: string | null,
    quality: number | null,
    notes?: string
  ) => {
    if (!user) return null;

    // Calculate duration if both times are provided
    let durationHours: number | null = null;
    if (bedtime && wakeTime) {
      const [bedH, bedM] = bedtime.split(':').map(Number);
      const [wakeH, wakeM] = wakeTime.split(':').map(Number);
      
      let duration = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
      if (duration < 0) duration += 24 * 60; // Handle overnight sleep
      durationHours = Math.round((duration / 60) * 100) / 100;
    }

    const { data, error } = await supabase
      .from('sleep_entries')
      .upsert({
        user_id: user.id,
        date,
        bedtime,
        wake_time: wakeTime,
        duration_hours: durationHours,
        quality,
        notes,
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (!error && data) {
      const newEntry: SleepEntry = {
        id: data.id,
        date: data.date,
        bedtime: data.bedtime,
        wakeTime: data.wake_time,
        durationHours: data.duration_hours ? Number(data.duration_hours) : null,
        quality: data.quality,
        notes: data.notes,
      };

      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== date);
        return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
      });

      return newEntry;
    }
    return null;
  }, [user]);

  const getTodaySleep = useCallback((): SleepEntry | undefined => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return entries.find(e => e.date === today);
  }, [entries]);

  const getAverageDuration = useCallback((): number | null => {
    const withDuration = entries.filter(e => e.durationHours !== null);
    if (withDuration.length === 0) return null;
    const total = withDuration.reduce((sum, e) => sum + (e.durationHours ?? 0), 0);
    return Math.round((total / withDuration.length) * 10) / 10;
  }, [entries]);

  const getAverageQuality = useCallback((): number | null => {
    const withQuality = entries.filter(e => e.quality !== null);
    if (withQuality.length === 0) return null;
    const total = withQuality.reduce((sum, e) => sum + (e.quality ?? 0), 0);
    return Math.round((total / withQuality.length) * 10) / 10;
  }, [entries]);

  return {
    entries,
    loading,
    logSleep,
    getTodaySleep,
    getAverageDuration,
    getAverageQuality,
    refetch: fetchSleepEntries,
  };
}
