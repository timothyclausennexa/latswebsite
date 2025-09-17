-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    coins INTEGER DEFAULT 100,
    current_skin TEXT DEFAULT 'default',
    owned_skins TEXT[] DEFAULT ARRAY['default'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create game_scores table
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    survival_time REAL DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create daily_missions table
CREATE TABLE IF NOT EXISTS public.daily_missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_type TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    reward_coins INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, mission_type, created_at)
);

-- Create skins table
CREATE TABLE IF NOT EXISTS public.skins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    color TEXT NOT NULL,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    animated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default skins
INSERT INTO public.skins (id, name, price, color, rarity) VALUES
    ('default', 'Prison Orange', 0, '#FF8A00', 'common'),
    ('shadow', 'Shadow Black', 50, '#0D0D0D', 'common'),
    ('ghost', 'Ghost White', 50, '#E5E5E5', 'common'),
    ('blood', 'Blood Red', 100, '#9E3039', 'rare'),
    ('gold', 'Golden', 250, '#FFD700', 'epic'),
    ('neon', 'Neon Green', 150, '#39FF14', 'rare'),
    ('cyber', 'Cyber Blue', 200, '#00FFFF', 'epic'),
    ('prison', 'Prison Stripes', 300, '#FF8A00', 'legendary');

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to submit game score
CREATE OR REPLACE FUNCTION public.submit_game_score(new_score INTEGER)
RETURNS TEXT AS $$
DECLARE
    user_profile public.profiles;
    coin_reward INTEGER;
    high_score INTEGER;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();

    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Insert the score
    INSERT INTO public.game_scores (user_id, score) VALUES (auth.uid(), new_score);

    -- Calculate coin reward (1 coin per 100 points)
    coin_reward := new_score / 100;

    -- Get user's highest score
    SELECT MAX(score) INTO high_score FROM public.game_scores WHERE user_id = auth.uid();

    -- Update user coins
    UPDATE public.profiles
    SET coins = coins + coin_reward,
        updated_at = NOW()
    WHERE id = auth.uid();

    -- Return feedback message
    IF new_score = high_score THEN
        RETURN 'NEW PERSONAL BEST! +' || coin_reward || ' coins earned!';
    ELSE
        RETURN 'Score submitted! +' || coin_reward || ' coins earned!';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to buy skin
CREATE OR REPLACE FUNCTION public.buy_skin(skin_id TEXT)
RETURNS JSON AS $$
DECLARE
    user_profile public.profiles;
    skin_data public.skins;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();

    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Get skin data
    SELECT * INTO skin_data FROM public.skins WHERE id = skin_id;

    IF skin_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Skin not found');
    END IF;

    -- Check if user already owns the skin
    IF skin_id = ANY(user_profile.owned_skins) THEN
        RETURN json_build_object('success', false, 'message', 'You already own this skin');
    END IF;

    -- Check if user has enough coins
    IF user_profile.coins < skin_data.price THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient coins');
    END IF;

    -- Purchase the skin
    UPDATE public.profiles
    SET coins = coins - skin_data.price,
        owned_skins = array_append(owned_skins, skin_id),
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN json_build_object(
        'success', true,
        'message', 'Skin purchased successfully!',
        'remaining_coins', user_profile.coins - skin_data.price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to equip skin
CREATE OR REPLACE FUNCTION public.equip_skin(skin_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile public.profiles;
BEGIN
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();

    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Check if user owns the skin
    IF NOT (skin_id = ANY(user_profile.owned_skins)) THEN
        RAISE EXCEPTION 'You do not own this skin';
    END IF;

    -- Equip the skin
    UPDATE public.profiles
    SET current_skin = skin_id,
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create leaderboard view for Top Escape Artists
CREATE OR REPLACE VIEW public.top_escape_artists AS
SELECT
    p.username,
    p.display_name,
    MAX(gs.score) as high_score,
    MAX(gs.survival_time) as best_time,
    COUNT(gs.id) as games_played,
    p.current_skin,
    CASE
        WHEN MAX(gs.survival_time) >= 120 THEN 'ESCAPE ARTIST'
        WHEN MAX(gs.survival_time) >= 60 THEN 'SURVIVOR'
        ELSE 'PRISONER'
    END as rank_title,
    ROW_NUMBER() OVER (ORDER BY MAX(gs.score) DESC, MAX(gs.survival_time) DESC) as rank
FROM public.profiles p
LEFT JOIN public.game_scores gs ON p.id = gs.user_id
WHERE p.username IS NOT NULL
GROUP BY p.id, p.username, p.display_name, p.current_skin
ORDER BY high_score DESC, best_time DESC
LIMIT 50;

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Game scores policies
CREATE POLICY "Game scores are viewable by everyone" ON public.game_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON public.game_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily missions policies
CREATE POLICY "Users can view own missions" ON public.daily_missions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own missions" ON public.daily_missions
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.game_scores TO authenticated;
GRANT ALL ON public.daily_missions TO authenticated;
GRANT ALL ON public.skins TO authenticated;
GRANT SELECT ON public.leaderboard TO authenticated, anon;