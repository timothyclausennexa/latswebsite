-- Remove founder user from database

-- First, delete any game scores for the founder user
DELETE FROM public.game_scores
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE username = 'Founder'
);

-- Then delete the founder profile
DELETE FROM public.profiles
WHERE username = 'Founder';

-- Check results
SELECT username, display_name FROM public.profiles WHERE username = 'Founder';