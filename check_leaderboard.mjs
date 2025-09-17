import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ecjczgwzzqinulbmsvkc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjamN6Z3d6enFpbnVsYm1zdmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQxNDUsImV4cCI6MjA3MzYwMDE0NX0.26P6Or0GwelKBziyAlXbKTh7ryHgh99wBz9Ll7BguS8'
);

async function checkLeaderboard() {
    console.log('Checking leaderboard data...\n');

    // Check game_scores table directly
    const { data: scores, error: scoresError } = await supabase
        .from('game_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

    if (scoresError) {
        console.error('Error fetching game_scores:', scoresError);
    } else {
        console.log('Top 10 scores from game_scores table:');
        scores.forEach((score, i) => {
            console.log(`${i + 1}. User: ${score.user_id}, Score: ${score.score}, Time: ${score.survival_time}s`);
        });
    }

    console.log('\n---\n');

    // Check top_escape_artists view
    const { data: leaderboard, error: leaderboardError } = await supabase
        .from('top_escape_artists')
        .select('*')
        .limit(10);

    if (leaderboardError) {
        console.error('Error fetching top_escape_artists:', leaderboardError);
        console.log('View might not exist or have issues');
    } else {
        console.log('Top 10 from top_escape_artists view:');
        leaderboard.forEach((entry, i) => {
            console.log(`${i + 1}. ${entry.username}: Score=${entry.high_score}, Rank=${entry.rank}`);
        });
    }
}

checkLeaderboard().then(() => process.exit(0));