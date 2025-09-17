-- Create missions configuration table
CREATE TABLE IF NOT EXISTS public.mission_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'permanent')),
    category TEXT NOT NULL CHECK (category IN ('gameplay', 'survival', 'score', 'streak', 'social')),
    requirement_type TEXT NOT NULL, -- e.g., 'min_score', 'survival_time', 'games_played', etc.
    requirement_value INTEGER NOT NULL,
    reward_coins INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user missions progress table
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
    UNIQUE(user_id, mission_id, mission_date) -- One mission per day per user
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

-- Function to get or create daily missions for a user
CREATE OR REPLACE FUNCTION get_user_daily_missions(p_user_id UUID)
RETURNS TABLE (
    mission_id TEXT,
    title TEXT,
    description TEXT,
    requirement_value INTEGER,
    reward_coins INTEGER,
    progress INTEGER,
    is_completed BOOLEAN,
    is_claimed BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Create today's missions if they don't exist
    INSERT INTO user_missions (user_id, mission_id, mission_date)
    SELECT
        p_user_id,
        mt.id,
        v_today
    FROM (
        -- Select 3 random daily missions for today
        SELECT id FROM mission_templates
        WHERE type = 'daily' AND is_active = true
        ORDER BY md5(v_today::text || id)::uuid  -- Deterministic random based on date
        LIMIT 3
    ) mt
    ON CONFLICT (user_id, mission_id, mission_date) DO NOTHING;

    -- Return user's missions for today
    RETURN QUERY
    SELECT
        mt.id,
        mt.title,
        mt.description,
        mt.requirement_value,
        mt.reward_coins,
        COALESCE(um.progress, 0),
        COALESCE(um.is_completed, false),
        um.claimed_at IS NOT NULL
    FROM mission_templates mt
    INNER JOIN user_missions um ON mt.id = um.mission_id
    WHERE um.user_id = p_user_id
    AND um.mission_date = v_today
    ORDER BY mt.reward_coins DESC;
END;
$$;

-- Function to update mission progress after a game
CREATE OR REPLACE FUNCTION update_mission_progress(
    p_user_id UUID,
    p_score INTEGER,
    p_survival_time REAL,
    p_daily_streak INTEGER DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_games_played INTEGER;
    v_completed_missions INTEGER := 0;
    v_total_rewards INTEGER := 0;
    mission RECORD;
BEGIN
    -- Count games played today
    SELECT COUNT(*) INTO v_games_played
    FROM game_scores
    WHERE user_id = p_user_id
    AND created_at::date = v_today;

    -- Update progress for each active mission
    FOR mission IN
        SELECT um.*, mt.requirement_type, mt.requirement_value, mt.reward_coins
        FROM user_missions um
        JOIN mission_templates mt ON um.mission_id = mt.id
        WHERE um.user_id = p_user_id
        AND um.mission_date = v_today
        AND NOT um.is_completed
    LOOP
        CASE mission.requirement_type
            WHEN 'games_played' THEN
                UPDATE user_missions
                SET progress = v_games_played,
                    is_completed = v_games_played >= mission.requirement_value,
                    completed_at = CASE
                        WHEN v_games_played >= mission.requirement_value THEN NOW()
                        ELSE completed_at
                    END
                WHERE id = mission.id;

            WHEN 'min_score' THEN
                IF p_score >= mission.requirement_value THEN
                    UPDATE user_missions
                    SET progress = p_score,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'survival_time' THEN
                IF p_survival_time >= mission.requirement_value THEN
                    UPDATE user_missions
                    SET progress = p_survival_time::INTEGER,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'daily_streak' THEN
                IF p_daily_streak >= mission.requirement_value THEN
                    UPDATE user_missions
                    SET progress = p_daily_streak,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'combo_score_time' THEN
                IF p_score >= 1500 AND p_survival_time >= 45 THEN
                    UPDATE user_missions
                    SET progress = 1,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;
        END CASE;
    END LOOP;

    RETURN json_build_object(
        'completed_missions', v_completed_missions,
        'pending_rewards', v_total_rewards
    );
END;
$$;

-- Function to claim mission rewards
CREATE OR REPLACE FUNCTION claim_mission_rewards(p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_coins INTEGER := 0;
    v_claimed_count INTEGER := 0;
BEGIN
    -- Calculate total rewards to claim
    SELECT
        COUNT(*),
        COALESCE(SUM(mt.reward_coins), 0)
    INTO v_claimed_count, v_total_coins
    FROM user_missions um
    JOIN mission_templates mt ON um.mission_id = mt.id
    WHERE um.user_id = p_user_id
    AND um.is_completed = true
    AND um.claimed_at IS NULL;

    IF v_total_coins > 0 THEN
        -- Mark missions as claimed
        UPDATE user_missions
        SET claimed_at = NOW()
        WHERE user_id = p_user_id
        AND is_completed = true
        AND claimed_at IS NULL;

        -- Award coins to user
        UPDATE profiles
        SET coins = coins + v_total_coins,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'coins_earned', v_total_coins,
        'missions_claimed', v_claimed_count
    );
END;
$$;

-- Grant permissions
GRANT ALL ON public.mission_templates TO authenticated;
GRANT ALL ON public.user_missions TO authenticated;