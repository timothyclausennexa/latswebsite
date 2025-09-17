import React, { useState } from 'react';
import { Button } from './ui/Button';

const DatabaseSetupNotice: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const sqlScript = `-- FIXED SQL - Works with existing database structure
-- Copy and paste this into your Supabase SQL editor:

-- Add missing columns to existing profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_skin TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS owned_skins TEXT[] DEFAULT ARRAY['default'],
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Update existing profiles with default values
UPDATE public.profiles
SET
    display_name = COALESCE(display_name, username),
    coins = COALESCE(coins, 100),
    current_skin = COALESCE(current_skin, 'default'),
    owned_skins = COALESCE(owned_skins, ARRAY['default']),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE display_name IS NULL OR coins IS NULL OR current_skin IS NULL OR owned_skins IS NULL;

-- Add survival_time to game_scores table
ALTER TABLE public.game_scores
ADD COLUMN IF NOT EXISTS survival_time REAL DEFAULT 0;

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
    ('prison', 'Prison Stripes', 300, '#FF8A00', 'legendary')
ON CONFLICT (id) DO NOTHING;

-- Create shop functions
CREATE OR REPLACE FUNCTION public.buy_skin(skin_id TEXT)
RETURNS JSON AS $$
DECLARE
    user_profile public.profiles;
    skin_data public.skins;
BEGIN
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();
    IF user_profile IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User profile not found');
    END IF;
    SELECT * INTO skin_data FROM public.skins WHERE id = skin_id;
    IF skin_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Skin not found');
    END IF;
    IF skin_id = ANY(user_profile.owned_skins) THEN
        RETURN json_build_object('success', false, 'message', 'You already own this skin');
    END IF;
    IF user_profile.coins < skin_data.price THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient coins');
    END IF;
    UPDATE public.profiles
    SET coins = coins - skin_data.price,
        owned_skins = array_append(owned_skins, skin_id),
        updated_at = NOW()
    WHERE id = auth.uid();
    RETURN json_build_object('success', true, 'message', 'Skin purchased successfully!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.equip_skin(skin_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile public.profiles;
BEGIN
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();
    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    IF NOT (skin_id = ANY(user_profile.owned_skins)) THEN
        RAISE EXCEPTION 'You do not own this skin';
    END IF;
    UPDATE public.profiles SET current_skin = skin_id, updated_at = NOW() WHERE id = auth.uid();
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create leaderboard view
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

-- Enable RLS and create policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Game scores are viewable by everyone" ON public.game_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.game_scores;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Game scores are viewable by everyone" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.game_scores TO authenticated;
GRANT ALL ON public.skins TO authenticated;
GRANT SELECT ON public.top_escape_artists TO authenticated, anon;`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sqlScript);
        alert('SQL script copied to clipboard! Paste it in your Supabase SQL editor.');
    };

    return (
        <div className="bg-alarm-red/20 border-2 border-alarm-red rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-alarm-red">⚠️ Database Setup Required</h3>
                    <p className="text-ash-white text-sm">
                        Run the SQL script in your Supabase dashboard to enable all features.
                    </p>
                </div>
                <div className="space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Hide' : 'Show'} SQL
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={copyToClipboard}
                    >
                        Copy SQL
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4">
                    <div className="bg-prison-black border border-ash-white/30 rounded p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-ash-white whitespace-pre-wrap font-mono">
                            {sqlScript}
                        </pre>
                    </div>
                    <div className="mt-2 text-xs text-ash-white/70">
                        <p>1. Go to your Supabase project dashboard</p>
                        <p>2. Navigate to SQL Editor</p>
                        <p>3. Paste and run this script</p>
                        <p>4. Refresh this page</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseSetupNotice;