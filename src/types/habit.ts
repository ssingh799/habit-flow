export type Category = 'health' | 'work' | 'personal' | 'fitness' | 'learning';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  category: Category;
  frequency: Frequency;
  createdAt: string;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export interface DailyProgress {
  date: string;
  completed: number;
  total: number;
  rate: number;
}
