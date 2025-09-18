import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useConfig } from '../hooks/useConfig';
import { shortCA } from '../utils/helpers';
import { Icon } from './ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import MayoTimer from './MayoTimer';

interface HeaderProps {
    onAuthClick: () => void;
    onShopClick: () => void;
    onProfileClick: () => void;
    onAdminClick: () => void;
}

const PixelatedHeader: React.FC<HeaderProps> = ({
    onAuthClick,
    onShopClick,
    onProfileClick,
    onAdminClick
}) => {
    const { user, profile } = useAuth();
    const CONFIG = useConfig();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

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

    const navLinks = [
        { href: '#how-it-works', name: 'HOW' },
        { href: '#roadmap', name: 'ROADMAP' },
        { href: '#manifesto', name: 'ABOUT' },
        { href: '#tokenomics', name: 'TOKENOMICS' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b-4 border-yellow-400">
                {/* Timer Bar - Pixelated design */}
                <div className="bg-black border-b-2 border-yellow-400/50">
                    <div className="container mx-auto px-4 py-2">
                        <div className="border-2 border-yellow-400 bg-black p-2 pixel-shadow-sm">
                            <MayoTimer className="w-full" />
                        </div>
                    </div>
                </div>

                {/* Main Header Content */}
                <div className="bg-black">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between py-3 md:py-4">

                            {/* Logo - Pixelated with hard shadow */}
                            <div className="flex items-center gap-3">
                                <h1 className="font-pixel-heading text-xl sm:text-2xl md:text-3xl text-yellow-400 pixel-text">
                                    MAYO MEN
                                </h1>
                                <span className="hidden sm:block text-2xl">🥫</span>
                            </div>

                            {/* Desktop Navigation - Blocky buttons */}
                            <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
                                {navLinks.map(link => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="
                                            px-4 py-2 font-pixel-heading text-xs text-yellow-400
                                            border-2 border-yellow-400 bg-black
                                            hover:bg-yellow-400 hover:text-black
                                            transition-none pixel-shadow-sm
                                            hover:translate-x-1 hover:translate-y-1
                                            hover:shadow-none
                                        "
                                    >
                                        {link.name}
                                    </a>
                                ))}
                            </nav>

                            {/* Right Actions - Pixelated buttons */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* User Info - Blocky design */}
                                {profile && (
                                    <div className="
                                        hidden md:flex items-center gap-3 px-4 py-2
                                        bg-black border-2 border-yellow-400/50
                                        pixel-shadow-sm
                                    ">
                                        <span className="text-yellow-400 text-sm">💰</span>
                                        <span className="font-pixel-heading text-xs text-yellow-400">
                                            {profile.coins || 0}
                                        </span>
                                        <div className="w-0.5 h-4 bg-yellow-400"></div>
                                        <span className="font-pixel-heading text-xs text-white">
                                            {profile.username}
                                        </span>
                                    </div>
                                )}

                                {/* Action Buttons - Pixelated */}
                                <div className="flex items-center gap-2">
                                    {!user ? (
                                        <button
                                            onClick={onAuthClick}
                                            className="
                                                px-4 py-2 font-pixel-heading text-xs
                                                bg-yellow-400 text-black border-2 border-black
                                                pixel-shadow hover:translate-x-1 hover:translate-y-1
                                                hover:shadow-none transition-transform
                                            "
                                        >
                                            LOGIN
                                        </button>
                                    ) : (
                                        <>
                                            {onShopClick && (
                                                <button
                                                    onClick={onShopClick}
                                                    className="
                                                        p-2 border-2 border-purple-400
                                                        bg-black text-purple-400
                                                        hover:bg-purple-400 hover:text-black
                                                        transition-colors pixel-shadow-sm
                                                    "
                                                >
                                                    <Icon type="coin-stack" className="h-5 w-5" />
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={onAdminClick}
                                                    className="
                                                        p-2 border-2 border-red-400
                                                        bg-black text-red-400
                                                        hover:bg-red-400 hover:text-black
                                                        transition-colors pixel-shadow-sm
                                                    "
                                                >
                                                    <Icon type="shield" className="h-5 w-5" />
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Buy Button - Most prominent pixelated */}
                                    <button
                                        onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank')}
                                        disabled={!CONFIG.PUMP_FUN_LINK}
                                        className="
                                            px-6 py-2 font-pixel-heading text-xs font-bold
                                            bg-green-400 text-black border-3 border-black
                                            pixel-shadow-lg hover:translate-x-1 hover:translate-y-1
                                            hover:shadow-none transition-transform
                                            animate-pixel-blink
                                        "
                                    >
                                        BUY NOW
                                    </button>

                                    {/* Mobile Menu Toggle - Pixelated */}
                                    <button
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        className="
                                            lg:hidden p-2
                                            border-2 border-white
                                            bg-black text-white
                                            pixel-shadow-sm
                                        "
                                    >
                                        <div className="w-6 h-5 flex flex-col justify-between">
                                            <span className="h-1 w-full bg-white"></span>
                                            <span className={`h-1 w-full bg-white ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                            <span className="h-1 w-full bg-white"></span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CA Display Bar - Pixelated */}
                {CONFIG.TOKEN_CONTRACT_ADDRESS && (
                    <div className="bg-black border-t-2 border-yellow-400/30 py-1">
                        <div className="container mx-auto px-4 text-center">
                            <span className="font-mono text-xs text-yellow-400">
                                CA: {shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)}
                            </span>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Menu - Pixelated fullscreen */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black border-4 border-yellow-400 lg:hidden">
                    <div className="container mx-auto px-4 py-20">
                        <nav className="flex flex-col gap-4">
                            {navLinks.map(link => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="
                                        font-pixel-heading text-xl text-yellow-400
                                        border-b-2 border-yellow-400/50 pb-3
                                        hover:bg-yellow-400 hover:text-black
                                        px-4 transition-colors
                                    "
                                >
                                    {link.name}
                                </a>
                            ))}
                        </nav>

                        {profile && (
                            <div className="mt-8 p-4 border-2 border-yellow-400 bg-black pixel-shadow">
                                <p className="font-pixel-heading text-yellow-400">
                                    💰 {profile.coins || 0} MAYOMEN
                                </p>
                                <p className="font-pixel-heading text-white mt-2">
                                    👤 {profile.username}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default PixelatedHeader;