import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const EnhancedAdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Tabs
    const [activeTab, setActiveTab] = useState<'config' | 'timer' | 'trades' | 'stats'>('config');

    // Config values
    const [tokenAddress, setTokenAddress] = useState('');
    const [pumpFunLink, setPumpFunLink] = useState('');
    const [streamLink, setStreamLink] = useState('');

    // Timer controls
    const [timerHours, setTimerHours] = useState(100);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [currentTimerSeconds, setCurrentTimerSeconds] = useState(360000);

    // Trade tracking
    const [buyAmount, setBuyAmount] = useState('');
    const [sellAmount, setSellAmount] = useState('');
    const [recentTrades, setRecentTrades] = useState<any[]>([]);

    // Statistics
    const [totalBuys, setTotalBuys] = useState(0);
    const [totalSells, setTotalSells] = useState(0);
    const [totalTimeAdded, setTotalTimeAdded] = useState(0);
    const [totalTimeRemoved, setTotalTimeRemoved] = useState(0);

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
                const { data } = await supabase
                    .from('admin_users')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    setIsAdmin(true);
                    await loadData();
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

    // Load all data
    const loadData = async () => {
        await Promise.all([
            loadConfig(),
            loadTimerState(),
            loadTradeStats(),
            loadRecentTrades()
        ]);
    };

    // Load config
    const loadConfig = async () => {
        try {
            const { data } = await supabase
                .from('site_config')
                .select('key, value');

            if (data) {
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

    // Load timer state
    const loadTimerState = async () => {
        try {
            const { data } = await supabase.rpc('get_timer_state');
            if (data) {
                setCurrentTimerSeconds(data.current_time_seconds);
                setIsTimerRunning(data.is_running);
                setTimerHours(Math.floor(data.current_time_seconds / 3600));
            }
        } catch (error) {
            console.error('Error loading timer:', error);
        }
    };

    // Load trade statistics
    const loadTradeStats = async () => {
        try {
            const { data } = await supabase
                .from('buy_sell_events')
                .select('event_type, impact_hours');

            if (data) {
                const buys = data.filter(t => t.event_type === 'buy');
                const sells = data.filter(t => t.event_type === 'sell');

                setTotalBuys(buys.length);
                setTotalSells(sells.length);
                setTotalTimeAdded(buys.reduce((sum, t) => sum + t.impact_hours, 0));
                setTotalTimeRemoved(Math.abs(sells.reduce((sum, t) => sum + t.impact_hours, 0)));
            }
        } catch (error) {
            console.error('Error loading trade stats:', error);
        }
    };

    // Load recent trades
    const loadRecentTrades = async () => {
        try {
            const { data } = await supabase
                .from('buy_sell_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setRecentTrades(data);
            }
        } catch (error) {
            console.error('Error loading trades:', error);
        }
    };

    // Save config
    const saveConfig = async () => {
        try {
            const updates = [
                { key: 'token_contract_address', value: tokenAddress },
                { key: 'pump_fun_link', value: pumpFunLink },
                { key: 'live_stream_link', value: streamLink }
            ];

            for (const update of updates) {
                await supabase
                    .from('site_config')
                    .upsert(update, { onConflict: 'key' });
            }

            setMessage('Configuration saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage('Error saving configuration');
        }
    };

    // Update timer
    const updateTimer = async () => {
        try {
            const { data, error } = await supabase.rpc('set_timer_manually', {
                p_hours: timerHours
            });

            if (error) throw error;

            if (data?.success) {
                setCurrentTimerSeconds(data.new_time_seconds);
                setMessage('Timer updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating timer:', error);
            setMessage('Error updating timer');
        }
    };

    // Toggle timer running state
    const toggleTimer = async () => {
        try {
            const { data, error } = await supabase.rpc('toggle_timer', {
                p_running: !isTimerRunning
            });

            if (error) throw error;

            if (data?.success) {
                setIsTimerRunning(!isTimerRunning);
                setMessage(`Timer ${!isTimerRunning ? 'started' : 'stopped'}!`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error toggling timer:', error);
            setMessage('Error toggling timer');
        }
    };

    // Process trade event
    const processTrade = async (type: 'buy' | 'sell', amount: string) => {
        if (!amount || parseFloat(amount) <= 0) {
            setMessage('Please enter a valid amount');
            return;
        }

        try {
            const { data, error } = await supabase.rpc('process_trade_event', {
                p_event_type: type,
                p_amount: parseFloat(amount)
            });

            if (error) throw error;

            if (data?.success) {
                setMessage(`${type === 'buy' ? 'Buy' : 'Sell'} recorded! Timer adjusted by ${data.impact_hours} hours`);
                if (type === 'buy') setBuyAmount('');
                else setSellAmount('');

                // Reload data
                await loadTimerState();
                await loadTradeStats();
                await loadRecentTrades();

                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error processing trade:', error);
            setMessage('Error processing trade');
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-prison-dark border-4 border-warning-orange w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-ash-white/20 bg-black/50 px-4 py-3">
                    <h2 className="font-pixel-heading text-lg text-yellow-400">
                        🥫 MAYO MEN ADMIN PANEL
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-ash-white/70 transition-colors hover:text-alarm-red"
                    >
                        <Icon type="x" className="h-6 w-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <p className="font-pixel-heading text-ash-white">Loading...</p>
                    </div>
                ) : !isAdmin ? (
                    <div className="p-8 text-center">
                        <p className="font-pixel-heading text-alarm-red">ACCESS DENIED</p>
                        <p className="mt-2 font-body text-ash-white/70">You are not authorized to access this panel.</p>
                    </div>
                ) : (
                    <div className="p-4">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {(['config', 'timer', 'trades', 'stats'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 font-pixel-heading text-sm uppercase transition-colors ${
                                        activeTab === tab
                                            ? 'bg-yellow-400 text-black'
                                            : 'bg-black/50 text-ash-white hover:bg-ash-white/10'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Message */}
                        {message && (
                            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-400 font-body text-sm">
                                {message}
                            </div>
                        )}

                        {/* Config Tab */}
                        {activeTab === 'config' && (
                            <div className="space-y-4">
                                <h3 className="font-pixel-heading text-yellow-400">Site Configuration</h3>

                                <div>
                                    <label className="block font-body text-sm text-ash-white/70 mb-1">
                                        Token Contract Address (CA)
                                    </label>
                                    <input
                                        type="text"
                                        value={tokenAddress}
                                        onChange={(e) => setTokenAddress(e.target.value)}
                                        placeholder="Enter token address..."
                                        className="w-full bg-black/50 border border-ash-white/20 px-3 py-2 font-body text-ash-white"
                                    />
                                </div>

                                <div>
                                    <label className="block font-body text-sm text-ash-white/70 mb-1">
                                        Pump.fun Link
                                    </label>
                                    <input
                                        type="text"
                                        value={pumpFunLink}
                                        onChange={(e) => setPumpFunLink(e.target.value)}
                                        placeholder="https://pump.fun/..."
                                        className="w-full bg-black/50 border border-ash-white/20 px-3 py-2 font-body text-ash-white"
                                    />
                                </div>

                                <div>
                                    <label className="block font-body text-sm text-ash-white/70 mb-1">
                                        Live Stream Link
                                    </label>
                                    <input
                                        type="text"
                                        value={streamLink}
                                        onChange={(e) => setStreamLink(e.target.value)}
                                        placeholder="Stream URL..."
                                        className="w-full bg-black/50 border border-ash-white/20 px-3 py-2 font-body text-ash-white"
                                    />
                                </div>

                                <Button variant="primary" onClick={saveConfig}>
                                    Save Configuration
                                </Button>
                            </div>
                        )}

                        {/* Timer Tab */}
                        {activeTab === 'timer' && (
                            <div className="space-y-4">
                                <h3 className="font-pixel-heading text-yellow-400">Mayo Timer Control</h3>

                                <div className="p-4 bg-black/50 border border-yellow-400">
                                    <p className="font-pixel-heading text-2xl text-green-400">
                                        Current: {formatTime(currentTimerSeconds)}
                                    </p>
                                    <p className="font-body text-sm text-ash-white/70 mt-1">
                                        Status: {isTimerRunning ? '🟢 RUNNING' : '🔴 STOPPED'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-body text-sm text-ash-white/70 mb-1">
                                        Set Timer (Hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={timerHours}
                                        onChange={(e) => setTimerHours(parseInt(e.target.value) || 0)}
                                        className="w-full bg-black/50 border border-ash-white/20 px-3 py-2 font-body text-ash-white"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="primary" onClick={updateTimer}>
                                        Set Timer
                                    </Button>
                                    <Button
                                        variant={isTimerRunning ? "secondary" : "primary"}
                                        onClick={toggleTimer}
                                    >
                                        {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Trades Tab */}
                        {activeTab === 'trades' && (
                            <div className="space-y-4">
                                <h3 className="font-pixel-heading text-yellow-400">Record Trades</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-500/10 border border-green-500">
                                        <h4 className="font-pixel-heading text-green-400 mb-2">ADD BUY</h4>
                                        <p className="text-xs text-ash-white/70 mb-2">Adds 2 hours to timer</p>
                                        <input
                                            type="number"
                                            value={buyAmount}
                                            onChange={(e) => setBuyAmount(e.target.value)}
                                            placeholder="Amount in $"
                                            className="w-full bg-black/50 border border-green-500 px-3 py-2 font-body text-ash-white mb-2"
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={() => processTrade('buy', buyAmount)}
                                            className="w-full"
                                        >
                                            Record Buy
                                        </Button>
                                    </div>

                                    <div className="p-4 bg-red-500/10 border border-red-500">
                                        <h4 className="font-pixel-heading text-red-400 mb-2">ADD SELL</h4>
                                        <p className="text-xs text-ash-white/70 mb-2">Removes 0.5 hours from timer</p>
                                        <input
                                            type="number"
                                            value={sellAmount}
                                            onChange={(e) => setSellAmount(e.target.value)}
                                            placeholder="Amount in $"
                                            className="w-full bg-black/50 border border-red-500 px-3 py-2 font-body text-ash-white mb-2"
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => processTrade('sell', sellAmount)}
                                            className="w-full"
                                        >
                                            Record Sell
                                        </Button>
                                    </div>
                                </div>

                                {/* Recent Trades */}
                                <div>
                                    <h4 className="font-pixel-heading text-ash-white mb-2">Recent Trades</h4>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {recentTrades.map((trade, idx) => (
                                            <div
                                                key={trade.id}
                                                className={`p-2 text-xs font-body ${
                                                    trade.event_type === 'buy'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                }`}
                                            >
                                                {trade.event_type.toUpperCase()} ${trade.amount} | {trade.impact_hours > 0 ? '+' : ''}{trade.impact_hours}h
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats Tab */}
                        {activeTab === 'stats' && (
                            <div className="space-y-4">
                                <h3 className="font-pixel-heading text-yellow-400">Statistics</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-black/50 border border-ash-white/20">
                                        <p className="font-body text-xs text-ash-white/70">Total Buys</p>
                                        <p className="font-pixel-heading text-2xl text-green-400">{totalBuys}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 border border-ash-white/20">
                                        <p className="font-body text-xs text-ash-white/70">Total Sells</p>
                                        <p className="font-pixel-heading text-2xl text-red-400">{totalSells}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 border border-ash-white/20">
                                        <p className="font-body text-xs text-ash-white/70">Hours Added</p>
                                        <p className="font-pixel-heading text-2xl text-yellow-400">+{totalTimeAdded.toFixed(1)}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 border border-ash-white/20">
                                        <p className="font-body text-xs text-ash-white/70">Hours Removed</p>
                                        <p className="font-pixel-heading text-2xl text-orange-400">-{totalTimeRemoved.toFixed(1)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedAdminDashboard;