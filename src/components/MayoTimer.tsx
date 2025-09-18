import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TimerState {
    current_time_seconds: number;  // This is what get_timer_state() returns
    is_running: boolean;
    last_updated: string;
    manual_override: boolean;
}

const MayoTimer: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [timerState, setTimerState] = useState<TimerState>({
        current_time_seconds: 360000, // 100 hours default
        is_running: false,
        last_updated: new Date().toISOString(),
        manual_override: false
    });
    const [displayTime, setDisplayTime] = useState(360000);

    // Fetch initial timer state
    useEffect(() => {
        const fetchTimerState = async () => {
            try {
                const { data, error } = await supabase
                    .rpc('get_timer_state');

                if (!error && data) {
                    setTimerState(data);
                    setDisplayTime(data.current_time_seconds);
                }
            } catch (err) {
                console.error('Error fetching timer:', err);
            }
        };

        fetchTimerState();

        // Subscribe to real-time updates
        const timerSubscription = supabase
            .channel('timer_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'timer_state'
            }, (payload) => {
                if (payload.new) {
                    // Map the database columns to our interface
                    const dbState = payload.new as any;
                    const newState: TimerState = {
                        current_time_seconds: dbState.time_seconds || 360000,
                        is_running: dbState.is_running || false,
                        last_updated: dbState.last_updated,
                        manual_override: dbState.manual_override || false
                    };
                    setTimerState(newState);
                    setDisplayTime(newState.current_time_seconds);
                }
            })
            .subscribe();

        // Subscribe to trade events for immediate updates
        const tradeSubscription = supabase
            .channel('trade_events')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'buy_sell_events'
            }, () => {
                // Refetch timer state when a trade happens
                fetchTimerState();
            })
            .subscribe();

        return () => {
            timerSubscription.unsubscribe();
            tradeSubscription.unsubscribe();
        };
    }, []);

    // Update display time every second if timer is running
    useEffect(() => {
        if (!timerState.is_running) {
            setDisplayTime(timerState.current_time_seconds);
            return;
        }

        const interval = setInterval(() => {
            setDisplayTime(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [timerState.is_running, timerState.current_time_seconds]);

    // Format time display
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 99) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get color based on time remaining
    const getTimerColor = () => {
        const hours = displayTime / 3600;
        if (hours < 10) return 'text-red-500 animate-pulse';
        if (hours < 50) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className={`mayo-timer ${className}`}>
            <div className="flex flex-col items-center">
                <div className="font-pixel-heading text-xs text-yellow-400 animate-pulse">
                    🥫 MAYO TIMER 🥫
                </div>
                <div className={`font-pixel-timer text-2xl sm:text-3xl md:text-4xl ${getTimerColor()}`}>
                    {formatTime(displayTime)}
                </div>
                {timerState.is_running && (
                    <div className="text-xs text-green-400 animate-pulse">
                        ▶ LIVE
                    </div>
                )}
            </div>
        </div>
    );
};

export default MayoTimer;