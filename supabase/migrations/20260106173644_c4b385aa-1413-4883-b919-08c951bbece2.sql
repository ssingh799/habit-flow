-- User streaks table for tracking habit streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id)
);

-- Achievements definition table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User achievements (unlocked)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Water intake tracking
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses INTEGER NOT NULL DEFAULT 0,
  goal INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Sleep tracking
CREATE TABLE public.sleep_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime TIME,
  wake_time TIME,
  duration_hours DECIMAL(4,2),
  quality INTEGER CHECK (quality >= 1 AND quality <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own streaks" ON public.user_streaks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for water_intake
CREATE POLICY "Users can view their own water intake" ON public.water_intake FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own water intake" ON public.water_intake FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own water intake" ON public.water_intake FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for sleep_entries
CREATE POLICY "Users can view their own sleep entries" ON public.sleep_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sleep entries" ON public.sleep_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep entries" ON public.sleep_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep entries" ON public.sleep_entries FOR DELETE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
('First Step', 'Complete your first habit', 'trophy', 'general', 'total_completions', 1),
('Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 'streak_days', 7),
('Month Master', 'Maintain a 30-day streak', 'flame', 'streak', 'streak_days', 30),
('Century Club', 'Complete 100 habits total', 'star', 'general', 'total_completions', 100),
('Habit Builder', 'Create 5 habits', 'target', 'general', 'habits_created', 5),
('Hydration Hero', 'Meet water goal 7 days in a row', 'droplet', 'wellness', 'water_streak', 7),
('Sleep Champion', 'Log sleep for 7 consecutive days', 'moon', 'wellness', 'sleep_streak', 7),
('Mood Tracker', 'Log mood for 14 days', 'smile', 'wellness', 'mood_entries', 14),
('Perfect Week', 'Complete all habits for 7 days', 'crown', 'streak', 'perfect_days', 7),
('Early Bird', 'Complete a habit before 8 AM', 'sunrise', 'general', 'early_completion', 1);

-- Create trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_water_intake_updated_at BEFORE UPDATE ON public.water_intake FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sleep_entries_updated_at BEFORE UPDATE ON public.sleep_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();