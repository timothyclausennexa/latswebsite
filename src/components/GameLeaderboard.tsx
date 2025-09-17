import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { GameLeaderboardEntry, UserRank } from '../types';
import { shortCA } from '../utils/helpers';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

const GameLeaderboard: React.FC = () => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<GameLeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<UserRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_top_scores');
            if (rpcError) throw rpcError;
            setLeaderboard(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch leaderboard');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMyRank = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error: rpcError } = await supabase.rpc('get_my_rank');
            if (rpcError) throw rpcError;
            setMyRank(data?.[0] || null);
        } catch (err: any) {
            console.error("Failed to fetch user rank:", err.message);
        }
    }, [user]);

    useEffect(() => {
        fetchLeaderboard();
        if (user) {
            fetchMyRank();
        }
        const interval = setInterval(() => {
            fetchLeaderboard();
            if(user) fetchMyRank();
        }, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(interval);
    }, [user, fetchLeaderboard, fetchMyRank]);

    const displayedLeaderboard = showAll ? leaderboard : leaderboard.slice(0, 10);
    const canShowMore = leaderboard.length > 10;
    
    return (
        <div className="border-2 border-ash-white/20 bg-black/30 p-4 shadow-pixel-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b-2 border-ash-white/20 pb-2">
                <h3 className="font-pixel-heading text-lg text-warning-orange">
                    Top Streamers
                </h3>
                <Button variant="ghost" size="sm" onClick={fetchLeaderboard} disabled={loading} aria-label="Refresh Leaderboard">
                    <Icon type="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            
            {error && <p className="text-center font-body text-alarm-red">{error}</p>}
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                 {loading && !leaderboard.length ? (
                    <p className="text-center font-body text-ash-white/50">Loading leaderboard...</p>
                ) : !loading && !leaderboard.length ? (
                    <p className="text-center font-body text-ash-white/50">The leaderboard is empty. Be the first!</p>
                ) : (
                    displayedLeaderboard.map((entry, index) => (
                        <div key={index} className="flex items-center rounded p-1.5 font-body text-ash-white bg-black/20">
                            <div className="w-1/6 text-center font-pixel-timer text-base">{index + 1}</div>
                            <div className="w-3/6 font-pixel-heading text-sm truncate">{entry.username}</div>
                            <div className="w-2/6 text-right font-mono text-sm">
                                {entry.max_score.toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 border-t-2 border-ash-white/20 pt-3 space-y-3">
                 {user && myRank && (
                    <div className="text-center bg-warning-orange/20 p-2 rounded">
                        <p className="font-pixel-heading text-sm text-ash-white">
                            YOUR RANK: <span className="text-warning-orange">#{myRank.rank}</span> WITH <span className="text-warning-orange">{myRank.max_score.toLocaleString()}</span> PTS
                        </p>
                    </div>
                 )}
                {canShowMore && (
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Top 10' : `Show Top 100 (${leaderboard.length})`}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default GameLeaderboard;
