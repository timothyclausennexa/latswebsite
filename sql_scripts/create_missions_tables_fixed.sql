-- Drop existing tables if needed (be careful with this in production)
-- DROP TABLE IF EXISTS public.user_missions CASCADE;
-- DROP TABLE IF EXISTS public.mission_templates CASCADE;

-- Create missions configuration table
CREATE TABLE IF NOT EXISTS public.mission_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'permanent')),
    category TEXT NOT NULL CHECK (category IN ('gameplay', 'survival', 'score', 'streak', 'social')),
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    reward_coins INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user missions progress table with proper date field
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id TEXT REFERENCES public.mission_templates(id),
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    mission_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, mission_id, mission_date)
);

-- Insert default mission templates
INSERT INTO public.mission_templates (id, title, description, type, category, requirement_type, requirement_value, reward_coins) VALUES
    -- Daily Gameplay Missions
    ('daily_play_1', 'First Step', 'Play 1 game today', 'daily', 'gameplay', 'games_played', 1, 10),
    ('daily_play_3', 'Warming Up', 'Play 3 games today', 'daily', 'gameplay', 'games_played', 3, 25),
    ('daily_play_5', 'Dedicated', 'Play 5 games today', 'daily', 'gameplay', 'games_played', 5, 50),

    -- Daily Score Missions
    ('daily_score_500', 'Score Rookie', 'Score 500+ points in a single game', 'daily', 'score', 'min_score', 500, 20),
    ('daily_score_1000', 'Score Hunter', 'Score 1000+ points in a single game', 'daily', 'score', 'min_score', 1000, 40),
    ('daily_score_2000', 'Score Master', 'Score 2000+ points in a single game', 'daily', 'score', 'min_score', 2000, 75),

    -- Daily Survival Missions
    ('daily_survive_30', 'Survivor', 'Survive for 30 seconds', 'daily', 'survival', 'survival_time', 30, 15),
    ('daily_survive_60', 'Escape Artist', 'Survive for 60 seconds', 'daily', 'survival', 'survival_time', 60, 35),
    ('daily_survive_120', 'Legendary', 'Survive for 120 seconds', 'daily', 'survival', 'survival_time', 120, 100),

    -- Daily Streak Missions
    ('daily_streak_maintain', 'Keep the Streak', 'Maintain your daily streak', 'daily', 'streak', 'daily_streak', 1, 30),

    -- Daily Combined Missions
    ('daily_combo_1', 'Perfectionist', 'Score 1500+ and survive 45+ seconds', 'daily', 'gameplay', 'combo_score_time', 1500, 60)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_missions_user_date ON user_missions(user_id, mission_date);
CREATE INDEX IF NOT EXISTS idx_user_missions_completed ON user_missions(is_completed, claimed_at);

-- Grant permissions
GRANT ALL ON public.mission_templates TO authenticated;
GRANT ALL ON public.user_missions TO authenticated;