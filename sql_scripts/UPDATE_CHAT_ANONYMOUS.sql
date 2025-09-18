-- UPDATE CHAT SYSTEM FOR ANONYMOUS MESSAGES
-- This updates the chat to allow anonymous messages

-- Alter chat_messages table to allow null user_id for anonymous messages
ALTER TABLE public.chat_messages
ALTER COLUMN user_id DROP NOT NULL;

-- Add is_anonymous column
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Drop and recreate policies to allow anonymous messages
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;

-- Everyone can read messages
CREATE POLICY "Anyone can read chat messages"
ON public.chat_messages
FOR SELECT
TO public
USING (NOT is_deleted);

-- Anyone can send messages (authenticated or anonymous)
CREATE POLICY "Anyone can insert chat messages"
ON public.chat_messages
FOR INSERT
TO public
WITH CHECK (
    LENGTH(message) > 0 AND
    LENGTH(message) <= 500
);

-- Update send_chat_message function to allow anonymous messages
CREATE OR REPLACE FUNCTION public.send_chat_message(
    p_message TEXT,
    p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_message_id BIGINT;
    v_is_anon BOOLEAN;
BEGIN
    -- Get current user if authenticated
    v_user_id := auth.uid();
    v_is_anon := p_is_anonymous OR (v_user_id IS NULL);

    -- Determine username
    IF v_is_anon THEN
        v_username := 'Anonymous Mayo Man #' || floor(random() * 9999 + 1)::TEXT;
        v_user_id := NULL; -- Ensure anonymous messages have null user_id
    ELSE
        -- Get username from profile
        SELECT username INTO v_username
        FROM public.profiles
        WHERE id = v_user_id;

        IF v_username IS NULL THEN
            v_username := 'Mayo Man #' || substr(v_user_id::TEXT, 1, 8);
        END IF;
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

    -- Insert message
    INSERT INTO public.chat_messages (user_id, username, message, is_anonymous)
    VALUES (v_user_id, v_username, TRIM(p_message), v_is_anon)
    RETURNING id INTO v_message_id;

    RETURN json_build_object(
        'success', true,
        'message_id', v_message_id,
        'username', v_username,
        'is_anonymous', v_is_anon
    );
END;
$$;