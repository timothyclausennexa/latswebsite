-- Admin System Setup for LATS Website
-- Run this in Supabase SQL Editor

-- 1. Create site_config table for storing CA and links
CREATE TABLE IF NOT EXISTS site_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default config values
INSERT INTO site_config (key, value) VALUES
    ('token_contract_address', NULL),
    ('pump_fun_link', NULL),
    ('live_stream_link', 'https://www.twitch.tv/latsirl'),
    ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- 4. Create function to make first user admin
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is the first user
    IF NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
        -- Make this user the super admin
        INSERT INTO admin_users (user_id, is_super_admin)
        VALUES (NEW.id, TRUE);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for first user admin
DROP TRIGGER IF EXISTS first_user_admin_trigger ON auth.users;
CREATE TRIGGER first_user_admin_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION make_first_user_admin();

-- 6. Create function to update site config
CREATE OR REPLACE FUNCTION update_site_config(
    p_key TEXT,
    p_value TEXT,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = p_user_id
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN json_build_object('success', FALSE, 'message', 'Unauthorized');
    END IF;

    -- Update the config
    INSERT INTO site_config (key, value, updated_by)
    VALUES (p_key, p_value, p_user_id)
    ON CONFLICT (key)
    DO UPDATE SET
        value = p_value,
        updated_at = NOW(),
        updated_by = p_user_id;

    RETURN json_build_object('success', TRUE, 'message', 'Config updated');
END;
$$ LANGUAGE plpgsql;

-- 7. Create RLS policies for site_config
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read site config
CREATE POLICY "Anyone can read site config"
    ON site_config FOR SELECT
    USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update site config"
    ON site_config FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- 8. Create RLS for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin table
CREATE POLICY "Only admins can read admin users"
    ON admin_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- 9. Grant necessary permissions
GRANT SELECT ON site_config TO authenticated, anon;
GRANT UPDATE ON site_config TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION update_site_config TO authenticated;

-- 10. Create realtime publication for site_config
DROP PUBLICATION IF EXISTS site_config_changes;
CREATE PUBLICATION site_config_changes FOR TABLE site_config;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE site_config;

SELECT 'Admin system setup complete! First user to sign up will be admin.' as message;