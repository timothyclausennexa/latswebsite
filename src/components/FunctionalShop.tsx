import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface Skin {
    id: string;
    name: string;
    price: number;
    color: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    animated: boolean;
}

interface FunctionalShopProps {
    isOpen: boolean;
    onClose: () => void;
}

const FunctionalShop: React.FC<FunctionalShopProps> = ({ isOpen, onClose }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [skins, setSkins] = useState<Skin[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchSkins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('skins')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            setSkins(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSkins();
            setMessage('');
            setError('');
        }
    }, [isOpen]);

    const handlePurchase = async (skinId: string, price: number) => {
        if (!user || !profile) return;

        setPurchasing(skinId);
        setMessage('');
        setError('');

        try {
            const { data, error } = await supabase.rpc('buy_skin', {
                skin_id: skinId
            });

            if (error) throw error;

            if (data.success) {
                setMessage(data.message);
                await refreshProfile();
            } else {
                setError(data.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPurchasing(null);
        }
    };

    const handleEquip = async (skinId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase.rpc('equip_skin', {
                skin_id: skinId
            });

            if (error) throw error;

            setMessage('Skin equipped!');
            await refreshProfile();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'border-ash-white/30 bg-ash-white/5';
            case 'rare': return 'border-blue-400/50 bg-blue-400/10';
            case 'epic': return 'border-purple-400/50 bg-purple-400/10';
            case 'legendary': return 'border-yellow-400/50 bg-yellow-400/10';
            default: return 'border-ash-white/30 bg-ash-white/5';
        }
    };

    const getRarityText = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-ash-white';
            case 'rare': return 'text-blue-400';
            case 'epic': return 'text-purple-400';
            case 'legendary': return 'text-yellow-400';
            default: return 'text-ash-white';
        }
    };

    const isOwned = (skinId: string) => {
        return profile?.owned_skins?.includes(skinId) || false;
    };

    const isEquipped = (skinId: string) => {
        return profile?.current_skin === skinId;
    };

    const canAfford = (price: number) => {
        return (profile?.coins || 0) >= price;
    };

    if (!user) {
        return (
            <Modal title="Shop" isOpen={isOpen} onClose={onClose}>
                <div className="text-center">
                    <h2 className="text-2xl font-pixel-heading text-warning-orange mb-4">
                        STREAMER SHOP
                    </h2>
                    <p className="text-ash-white mb-4">
                        You need to be logged in to access the shop.
                    </p>
                    <Button variant="primary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal title="Shop" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <h2 className="text-xl sm:text-2xl font-pixel-heading text-warning-orange">
                        STREAMER SHOP
                    </h2>
                    <div className="text-right">
                        <p className="text-yellow-400 font-bold">
                            💰 {profile?.coins || 0} LATS
                        </p>
                        <p className="text-xs text-ash-white/60">
                            Earn lats by playing!
                        </p>
                    </div>
                </div>

                {message && (
                    <div className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-2 rounded text-sm mb-4">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-alarm-red/20 border border-alarm-red text-alarm-red px-3 py-2 rounded text-sm mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-pulse text-ash-white">Loading shop...</div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {skins.map((skin) => (
                                <div
                                    key={skin.id}
                                    className={`border-2 rounded-lg p-3 sm:p-4 transition-all ${getRarityColor(skin.rarity)} ${
                                        isEquipped(skin.id) ? 'ring-2 ring-warning-orange' : ''
                                    }`}
                                >
                                    {/* Skin Preview */}
                                    <div className="flex justify-center mb-3">
                                        <div
                                            className="w-16 h-16 border-2 border-white rounded"
                                            style={{ backgroundColor: skin.color }}
                                        >
                                            {skin.id === 'prison' && (
                                                <div className="w-full h-full">
                                                    {Array.from({ length: 8 }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-2 ${i % 2 === 0 ? 'bg-orange-500' : 'bg-black'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <h3 className="font-bold text-ash-white mb-1">{skin.name}</h3>
                                        <p className={`text-xs font-pixel-heading mb-3 ${getRarityText(skin.rarity)}`}>
                                            {skin.rarity.toUpperCase()}
                                        </p>

                                        {isEquipped(skin.id) ? (
                                            <div className="bg-warning-orange text-prison-black px-3 py-2 rounded font-bold text-sm">
                                                EQUIPPED
                                            </div>
                                        ) : isOwned(skin.id) ? (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleEquip(skin.id)}
                                                className="w-full"
                                            >
                                                EQUIP
                                            </Button>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-yellow-400 font-bold">
                                                    💰 {skin.price} lats
                                                </p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handlePurchase(skin.id, skin.price)}
                                                    disabled={!canAfford(skin.price) || purchasing === skin.id}
                                                    className="w-full"
                                                >
                                                    {purchasing === skin.id
                                                        ? 'BUYING...'
                                                        : canAfford(skin.price)
                                                        ? 'BUY'
                                                        : 'NOT ENOUGH LATS'
                                                    }
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-ash-white/20">
                    <div className="text-xs text-ash-white/60 space-y-1">
                        <p>💰 Earn lats by playing and getting high scores</p>
                        <p>🎨 Equipped skins are visible in the game and leaderboard</p>
                        <p>⭐ Higher rarity skins have special visual effects</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FunctionalShop;