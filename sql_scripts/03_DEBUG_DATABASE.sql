-- Check Database Status
-- Run this first to see what tables and data already exist

-- 1. Check if tables exist
SELECT 'Checking existing tables:' as status;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('site_config', 'admin_users', 'users', 'skins', 'user_inventories', 'missions', 'user_missions')
ORDER BY table_name;

-- 2. Check site_config table structure and data if it exists
SELECT '---' as separator;
SELECT 'Checking site_config table:' as status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'site_config'
ORDER BY ordinal_position;

SELECT '---' as separator;
SELECT 'Site config data:' as status;
SELECT key, value FROM site_config ORDER BY key;

-- 3. Check admin_users table structure and data if it exists
SELECT '---' as separator;
SELECT 'Checking admin_users table:' as status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'admin_users'
ORDER BY ordinal_position;

SELECT '---' as separator;
SELECT 'Admin users data:' as status;
SELECT au.*, u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id;

-- 4. Check if there are any users in auth.users
SELECT '---' as separator;
SELECT 'Checking auth.users:' as status;
SELECT COUNT(*) as user_count FROM auth.users;

SELECT '---' as separator;
SELECT 'First 5 users:' as status;
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at
LIMIT 5;

-- 5. Check RLS policies
SELECT '---' as separator;
SELECT 'Checking RLS policies on site_config:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'site_config';

SELECT '---' as separator;
SELECT 'Checking RLS policies on admin_users:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'admin_users';

-- 6. Check if RLS is enabled
SELECT '---' as separator;
SELECT 'Checking if RLS is enabled:' as status;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('site_config', 'admin_users');