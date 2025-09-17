import React, { useState, useRef, useEffect } from 'react';
import CellBreakGameFixed from './CellBreakGameFixed';
import MobileCellBreakGame from './MobileCellBreakGame';
import RealLeaderboard, { LeaderboardRef } from './RealLeaderboard';
import DailyMissions from './DailyMissions';
import FunctionalAuthModal from './FunctionalAuthModal';
import FunctionalShop from './FunctionalShop';
import MobileGameWarning from './MobileGameWarning';

const GameSection: React.FC = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const leaderboardRef = useRef<LeaderboardRef>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // sm breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleGameEnd = () => {
        console.log('🎮 GameSection: handleGameEnd called, refreshing leaderboard...');
        leaderboardRef.current?.refreshLeaderboard();
    };
    return (
        <section id="cell-break" className="relative border-y-4 border-prison-black bg-prison-dark py-12 sm:py-16 lg:py-24">
            <div className="absolute inset-0 bg-[url('/img/grid-bg.png')] bg-repeat opacity-10" />
            <div className="container relative mx-auto px-4 sm:px-6">
                <div className="text-center">
                     <h2 className="font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                        CELL BREAK: THE GAME
                    </h2>
                    <p className="mx-auto mt-2 max-w-2xl font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed">
                        He's not the only one trapped. Play our mini-game to climb the leaderboard, complete missions, and earn Escape Points (EP) for cosmetic upgrades.
                    </p>
                    {isMobile && (
                        <div className="mx-auto mt-4 max-w-md rounded-lg border border-warning-orange/30 bg-warning-orange/10 p-3">
                            <p className="font-body text-xs text-warning-orange font-medium">
                                📱 For the best gaming experience, visit this site on desktop/web browser
                            </p>
                        </div>
                    )}
                </div>

                {/* Game for desktop only */}
                {isMobile ? (
                    <div className="mt-8 sm:mt-12 relative">
                        <div className="bg-black/50 border-2 border-warning-orange/50 rounded-lg p-8 text-center">
                            <h3 className="text-xl font-pixel-heading text-warning-orange mb-4">
                                🎮 DESKTOP ONLY GAME
                            </h3>
                            <p className="text-ash-white/80 mb-6">
                                Cell Break requires keyboard and mouse controls.
                                Please visit on a desktop computer to play.
                            </p>
                            <div className="text-sm text-ash-white/60">
                                <p>✓ Full keyboard controls</p>
                                <p>✓ Precise mouse aim</p>
                                <p>✓ Better performance</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 sm:mt-12 relative">
                        <CellBreakGameFixed
                            onAuthClick={() => setShowAuthModal(true)}
                            onOpenShop={() => setShowShop(true)}
                            onGameEnd={handleGameEnd}
                        />
                    </div>
                )}

                {/* Leaderboard and Missions below in a grid */}
                <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
                    <RealLeaderboard ref={leaderboardRef} />
                    <DailyMissions />
                </div>
            </div>

            {/* Modals */}
            <FunctionalAuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
            <FunctionalShop
                isOpen={showShop}
                onClose={() => setShowShop(false)}
            />
        </section>
    );
};

export default GameSection;
