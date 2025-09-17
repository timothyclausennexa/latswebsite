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
        ORDER BY md5(v_today::text || id)  -- Deterministic random based on date
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
    AND DATE(created_at) = v_today;

    -- Update progress for each active mission
    FOR mission IN
        SELECT um.id as mission_row_id, um.*, mt.requirement_type, mt.requirement_value, mt.reward_coins
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
                WHERE id = mission.mission_row_id;

                IF v_games_played >= mission.requirement_value THEN
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'min_score' THEN
                IF p_score >= mission.requirement_value THEN
                    UPDATE user_missions
                    SET progress = p_score,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.mission_row_id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'survival_time' THEN
                IF p_survival_time >= mission.requirement_value THEN
                    UPDATE user_missions
                    SET progress = p_survival_time::INTEGER,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.mission_row_id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'daily_streak' THEN
                IF p_daily_streak >= mission.requirement_value THEN
                    UPDATE user_missions
                    SET progress = p_daily_streak,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.mission_row_id;
                    v_completed_missions := v_completed_missions + 1;
                    v_total_rewards := v_total_rewards + mission.reward_coins;
                END IF;

            WHEN 'combo_score_time' THEN
                IF p_score >= 1500 AND p_survival_time >= 45 THEN
                    UPDATE user_missions
                    SET progress = 1,
                        is_completed = true,
                        completed_at = NOW()
                    WHERE id = mission.mission_row_id;
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