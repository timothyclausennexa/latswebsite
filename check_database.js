import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecjczgwzzqinulbmsvkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjamN6Z3d6enFpbnVsYm1zdmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQxNDUsImV4cCI6MjA3MzYwMDE0NX0.26P6Or0GwelKBziyAlXbKTh7ryHgh99wBz9Ll7BguS8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
    console.log('🔍 Checking database structure...\n');

    // Check profiles table
    try {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (profilesError) {
            console.log('❌ Profiles table:', profilesError.message);
        } else {
            console.log('✅ Profiles table exists');
            if (profiles && profiles.length > 0) {
                console.log('   Columns:', Object.keys(profiles[0]));
            } else {
                console.log('   No data yet');
            }
        }
    } catch (e) {
        console.log('❌ Profiles table error:', e.message);
    }

    // Check game_scores table
    try {
        const { data: scores, error: scoresError } = await supabase
            .from('game_scores')
            .select('*')
            .limit(1);

        if (scoresError) {
            console.log('❌ Game_scores table:', scoresError.message);
        } else {
            console.log('✅ Game_scores table exists');
            if (scores && scores.length > 0) {
                console.log('   Columns:', Object.keys(scores[0]));
            } else {
                console.log('   No data yet');
            }
        }
    } catch (e) {
        console.log('❌ Game_scores table error:', e.message);
    }

    // Check skins table
    try {
        const { data: skins, error: skinsError } = await supabase
            .from('skins')
            .select('*')
            .limit(1);

        if (skinsError) {
            console.log('❌ Skins table:', skinsError.message);
        } else {
            console.log('✅ Skins table exists');
            if (skins && skins.length > 0) {
                console.log('   Columns:', Object.keys(skins[0]));
                console.log('   Count:', skins.length);
            } else {
                console.log('   No data yet');
            }
        }
    } catch (e) {
        console.log('❌ Skins table error:', e.message);
    }

    // Check top_escape_artists view
    try {
        const { data: leaderboard, error: leaderboardError } = await supabase
            .from('top_escape_artists')
            .select('*')
            .limit(1);

        if (leaderboardError) {
            console.log('❌ Top_escape_artists view:', leaderboardError.message);
        } else {
            console.log('✅ Top_escape_artists view exists');
            if (leaderboard && leaderboard.length > 0) {
                console.log('   Columns:', Object.keys(leaderboard[0]));
            } else {
                console.log('   No data yet');
            }
        }
    } catch (e) {
        console.log('❌ Top_escape_artists view error:', e.message);
    }

    console.log('\n🔍 Database check complete');
}

checkDatabase();