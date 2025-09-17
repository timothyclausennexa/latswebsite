# Leaderboard Saving Fix Instructions

## Problem Identified
The leaderboard isn't saving scores because the `submit_game_score` RPC function in the database has incorrect parameter names that don't match what the frontend is calling.

### The Issue:
- Frontend code calls: `supabase.rpc('submit_game_score', { new_score: score, new_survival_time: survivalTime })`
- But some SQL scripts use different parameter names like `p_survival_time` instead of `new_survival_time`

## Solution Steps

### Step 1: Run the Debug Script First
Go to your Supabase SQL Editor and run:
```sql
-- Copy and paste the contents of:
sql_scripts/DEBUG_SCORE_SUBMISSION.sql
```

This will help diagnose the current state of your database and show:
- If the function exists
- What parameters it expects
- If there are any permission issues
- Recent scores in the database

### Step 2: Apply the Fix
Run this script in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of:
sql_scripts/FIX_SCORE_SUBMISSION.sql
```

This script:
1. Drops any existing versions of the function
2. Creates the function with the CORRECT parameter names (`new_score` and `new_survival_time`)
3. Sets up proper permissions for authenticated users
4. Adds proper RLS policies

### Step 3: Verify the Fix
After running the fix script, test by:

1. **In the game**: Play a game and let it end. Check the browser console for:
   - "✅ Score submitted successfully!" message
   - No error messages about RPC calls

2. **Check the database**: Run this query in Supabase:
```sql
SELECT * FROM game_scores ORDER BY created_at DESC LIMIT 10;
```

3. **Check the leaderboard view**:
```sql
SELECT * FROM top_escape_artists LIMIT 10;
```

## If It Still Doesn't Work

### Check Authentication:
1. Make sure users are properly logged in before playing
2. Check browser console for authentication errors
3. Verify the user has a profile in the profiles table

### Check RLS Policies:
Run this to ensure RLS is properly configured:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('game_scores', 'profiles');

-- If RLS is not enabled, enable it:
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Check Function Permissions:
```sql
-- Grant permissions if needed
GRANT EXECUTE ON FUNCTION public.submit_game_score TO anon, authenticated;
GRANT ALL ON public.game_scores TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
```

## Additional Debugging

If scores still aren't saving, check the browser console for detailed error messages. The game logs extensive debugging information including:
- User authentication state
- Score submission attempts
- RPC call responses
- Error details

Look for messages starting with:
- 🔍 (auth state)
- 🚀 (score submission)
- ✅ (success)
- ❌ (errors)

## Quick Test

To quickly test if the function works, run this in Supabase SQL Editor while logged in:
```sql
SELECT submit_game_score(100, 30.5);
```

This should return a JSON response with success status and coins earned.