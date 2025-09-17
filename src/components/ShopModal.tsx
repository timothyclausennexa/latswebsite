import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { ShopItem, UserInventoryItem } from '../types';
import { Icon } from './ui/Icon';
import { supabase } from '../lib/supabaseClient';

const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { profile, fetchProfile } = useAuth();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [actionMessage, setActionMessage] = useState('');

    const fetchShopData = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        try {
            const [shopItemsRes, inventoryRes] = await Promise.all([
                supabase.from('shop_items').select('*').order('cost', { ascending: true }),
                supabase.from('user_inventories').select('item_id').eq('user_id', profile!.id)
            ]);

            if (shopItemsRes.error) throw shopItemsRes.error;
            if (inventoryRes.error) throw inventoryRes.error;

            setItems(shopItemsRes.data);
            setInventory(inventoryRes.data);
            if (shopItemsRes.data.length > 0) {
                setSelectedItem(shopItemsRes.data[0]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load shop data.");
        } finally {
            setLoading(false);
        }
    }, [isOpen, profile]);

    useEffect(() => {
        fetchShopData();
    }, [fetchShopData]);
    
    const handlePurchase = async (item: ShopItem) => {
        setActionStatus('loading');
        setActionMessage('');
        try {
            const { data, error } = await supabase.rpc('purchase_shop_item', { item_id_to_buy: item.id });
            if (error) throw error;
            setActionMessage(data);
            setActionStatus(data === 'Purchase successful!' ? 'success' : 'error');
            await fetchProfile(); // Refresh points
            await fetchShopData(); // Refresh inventory
        } catch (err: any) {
            setActionStatus('error');
            setActionMessage(err.message || 'Purchase failed.');
        }
    };
    
    const handleEquip = async (item: ShopItem) => {
        setActionStatus('loading');
        setActionMessage('');
        try {
            const { error } = await supabase.from('profiles').update({ equipped_skin_id: item.asset_id }).eq('id', profile!.id);
            if (error) throw error;
            setActionMessage('Skin Equipped!');
            setActionStatus('success');
            await fetchProfile(); // Refresh equipped skin
        } catch (err: any) {
            setActionStatus('error');
            setActionMessage(err.message || 'Failed to equip skin.');
        }
    };

    const isOwned = (itemId: number) => inventory.some(invItem => invItem.item_id === itemId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="SKIN SHOP">
            <div className="flex justify-between items-center mb-4 border-b-2 border-ash-white/20 pb-2">
                <h3 className="font-pixel-heading text-ash-white">Your Balance:</h3>
                <p className="font-pixel-timer text-2xl text-yellow-400">{profile?.escape_points.toLocaleString() || 0} EP</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: '400px' }}>
                <div className="md:col-span-1 h-full overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {loading ? <p>Loading items...</p> : items.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => { setSelectedItem(item); setActionStatus('idle'); }}
                            className={`w-full flex items-center justify-between p-2 rounded transition-colors text-left ${selectedItem?.id === item.id ? 'bg-warning-orange/20' : 'hover:bg-ash-white/10'}`}
                        >
                            <span className="font-pixel-heading text-sm">{item.name}</span>
                            {isOwned(item.id) ? (
                                <span className="font-mono text-xs text-green-400">OWNED</span>
                            ) : (
                                <span className="font-mono text-xs text-yellow-400">{item.cost} EP</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="md:col-span-2 flex flex-col items-center justify-center p-4 border-2 border-ash-white/20 bg-prison-black/50">
                    {selectedItem ? (
                        <>
                            <div className="w-32 h-32 bg-prison-black flex items-center justify-center border-2 border-ash-white/10 mb-4">
                                <Icon type="user" className="w-24 h-24 text-ash-white/50" />
                            </div>
                            <h4 className="font-pixel-heading text-lg text-warning-orange">{selectedItem.name}</h4>
                            <p className="font-body text-sm text-ash-white/70 mt-1 text-center h-10">{selectedItem.description}</p>
                            
                            <div className="mt-6 flex flex-col items-center gap-2 w-full">
                                {isOwned(selectedItem.id) ? (
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => handleEquip(selectedItem)}
                                        disabled={actionStatus === 'loading' || profile?.equipped_skin_id === selectedItem.asset_id}
                                    >
                                        {profile?.equipped_skin_id === selectedItem.asset_id ? 'EQUIPPED' : 'EQUIP'}
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="primary" 
                                        onClick={() => handlePurchase(selectedItem)}
                                        disabled={actionStatus === 'loading' || (profile?.escape_points || 0) < selectedItem.cost}
                                    >
                                        Purchase ({selectedItem.cost.toLocaleString()} EP)
                                    </Button>
                                )}
                                <div className="h-5 mt-2 text-sm font-body">
                                    {actionStatus === 'loading' && <p className="text-ash-white/70">Processing...</p>}
                                    {actionStatus === 'success' && <p className="text-green-400">{actionMessage}</p>}
                                    {actionStatus === 'error' && <p className="text-alarm-red">{actionMessage}</p>}
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="font-body text-ash-white/50">Select an item to view.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ShopModal;
