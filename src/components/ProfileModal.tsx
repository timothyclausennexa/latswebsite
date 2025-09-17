import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, profile, fetchProfile } = useAuth();
    const [solanaAddress, setSolanaAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // This effect ensures the local state of the input field is always
        // synchronized with the global profile state when the modal opens or the profile updates.
        if (isOpen) {
            // Always set to a string to keep the input controlled
            setSolanaAddress(profile?.solana_address || '');
            
            // Reset messages when modal is opened
            setError(null);
            setSuccess(null);
        }
    }, [profile, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase
            .from('profiles')
            .update({ solana_address: solanaAddress || null }) // Send null if empty
            .eq('id', user.id);

        if (error) {
            setError(error.message);
        } else {
            setSuccess('Profile updated successfully!');
            // After a successful save, re-fetch the profile to update the global state.
            // The useEffect above will then synchronize the local state with the new global state.
            await fetchProfile(); 
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="PROFILE SETTINGS">
            <div className="font-body">
                {/* Profile Stats Section */}
                <div className="mb-6 p-4 bg-ash-white/5 border-2 border-ash-white/10 rounded">
                    <h3 className="font-pixel-heading text-warning-orange mb-3">PLAYER STATS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div>
                            <span className="text-ash-white/70">💰 SLURP:</span>
                            <span className="text-warning-orange font-bold ml-2">{profile?.coins || 0}</span>
                        </div>
                        <div>
                            <span className="text-ash-white/70">🎮 Current Skin:</span>
                            <span className="text-ash-white ml-2">{profile?.current_skin || 'default'}</span>
                        </div>
                        <div>
                            <span className="text-ash-white/70">👤 Display Name:</span>
                            <span className="text-ash-white ml-2">{profile?.display_name || profile?.username || 'Player'}</span>
                        </div>
                        <div>
                            <span className="text-ash-white/70">🔓 Skins Owned:</span>
                            <span className="text-ash-white ml-2">{profile?.owned_skins?.length || 1}</span>
                        </div>
                    </div>
                </div>

                <p className="mb-4 text-ash-white/70 text-sm">
                    Add your public Solana address to be eligible for potential weekly rewards. This will be displayed on the leaderboard.
                </p>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block font-pixel-heading text-sm text-ash-white/70">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={profile?.username || ''}
                            disabled
                            className="mt-1 w-full border-2 border-black bg-ash-white/20 p-2 font-mono text-ash-white/50"
                        />
                    </div>
                    <div>
                        <label className="block font-pixel-heading text-sm text-ash-white/70">Stream Points (SLURP)</label>
                        <div className="mt-1 w-full border-2 border-black bg-ash-white/20 p-2 font-mono text-warning-orange font-bold">
                            💰 {profile?.coins || 0} SLURP
                        </div>
                    </div>
                     <div>
                        <label htmlFor="solana_address" className="block font-pixel-heading text-sm text-ash-white/70">Solana Address</label>
                        <input
                            id="solana_address"
                            type="text"
                            value={solanaAddress}
                            onChange={(e) => setSolanaAddress(e.target.value)}
                            className="mt-1 w-full border-2 border-black bg-ash-white/10 p-2 font-mono text-ash-white focus:border-warning-orange focus:outline-none"
                            placeholder="So11...1112"
                        />
                    </div>
                    {error && <p className="text-alarm-red text-sm">{error}</p>}
                    {success && <p className="text-green-400 text-sm">{success}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                         <Button type="button" variant="ghost" size="md" onClick={onClose}>
                            Close
                        </Button>
                        <Button type="submit" variant="primary" size="md" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ProfileModal;