import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

export interface MeditationSession {
  id: string;
  date: string;
  durationSeconds: number;
  completed: boolean;
  createdAt: string;
}

export function useMeditation() {
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data.map(s => ({
        id: s.id,
        date: s.date,
        durationSeconds: s.duration_seconds,
        completed: s.completed,
        createdAt: s.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const logSession = useCallback(async (durationSeconds: number) => {
    if (!user) return null;

    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: user.id,
        date: today,
        duration_seconds: durationSeconds,
        completed: true,
      })
      .select()
      .single();

    if (!error && data) {
      const newSession: MeditationSession = {
        id: data.id,
        date: data.date,
        durationSeconds: data.duration_seconds,
        completed: data.completed,
        createdAt: data.created_at,
      };
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    }
    return null;
  }, [user]);

  const getTodayTotalMinutes = useCallback((): number => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySessions = sessions.filter(s => s.date === today);
    const totalSeconds = todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    return Math.round(totalSeconds / 60);
  }, [sessions]);

  const getWeeklyTotalMinutes = useCallback((): number => {
    const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    return Math.round(totalSeconds / 60);
  }, [sessions]);

  const getDailyStats = useCallback(() => {
    const dailyMap = new Map<string, number>();
    
    sessions.forEach(s => {
      const current = dailyMap.get(s.date) || 0;
      dailyMap.set(s.date, current + s.durationSeconds);
    });

    return Array.from(dailyMap.entries())
      .map(([date, seconds]) => ({
        date,
        minutes: Math.round(seconds / 60),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions]);

  return {
    sessions,
    loading,
    logSession,
    getTodayTotalMinutes,
    getWeeklyTotalMinutes,
    getDailyStats,
    refetch: fetchSessions,
  };
}
