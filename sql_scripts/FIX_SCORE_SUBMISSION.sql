-- FIX SCORE SUBMISSION FUNCTION
-- This fixes the parameter names to match what the frontend is calling

-- Drop existing function versions
DROP FUNCTION IF EXISTS public.submit_game_score(integer);
DROP FUNCTION IF EXISTS public.submit_game_score(integer, real);
DROP FUNCTION IF EXISTS public.submit_game_score CASCADE;

-- Create the submit_game_score function with correct parameter names
CREATE OR REPLACE FUNCTION public.submit_game_score(
    new_score INTEGER,
    new_survival_time REAL DEFAULT 0  -- Frontend calls it new_survival_time
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_coins_earned INTEGER;
    v_new_score_id BIGINT;
    v_high_score INTEGER;
    is_new_high BOOLEAN := false;
BEGIN
    -- Get the current authenticated user
    v_user_id := auth.uid();

    -- Log the attempt
    RAISE NOTICE 'Score submission attempt: user_id=%, score=%, survival_time=%',
                 v_user_id, new_score, new_survival_time;

    -- If no user is logged in, return error
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not authenticated',
            'coins_earned', 0
        );
    END IF;

    -- Get username from profiles
    SELECT username INTO v_username
    FROM public.profiles
    WHERE id = v_user_id;

    -- Get user's current high score
    SELECT COALESCE(MAX(score), 0) INTO v_high_score
    FROM public.game_scores
    WHERE user_id = v_user_id;

    is_new_high := new_score > v_high_score;

    -- Calculate coins earned (10% of score, double for new high score)
    v_coins_earned := GREATEST(1, FLOOR(new_score * 0.1));
    IF is_new_high THEN
        v_coins_earned := v_coins_earned * 2;
    END IF;

    -- Insert the game score
    INSERT INTO public.game_scores (user_id, score, survival_time, created_at)
    VALUES (v_user_id, new_score, new_survival_time, NOW())
    RETURNING id INTO v_new_score_id;

    -- Update user's coins in profiles
    UPDATE public.profiles
    SET coins = COALESCE(coins, 0) + v_coins_earned,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Log success
    RAISE NOTICE 'Score saved successfully: score_id=%, coins_earned=%', v_new_score_id, v_coins_earned;

    RETURN json_build_object(
        'success', true,
        'message', CASE
            WHEN is_new_high THEN 'New high score! Coins doubled!'
            ELSE 'Score saved successfully!'
        END,
        'coins_earned', v_coins_earned,
        'username', v_username,
        'score_id', v_new_score_id,
        'is_new_high', is_new_high
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE WARNING 'Error in submit_game_score: %', SQLERRM;

        RETURN json_build_object(
            'success', false,
            'message', 'Error saving score: ' || SQLERRM,
            'coins_earned', 0
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.submit_game_score TO anon, authenticated;

-- Also ensure the game_scores table has proper RLS policies
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view game scores" ON public.game_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.game_scores;

-- Create policies
CREATE POLICY "Anyone can view game scores"
    ON public.game_scores FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own scores"
    ON public.game_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Test that the function exists and has correct signature
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'submit_game_score'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test the view is working
SELECT COUNT(*) as leaderboard_entries FROM public.top_escape_artists;