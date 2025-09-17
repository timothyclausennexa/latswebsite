import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Config values
    const [tokenAddress, setTokenAddress] = useState('');
    const [pumpFunLink, setPumpFunLink] = useState('');
    const [streamLink, setStreamLink] = useState('');

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('admin_users')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (data && !error) {
                    setIsAdmin(true);
                    await loadConfig();
                }
            } catch (error) {
                console.error('Admin check error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            checkAdminStatus();
        }
    }, [user, isOpen]);

    // Load current config
    const loadConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('key, value');

            if (data && !error) {
                data.forEach(item => {
                    switch (item.key) {
                        case 'token_contract_address':
                            setTokenAddress(item.value || '');
                            break;
                        case 'pump_fun_link':
                            setPumpFunLink(item.value || '');
                            break;
                        case 'live_stream_link':
                            setStreamLink(item.value || '');
                            break;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    // Save configuration
    const saveConfig = async () => {
        if (!user) return;

        setSaving(true);
        setMessage('');

        try {
            const updates = [
                { key: 'token_contract_address', value: tokenAddress },
                { key: 'pump_fun_link', value: pumpFunLink },
                { key: 'live_stream_link', value: streamLink }
            ];

            for (const update of updates) {
                const { error } = await supabase.rpc('update_site_config', {
                    p_key: update.key,
                    p_value: update.value,
                    p_user_id: user.id
                });

                if (error) throw error;
            }

            setMessage('✅ Configuration saved successfully! Site will update in real-time.');

            // Trigger a custom event to update the app
            window.dispatchEvent(new CustomEvent('configUpdated'));

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage('❌ Error saving configuration');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-prison-black/90 backdrop-blur-md animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="bg-prison-black border-4 border-warning-orange shadow-pixel-xl p-8 rounded-lg" style={{ maxWidth: '42rem', width: '90%', margin: '0 auto' }}>
                    <p className="text-center text-ash-white font-pixel-heading animate-pulse">LOADING ADMIN PANEL...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="fixed inset-0 z-[9999] bg-prison-black/90 backdrop-blur-md animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="bg-prison-black border-4 border-alarm-red shadow-pixel-xl p-8 rounded-lg" style={{ maxWidth: '28rem', width: '90%', margin: '0 auto' }}>
                    <h2 className="text-2xl font-pixel-heading text-alarm-red mb-4">🚫 ACCESS DENIED</h2>
                    <p className="text-ash-white mb-4">You are not authorized to access this panel.</p>
                    <Button variant="primary" onClick={onClose}>CLOSE</Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-prison-black/90 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: '2rem'
            }}
        >
            <div
                className="relative bg-prison-black border-4 border-warning-orange shadow-pixel-xl p-4 sm:p-8 rounded-lg overflow-y-auto custom-scrollbar animate-slideUp"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '42rem',
                    width: '100%',
                    maxHeight: '85vh',
                    margin: 'auto'
                }}
            >
                <div className="flex items-start justify-between border-b-2 border-warning-orange/30 pb-3 mb-6">
                    <h2 className="text-2xl font-pixel-heading text-warning-orange">
                        🔐 ADMIN CONTROL PANEL
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-ash-white/50 transition-colors hover:text-ash-white"
                        aria-label="Close"
                    >
                        <Icon type="x-close" className="h-6 w-6" />
                    </button>
                </div>

                {message && (
                    <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-yellow-400 font-pixel-heading mb-2">
                            Token Contract Address (CA)
                        </label>
                        <input
                            type="text"
                            value={tokenAddress}
                            onChange={(e) => setTokenAddress(e.target.value)}
                            placeholder="Enter the token contract address..."
                            className="w-full px-4 py-3 bg-prison-black border-2 border-warning-orange/50 rounded text-ash-white focus:border-warning-orange focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-ash-white/60 mt-1">
                            This will be displayed across the site and in the entry modal
                        </p>
                    </div>

                    <div>
                        <label className="block text-yellow-400 font-pixel-heading mb-2">
                            Pump.fun Link
                        </label>
                        <input
                            type="text"
                            value={pumpFunLink}
                            onChange={(e) => setPumpFunLink(e.target.value)}
                            placeholder="https://pump.fun/..."
                            className="w-full px-4 py-3 bg-prison-black border-2 border-warning-orange/50 rounded text-ash-white focus:border-warning-orange focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-ash-white/60 mt-1">
                            Link to the pump.fun page for buying $LATS
                        </p>
                    </div>

                    <div>
                        <label className="block text-yellow-400 font-pixel-heading mb-2">
                            Live Stream Link
                        </label>
                        <input
                            type="text"
                            value={streamLink}
                            onChange={(e) => setStreamLink(e.target.value)}
                            placeholder="https://twitch.tv/..."
                            className="w-full px-4 py-3 bg-prison-black border-2 border-warning-orange/50 rounded text-ash-white focus:border-warning-orange focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-ash-white/60 mt-1">
                            Link to your 24/7 live stream
                        </p>
                    </div>

                    <div className="border-t border-ash-white/20 pt-6">
                        <h3 className="text-lg font-pixel-heading text-warning-orange mb-4">
                            ⚠️ IMPORTANT NOTES
                        </h3>
                        <ul className="space-y-2 text-sm text-ash-white/80">
                            <li>• Changes update across the entire site in real-time</li>
                            <li>• Make sure the CA is correct before saving</li>
                            <li>• Links should start with https://</li>
                            <li>• All connected users will see updates immediately</li>
                        </ul>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={saveConfig}
                            disabled={saving}
                            className="flex-1 bg-warning-orange hover:bg-warning-orange/80 transition-colors"
                        >
                            {saving ? 'SAVING...' : '💾 SAVE CONFIGURATION'}
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={onClose}
                            className="flex-1"
                        >
                            CLOSE
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;