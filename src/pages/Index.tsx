import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Target, CheckCircle2, Clock, TrendingUp, Calendar, Smile, Heart, FileText, LogOut, User } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { useMood } from '@/hooks/useMood';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Category, Habit } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HabitCard } from '@/components/HabitCard';
import { AddHabitDialog } from '@/components/AddHabitDialog';
import { ProgressChart } from '@/components/ProgressChart';
import { StatsCard } from '@/components/StatsCard';
import { WeekCalendar } from '@/components/WeekCalendar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { MoodEntry } from '@/components/MoodEntry';
import { MoodChart } from '@/components/MoodChart';
import { MonthlyReport } from '@/components/MonthlyReport';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const {
    habits,
    completions,
    loading: habitsLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    getWeekProgress,
    getMonthProgress,
    getHabitsByCategory,
    getTodayStats,
  } = useHabits();

  const {
    moodEntries,
    loading: moodLoading,
    setMood,
    getTodayMood,
    getWeekMoodData,
    getMonthMoodData,
    getAverageMood,
  } = useMood();

  const isLoading = habitsLoading || moodLoading;

  // Fetch profile data for avatar
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setAvatarUrl(data.avatar_url);
        setDisplayName(data.display_name);
      }
    };
    
    fetchProfile();
  }, [user]);

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayStats = getTodayStats();
  const weekProgress = getWeekProgress(selectedDate);
  const monthProgress = getMonthProgress(30);
  const todayMood = getTodayMood();
  const weekMoodData = getWeekMoodData();
  const monthMoodData = getMonthMoodData(30);
  const avgMood = getAverageMood(7);

  const filteredHabits =
    selectedCategory === 'all' ? habits : getHabitsByCategory(selectedCategory);
  const dailyHabits = filteredHabits.filter((h) => h.frequency === 'daily');

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsAddDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingHabit) {
      deleteHabit(deletingHabit.id);
      setDeletingHabit(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Habit Tracker</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                <span className="hidden sm:inline">{user?.email} • </span>
                {format(new Date(), 'EEE, MMM d')}
                <span className="hidden md:inline">, {format(new Date(), 'yyyy')}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gradient-primary text-primary-foreground shadow-glow h-8 sm:h-9 px-2 sm:px-4"
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Habit</span>
              </Button>
              
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <main className="container max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 animate-fade-in">
          <StatsCard
            title="Total Habits"
            value={habits.length}
            icon={Target}
          />
          <StatsCard
            title="Completed Today"
            value={todayStats.completed}
            subtitle={`of ${todayStats.total} habits`}
            icon={CheckCircle2}
            trend="up"
          />
          <StatsCard
            title="Pending"
            value={todayStats.pending}
            subtitle="habits remaining"
            icon={Clock}
            trend={todayStats.pending > 0 ? 'neutral' : 'up'}
          />
          <StatsCard
            title="Success Rate"
            value={`${todayStats.rate}%`}
            subtitle="today's progress"
            icon={TrendingUp}
            trend={todayStats.rate >= 50 ? 'up' : 'down'}
          />
          <StatsCard
            title="Avg Mood"
            value={avgMood !== null ? avgMood.toString() : '-'}
            subtitle="last 7 days"
            icon={Heart}
            trend={avgMood !== null ? (avgMood >= 6 ? 'up' : avgMood >= 4 ? 'neutral' : 'down') : undefined}
            className="col-span-2 sm:col-span-1"
          />
        </section>

        {/* Week Calendar */}
        <section className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-card animate-fade-in">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">This Week</h2>
          </div>
          <WeekCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            weekProgress={weekProgress}
          />
        </section>

        {/* Mood, Progress & Reports */}
        <section className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-card animate-fade-in">
          <Tabs defaultValue="mood" className="w-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4 overflow-x-auto">
              <TabsList className="bg-secondary w-full sm:w-auto">
                <TabsTrigger value="mood" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                  <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Mood</span>
                </TabsTrigger>
                <TabsTrigger value="habits" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Habits</span>
                </TabsTrigger>
                <TabsTrigger value="report" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Monthly </span>Report
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="mood" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Mood Entry */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Today's Mood</h3>
                  <MoodEntry
                    date={new Date()}
                    existingEntry={todayMood}
                    onSave={setMood}
                  />
                </div>
                
                {/* Mood Charts */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Weekly Mood</h3>
                    <MoodChart data={weekMoodData} height={120} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Monthly Trend</h3>
                    <MoodChart data={monthMoodData} height={120} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="habits" className="mt-0">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Monthly Progress</h3>
              </div>
              {monthProgress.some((p) => p.total > 0) ? (
                <ProgressChart data={monthProgress} type="area" />
              ) : (
                <div className="h-[150px] sm:h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  Add some habits to see your progress chart
                </div>
              )}
            </TabsContent>

            <TabsContent value="report" className="mt-0">
              <MonthlyReport
                habits={habits}
                completions={completions}
                monthProgress={monthProgress}
                monthMoodData={monthMoodData}
                moodEntries={moodEntries}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Habits Section */}
        <section className="animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Today's Habits
              <span className="ml-2 text-xs sm:text-sm font-normal text-muted-foreground">
                ({dailyHabits.length} habits)
              </span>
            </h2>
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          {dailyHabits.length > 0 ? (
            <div className="space-y-3">
              {dailyHabits.map((habit, index) => (
                <div
                  key={habit.id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <HabitCard
                    habit={habit}
                    isCompleted={isCompleted(habit.id, dateStr)}
                    onToggle={() => toggleCompletion(habit.id, dateStr)}
                    onEdit={() => handleEdit(habit)}
                    onDelete={() => setDeletingHabit(habit)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No habits yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Start building better habits today. Add your first habit to begin tracking your
                progress.
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gradient-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Habit
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Add/Edit Dialog */}
      <AddHabitDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingHabit(null);
        }}
        onAdd={addHabit}
        editingHabit={editingHabit}
        onUpdate={updateHabit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingHabit} onOpenChange={() => setDeletingHabit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingHabit?.name}"? This action cannot be undone
              and all completion history will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
