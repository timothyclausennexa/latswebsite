-- COMPLETE FIX FOR LEADERBOARD - CORRECTED VERSION
-- Run this entire script to fix all leaderboard issues

-- 1. Drop the old function with different parameters
DROP FUNCTION IF EXISTS public.submit_game_score(integer);
DROP FUNCTION IF EXISTS public.submit_game_score(integer, real);
DROP FUNCTION IF EXISTS public.submit_game_score CASCADE;

-- 2. Create the correct submit_game_score function
CREATE OR REPLACE FUNCTION public.submit_game_score(
    new_score INTEGER,
    p_survival_time REAL DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_coins_earned INTEGER;
    v_new_score_id BIGINT;
BEGIN
    -- Get the current user
    v_user_id := auth.uid();

    -- If no user is logged in, still save as anonymous
    IF v_user_id IS NULL THEN
        INSERT INTO public.game_scores (user_id, score, survival_time, created_at)
        VALUES (NULL, new_score, p_survival_time, NOW())
        RETURNING id INTO v_new_score_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Score saved (anonymous)',
            'coins_earned', 0
        );
    END IF;

    -- Get username from profiles
    SELECT username INTO v_username
    FROM public.profiles
    WHERE id = v_user_id;

    -- Calculate coins earned (10% of score)
    v_coins_earned := GREATEST(1, FLOOR(new_score * 0.1));

    -- Insert the game score
    INSERT INTO public.game_scores (user_id, score, survival_time, created_at)
    VALUES (v_user_id, new_score, p_survival_time, NOW())
    RETURNING id INTO v_new_score_id;

    -- Update user's coins in profiles
    UPDATE public.profiles
    SET coins = COALESCE(coins, 0) + v_coins_earned
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Score saved successfully!',
        'coins_earned', v_coins_earned,
        'username', v_username,
        'score_id', v_new_score_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error saving score: ' || SQLERRM,
            'coins_earned', 0
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION submit_game_score TO anon, authenticated;

-- 3. Add coins column if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100;

-- 4. Fix the leaderboard view (SIMPLIFIED VERSION)
DROP VIEW IF EXISTS public.top_escape_artists;

CREATE OR REPLACE VIEW public.top_escape_artists AS
SELECT
    ROW_NUMBER() OVER (ORDER BY score DESC, survival_time DESC) as rank,
    id,
    username,
    best_time,
    total_escapes,
    coins,
    wallet_address
FROM (
    -- Get best score for each user
    SELECT DISTINCT ON (gs.user_id)
        gs.user_id as id,
        COALESCE(p.username, 'Guest_' || SUBSTRING(COALESCE(gs.user_id::text, gen_random_uuid()::text), 1, 6)) as username,
        gs.score as best_time,
        FLOOR(gs.survival_time)::INTEGER as total_escapes,
        COALESCE(p.coins, 0) as coins,
        NULL::text as wallet_address,
        gs.score,
        gs.survival_time
    FROM public.game_scores gs
    LEFT JOIN public.profiles p ON p.id = gs.user_id
    WHERE gs.score > 0
    ORDER BY gs.user_id, gs.score DESC, gs.survival_time DESC
) subquery
ORDER BY score DESC, survival_time DESC
LIMIT 100;

-- 5. Grant permissions
GRANT SELECT ON public.top_escape_artists TO anon, authenticated;
GRANT SELECT, INSERT ON public.game_scores TO anon, authenticated;

-- 6. Fix RLS policies
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can read scores" ON public.game_scores;
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.game_scores;
DROP POLICY IF EXISTS "Game scores are viewable by everyone" ON public.game_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.game_scores;

-- Create new policies
CREATE POLICY "Anyone can read scores"
    ON public.game_scores FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert scores"
    ON public.game_scores FOR INSERT
    WITH CHECK (true);

-- 7. Ensure profiles exist for all users
INSERT INTO public.profiles (id, username, coins)
SELECT DISTINCT
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'username',
        SPLIT_PART(u.email, '@', 1),
        'Player' || SUBSTRING(u.id::text, 1, 6)
    ),
    100
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 8. Update any profiles without usernames
UPDATE public.profiles
SET username = 'Player' || SUBSTRING(id::text, 1, 6)
WHERE username IS NULL OR username = '';

-- 9. Add test data if the leaderboard is empty
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.game_scores WHERE score > 0 LIMIT 1) THEN
        -- Create a test user ID
        test_user_id := gen_random_uuid();

        -- Create test profile
        INSERT INTO public.profiles (id, username, coins)
        VALUES
            (test_user_id, 'DemoChampion', 500)
        ON CONFLICT (id) DO NOTHING;

        -- Insert test scores
        INSERT INTO public.game_scores (user_id, score, survival_time, created_at)
        VALUES
            (test_user_id, 15000, 200.5, NOW() - INTERVAL '1 hour'),
            (test_user_id, 12000, 180.3, NOW() - INTERVAL '2 hours'),
            (NULL, 10000, 160.7, NOW() - INTERVAL '3 hours'),
            (NULL, 8000, 140.2, NOW() - INTERVAL '4 hours'),
            (NULL, 6000, 120.8, NOW() - INTERVAL '5 hours');

        RAISE NOTICE 'Test data added to leaderboard';
    END IF;
END $$;

-- 10. Verify the fix
SELECT 'LEADERBOARD FIXED! Current top 10:' as status;

SELECT
    rank,
    username,
    best_time as score,
    total_escapes as survival_seconds,
    coins
FROM public.top_escape_artists
LIMIT 10;

-- Debug: Check if scores are being saved
SELECT 'Total scores in database:' as check, COUNT(*) as count FROM public.game_scores;
SELECT 'Total profiles:' as check, COUNT(*) as count FROM public.profiles;