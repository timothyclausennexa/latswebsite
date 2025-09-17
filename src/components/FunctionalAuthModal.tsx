import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface FunctionalAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FunctionalAuthModal: React.FC<FunctionalAuthModalProps> = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const clearForm = () => {
        setPassword('');
        setUsername('');
        setMessage('');
        setError('');
    };

    useEffect(() => {
        if (isOpen) {
            clearForm();
        }
    }, [isOpen]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Check if username is taken
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                setError('Username already taken');
                setLoading(false);
                return;
            }

            // Create a fake email from username for Supabase auth
            const fakeEmail = `${username.toLowerCase()}@lats.game`;

            const { data, error } = await supabase.auth.signUp({
                email: fakeEmail,
                password,
                options: {
                    data: {
                        username,
                        display_name: username
                    },
                    emailRedirectTo: undefined // No email confirmation needed
                }
            });

            if (error) throw error;

            if (data.user) {
                setMessage('Account created successfully! You can now sign in.');
                setTimeout(() => {
                    setMode('signin');
                    setPassword('');
                }, 1500);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Create fake email from username for sign in
            const fakeEmail = `${username.toLowerCase()}@lats.game`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password
            });

            if (error) throw error;

            if (data.user) {
                setMessage('Signed in successfully!');
                setTimeout(() => {
                    onClose();
                }, 1000);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestPlay = () => {
        setMessage('Playing as guest - scores won\'t be saved');
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    return (
        <Modal title="Authentication" isOpen={isOpen} onClose={onClose}>
            <div className="bg-black border-2 border-warning-orange p-6 rounded-lg max-w-md w-full">
                <h2 className="text-2xl font-pixel-heading text-warning-orange mb-4 text-center">
                    JOIN THE STREAM
                </h2>

                <div className="flex mb-6">
                    <button
                        onClick={() => setMode('signin')}
                        className={`flex-1 py-2 px-4 font-pixel-heading ${
                            mode === 'signin'
                                ? 'bg-warning-orange text-black'
                                : 'bg-ash-white/10 text-ash-white hover:bg-ash-white/20'
                        }`}
                    >
                        SIGN IN
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-2 px-4 font-pixel-heading ${
                            mode === 'signup'
                                ? 'bg-warning-orange text-black'
                                : 'bg-ash-white/10 text-ash-white hover:bg-ash-white/20'
                        }`}
                    >
                        SIGN UP
                    </button>
                </div>

                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                    <div>
                        <label className="block text-ash-white text-sm font-bold mb-2">
                            {mode === 'signup' ? 'Streamer Name (Username)' : 'Username'}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-ash-white/10 border border-ash-white/30 rounded text-ash-white placeholder-ash-white/50 focus:outline-none focus:border-warning-orange"
                            placeholder="Your streamer name"
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="[a-zA-Z0-9_]+"
                            title="Username can only contain letters, numbers, and underscores"
                        />
                    </div>

                    <div>
                        <label className="block text-ash-white text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-ash-white/10 border border-ash-white/30 rounded text-ash-white placeholder-ash-white/50 focus:outline-none focus:border-warning-orange"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="bg-alarm-red/20 border border-alarm-red text-alarm-red px-3 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-2 rounded text-sm">
                            {message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'PROCESSING...' : mode === 'signin' ? 'JOIN STREAM' : 'START STREAMING'}
                    </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-ash-white/20">
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={handleGuestPlay}
                        className="w-full"
                    >
                        Play as Guest (No Score Saving)
                    </Button>
                </div>

                <div className="mt-4 text-xs text-ash-white/60 text-center">
                    <p>• Scores auto-save to global leaderboard</p>
                    <p>• Unlock skins and achievements</p>
                    <p>• Compete with streamers worldwide</p>
                </div>
            </div>
        </Modal>
    );
};

export default FunctionalAuthModal;