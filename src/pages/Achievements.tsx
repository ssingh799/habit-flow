import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Lock, CheckCircle2, Flame, Droplets, Moon, Smile, Target } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useStreaks } from '@/hooks/useStreaks';
import { useHabits } from '@/hooks/useHabits';
import { useSleep } from '@/hooks/useSleep';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { useMood } from '@/hooks/useMood';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  droplets: Droplets,
  moon: Moon,
  smile: Smile,
  target: Target,
  checkCircle: CheckCircle2,
};

const Achievements = () => {
  const navigate = useNavigate();
  const { achievements, userAchievements, loading: achievementsLoading, getAchievementWithStatus } = useAchievements();
  const { streaks, getLongestStreak, getTotalStreakDays, loading: streaksLoading } = useStreaks();
  const { habits, completions } = useHabits();
  const { entries: sleepEntries } = useSleep();
  const { todayEntry: waterEntry } = useWaterIntake();
  const { moodEntries } = useMood();

  const loading = achievementsLoading || streaksLoading;

  // Calculate progress for each achievement
  const achievementsWithProgress = useMemo(() => {
    const achievementList = getAchievementWithStatus();
    
    return achievementList.map(achievement => {
      let currentProgress = 0;
      const target = achievement.requirementValue;
      
      switch (achievement.requirementType) {
        case 'habit_completions':
          currentProgress = completions.length;
          break;
        case 'habits_created':
          currentProgress = habits.length;
          break;
        case 'streak_days':
          currentProgress = getLongestStreak();
          break;
        case 'total_streak_days':
          currentProgress = getTotalStreakDays();
          break;
        case 'sleep_entries':
          currentProgress = sleepEntries?.length || 0;
          break;
        case 'water_goals_met':
          // For water, we only have today's entry in this hook
          currentProgress = waterEntry && waterEntry.glasses >= waterEntry.goal ? 1 : 0;
          break;
        case 'mood_entries':
          currentProgress = moodEntries?.length || 0;
          break;
        default:
          currentProgress = 0;
      }

      const progressPercent = Math.min((currentProgress / target) * 100, 100);
      
      return {
        ...achievement,
        currentProgress,
        progressPercent,
      };
    });
  }, [getAchievementWithStatus, completions, habits, getLongestStreak, getTotalStreakDays, sleepEntries, waterEntry, moodEntries]);

  const unlockedAchievements = achievementsWithProgress.filter(a => a.unlocked);
  const lockedAchievements = achievementsWithProgress.filter(a => !a.unlocked);

  // Group by category
  const categories = useMemo(() => {
    const catMap = new Map<string, typeof achievementsWithProgress>();
    achievementsWithProgress.forEach(a => {
      const cat = a.category || 'general';
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(a);
    });
    return catMap;
  }, [achievementsWithProgress]);

  const renderAchievementCard = (achievement: typeof achievementsWithProgress[0]) => {
    const IconComponent = iconMap[achievement.icon] || Trophy;
    
    return (
      <Card 
        key={achievement.id}
        className={cn(
          "transition-all duration-300",
          achievement.unlocked 
            ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-glow" 
            : "bg-card/50 border-border/50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl shrink-0",
              achievement.unlocked 
                ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              {achievement.unlocked ? (
                <IconComponent className="h-6 w-6" />
              ) : (
                <Lock className="h-6 w-6" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className={cn(
                  "font-semibold truncate",
                  achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {achievement.name}
                </h3>
                {achievement.unlocked && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {achievement.description}
              </p>
              
              {!achievement.unlocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">
                      {achievement.currentProgress} / {achievement.requirementValue}
                    </span>
                  </div>
                  <Progress value={achievement.progressPercent} className="h-2" />
                </div>
              )}
              
              {achievement.unlocked && achievement.unlockedAt && (
                <p className="text-xs text-primary/80">
                  Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Achievements
              </h1>
              <p className="text-sm text-muted-foreground">
                {unlockedAchievements.length} of {achievements.length} unlocked
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <section className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{unlockedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Unlocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{getLongestStreak()}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{completions.length}</p>
              <p className="text-xs text-muted-foreground">Completions</p>
            </CardContent>
          </Card>
        </section>

        {/* Achievements Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-secondary">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-3 pr-4">
                {achievementsWithProgress.length > 0 ? (
                  achievementsWithProgress.map(renderAchievementCard)
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements available yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unlocked" className="mt-4">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-3 pr-4">
                {unlockedAchievements.length > 0 ? (
                  unlockedAchievements.map(renderAchievementCard)
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete milestones to unlock achievements!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="locked" className="mt-4">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-3 pr-4">
                {lockedAchievements.length > 0 ? (
                  lockedAchievements.map(renderAchievementCard)
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You've unlocked all achievements! 🎉</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-6 pr-4">
                {Array.from(categories.entries()).map(([category, categoryAchievements]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 capitalize">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {categoryAchievements.map(renderAchievementCard)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Achievements;
