-- COMMUNITY JUKEBOX SETUP
-- This script creates the tables and functions needed for the community jukebox feature

-- 1. Create the community_playlist table
CREATE TABLE IF NOT EXISTS public.community_playlist (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id),
    spotify_url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by_username TEXT
);

-- 2. Create the daily_song_poll table
CREATE TABLE IF NOT EXISTS public.daily_song_poll (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    option_1_url TEXT NOT NULL,
    option_1_title TEXT NOT NULL,
    option_1_artist TEXT NOT NULL,
    option_1_thumbnail TEXT,
    option_2_url TEXT NOT NULL,
    option_2_title TEXT NOT NULL,
    option_2_artist TEXT NOT NULL,
    option_2_thumbnail TEXT,
    option_3_url TEXT NOT NULL,
    option_3_title TEXT NOT NULL,
    option_3_artist TEXT NOT NULL,
    option_3_thumbnail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    poll_id BIGINT REFERENCES public.daily_song_poll(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    option_number INT NOT NULL CHECK (option_number IN (1, 2, 3)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- 4. Create function to get Spotify metadata (mock implementation)
CREATE OR REPLACE FUNCTION public.get_spotify_metadata_from_db(p_song_url TEXT)
RETURNS JSON AS $$
DECLARE
    track_id TEXT;
    result JSON;
BEGIN
    -- Extract track ID from Spotify URL
    -- Format: https://open.spotify.com/track/TRACK_ID
    track_id := split_part(split_part(p_song_url, '/track/', 2), '?', 1);

    -- For now, return mock data based on the track ID
    -- In production, this would call the actual Spotify API
    result := json_build_object(
        'title', 'Track ' || LEFT(track_id, 8),
        'author_name', 'Artist',
        'thumbnail_url', 'https://via.placeholder.com/150?text=' || LEFT(track_id, 4)
    );

    -- If you have a real Spotify API integration, replace the above with:
    -- result := fetch_from_spotify_api(track_id);

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get community playlist
CREATE OR REPLACE FUNCTION public.get_community_playlist()
RETURNS TABLE (
    id BIGINT,
    spotify_url TEXT,
    title TEXT,
    artist TEXT,
    thumbnail_url TEXT,
    submitted_by_username TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.spotify_url,
        cp.title,
        cp.artist,
        cp.thumbnail_url,
        COALESCE(p.username, 'Anonymous') as submitted_by_username,
        cp.created_at
    FROM public.community_playlist cp
    LEFT JOIN public.profiles p ON p.id = cp.user_id
    ORDER BY cp.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get current poll
CREATE OR REPLACE FUNCTION public.get_current_poll()
RETURNS JSON AS $$
DECLARE
    poll_data RECORD;
    vote_counts JSON;
    user_vote INT;
BEGIN
    -- Get the most recent poll
    SELECT * INTO poll_data
    FROM public.daily_song_poll
    ORDER BY created_at DESC
    LIMIT 1;

    IF poll_data IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get vote counts
    SELECT json_build_object(
        'option_1', COUNT(CASE WHEN option_number = 1 THEN 1 END),
        'option_2', COUNT(CASE WHEN option_number = 2 THEN 1 END),
        'option_3', COUNT(CASE WHEN option_number = 3 THEN 1 END)
    ) INTO vote_counts
    FROM public.poll_votes
    WHERE poll_id = poll_data.id;

    -- Get current user's vote (if authenticated)
    IF auth.uid() IS NOT NULL THEN
        SELECT option_number INTO user_vote
        FROM public.poll_votes
        WHERE poll_id = poll_data.id AND user_id = auth.uid();
    END IF;

    RETURN json_build_object(
        'poll_id', poll_data.id,
        'options', json_build_array(
            json_build_object(
                'url', poll_data.option_1_url,
                'title', poll_data.option_1_title,
                'artist', poll_data.option_1_artist,
                'thumbnail', poll_data.option_1_thumbnail,
                'votes', COALESCE((vote_counts->>'option_1')::INT, 0)
            ),
            json_build_object(
                'url', poll_data.option_2_url,
                'title', poll_data.option_2_title,
                'artist', poll_data.option_2_artist,
                'thumbnail', poll_data.option_2_thumbnail,
                'votes', COALESCE((vote_counts->>'option_2')::INT, 0)
            ),
            json_build_object(
                'url', poll_data.option_3_url,
                'title', poll_data.option_3_title,
                'artist', poll_data.option_3_artist,
                'thumbnail', poll_data.option_3_thumbnail,
                'votes', COALESCE((vote_counts->>'option_3')::INT, 0)
            )
        ),
        'user_vote', user_vote,
        'created_at', poll_data.created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to submit vote
CREATE OR REPLACE FUNCTION public.submit_poll_vote(p_poll_id BIGINT, p_option_number INT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Must be logged in to vote');
    END IF;

    IF p_option_number NOT IN (1, 2, 3) THEN
        RETURN json_build_object('success', false, 'message', 'Invalid option number');
    END IF;

    -- Insert or update vote
    INSERT INTO public.poll_votes (poll_id, user_id, option_number)
    VALUES (p_poll_id, v_user_id, p_option_number)
    ON CONFLICT (poll_id, user_id)
    DO UPDATE SET option_number = p_option_number, created_at = NOW();

    RETURN json_build_object('success', true, 'message', 'Vote submitted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Set up RLS policies
ALTER TABLE public.community_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_song_poll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Playlist policies
CREATE POLICY "Anyone can view playlist"
    ON public.community_playlist FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add songs"
    ON public.community_playlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Poll policies
CREATE POLICY "Anyone can view polls"
    ON public.daily_song_poll FOR SELECT
    USING (true);

-- Vote policies
CREATE POLICY "Anyone can view votes"
    ON public.poll_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own votes"
    ON public.poll_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
    ON public.poll_votes FOR UPDATE
    USING (auth.uid() = user_id);

-- 9. Grant permissions
GRANT ALL ON public.community_playlist TO authenticated;
GRANT SELECT ON public.community_playlist TO anon;

GRANT ALL ON public.daily_song_poll TO authenticated;
GRANT SELECT ON public.daily_song_poll TO anon;

GRANT ALL ON public.poll_votes TO authenticated;
GRANT SELECT ON public.poll_votes TO anon;

GRANT EXECUTE ON FUNCTION public.get_spotify_metadata_from_db TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_playlist TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_poll TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_poll_vote TO authenticated;

-- 10. Insert sample poll for testing
INSERT INTO public.daily_song_poll (
    option_1_url, option_1_title, option_1_artist, option_1_thumbnail,
    option_2_url, option_2_title, option_2_artist, option_2_thumbnail,
    option_3_url, option_3_title, option_3_artist, option_3_thumbnail
) VALUES (
    'https://open.spotify.com/track/1', 'Never Gonna Give You Up', 'Rick Astley', 'https://via.placeholder.com/150?text=Rick',
    'https://open.spotify.com/track/2', 'All Star', 'Smash Mouth', 'https://via.placeholder.com/150?text=Smash',
    'https://open.spotify.com/track/3', 'Sandstorm', 'Darude', 'https://via.placeholder.com/150?text=Darude'
) ON CONFLICT DO NOTHING;

SELECT 'Community Jukebox setup complete!' as status;