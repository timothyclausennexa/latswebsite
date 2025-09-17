-- Update the submit_game_score function to also update mission progress
CREATE OR REPLACE FUNCTION submit_game_score(
    new_score INTEGER,
    new_survival_time REAL DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    coins_earned INTEGER;
    v_high_score INTEGER;
    is_new_high BOOLEAN := false;
    v_daily_play_count INTEGER;
    v_last_play_time TIMESTAMPTZ;
    v_mission_result json;
    v_daily_streak INTEGER;
BEGIN
    -- Get authenticated user ID
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not authenticated'
        );
    END IF;

    -- Check daily play count for anti-spam
    SELECT COUNT(*), MAX(created_at)
    INTO v_daily_play_count, v_last_play_time
    FROM game_scores
    WHERE user_id = v_user_id
    AND created_at >= CURRENT_DATE;

    -- Limit plays to prevent spam (reasonable limit: 100 per day)
    IF v_daily_play_count >= 100 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Daily play limit reached'
        );
    END IF;

    -- Get user's current high score
    SELECT COALESCE(MAX(score), 0) INTO v_high_score
    FROM game_scores
    WHERE user_id = v_user_id;

    is_new_high := new_score > v_high_score;

    -- Calculate coins earned with survival time bonus
    coins_earned := LEAST(
        new_score / 10 + FLOOR(new_survival_time / 10), -- Bonus for survival time
        100 -- Cap at 100 coins per game
    );

    -- Double coins for new high scores
    IF is_new_high THEN
        coins_earned := coins_earned * 2;
    END IF;

    -- Insert the game score with survival time
    INSERT INTO game_scores (user_id, score, survival_time, created_at)
    VALUES (v_user_id, new_score, new_survival_time, NOW());

    -- Award coins
    UPDATE profiles
    SET coins = coins + coins_earned,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Get daily streak for mission tracking
    SELECT COALESCE(
        CASE
            WHEN EXISTS (
                SELECT 1 FROM game_scores
                WHERE user_id = v_user_id
                AND created_at::date = CURRENT_DATE - INTERVAL '1 day'
            )
            THEN (
                SELECT COUNT(DISTINCT created_at::date)
                FROM game_scores
                WHERE user_id = v_user_id
                AND created_at::date >= CURRENT_DATE - INTERVAL '30 days'
            )
            ELSE 1
        END,
        1
    ) INTO v_daily_streak;

    -- Update mission progress
    v_mission_result := update_mission_progress(
        v_user_id,
        new_score,
        new_survival_time,
        v_daily_streak
    );

    RETURN json_build_object(
        'success', true,
        'coins_earned', coins_earned,
        'is_new_high', is_new_high,
        'missions_completed', COALESCE((v_mission_result->>'completed_missions')::INTEGER, 0),
        'pending_rewards', COALESCE((v_mission_result->>'pending_rewards')::INTEGER, 0),
        'message', CASE
            WHEN is_new_high THEN 'New high score! Coins doubled!'
            ELSE 'Score submitted successfully!'
        END
    );
END;
$$;