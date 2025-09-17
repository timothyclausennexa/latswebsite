// FIX: Removed invalid file header comment.
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PlaylistSong } from '../types';
import { Button } from './ui/Button';
import AuthModal from './AuthModal';

const CommunityPlaylist: React.FC = () => {
    const [playlist, setPlaylist] = useState<PlaylistSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [songUrl, setSongUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const fetchPlaylist = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('get_community_playlist');

            if (rpcError) throw rpcError;

            setPlaylist(data as PlaylistSong[]);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch playlist.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlaylist();
        
        const channel = supabase.channel('public:community_playlist')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_playlist' }, payload => {
                fetchPlaylist();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPlaylist]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        let cleanUrl = songUrl.split('?')[0];
        // Handle Spotify URI format
        if (cleanUrl.startsWith('spotify:track:')) {
            const trackId = cleanUrl.split(':')[2];
            cleanUrl = `https://open.spotify.com/track/${trackId}`;
        }

        if (!cleanUrl || !cleanUrl.includes('spotify.com/track/')) {
            setSubmissionError('Please enter a valid Spotify track URL or URI.');
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        try {
            // Step 1: Call the DB function to get metadata
            const { data: metadata, error: functionError } = await supabase.rpc('get_spotify_metadata_from_db', {
                p_song_url: cleanUrl
            });

            if (functionError || !metadata) {
                throw new Error(functionError?.message || "Failed to get song metadata. Is this a valid track URL?");
            }

            const { title, author_name: artist, thumbnail_url } = metadata;
            if (!title || !artist || !thumbnail_url) {
                throw new Error("Could not retrieve all required song details from Spotify.");
            }
            
            // Step 2: Insert the song with its metadata into the public table
            const { error: insertError } = await supabase.from('community_playlist').insert({
                user_id: user.id,
                spotify_url: cleanUrl,
                title,
                artist,
                thumbnail_url,
            });

            if (insertError) {
                if (insertError.code === '23505') { 
                    throw new Error("This song is already in the queue.");
                }
                throw insertError;
            }

            setSongUrl('');
        } catch (err: any) {
            setSubmissionError(err.message || 'An unexpected error occurred.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-lg h-full flex flex-col">
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <h3 className="mb-3 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                Playlist Queue
            </h3>
            
            <form onSubmit={handleSubmit} className="mb-4">
                 <div className="mb-2 font-body text-sm text-ash-white/70">
                    <p><strong>How to add a song:</strong> In Spotify, right-click a song &gt; Share &gt; Copy Song Link.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={songUrl}
                        onChange={(e) => setSongUrl(e.target.value)}
                        className="flex-grow border-2 border-prison-black bg-ash-white/10 p-2 font-mono text-sm text-ash-white focus:border-warning-orange focus:outline-none"
                        placeholder="Paste Spotify Song Link Here"
                        disabled={isSubmitting}
                    />
                    <Button type="submit" variant="primary" disabled={isSubmitting || !user}>
                        {isSubmitting ? 'Adding...' : 'Add Song'}
                    </Button>
                </div>
                {submissionError && <p className="mt-2 text-sm text-alarm-red">{submissionError}</p>}
                 {!user && !isSubmitting && <p className="mt-2 text-sm text-center text-ash-white/60">You must be signed in to add songs.</p>}
            </form>

            <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                {loading ? (
                    <p className="text-center font-body text-ash-white/50">Loading playlist...</p>
                ) : error ? (
                    <p className="text-center font-body text-alarm-red">{error}</p>
                ) : playlist.length > 0 ? (
                    playlist.map(song => (
                        <a 
                            key={song.id}
                            href={song.spotify_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded bg-prison-black/40 p-2 transition-colors hover:bg-prison-black/60"
                        >
                            <img src={song.thumbnail_url} alt={`${song.title} artwork`} className="h-10 w-10 flex-shrink-0 border-2 border-prison-black" />
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate font-body font-bold text-ash-white">{song.title}</p>
                                <p className="truncate font-body text-sm text-ash-white/70">{song.artist}</p>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="font-mono text-xs text-ash-white/50">Added by</p>
                                <p className="font-pixel-heading text-sm text-ash-white/80">{song.submitted_by_username}</p>
                            </div>
                        </a>
                    ))
                ) : (
                    <p className="text-center font-body text-ash-white/50">The playlist is empty. Add the first song!</p>
                )}
            </div>
        </div>
    );
};

export default CommunityPlaylist;