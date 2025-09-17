import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useConfig } from '../hooks/useConfig';
import { shortCA } from '../utils/helpers';
import { Icon } from './ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface HeaderProps {
    onAuthClick: () => void;
    onShopClick?: () => void;
    onProfileClick?: () => void;
    onAdminClick?: () => void;
    isAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAuthClick, onShopClick, onProfileClick, onAdminClick }) => {
    const navLinks = [
        { name: "Mechanics", href: "#how-it-works" },
        { name: "Roadmap", href: "#roadmap" },
        { name: "Q&A", href: "#faq" },
    ];
    const [isCopied, setIsCopied] = useState(false);
    const { profile, signOut, user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const CONFIG = useConfig();

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            }

            try {
                const { data } = await supabase
                    .from('admin_users')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                setIsAdmin(!!data);
            } catch (error) {
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    const handleCopy = () => {
        if (CONFIG.TOKEN_CONTRACT_ADDRESS) {
            navigator.clipboard.writeText(CONFIG.TOKEN_CONTRACT_ADDRESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }
    };

    return (
        <header className="sticky top-0 z-40 border-b-4 border-black bg-black/80 backdrop-blur-sm">
            <div className="relative border-y-2 border-ash-white/20">
                <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3 sm:gap-4">
                    {/* Logo */}
                    <div className="font-pixel-heading text-xl text-alarm-red sm:text-2xl">
                        Lats
                    </div>
                    
                    {/* Nav Links (center) */}
                    <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="font-pixel-heading text-sm text-ash-white transition-colors hover:text-warning-orange">
                                {link.name}
                            </a>
                        ))}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {profile ? (
                            <>
                                <div className="flex items-center gap-2 rounded-md border-2 border-ash-white/20 bg-black/50 p-2 font-mono text-xs text-ash-white/70">
                                    <Icon type="coin-stack" className="h-4 w-4 text-yellow-400" />
                                    <span className="font-pixel-heading text-sm text-yellow-400">{profile.coins || 0} LATS</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-md border-2 border-ash-white/20 bg-black/50 p-2 font-mono text-xs text-ash-white/70">
                                    <Icon type="user" className="h-4 w-4 text-warning-orange" />
                                    <span className="font-pixel-heading text-sm text-ash-white">{profile.username}</span>
                                    <button
                                        onClick={onProfileClick}
                                        className="font-pixel-heading text-xs text-ash-white/60 hover:text-warning-orange"
                                    >
                                        [Settings]
                                    </button>
                                </div>
                                {onShopClick && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={onShopClick}
                                        className="hidden sm:inline-block"
                                    >
                                        <Icon type="shop" className="mr-1 h-4 w-4" />
                                        Shop
                                    </Button>
                                )}
                                {isAdmin && onAdminClick && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={onAdminClick}
                                        className="bg-green-600 hover:bg-green-500"
                                    >
                                        <span className="hidden sm:inline">🔐 Admin</span>
                                        <span className="sm:hidden">🔐</span>
                                    </Button>
                                )}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={signOut}
                                    className="hidden sm:inline-block"
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                             <>
                                <div className="hidden rounded-md border-2 border-ash-white/20 bg-black/50 p-2 font-mono text-xs text-ash-white/70 sm:flex sm:items-center sm:gap-2">
                                    <span className="hidden lg:inline">CA:</span>
                                    {CONFIG.TOKEN_CONTRACT_ADDRESS ? (
                                        <>
                                            <span>{shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)}</span>
                                            <button
                                                onClick={handleCopy}
                                                className="text-ash-white/60 transition-colors hover:text-warning-orange"
                                                aria-label="Copy contract address"
                                            >
                                                {isCopied ? <Icon type="check" className="h-4 w-4 text-green-400" /> : <Icon type="copy" className="h-4 w-4" />}
                                            </button>
                                        </>
                                    ) : (
                                        <span>Setting up on stream...</span>
                                    )}
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={onAuthClick}
                                    className="hidden sm:inline-block"
                                >
                                    Login / Sign Up
                                </Button>
                            </>
                        )}
                        <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank', 'noopener,noreferrer')}
                            disabled={!CONFIG.PUMP_FUN_LINK}
                            tooltip="Link will be updated live on stream"
                            className="shadow-warning-orange/30"
                        >
                            BUY $LATS
                        </Button>
                    </div>
                </div>
            </div>
            {/* Modals are now rendered in App.tsx at the root level */}
        </header>
    );
};

export default Header;