import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useConfig } from '../hooks/useConfig';
import { shortCA } from '../utils/helpers';
import { Icon } from './ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTouchButton, useTouch } from '../hooks/useTouch';
import MayoTimer from './MayoTimer';

// Touch-optimized hamburger button component
const HamburgerButton: React.FC<{
    isOpen: boolean;
    onClick: () => void;
}> = ({ isOpen, onClick }) => {
    const { ref, triggerHaptic } = useTouchButton({
        enableHaptics: true,
        hapticOnPress: 'impactMedium',
        hapticOnRelease: 'selection',
        enableRipple: true,
        rippleColor: 'rgba(255, 138, 0, 0.3)',
        enableScale: true,
        scaleAmount: 0.92,
        onTap: () => {
            triggerHaptic('selection');
            onClick();
        },
    });

    return (
        <button
            ref={ref}
            onClick={() => {
                triggerHaptic('selection');
                onClick();
            }}
            className="hamburger-button flex h-11 w-11 items-center justify-center rounded-md border-2 border-ash-white/20 bg-black/50 transition-colors hover:border-warning-orange/50 hover-to-touch touch-optimized touch-focus touch-ripple touch-target-min"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
        >
            <div className="relative h-5 w-5">
                <span className={`absolute left-0 top-1 h-0.5 w-5 bg-ash-white transition-all duration-300 ${isOpen ? 'top-2 rotate-45' : ''}`} />
                <span className={`absolute left-0 top-2 h-0.5 w-5 bg-ash-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
                <span className={`absolute left-0 top-3 h-0.5 w-5 bg-ash-white transition-all duration-300 ${isOpen ? 'top-2 -rotate-45' : ''}`} />
            </div>
        </button>
    );
};

// Touch-optimized close button for mobile menu
const CloseMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { ref, triggerHaptic } = useTouchButton({
        enableHaptics: true,
        hapticOnPress: 'impactMedium',
        hapticOnRelease: 'selection',
        enableRipple: true,
        rippleColor: 'rgba(255, 138, 0, 0.3)',
        enableScale: true,
        scaleAmount: 0.9,
        onTap: () => {
            triggerHaptic('selection');
            onClick();
        },
    });

    return (
        <button
            ref={ref}
            onClick={() => {
                triggerHaptic('selection');
                onClick();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-ash-white/20 bg-black/50 text-ash-white transition-colors hover:border-warning-orange/50 hover-to-touch touch-optimized touch-focus touch-ripple touch-target-min"
            aria-label="Close menu"
        >
            <Icon type="x" className="h-5 w-5" />
        </button>
    );
};

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { profile, signOut, user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const CONFIG = useConfig();

    // Touch optimization for mobile menu with swipe gestures
    const { ref: mobileMenuRef, triggerHaptic } = useTouch({
        enableSwipe: true,
        enableHaptics: true,
        preventDefaults: false, // Allow normal interactions within menu
        onSwipe: (gesture) => {
            if (gesture.direction === 'right' && isMobileMenuOpen) {
                // Swipe right to close menu
                setIsMobileMenuOpen(false);
                triggerHaptic('impactLight');
            }
        },
    });

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

    // Close mobile menu on navigation
    const handleNavClick = (href: string) => {
        setIsMobileMenuOpen(false);
        // Let the browser handle the navigation
    };

    // Handle mobile menu actions
    const handleMobileAction = (action: () => void) => {
        action();
        setIsMobileMenuOpen(false);
    };

    const handleCopy = () => {
        if (CONFIG.TOKEN_CONTRACT_ADDRESS) {
            navigator.clipboard.writeText(CONFIG.TOKEN_CONTRACT_ADDRESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }
    };

    // Close mobile menu when clicking outside or pressing escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('click', handleClickOutside);
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('click', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className="sticky top-0 z-40 border-b-4 border-black bg-black/80 backdrop-blur-sm">
                <div className="relative border-y-2 border-ash-white/20">
                    <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3 sm:gap-4">
                        {/* Logo */}
                        <div className="font-pixel-heading text-lg text-alarm-red sm:text-xl md:text-2xl">
                            MAYO MEN
                        </div>

                        {/* Mayo Timer - Centered for mobile, next to logo for desktop */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none">
                            <MayoTimer className="scale-75 sm:scale-90 md:scale-100" />
                        </div>

                        {/* Desktop Nav Links (center) */}
                        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
                            {navLinks.map(link => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="font-pixel-heading text-sm text-ash-white transition-colors hover:text-warning-orange"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </nav>

                        {/* Desktop Right Section */}
                        <div className="hidden items-center gap-2 sm:flex sm:gap-4 md:gap-3">
                            {profile ? (
                                <>
                                    {/* User Coins - Hidden on smaller screens, shown on md+ */}
                                    <div className="hidden items-center gap-2 rounded-md border-2 border-ash-white/20 bg-black/50 p-2 font-mono text-xs text-ash-white/70 md:flex">
                                        <Icon type="coin-stack" className="h-4 w-4 text-yellow-400" />
                                        <span className="font-pixel-heading text-sm text-yellow-400">{profile.coins || 0} SLURP</span>
                                    </div>

                                    {/* User Profile - Compact on small, full on md+ */}
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

                                    {/* Shop Button */}
                                    {onShopClick && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={onShopClick}
                                            className="hidden lg:inline-flex"
                                        >
                                            <Icon type="shop" className="mr-1 h-4 w-4" />
                                            Shop
                                        </Button>
                                    )}

                                    {/* Admin Button */}
                                    {isAdmin && onAdminClick && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={onAdminClick}
                                            className="bg-green-600 hover:bg-green-500"
                                        >
                                            <span className="hidden lg:inline">🔐 Admin</span>
                                            <span className="lg:hidden">🔐</span>
                                        </Button>
                                    )}

                                    {/* Logout Button */}
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={signOut}
                                        className="hidden lg:inline-flex"
                                    >
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Contract Address */}
                                    <div className="hidden items-center gap-2 rounded-md border-2 border-ash-white/20 bg-black/50 p-2 font-mono text-xs text-ash-white/70 md:flex">
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

                                    {/* Login Button */}
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={onAuthClick}
                                        className="hidden lg:inline-flex"
                                    >
                                        Login / Sign Up
                                    </Button>
                                </>
                            )}

                            {/* Buy Button - Always visible on desktop */}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank', 'noopener,noreferrer')}
                                disabled={!CONFIG.PUMP_FUN_LINK}
                                tooltip="Link will be updated live on stream"
                                className="shadow-warning-orange/30"
                            >
                                <span className="hidden sm:inline">BUY $MAYOMEN</span>
                                <span className="sm:hidden">BUY</span>
                            </Button>
                        </div>

                        {/* Mobile Elements */}
                        <div className="flex items-center gap-2 sm:hidden">
                            {/* Mobile User/Login Button */}
                            {profile ? (
                                <button
                                    onClick={onProfileClick}
                                    className="flex items-center gap-1 px-2 py-1 bg-black/50 border border-warning-orange/30 rounded text-xs"
                                >
                                    <Icon type="user" className="h-3 w-3 text-warning-orange" />
                                    <span className="text-ash-white max-w-[60px] truncate">
                                        {profile.username}
                                    </span>
                                </button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={onAuthClick}
                                    className="px-3 py-2 text-xs"
                                >
                                    Login
                                </Button>
                            )}

                            {/* Mobile Buy Button - Always visible */}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank', 'noopener,noreferrer')}
                                disabled={!CONFIG.PUMP_FUN_LINK}
                                className="px-3 py-2 text-xs shadow-warning-orange/30"
                            >
                                BUY
                            </Button>

                            {/* Hamburger Menu Button with Touch Optimization */}
                            <HamburgerButton
                                isOpen={isMobileMenuOpen}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay with Touch Gestures */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm sm:hidden">
                    <div
                        ref={mobileMenuRef}
                        className="mobile-menu absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black/95 border-l-4 border-ash-white/20 backdrop-blur-md touch-optimized safe-area-all"
                    >
                        {/* Mobile Menu Header */}
                        <div className="flex items-center justify-between border-b-2 border-ash-white/20 p-4">
                            <div className="font-pixel-heading text-lg text-alarm-red">Menu</div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-ash-white/60 touch-only">Swipe right to close</div>
                                <CloseMenuButton onClick={() => setIsMobileMenuOpen(false)} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 p-6">
                            {/* Navigation Links */}
                            <nav className="flex flex-col gap-4">
                                <h3 className="font-pixel-heading text-sm text-ash-white/60 uppercase tracking-wider">Navigation</h3>
                                {navLinks.map(link => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => handleNavClick(link.href)}
                                        className="font-pixel-heading text-lg text-ash-white transition-colors hover:text-warning-orange py-2 px-3 rounded-md hover:bg-ash-white/5"
                                    >
                                        {link.name}
                                    </a>
                                ))}
                            </nav>

                            {/* User Section */}
                            {profile ? (
                                <div className="flex flex-col gap-4">
                                    <h3 className="font-pixel-heading text-sm text-ash-white/60 uppercase tracking-wider">Account</h3>

                                    {/* User Info Card */}
                                    <div className="rounded-lg border-2 border-ash-white/20 bg-black/50 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Icon type="user" className="h-5 w-5 text-warning-orange" />
                                            <span className="font-pixel-heading text-base text-ash-white">{profile.username}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Icon type="coin-stack" className="h-5 w-5 text-yellow-400" />
                                            <span className="font-pixel-heading text-base text-yellow-400">{profile.coins || 0} SLURP</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            onClick={() => handleMobileAction(onProfileClick!)}
                                            className="w-full justify-start"
                                        >
                                            <Icon type="user" className="mr-2 h-5 w-5" />
                                            Profile Settings
                                        </Button>

                                        {onShopClick && (
                                            <Button
                                                variant="secondary"
                                                size="lg"
                                                onClick={() => handleMobileAction(onShopClick)}
                                                className="w-full justify-start"
                                            >
                                                <Icon type="shop" className="mr-2 h-5 w-5" />
                                                Shop
                                            </Button>
                                        )}

                                        {isAdmin && onAdminClick && (
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={() => handleMobileAction(onAdminClick)}
                                                className="w-full justify-start bg-green-600 hover:bg-green-500"
                                            >
                                                🔐 Admin Panel
                                            </Button>
                                        )}

                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => handleMobileAction(signOut)}
                                            className="w-full justify-start"
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <h3 className="font-pixel-heading text-sm text-ash-white/60 uppercase tracking-wider">Account</h3>

                                    {/* Contract Address Card */}
                                    {CONFIG.TOKEN_CONTRACT_ADDRESS && (
                                        <div className="rounded-lg border-2 border-ash-white/20 bg-black/50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-pixel-heading text-xs text-ash-white/60 mb-1">Contract Address</div>
                                                    <div className="font-mono text-sm text-ash-white">{shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)}</div>
                                                </div>
                                                <button
                                                    onClick={handleCopy}
                                                    className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-ash-white/20 bg-black/50 text-ash-white/60 transition-colors hover:border-warning-orange/50 hover:text-warning-orange"
                                                    aria-label="Copy contract address"
                                                >
                                                    {isCopied ? <Icon type="check" className="h-5 w-5 text-green-400" /> : <Icon type="copy" className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Login Button */}
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={() => handleMobileAction(onAuthClick)}
                                        className="w-full"
                                    >
                                        Login / Sign Up
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;