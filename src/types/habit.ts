export type Category = 'health' | 'work' | 'personal' | 'fitness' | 'learning';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export type MoodTag = 'stressed' | 'energetic' | 'tired' | 'happy' | 'anxious' | 'calm' | 'motivated' | 'sad';

export interface Habit {
  id: string;
  name: string;
  category: Category;
  frequency: Frequency;
  createdAt: string;
}

export interface HabitCompletion {
  habitId: string;
  date: string;
  completed: boolean;
  durationSeconds?: number | null;
}

export interface MoodEntry {
  date: string;
  mood: number; // 1-10 scale
  notes?: string;
  tags: MoodTag[];
  createdAt: string;
}

export interface DailyProgress {
  date: string;
  completed: number;
  total: number;
  rate: number;
}
