import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'signIn' | 'signUp';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState<AuthMode>('signIn');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // Use a dummy email domain since Supabase requires email for auth,
        // but we're using username for the user-facing experience.
        const email = `${username.toLowerCase()}@slurp.game`;

        if (mode === 'signUp') {
            if (username.length < 3) {
                setError("Username must be at least 3 characters.");
                setLoading(false);
                return;
            }
             if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username,
                    }
                }
            });
            if (error) {
                setError(error.message);
            } else {
                alert('Success! You can now sign in.');
                setMode('signIn');
            }
        } else { // signIn
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setError(error.message);
            } else {
                onClose();
            }
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'signIn' ? "SIGN IN" : "CREATE ACCOUNT"}>
            <div className="font-body">
                <div className="flex border-b-2 border-ash-white/20 mb-4">
                    <button onClick={() => setMode('signIn')} className={`flex-1 pb-2 font-pixel-heading ${mode === 'signIn' ? 'text-warning-orange border-b-2 border-warning-orange' : 'text-ash-white/50'}`}>
                        Sign In
                    </button>
                    <button onClick={() => setMode('signUp')} className={`flex-1 pb-2 font-pixel-heading ${mode === 'signUp' ? 'text-warning-orange border-b-2 border-warning-orange' : 'text-ash-white/50'}`}>
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block font-pixel-heading text-sm text-ash-white/70">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full border-2 border-prison-black bg-ash-white/10 p-2 font-mono text-ash-white focus:border-warning-orange focus:outline-none"
                            placeholder="PixelPilot"
                            maxLength={12}
                        />
                    </div>
                     <div>
                        <label htmlFor="password"className="block font-pixel-heading text-sm text-ash-white/70">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full border-2 border-prison-black bg-ash-white/10 p-2 font-mono text-ash-white focus:border-warning-orange focus:outline-none"
                            placeholder="******"
                        />
                    </div>
                    {error && <p className="text-alarm-red text-sm">{error}</p>}
                    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                        {loading ? 'Processing...' : (mode === 'signIn' ? 'Sign In to Submit' : 'Create Account')}
                    </Button>
                </form>
            </div>
        </Modal>
    );
};

export default AuthModal;
