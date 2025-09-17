-- Final fix for missions - using a different approach
-- Run this in Supabase SQL Editor

-- First, drop the existing function
DROP FUNCTION IF EXISTS get_user_daily_missions(UUID);

-- Create a new version with unique column names in the return table
CREATE OR REPLACE FUNCTION get_user_daily_missions(p_user_id UUID)
RETURNS TABLE (
    out_mission_id TEXT,
    out_title TEXT,
    out_description TEXT,
    out_requirement_value INTEGER,
    out_reward_coins INTEGER,
    out_progress INTEGER,
    out_is_completed BOOLEAN,
    out_is_claimed BOOLEAN
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
        (um.claimed_at IS NOT NULL)
    FROM mission_templates mt
    INNER JOIN user_missions um ON mt.id = um.mission_id
    WHERE um.user_id = p_user_id
    AND um.mission_date = v_today
    ORDER BY mt.reward_coins DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_daily_missions(UUID) TO authenticated;

-- Now update the frontend to match the new column names
SELECT 'Function fixed with new column names! Update the frontend to use out_mission_id, out_title, etc.' as message;