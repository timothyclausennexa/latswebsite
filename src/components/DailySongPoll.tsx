import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { DailyPollSong } from '../types';
import { Button } from './ui/Button';
import AuthModal from './AuthModal';

const DailySongPoll: React.FC = () => {
    const [pollSongs, setPollSongs] = useState<DailyPollSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState<string | null>(null);
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const fetchPoll = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.rpc('get_daily_poll_songs');
        
        if (error) {
            console.error('Error fetching poll:', error);
            setError(`Failed to load today's poll: ${error.message}`);
        } else {
            setPollSongs(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPoll();
        const channel = supabase.channel('public:daily_song_votes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_song_votes' }, () => {
                fetchPoll();
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPoll]);

    const handleVote = async (songId: string) => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        setIsVoting(songId);
        setError(null);
        
        try {
            const { error: rpcError } = await supabase.rpc('cast_daily_vote', { song_id_to_vote_for: songId });
            if (rpcError) {
                throw rpcError;
            }
            // The real-time subscription will trigger a re-fetch and UI update.
        } catch (error: any) {
             console.error("Vote error:", error);
             setError(error.message || "An unexpected error occurred during voting.");
        } finally {
            // CRITICAL FIX: Always reset the isVoting state after the attempt.
            // This prevents all buttons from being permanently disabled on an error.
            setIsVoting(null);
        }
    };

    return (
        <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-lg h-full flex flex-col">
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <h3 className="mb-3 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                Vote for Tomorrow's Torture
            </h3>
            <p className="mb-4 font-body text-sm text-ash-white/70">
                The winning song will be played on repeat for an hour. Choose wisely.
            </p>

            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {loading ? (
                    <p className="text-center font-body text-ash-white/50">Loading poll...</p>
                ) : error ? (
                    <p className="text-center font-body text-alarm-red">{error}</p>
                ) : pollSongs.length > 0 ? (
                    pollSongs.map(song => (
                        <div key={song.id} className="rounded bg-prison-black/40 p-2">
                            <div className="flex items-center gap-3">
                                <img src={song.thumbnail_url} alt={`${song.title} artwork`} className="h-12 w-12 flex-shrink-0 border-2 border-prison-black" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate font-body font-bold text-ash-white">{song.title}</p>
                                    <p className="truncate font-body text-sm text-ash-white/70">{song.artist}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-pixel-timer text-xl text-warning-orange">{song.vote_count}</p>
                                    <p className="font-pixel-heading text-xs text-ash-white/50">VOTES</p>
                                </div>
                            </div>
                            <div className="mt-2">
                                 <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleVote(song.id)}
                                    disabled={isVoting !== null || song.user_has_voted}
                                >
                                    {song.user_has_voted ? 'VOTED' : (isVoting === song.id ? 'VOTING...' : 'VOTE')}
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center font-body text-ash-white/50">No songs in the poll yet. Songs are added from the community playlist daily.</p>
                )}
            </div>
             {!user && <p className="mt-2 text-center font-body text-xs text-ash-white/60">You must be signed in to vote.</p>}
        </div>
    );
};

export default DailySongPoll;
