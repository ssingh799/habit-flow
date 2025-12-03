import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Target, CheckCircle2, Clock, TrendingUp, Calendar } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { Category, Habit } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { HabitCard } from '@/components/HabitCard';
import { AddHabitDialog } from '@/components/AddHabitDialog';
import { ProgressChart } from '@/components/ProgressChart';
import { StatsCard } from '@/components/StatsCard';
import { WeekCalendar } from '@/components/WeekCalendar';
import { CategoryFilter } from '@/components/CategoryFilter';
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

const Index = () => {
  const {
    habits,
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

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayStats = getTodayStats();
  const weekProgress = getWeekProgress(selectedDate);
  const monthProgress = getMonthProgress(30);

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
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Habit Tracker</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gradient-primary text-primary-foreground shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
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
        </section>

        {/* Week Calendar */}
        <section className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">This Week</h2>
          </div>
          <WeekCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            weekProgress={weekProgress}
          />
        </section>

        {/* Progress Chart */}
        <section className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Monthly Progress</h2>
            </div>
          </div>
          {monthProgress.some((p) => p.total > 0) ? (
            <ProgressChart data={monthProgress} type="area" />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Add some habits to see your progress chart
            </div>
          )}
        </section>

        {/* Habits Section */}
        <section className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Today's Habits
              <span className="ml-2 text-sm font-normal text-muted-foreground">
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
