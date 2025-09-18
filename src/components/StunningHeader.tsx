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

const StunningHeader: React.FC<HeaderProps> = ({
    onAuthClick,
    onShopClick,
    onProfileClick,
    onAdminClick
}) => {
    const { user, profile } = useAuth();
    const CONFIG = useConfig();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll for header effects
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        { href: '#how-it-works', name: '🥫 How It Works' },
        { href: '#roadmap', name: '🗺️ Roadmap' },
        { href: '#manifesto', name: '📜 About' },
        { href: '#tokenomics', name: '💰 Tokenomics' },
    ];

    return (
        <>
            <header className={`
                fixed top-0 left-0 right-0 z-50
                transition-all duration-500 ease-in-out
                ${scrolled
                    ? 'bg-black/95 backdrop-blur-xl shadow-2xl shadow-yellow-400/20'
                    : 'bg-gradient-to-b from-black via-black/90 to-transparent'
                }
            `}>
                {/* Timer Bar - Full width, above main header */}
                <div className="bg-gradient-to-r from-yellow-400/20 via-yellow-500/30 to-yellow-400/20 border-b border-yellow-400/50">
                    <div className="container mx-auto px-4 py-2">
                        <MayoTimer className="w-full" />
                    </div>
                </div>

                {/* Main Header Content */}
                <div className="border-b border-yellow-400/30 backdrop-blur-md">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between py-3 md:py-4">

                            {/* Logo - Enhanced with glow effect */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse"></div>
                                    <h1 className="relative font-pixel-heading text-xl sm:text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 animate-gradient">
                                        MAYO MEN
                                    </h1>
                                </div>
                                <span className="hidden sm:block text-2xl animate-mayo-float">🥫</span>
                            </div>

                            {/* Desktop Navigation - Center */}
                            <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
                                {navLinks.map(link => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="
                                            relative font-pixel-heading text-sm text-white/80
                                            hover:text-yellow-400 transition-all duration-300
                                            hover:scale-110 group
                                        "
                                    >
                                        <span className="relative z-10">{link.name}</span>
                                        <span className="
                                            absolute inset-0 bg-yellow-400/20 rounded-lg
                                            scale-0 group-hover:scale-100 transition-transform duration-300
                                            blur-xl
                                        "></span>
                                    </a>
                                ))}
                            </nav>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* User Info - Glassmorphic design */}
                                {profile && (
                                    <div className="
                                        hidden md:flex items-center gap-3 px-4 py-2
                                        bg-white/5 backdrop-blur-md rounded-full
                                        border border-yellow-400/30
                                    ">
                                        <span className="text-yellow-400 text-sm">💰</span>
                                        <span className="font-pixel-heading text-sm text-yellow-300">
                                            {profile.coins || 0}
                                        </span>
                                        <div className="w-px h-4 bg-yellow-400/30"></div>
                                        <span className="font-pixel-heading text-sm text-white/80">
                                            {profile.username}
                                        </span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {!user ? (
                                        <Button
                                            onClick={onAuthClick}
                                            className="
                                                bg-gradient-to-r from-yellow-400 to-orange-400
                                                text-black font-bold px-4 py-2 rounded-full
                                                hover:shadow-lg hover:shadow-yellow-400/50
                                                transform hover:scale-105 transition-all duration-300
                                            "
                                        >
                                            <span className="hidden sm:inline">🚀 Login</span>
                                            <span className="sm:hidden">Login</span>
                                        </Button>
                                    ) : (
                                        <>
                                            {onShopClick && (
                                                <button
                                                    onClick={onShopClick}
                                                    className="
                                                        p-2 rounded-full bg-purple-500/20
                                                        border border-purple-400/50
                                                        hover:bg-purple-500/30 hover:scale-110
                                                        transition-all duration-300
                                                    "
                                                >
                                                    <Icon type="coin-stack" className="h-5 w-5 text-purple-400" />
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={onAdminClick}
                                                    className="
                                                        p-2 rounded-full bg-red-500/20
                                                        border border-red-400/50
                                                        hover:bg-red-500/30 hover:scale-110
                                                        transition-all duration-300
                                                    "
                                                >
                                                    <Icon type="shield" className="h-5 w-5 text-red-400" />
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Buy Button - Most prominent */}
                                    <Button
                                        onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank')}
                                        disabled={!CONFIG.PUMP_FUN_LINK}
                                        className="
                                            relative overflow-hidden
                                            bg-gradient-to-r from-green-400 via-emerald-400 to-green-400
                                            text-black font-bold px-6 py-2 rounded-full
                                            hover:shadow-lg hover:shadow-green-400/50
                                            transform hover:scale-105 transition-all duration-300
                                            animate-shimmer bg-[length:200%_100%]
                                        "
                                    >
                                        <span className="relative z-10">
                                            💸 BUY NOW
                                        </span>
                                    </Button>

                                    {/* Mobile Menu Toggle */}
                                    <button
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        className="
                                            lg:hidden p-2 rounded-lg
                                            bg-white/10 backdrop-blur-md
                                            border border-white/20
                                        "
                                    >
                                        <div className="w-6 h-5 flex flex-col justify-between">
                                            <span className={`
                                                h-0.5 w-full bg-white transition-all duration-300
                                                ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}
                                            `}></span>
                                            <span className={`
                                                h-0.5 w-full bg-white transition-all duration-300
                                                ${isMobileMenuOpen ? 'opacity-0' : ''}
                                            `}></span>
                                            <span className={`
                                                h-0.5 w-full bg-white transition-all duration-300
                                                ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}
                                            `}></span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CA Display Bar - Optional */}
                {CONFIG.TOKEN_CONTRACT_ADDRESS && (
                    <div className="bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent py-1">
                        <div className="container mx-auto px-4 text-center">
                            <span className="font-mono text-xs text-yellow-400/80">
                                CA: {shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)}
                            </span>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Menu - Fullscreen with blur */}
            {isMobileMenuOpen && (
                <div className="
                    fixed inset-0 z-40 bg-black/95 backdrop-blur-xl
                    lg:hidden
                ">
                    <div className="container mx-auto px-4 py-20">
                        <nav className="flex flex-col gap-4">
                            {navLinks.map(link => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="
                                        font-pixel-heading text-xl text-white/80
                                        hover:text-yellow-400 transition-colors duration-300
                                        py-3 border-b border-white/10
                                    "
                                >
                                    {link.name}
                                </a>
                            ))}
                        </nav>

                        {profile && (
                            <div className="mt-8 p-4 bg-white/5 rounded-xl">
                                <p className="font-pixel-heading text-yellow-400">
                                    💰 {profile.coins || 0} MAYOMEN
                                </p>
                                <p className="font-pixel-heading text-white/80 mt-2">
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

export default StunningHeader;