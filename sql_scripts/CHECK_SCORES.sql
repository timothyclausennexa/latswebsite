-- Check why scores show as 0

-- 1. Check raw game_scores data
SELECT 'Raw game_scores data:' as check;
SELECT
    id,
    user_id,
    score,
    survival_time,
    created_at
FROM public.game_scores
ORDER BY score DESC
LIMIT 10;

-- 2. Check the view structure
SELECT 'View data (top_escape_artists):' as check;
SELECT * FROM public.top_escape_artists LIMIT 10;

-- 3. Check column names in the view
SELECT 'Column names in view:' as check;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'top_escape_artists';

-- 4. Check if scores are actually being saved
SELECT 'Score statistics:' as check;
SELECT
    COUNT(*) as total_scores,
    MAX(score) as max_score,
    MIN(score) as min_score,
    AVG(score) as avg_score
FROM public.game_scores;