import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from './useAchievements';
import { useAchievementCelebration } from './useAchievementCelebration';
import { toast } from 'sonner';

interface AchievementCriteria {
  total_completions: number;
  habits_created: number;
  streak_days: number;
  perfect_days: number;
  sleep_streak: number;
  water_streak: number;
  mood_entries: number;
  early_completion: number;
}

export function useAutoUnlockAchievements() {
  const { user } = useAuth();
  const { achievements, userAchievements, unlockAchievement, refetch } = useAchievements();
  const { celebrate } = useAchievementCelebration();
  const hasChecked = useRef(false);

  const checkAndUnlockAchievements = useCallback(async () => {
    if (!user || achievements.length === 0) return;

    // Fetch all required data in parallel
    const [
      { data: completions },
      { data: habits },
      { data: streaks },
      { data: sleepEntries },
      { data: waterEntries },
      { data: moodEntries },
    ] = await Promise.all([
      supabase.from('habit_completions').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('user_streaks').select('*').eq('user_id', user.id),
      supabase.from('sleep_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('water_intake').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('mood_entries').select('*').eq('user_id', user.id),
    ]);

    // Calculate criteria values
    const criteria: AchievementCriteria = {
      total_completions: completions?.length || 0,
      habits_created: habits?.length || 0,
      streak_days: Math.max(...(streaks?.map(s => s.current_streak) || [0]), 0),
      perfect_days: calculatePerfectDays(completions || [], habits || []),
      sleep_streak: calculateConsecutiveDays(sleepEntries?.map(e => e.date) || []),
      water_streak: calculateWaterGoalStreak(waterEntries || []),
      mood_entries: moodEntries?.length || 0,
      early_completion: hasEarlyCompletion(completions || []) ? 1 : 0,
    };

    // Check each achievement
    const unlockedIds = userAchievements.map(ua => ua.achievementId);
    
    for (const achievement of achievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      const criteriaValue = criteria[achievement.requirementType as keyof AchievementCriteria] || 0;
      
      if (criteriaValue >= achievement.requirementValue) {
        const success = await unlockAchievement(achievement.id);
        if (success) {
          celebrate();
          toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
            description: achievement.description,
            duration: 5000,
          });
        }
      }
    }
  }, [user, achievements, userAchievements, unlockAchievement, celebrate]);

  // Check on mount and when data changes
  useEffect(() => {
    if (!hasChecked.current && user && achievements.length > 0) {
      hasChecked.current = true;
      checkAndUnlockAchievements();
    }
  }, [user, achievements, checkAndUnlockAchievements]);

  return { checkAndUnlockAchievements, refetchAchievements: refetch };
}

// Helper functions
function calculatePerfectDays(completions: any[], habits: any[]): number {
  if (habits.length === 0) return 0;
  
  const completionsByDate = completions.reduce((acc, c) => {
    acc[c.date] = (acc[c.date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.values(completionsByDate).filter((count): count is number => typeof count === 'number' && count >= habits.length).length;
}

function calculateConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...new Set(dates)].sort().reverse();
  let streak = 1;
  
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const curr = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateWaterGoalStreak(entries: Array<{ glasses: number; goal: number; date: string }>): number {
  if (entries.length === 0) return 0;
  
  const goalMet = entries.filter(e => e.glasses >= e.goal);
  return calculateConsecutiveDays(goalMet.map(e => e.date));
}

function hasEarlyCompletion(completions: any[]): boolean {
  return completions.some(c => {
    const hour = new Date(c.created_at).getHours();
    return hour < 8;
  });
}
