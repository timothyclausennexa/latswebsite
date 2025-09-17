import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
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
            console.log(`${i + 1}. User: ${score.user_id}, Score: ${score.score}, Time: ${score.survival_time}`);
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
            console.log(`${i + 1}. ${entry.username}: ${entry.high_score}`);
        });
    }

    console.log('\n---\n');

    // Check if the view is correctly aggregating
    const { data: profileScores, error: profileError } = await supabase
        .from('profiles')
        .select(`
            id,
            username,
            game_scores (
                score,
                survival_time
            )
        `)
        .limit(5);

    if (profileError) {
        console.error('Error fetching profiles with scores:', profileError);
    } else {
        console.log('Sample profiles with their scores:');
        profileScores.forEach(profile => {
            const scores = profile.game_scores || [];
            const maxScore = Math.max(...scores.map(s => s.score), 0);
            console.log(`${profile.username}: Max score = ${maxScore}, Total games = ${scores.length}`);
        });
    }
}

checkLeaderboard().then(() => process.exit(0));