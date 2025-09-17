-- Fix leaderboard column names to match frontend expectations

-- Drop the old view
DROP VIEW IF EXISTS public.top_escape_artists;

-- Create view with correct column names that match the frontend
CREATE OR REPLACE VIEW public.top_escape_artists AS
SELECT
    ROW_NUMBER() OVER (ORDER BY score DESC, survival_time DESC) as rank,
    id,
    username,
    display_name,
    high_score,
    best_time,
    games_played,
    current_skin,
    rank_title,
    coins
FROM (
    SELECT DISTINCT ON (gs.user_id)
        gs.user_id as id,
        COALESCE(p.username, 'Guest_' || SUBSTRING(COALESCE(gs.user_id::text, gen_random_uuid()::text), 1, 6)) as username,
        COALESCE(p.username, 'Guest_' || SUBSTRING(COALESCE(gs.user_id::text, gen_random_uuid()::text), 1, 6)) as display_name,
        gs.score as high_score,  -- THIS IS THE KEY FIX: high_score not best_time
        gs.survival_time as best_time,  -- Survival time is best_time
        COUNT(gs.id) OVER (PARTITION BY gs.user_id) as games_played,
        'default' as current_skin,
        CASE
            WHEN gs.survival_time >= 120 THEN 'ESCAPE ARTIST'
            WHEN gs.survival_time >= 60 THEN 'SURVIVOR'
            ELSE 'PRISONER'
        END as rank_title,
        COALESCE(p.coins, 0) as coins,
        gs.score,
        gs.survival_time
    FROM public.game_scores gs
    LEFT JOIN public.profiles p ON p.id = gs.user_id
    WHERE gs.score > 0
    ORDER BY gs.user_id, gs.score DESC, gs.survival_time DESC
) subquery
ORDER BY score DESC, survival_time DESC
LIMIT 100;

-- Grant permissions
GRANT SELECT ON public.top_escape_artists TO anon, authenticated;

-- Test the fix
SELECT 'Leaderboard columns fixed! Testing view:' as status;
SELECT
    rank,
    username,
    high_score,  -- Should show the score
    best_time,   -- Should show survival time
    games_played,
    rank_title
FROM public.top_escape_artists
LIMIT 5;