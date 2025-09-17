-- DEBUG SCORE SUBMISSION ISSUES
-- Run this script to diagnose why scores aren't being saved

-- 1. Check if the submit_game_score function exists
SELECT 'Checking if submit_game_score function exists...' as status;
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosrc as source_preview
FROM pg_proc
WHERE proname = 'submit_game_score'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check if the game_scores table exists and has the right columns
SELECT 'Checking game_scores table structure...' as status;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'game_scores'
ORDER BY ordinal_position;

-- 3. Check RLS policies on game_scores
SELECT 'Checking RLS policies on game_scores...' as status;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'game_scores';

-- 4. Check if RLS is enabled
SELECT 'Checking if RLS is enabled...' as status;
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'game_scores';

-- 5. Test the function with a dummy call (will fail but shows if callable)
SELECT 'Testing function signature...' as status;
DO $$
BEGIN
    -- Try to call the function to see if it exists
    PERFORM public.submit_game_score(100, 60.5);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test result: %', SQLERRM;
END $$;

-- 6. Check recent scores to see if anything is being saved
SELECT 'Checking recent game scores (last 10)...' as status;
SELECT
    id,
    user_id,
    score,
    survival_time,
    created_at,
    (SELECT username FROM profiles WHERE profiles.id = game_scores.user_id) as username
FROM public.game_scores
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check if there are any users in profiles table
SELECT 'Checking profiles table...' as status;
SELECT COUNT(*) as total_users FROM public.profiles;

-- 8. Show current user (if authenticated)
SELECT 'Current authenticated user...' as status;
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 9. Try manually inserting a test score (will only work if authenticated)
SELECT 'Attempting manual score insert test...' as status;
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user from profiles for testing
    SELECT id INTO test_user_id FROM public.profiles LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Try to insert a test score
        INSERT INTO public.game_scores (user_id, score, survival_time, created_at)
        VALUES (test_user_id, 999999, 99.9, NOW());

        RAISE NOTICE 'Test score inserted successfully for user %', test_user_id;

        -- Delete the test score
        DELETE FROM public.game_scores WHERE score = 999999 AND user_id = test_user_id;
        RAISE NOTICE 'Test score deleted';
    ELSE
        RAISE NOTICE 'No users found in profiles table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Manual insert test failed: %', SQLERRM;
END $$;

-- 10. Check function permissions
SELECT 'Checking function permissions...' as status;
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    r.rolname as role_name,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')) r
WHERE p.proname = 'submit_game_score'
AND n.nspname = 'public';