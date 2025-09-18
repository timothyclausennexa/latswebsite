import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useConfig } from '../hooks/useConfig';

interface TradeEvent {
    event_type: 'buy' | 'sell';
    amount: number;
    impact_hours: number;
    created_at: string;
}

const StreamerOverlay: React.FC = () => {
    const CONFIG = useConfig();
    const [currentMarketCap, setCurrentMarketCap] = useState(0);
    const [nextMilestone, setNextMilestone] = useState('');
    const [nextChallenge, setNextChallenge] = useState('');
    const [timerSeconds, setTimerSeconds] = useState(360000);
    const [recentTrades, setRecentTrades] = useState<TradeEvent[]>([]);
    const [totalBuys, setTotalBuys] = useState(0);
    const [totalSells, setTotalSells] = useState(0);

    // Roadmap milestones for reference
    const milestones = [
        { mcap: 10000, challenge: '1 POUND of mayo on myself!' },
        { mcap: 20000, challenge: '2 POUNDS of mayo!' },
        { mcap: 30000, challenge: '10 POUNDS mayo bath!' },
        { mcap: 50000, challenge: 'Mayo with EVERY meal for 24h!' },
        { mcap: 67000, challenge: 'MENTOS IN 10L OF COKE EXPLOSION!' },
        { mcap: 100000, challenge: '20 POUNDS + Friend from Iowa arrives!' },
        { mcap: 150000, challenge: 'IRL streaming in Iowa begins!' },
        { mcap: 180000, challenge: 'FIREWORKS ROADTRIP TO IOWA!' },
        { mcap: 200000, challenge: 'Mayo slip-n-slide!' },
        { mcap: 300000, challenge: 'Miami beach mayo challenges!' },
        { mcap: 500000, challenge: 'Mayo fountain installation!' },
        { mcap: 1000000, challenge: 'Mayo suit for a week!' },
        { mcap: 1000000000, challenge: 'LAUNCH MAYO MEN BRAND!' }
    ];

    useEffect(() => {
        // Get timer state
        const fetchTimerState = async () => {
            const { data } = await supabase.rpc('get_timer_state');
            if (data) {
                setTimerSeconds(data.current_time_seconds);
            }
        };

        // Get trade stats
        const fetchTradeStats = async () => {
            const { data } = await supabase
                .from('buy_sell_events')
                .select('event_type, amount, impact_hours, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setRecentTrades(data);

                // Calculate totals
                const buys = data.filter(t => t.event_type === 'buy').length;
                const sells = data.filter(t => t.event_type === 'sell').length;
                setTotalBuys(buys);
                setTotalSells(sells);
            }
        };

        fetchTimerState();
        fetchTradeStats();

        // Set up real-time subscriptions
        const timerSub = supabase
            .channel('overlay_timer')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'timer_state'
            }, (payload) => {
                if (payload.new) {
                    setTimerSeconds((payload.new as any).current_time_seconds);
                }
            })
            .subscribe();

        const tradeSub = supabase
            .channel('overlay_trades')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'buy_sell_events'
            }, (payload) => {
                if (payload.new) {
                    const newTrade = payload.new as TradeEvent;
                    setRecentTrades(prev => [newTrade, ...prev.slice(0, 4)]);
                    if (newTrade.event_type === 'buy') {
                        setTotalBuys(prev => prev + 1);
                    } else {
                        setTotalSells(prev => prev + 1);
                    }
                }
            })
            .subscribe();

        // Simulate market cap updates (replace with real data when available)
        const mcapInterval = setInterval(() => {
            const simulatedMcap = Math.floor(Math.random() * 100000) + 10000;
            setCurrentMarketCap(simulatedMcap);

            // Find next milestone
            const next = milestones.find(m => m.mcap > simulatedMcap);
            if (next) {
                setNextMilestone(`$${(next.mcap / 1000).toFixed(0)}K`);
                setNextChallenge(next.challenge);
            }
        }, 30000);

        return () => {
            timerSub.unsubscribe();
            tradeSub.unsubscribe();
            clearInterval(mcapInterval);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}H ${minutes}M ${secs}S`;
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            {/* Main Overlay Container */}
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Bar - Timer and Stats */}
                <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-4 border-yellow-400 rounded-lg p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Timer */}
                        <div className="text-center">
                            <div className="text-2xl text-yellow-400 mb-2">🥫 MAYO TIMER 🥫</div>
                            <div className="text-6xl font-bold text-white animate-pulse">
                                {formatTime(timerSeconds)}
                            </div>
                        </div>

                        {/* Market Cap */}
                        <div className="text-center">
                            <div className="text-2xl text-green-400 mb-2">💰 MARKET CAP 💰</div>
                            <div className="text-5xl font-bold text-green-300">
                                ${(currentMarketCap / 1000).toFixed(1)}K
                            </div>
                        </div>

                        {/* Buy/Sell Stats */}
                        <div className="text-center">
                            <div className="text-2xl text-blue-400 mb-2">📊 TRADES 📊</div>
                            <div className="flex justify-center gap-4">
                                <div>
                                    <span className="text-green-400 text-3xl">↑{totalBuys}</span>
                                    <div className="text-sm">BUYS</div>
                                </div>
                                <div>
                                    <span className="text-red-400 text-3xl">↓{totalSells}</span>
                                    <div className="text-sm">SELLS</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Milestone */}
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-4 border-purple-400 rounded-lg p-6">
                    <div className="text-3xl text-purple-400 mb-3">🎯 NEXT MILESTONE: {nextMilestone}</div>
                    <div className="text-4xl font-bold animate-pulse">
                        {nextChallenge}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-4 border-blue-400 rounded-lg p-6">
                    <div className="text-2xl text-blue-400 mb-4">🔥 RECENT ACTIVITY 🔥</div>
                    <div className="space-y-2">
                        {recentTrades.map((trade, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-2 rounded ${
                                trade.event_type === 'buy'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-red-500/20 text-red-300'
                            }`}>
                                <span className="text-xl">
                                    {trade.event_type === 'buy' ? '🚀 BUY' : '📉 SELL'}
                                </span>
                                <span className="text-lg">
                                    ${trade.amount} • {trade.event_type === 'buy' ? '+2' : '-0.5'} HOURS
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Token Info */}
                <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-4 border-orange-400 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div className="text-2xl text-orange-400">🪙 $MAYOMEN</div>
                        <div className="text-lg">
                            CA: {CONFIG.TOKEN_CONTRACT_ADDRESS ?
                                `${CONFIG.TOKEN_CONTRACT_ADDRESS.slice(0, 6)}...${CONFIG.TOKEN_CONTRACT_ADDRESS.slice(-4)}`
                                : 'NOT SET'}
                        </div>
                        <div className="text-xl text-yellow-300">
                            BUY = +2 HRS | SELL = -0.5 HRS
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Mayo Drip Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-drip"
                        style={{
                            left: `${20 + i * 15}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${3 + i}s`
                        }}
                    >
                        <div className="text-6xl opacity-30">🥛</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StreamerOverlay;