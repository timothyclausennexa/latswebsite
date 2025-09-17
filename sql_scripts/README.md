# SQL Scripts for LATS Website

## Important Scripts (Run in Order)

### 1. `01_MAIN_FIX_LEADERBOARD.sql`
**Purpose:** Fixes the leaderboard and score saving system
- Creates/fixes the `submit_game_score` function
- Sets up the `top_escape_artists` view
- Handles both authenticated and guest players
- Awards coins based on performance

### 2. `02_SETUP_ADMIN.sql`
**Purpose:** Sets up the admin system
- Creates `admin_users` and `site_config` tables
- Sets up admin dashboard functionality
- First user to sign up becomes admin

### 3. `03_DEBUG_DATABASE.sql`
**Purpose:** Debugging tool to check database status
- Shows existing tables and data
- Checks user profiles
- Verifies RLS policies

## Other Scripts

### Missions System
- `setup_missions_complete.sql` - Complete missions system setup
- `create_missions_tables.sql` - Creates mission tables
- `fix_missions_*.sql` - Various mission fixes

### Game Features
- `update_submit_game_score*.sql` - Game scoring updates
- `update_skin_prices.sql` - Shop skin pricing

### Database Setup
- `setup_database.sql` - Initial database setup
- `add_missing_functions.sql` - Additional database functions

## How to Use

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the script content
5. Click Run

## Current Status
✅ Leaderboard fixed and working
✅ Admin system set up
✅ Missions system ready
✅ Game scoring functional