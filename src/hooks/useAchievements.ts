import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAchievements = useCallback(async () => {
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    if (allAchievements) {
      setAchievements(allAchievements.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        requirementType: a.requirement_type,
        requirementValue: a.requirement_value,
      })));
    }

    if (user) {
      const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (unlocked) {
        setUserAchievements(unlocked.map(u => ({
          achievementId: u.achievement_id,
          unlockedAt: u.unlocked_at,
        })));
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user) return false;

    // Check if already unlocked
    if (userAchievements.some(ua => ua.achievementId === achievementId)) {
      return false;
    }

    const { error } = await supabase
      .from('user_achievements')
      .insert({ user_id: user.id, achievement_id: achievementId });

    if (!error) {
      setUserAchievements(prev => [...prev, {
        achievementId,
        unlockedAt: new Date().toISOString(),
      }]);
      return true;
    }
    return false;
  }, [user, userAchievements]);

  const isUnlocked = useCallback((achievementId: string): boolean => {
    return userAchievements.some(ua => ua.achievementId === achievementId);
  }, [userAchievements]);

  const getUnlockedCount = useCallback((): number => {
    return userAchievements.length;
  }, [userAchievements]);

  const getAchievementWithStatus = useCallback(() => {
    return achievements.map(a => ({
      ...a,
      unlocked: isUnlocked(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt,
    }));
  }, [achievements, userAchievements, isUnlocked]);

  return {
    achievements,
    userAchievements,
    loading,
    unlockAchievement,
    isUnlocked,
    getUnlockedCount,
    getAchievementWithStatus,
    refetch: fetchAchievements,
  };
}
