-- Debug Leaderboard Issues
-- Run this to see what data exists in your database

-- 1. Check if game_scores table has any data
SELECT 'Checking game_scores table:' as check_step;
SELECT COUNT(*) as total_scores FROM public.game_scores;

-- 2. Show recent game scores
SELECT 'Recent game scores:' as check_step;
SELECT
    gs.id,
    gs.user_id,
    gs.score,
    gs.survival_time,
    gs.created_at,
    u.email
FROM public.game_scores gs
LEFT JOIN auth.users u ON u.id = gs.user_id
ORDER BY gs.created_at DESC
LIMIT 10;

-- 3. Check profiles table
SELECT 'Checking profiles table:' as check_step;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 4. Show profiles with usernames
SELECT 'Profiles with usernames:' as check_step;
SELECT
    p.id,
    p.username,
    p.created_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Check the current view
SELECT 'Current leaderboard view:' as check_step;
SELECT * FROM public.top_escape_artists LIMIT 10;

-- 6. Check if users are properly linked
SELECT 'Checking user linkage:' as check_step;
SELECT
    u.id as user_id,
    u.email,
    p.username as profile_username,
    COUNT(gs.id) as total_games,
    MAX(gs.score) as best_score
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.game_scores gs ON gs.user_id = u.id
GROUP BY u.id, u.email, p.username
ORDER BY best_score DESC NULLS LAST
LIMIT 10;