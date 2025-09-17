-- FIX ADMIN PERMISSIONS FOR SITE CONFIG
-- This fixes the RLS policy error when admins try to update site_config

-- Drop existing policies
DROP POLICY IF EXISTS "site_config_select" ON public.site_config;
DROP POLICY IF EXISTS "site_config_update" ON public.site_config;
DROP POLICY IF EXISTS "site_config_insert" ON public.site_config;
DROP POLICY IF EXISTS "Admins can update site config" ON public.site_config;
DROP POLICY IF EXISTS "Admins can insert site config" ON public.site_config;

-- Enable RLS on site_config
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Everyone can read site_config
CREATE POLICY "Anyone can read site config"
ON public.site_config
FOR SELECT
TO public
USING (true);

-- Admins can insert new config
CREATE POLICY "Admins can insert site config"
ON public.site_config
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = auth.uid()
    )
);

-- Admins can update existing config
CREATE POLICY "Admins can update site config"
ON public.site_config
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = auth.uid()
    )
);

-- Update the function to handle both insert and update
CREATE OR REPLACE FUNCTION public.update_site_config(
    p_key TEXT,
    p_value TEXT,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS(
        SELECT 1 FROM public.admin_users
        WHERE user_id = p_user_id
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Not an admin'
        );
    END IF;

    -- Insert or update the config
    INSERT INTO public.site_config (key, value, updated_at)
    VALUES (p_key, p_value, NOW())
    ON CONFLICT (key)
    DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;

    RETURN json_build_object(
        'success', true,
        'message', 'Configuration updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_site_config TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_config_key ON public.site_config(key);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Test the setup by inserting default values if they don't exist
INSERT INTO public.site_config (key, value)
VALUES
    ('token_contract_address', NULL),
    ('pump_fun_link', NULL),
    ('live_stream_link', NULL)
ON CONFLICT (key) DO NOTHING;

-- Verify the policies are working
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'site_config';