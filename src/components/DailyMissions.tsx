import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';

interface Mission {
    mission_id: string;
    title: string;
    description: string;
    requirement_value: number;
    reward_lats: number;
    progress: number;
    is_completed: boolean;
    is_claimed: boolean;
}

const DailyMissions: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [message, setMessage] = useState('');

    const fetchMissions = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // Direct query approach to avoid the function ambiguity issue
            const today = new Date().toISOString().split('T')[0];

            // First ensure missions exist for today
            const { data: templates } = await supabase
                .from('mission_templates')
                .select('id')
                .eq('type', 'daily')
                .eq('is_active', true)
                .limit(3);

            if (templates && templates.length > 0) {
                // Insert today's missions if they don't exist
                for (const template of templates) {
                    await supabase
                        .from('user_missions')
                        .upsert({
                            user_id: user.id,
                            mission_id: template.id,
                            mission_date: today
                        }, {
                            onConflict: 'user_id,mission_id,mission_date'
                        });
                }
            }

            // Now fetch the missions
            const { data, error } = await supabase
                .from('user_missions')
                .select(`
                    mission_id,
                    progress,
                    is_completed,
                    claimed_at,
                    mission_templates!inner (
                        title,
                        description,
                        requirement_value,
                        reward_coins
                    )
                `)
                .eq('user_id', user.id)
                .eq('mission_date', today);

            if (error) throw error;

            // Transform the data to match our interface
            const transformedData = (data || []).map(item => ({
                mission_id: item.mission_id,
                title: (item.mission_templates as any).title,
                description: (item.mission_templates as any).description,
                requirement_value: (item.mission_templates as any).requirement_value,
                reward_lats: (item.mission_templates as any).reward_coins,
                progress: item.progress || 0,
                is_completed: item.is_completed || false,
                is_claimed: !!item.claimed_at
            }));

            setMissions(transformedData);
        } catch (error) {
            console.error('Error fetching missions:', error);
            setMissions([]);
        } finally {
            setLoading(false);
        }
    };

    const claimRewards = async () => {
        if (!user || claiming) return;

        setClaiming(true);
        setMessage('');

        try {
            const { data, error } = await supabase.rpc('claim_mission_rewards', {
                p_user_id: user.id
            });

            if (error) throw error;

            if (data.coins_earned > 0) {
                setMessage(`🎉 Claimed ${data.coins_earned} lats!`);
                await refreshProfile();
                await fetchMissions();
            } else {
                setMessage('No rewards to claim');
            }
        } catch (error) {
            console.error('Error claiming rewards:', error);
            setMessage('Failed to claim rewards');
        } finally {
            setClaiming(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    useEffect(() => {
        fetchMissions();

        // Refresh missions every minute
        const interval = setInterval(fetchMissions, 60000);

        return () => clearInterval(interval);
    }, [user]);

    const hasUnclaimedRewards = missions.some(m => m.is_completed && !m.is_claimed);

    const getProgressPercentage = (mission: Mission) => {
        if (mission.is_completed) return 100;
        return Math.min(100, Math.round((mission.progress / mission.requirement_value) * 100));
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-yellow-500';
        if (percentage >= 50) return 'bg-warning-orange';
        return 'bg-ash-white/30';
    };

    if (!user) {
        return (
            <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-lg">
                <h3 className="mb-3 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                    Daily Objectives
                </h3>
                <p className="text-center text-ash-white/60 py-8">
                    Login to see daily missions
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-lg">
                <h3 className="mb-3 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                    Daily Objectives
                </h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-ash-white/10 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-lg">
            <div className="flex items-center justify-between mb-3 border-b-2 border-ash-white/20 pb-2">
                <h3 className="font-pixel-heading text-lg text-warning-orange">
                    Daily Objectives
                </h3>
                {hasUnclaimedRewards && (
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={claimRewards}
                        disabled={claiming}
                        className="animate-pulse"
                    >
                        {claiming ? 'Claiming...' : 'Claim Rewards'}
                    </Button>
                )}
            </div>

            {message && (
                <div className="mb-3 p-2 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm text-center">
                    {message}
                </div>
            )}

            <ul className="space-y-3">
                {missions.length === 0 ? (
                    <li className="text-center text-ash-white/60 py-4">
                        No missions available today. Check back tomorrow!
                    </li>
                ) : (
                    missions.map(mission => {
                        const progress = getProgressPercentage(mission);
                        const progressColor = getProgressColor(progress);

                        return (
                            <li key={mission.mission_id} className="border border-ash-white/10 rounded-lg p-3 bg-ash-white/5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {mission.is_claimed ? (
                                            <Icon type="check" className="h-5 w-5 text-green-400" />
                                        ) : mission.is_completed ? (
                                            <Icon type="check" className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        ) : (
                                            <Icon type="check" className="h-5 w-5 text-ash-white/30" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-ash-white mb-1">
                                            {mission.title}
                                        </p>
                                        <p className="font-body text-xs text-ash-white/80 mb-2">
                                            {mission.description}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="mb-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-ash-white/60">
                                                    Progress: {mission.progress}/{mission.requirement_value}
                                                </span>
                                                <span className="text-ash-white/60">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-prison-black rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${progressColor} transition-all duration-300`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <p className="font-mono text-xs text-yellow-400">
                                                💰 {mission.reward_lats} lats
                                            </p>
                                            {mission.is_claimed && (
                                                <span className="text-xs text-green-400">Claimed!</span>
                                            )}
                                            {mission.is_completed && !mission.is_claimed && (
                                                <span className="text-xs text-yellow-400 animate-pulse">Ready to claim!</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            <div className="mt-4 pt-3 border-t border-ash-white/20">
                <div className="text-xs text-ash-white/60 space-y-1">
                    <p>🎯 Complete objectives to earn lats</p>
                    <p>🔄 New missions daily at midnight UTC</p>
                    <p>💰 Use lats to buy skins in the shop</p>
                    {missions.filter(m => m.is_completed && !m.is_claimed).length > 0 && (
                        <p className="text-yellow-400 animate-pulse">
                            ⚡ You have {missions.filter(m => m.is_completed && !m.is_claimed).length} unclaimed rewards!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyMissions;