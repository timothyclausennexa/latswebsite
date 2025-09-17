import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LeaderboardEntry {
    username: string;
    display_name: string;
    high_score: number;
    best_time: number;
    games_played: number;
    current_skin: string;
    rank_title: string;
    rank: number;
}

export interface LeaderboardRef {
    refreshLeaderboard: () => void;
}

const RealLeaderboard = forwardRef<LeaderboardRef>((props, ref) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<'top3' | 'top10' | 'all'>('top3');

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            console.log('Fetching leaderboard...');

            // Try to fetch from view first, fallback to direct query
            let { data, error } = await supabase
                .from('top_escape_artists')
                .select('*')
                .order('rank', { ascending: true });

            console.log('Leaderboard data:', data);
            console.log('Leaderboard error:', error);

            if (error && error.code === 'PGRST116') {
                // View doesn't exist, try direct query
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select(`
                        username,
                        display_name,
                        current_skin,
                        game_scores(score, survival_time)
                    `)
                    .not('username', 'is', null);

                if (profileError) throw profileError;

                // Process data manually
                data = (profileData || []).map((profile: any, index: number) => {
                    const scores = profile.game_scores || [];
                    const highScore = Math.max(...scores.map((s: any) => s.score), 0);
                    const bestTime = Math.max(...scores.map((s: any) => s.survival_time || 0), 0);

                    return {
                        username: profile.username,
                        display_name: profile.display_name,
                        high_score: highScore,
                        best_time: bestTime,
                        games_played: scores.length,
                        current_skin: profile.current_skin,
                        rank_title: bestTime >= 120 ? 'ESCAPE ARTIST' : bestTime >= 60 ? 'SURVIVOR' : 'PRISONER',
                        rank: index + 1
                    };
                }).sort((a: any, b: any) => b.high_score - a.high_score || b.best_time - a.best_time);
            }

            setLeaderboard(data || []);
        } catch (err: any) {
            setError(`Database setup needed. Contact admin to run setup_database.sql`);
            console.error('Leaderboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Set up real-time subscription
        const subscription = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_scores'
                },
                () => {
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Expose refresh function to parent components
    useImperativeHandle(ref, () => ({
        refreshLeaderboard: () => {
            console.log('Manual leaderboard refresh triggered');
            fetchLeaderboard();
        }
    }));

    const formatTime = (seconds: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getTitleColor = (title: string) => {
        switch (title) {
            case 'ESCAPE ARTIST': return 'text-yellow-400';
            case 'SURVIVOR': return 'text-green-400';
            default: return 'text-ash-white';
        }
    };

    if (loading) {
        return (
            <div className="bg-prison-black border-2 border-ash-white/20 p-6 rounded-lg">
                <h3 className="text-xl font-pixel-heading text-warning-orange mb-4">
                    TOP ESCAPE ARTISTS
                </h3>
                <div className="animate-pulse">
                    <div className="h-4 bg-ash-white/20 rounded mb-2"></div>
                    <div className="h-4 bg-ash-white/20 rounded mb-2"></div>
                    <div className="h-4 bg-ash-white/20 rounded mb-2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-prison-black border-2 border-ash-white/20 p-6 rounded-lg">
                <h3 className="text-xl font-pixel-heading text-warning-orange mb-4">
                    TOP ESCAPE ARTISTS
                </h3>
                <p className="text-alarm-red">Error loading leaderboard: {error}</p>
                <button
                    onClick={fetchLeaderboard}
                    className="mt-2 text-warning-orange hover:text-ash-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-prison-black border-2 border-ash-white/20 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-pixel-heading text-warning-orange">
                    🏆 TOP ESCAPE ARTISTS
                </h3>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchLeaderboard}
                        className="text-xs text-ash-white/60 hover:text-warning-orange transition-colors"
                        title="Refresh leaderboard"
                    >
                        🔄 Refresh
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-ash-white/60">Live</span>
                    </div>
                </div>
            </div>

            {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏃‍♂️</div>
                    <p className="text-ash-white/60 mb-2">No escape artists yet!</p>
                    <p className="text-xs text-ash-white/40">Complete a game to appear on the leaderboard</p>
                </div>
            ) : (
                <>
                    <div className={`space-y-2 ${displayMode === 'all' ? 'max-h-[600px] overflow-y-auto custom-scrollbar' : ''}`}>
                        {leaderboard
                            .slice(0, displayMode === 'top3' ? 3 : displayMode === 'top10' ? 10 : 100)
                            .map((entry, index) => (
                            <div
                                key={`${entry.username}-${entry.rank}`}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    index < 3
                                        ? 'bg-warning-orange/10 border-warning-orange/30'
                                        : 'bg-ash-white/5 border-ash-white/10 hover:bg-ash-white/10'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl font-bold text-warning-orange min-w-[3rem]">
                                        {getRankIcon(entry.rank)}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-ash-white">
                                            {entry.display_name || entry.username}
                                        </p>
                                        <p className={`text-xs font-pixel-heading ${getTitleColor(entry.rank_title)}`}>
                                            {entry.rank_title}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-warning-orange">
                                        {entry.high_score?.toLocaleString() || 0}
                                    </p>
                                    <div className="text-xs text-ash-white/70 space-x-2">
                                        <span>⏱️ {formatTime(entry.best_time)}</span>
                                        <span>🎮 {entry.games_played}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Expand/Collapse Controls */}
                    {leaderboard.length > 3 && (
                        <div className="mt-4 flex justify-center space-x-2">
                            {displayMode === 'top3' && (
                                <button
                                    onClick={() => setDisplayMode('top10')}
                                    className="px-4 py-2 bg-warning-orange/20 border border-warning-orange/50 rounded text-warning-orange hover:bg-warning-orange/30 transition-colors font-pixel-heading text-sm"
                                >
                                    Show Top 10
                                </button>
                            )}
                            {displayMode === 'top10' && (
                                <>
                                    <button
                                        onClick={() => setDisplayMode('top3')}
                                        className="px-4 py-2 bg-ash-white/10 border border-ash-white/30 rounded text-ash-white hover:bg-ash-white/20 transition-colors font-pixel-heading text-sm"
                                    >
                                        Show Top 3
                                    </button>
                                    {leaderboard.length > 10 && (
                                        <button
                                            onClick={() => setDisplayMode('all')}
                                            className="px-4 py-2 bg-warning-orange/20 border border-warning-orange/50 rounded text-warning-orange hover:bg-warning-orange/30 transition-colors font-pixel-heading text-sm"
                                        >
                                            Show All (Top 100)
                                        </button>
                                    )}
                                </>
                            )}
                            {displayMode === 'all' && (
                                <>
                                    <button
                                        onClick={() => setDisplayMode('top3')}
                                        className="px-4 py-2 bg-ash-white/10 border border-ash-white/30 rounded text-ash-white hover:bg-ash-white/20 transition-colors font-pixel-heading text-sm"
                                    >
                                        Show Top 3
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('top10')}
                                        className="px-4 py-2 bg-ash-white/10 border border-ash-white/30 rounded text-ash-white hover:bg-ash-white/20 transition-colors font-pixel-heading text-sm"
                                    >
                                        Show Top 10
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="mt-4 pt-4 border-t border-ash-white/20">
                <div className="text-xs text-ash-white/60 space-y-1">
                    <p>👥 {leaderboard.length} total players</p>
                    <p>🥇 Top 3 get special recognition</p>
                    <p>⏱️ Survive 2+ minutes = ESCAPE ARTIST</p>
                    <p>🔄 Updates in real-time</p>
                </div>
            </div>
        </div>
    );
});

export default RealLeaderboard;