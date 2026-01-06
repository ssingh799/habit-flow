import { Trophy, Flame, Star, Award } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useStreaks } from '@/hooks/useStreaks';
import { AchievementCard } from './AchievementCard';
import { StreakBadge } from './StreakBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GamificationPanel() {
  const { getAchievementWithStatus, getUnlockedCount, loading: achievementsLoading } = useAchievements();
  const { getLongestStreak, getTotalStreakDays, loading: streaksLoading } = useStreaks();

  const allAchievements = getAchievementWithStatus();
  const unlockedCount = getUnlockedCount();
  const longestStreak = getLongestStreak();
  const totalStreakDays = getTotalStreakDays();

  const loading = achievementsLoading || streaksLoading;

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 animate-pulse">
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-foreground">Achievements & Streaks</h3>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{unlockedCount}</p>
          <p className="text-xs text-muted-foreground">Unlocked</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-lg font-bold text-foreground">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-lg font-bold text-foreground">{totalStreakDays}</p>
          <p className="text-xs text-muted-foreground">Total Days</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
          <TabsTrigger value="unlocked" className="flex-1 text-xs">Unlocked</TabsTrigger>
          <TabsTrigger value="locked" className="flex-1 text-xs">Locked</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[280px]">
          <TabsContent value="all" className="mt-0 space-y-2">
            {allAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                icon={achievement.icon}
                unlocked={achievement.unlocked}
                unlockedAt={achievement.unlockedAt}
              />
            ))}
          </TabsContent>

          <TabsContent value="unlocked" className="mt-0 space-y-2">
            {allAchievements.filter(a => a.unlocked).length > 0 ? (
              allAchievements
                .filter(a => a.unlocked)
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    name={achievement.name}
                    description={achievement.description}
                    icon={achievement.icon}
                    unlocked={achievement.unlocked}
                    unlockedAt={achievement.unlockedAt}
                  />
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No achievements unlocked yet</p>
                <p className="text-xs">Complete habits to earn achievements!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="mt-0 space-y-2">
            {allAchievements
              .filter(a => !a.unlocked)
              .map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.icon}
                  unlocked={achievement.unlocked}
                />
              ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
