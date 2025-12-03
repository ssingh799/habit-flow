import { useMemo } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from 'date-fns';
import { 
  Trophy, 
  Flame, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Target, 
  CheckCircle2, 
  Clock,
  Star,
  Zap,
  Award
} from 'lucide-react';
import { DailyProgress, Habit, HabitCompletion, MoodEntry } from '@/types/habit';
import { DailyMoodData } from '@/hooks/useMood';
import { MoodChart } from './MoodChart';
import { ProgressChart } from './ProgressChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface MonthlyReportProps {
  habits: Habit[];
  completions: HabitCompletion[];
  monthProgress: DailyProgress[];
  monthMoodData: DailyMoodData[];
  moodEntries: MoodEntry[];
}

interface InsightCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

function InsightCard({ icon: Icon, title, value, subtitle, color = 'primary' }: InsightCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
      <div className={`p-2 rounded-lg bg-${color}/10`}>
        <Icon className={`h-5 w-5 text-${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function MonthlyReport({ 
  habits, 
  completions, 
  monthProgress, 
  monthMoodData,
  moodEntries 
}: MonthlyReportProps) {
  // Calculate total completed vs pending
  const monthlyStats = useMemo(() => {
    const totalTasks = monthProgress.reduce((acc, p) => acc + p.total, 0);
    const completedTasks = monthProgress.reduce((acc, p) => acc + p.completed, 0);
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return { totalTasks, completedTasks, pendingTasks, completionRate };
  }, [monthProgress]);

  // Calculate streaks
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = monthProgress.length - 1; i >= 0; i--) {
      const day = monthProgress[i];
      if (day.total > 0 && day.completed === day.total) {
        streak++;
      } else if (day.total > 0) {
        break;
      }
    }
    return streak;
  }, [monthProgress]);

  const longestStreak = useMemo(() => {
    let longest = 0;
    let current = 0;
    for (const day of monthProgress) {
      if (day.total > 0 && day.completed === day.total) {
        current++;
        longest = Math.max(longest, current);
      } else if (day.total > 0) {
        current = 0;
      }
    }
    return longest;
  }, [monthProgress]);

  // Best performing week
  const bestWeek = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const weeks = eachWeekOfInterval({ start: thirtyDaysAgo, end: today }, { weekStartsOn: 1 });
    
    let best = { start: new Date(), rate: 0 };
    
    for (const weekStart of weeks) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekData = monthProgress.filter(p => {
        const date = parseISO(p.date);
        return date >= weekStart && date <= weekEnd;
      });
      
      const total = weekData.reduce((acc, p) => acc + p.total, 0);
      const completed = weekData.reduce((acc, p) => acc + p.completed, 0);
      const rate = total > 0 ? (completed / total) * 100 : 0;
      
      if (rate > best.rate) {
        best = { start: weekStart, rate };
      }
    }
    
    return best.rate > 0 ? {
      dateRange: `${format(best.start, 'MMM d')} - ${format(endOfWeek(best.start, { weekStartsOn: 1 }), 'MMM d')}`,
      rate: Math.round(best.rate)
    } : null;
  }, [monthProgress]);

  // Most consistent habit
  const mostConsistentHabit = useMemo(() => {
    if (habits.length === 0) return null;
    
    const habitStats = habits.map(habit => {
      const habitCompletions = completions.filter(c => 
        c.habitId === habit.id && c.completed
      );
      const last30Days = monthProgress.map(p => p.date);
      const completedInRange = habitCompletions.filter(c => 
        last30Days.includes(c.date)
      ).length;
      
      return {
        habit,
        completions: completedInRange,
        rate: last30Days.length > 0 ? (completedInRange / 30) * 100 : 0
      };
    });
    
    const best = habitStats.reduce((a, b) => a.completions > b.completions ? a : b);
    return best.completions > 0 ? best : null;
  }, [habits, completions, monthProgress]);

  // Highest mood dates
  const highestMoodDates = useMemo(() => {
    const validEntries = moodEntries.filter(e => {
      const entryDate = parseISO(e.date);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return entryDate >= thirtyDaysAgo && e.mood >= 8;
    });
    
    return validEntries
      .sort((a, b) => b.mood - a.mood)
      .slice(0, 3)
      .map(e => ({
        date: format(parseISO(e.date), 'MMM d'),
        mood: e.mood
      }));
  }, [moodEntries]);

  // Progress chart with dots
  const progressChartData = useMemo(() => {
    return monthProgress.map(p => ({
      ...p,
      displayDate: format(parseISO(p.date), 'MMM d'),
    }));
  }, [monthProgress]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Habits</p>
                <p className="text-2xl font-bold text-foreground">{habits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{monthlyStats.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{monthlyStats.pendingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Flame className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{currentStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Progress Graph */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthProgress.some(p => p.total > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="displayDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
                            <p className="font-semibold text-foreground">{data.displayDate}</p>
                            <p className="text-sm text-primary">{Math.round(data.rate)}% completed</p>
                            <p className="text-xs text-muted-foreground">{data.completed}/{data.total} tasks</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No progress data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Mood Graph */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-accent" />
              Monthly Mood Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoodChart data={monthMoodData} height={200} />
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" />
            Monthly Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Best Performing Week */}
            <InsightCard
              icon={Trophy}
              title="Best Performing Week"
              value={bestWeek ? bestWeek.dateRange : 'No data yet'}
              subtitle={bestWeek ? `${bestWeek.rate}% completion rate` : undefined}
            />
            
            {/* Most Consistent Habit */}
            <InsightCard
              icon={Award}
              title="Most Consistent Habit"
              value={mostConsistentHabit ? mostConsistentHabit.habit.name : 'No data yet'}
              subtitle={mostConsistentHabit ? `${mostConsistentHabit.completions} completions this month` : undefined}
            />
            
            {/* Longest Streak */}
            <InsightCard
              icon={Flame}
              title="Longest Streak"
              value={longestStreak > 0 ? `${longestStreak} days` : 'No streak yet'}
              subtitle="100% completion days"
            />
            
            {/* Highest Mood Days */}
            <InsightCard
              icon={Zap}
              title="Mood was Highest"
              value={highestMoodDates.length > 0 
                ? highestMoodDates.map(d => d.date).join(', ') 
                : 'No high mood days'}
              subtitle={highestMoodDates.length > 0 
                ? `Peak: ${highestMoodDates[0]?.mood}/10` 
                : undefined}
            />
            
            {/* Completion Rate */}
            <InsightCard
              icon={TrendingUp}
              title="Overall Completion Rate"
              value={`${monthlyStats.completionRate}%`}
              subtitle={`${monthlyStats.completedTasks} of ${monthlyStats.totalTasks} tasks`}
            />
            
            {/* Average Daily Tasks */}
            <InsightCard
              icon={Calendar}
              title="Avg Daily Completions"
              value={monthProgress.length > 0 
                ? (monthlyStats.completedTasks / 30).toFixed(1) 
                : '0'}
              subtitle="tasks per day"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
