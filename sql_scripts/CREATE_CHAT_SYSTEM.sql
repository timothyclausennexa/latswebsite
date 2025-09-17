-- CREATE REAL-TIME CHAT SYSTEM
-- This creates the tables and functions for the public chat

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;

-- Create policies
-- Everyone can read messages
CREATE POLICY "Anyone can read chat messages"
ON public.chat_messages
FOR SELECT
TO public
USING (NOT is_deleted);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can insert chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    LENGTH(message) > 0 AND
    LENGTH(message) <= 500
);

-- Users can soft delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to send a chat message
CREATE OR REPLACE FUNCTION public.send_chat_message(
    p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_message_id BIGINT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Get username
    SELECT username INTO v_username
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_username IS NULL THEN
        v_username := 'Anonymous';
    END IF;

    -- Validate message
    IF LENGTH(TRIM(p_message)) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Message cannot be empty'
        );
    END IF;

    IF LENGTH(p_message) > 500 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Message too long (max 500 characters)'
        );
    END IF;

    -- Check for spam (basic rate limiting - max 5 messages per minute)
    IF (
        SELECT COUNT(*)
        FROM public.chat_messages
        WHERE user_id = v_user_id
        AND created_at > NOW() - INTERVAL '1 minute'
    ) >= 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Too many messages. Please wait a moment.'
        );
    END IF;

    -- Insert message
    INSERT INTO public.chat_messages (user_id, username, message)
    VALUES (v_user_id, v_username, TRIM(p_message))
    RETURNING id INTO v_message_id;

    RETURN json_build_object(
        'success', true,
        'message_id', v_message_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.send_chat_message TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT SELECT ON public.chat_messages TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.chat_messages_id_seq TO authenticated;

-- Function to get recent messages (for initial load)
CREATE OR REPLACE FUNCTION public.get_recent_messages(
    p_limit INTEGER DEFAULT 50
)
RETURNS SETOF public.chat_messages
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.chat_messages
    WHERE NOT is_deleted
    ORDER BY created_at DESC
    LIMIT p_limit;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.get_recent_messages TO public;

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;