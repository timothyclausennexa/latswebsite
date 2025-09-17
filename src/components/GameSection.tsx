import React, { useState, useRef } from 'react';
import CellBreakGameFixed from './CellBreakGameFixed';
import RealLeaderboard, { LeaderboardRef } from './RealLeaderboard';
import DailyMissions from './DailyMissions';
import FunctionalAuthModal from './FunctionalAuthModal';
import FunctionalShop from './FunctionalShop';

const GameSection: React.FC = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const leaderboardRef = useRef<LeaderboardRef>(null);

    const handleGameEnd = () => {
        console.log('🎮 GameSection: handleGameEnd called, refreshing leaderboard...');
        leaderboardRef.current?.refreshLeaderboard();
    };
    return (
        <section id="cell-break" className="relative border-y-4 border-prison-black bg-prison-dark py-16 sm:py-24">
            <div className="absolute inset-0 bg-[url('/img/grid-bg.png')] bg-repeat opacity-10" />
            <div className="container relative mx-auto px-4">
                <div className="text-center">
                     <h2 className="font-pixel-heading text-2xl uppercase text-ash-white sm:text-3xl lg:text-4xl">
                        CELL BREAK: THE GAME
                    </h2>
                    <p className="mx-auto mt-2 max-w-2xl font-body text-ash-white/70">
                        He's not the only one trapped. Play our mini-game to climb the leaderboard, complete missions, and earn Escape Points (EP) for cosmetic upgrades.
                    </p>
                </div>


                {/* Game takes full width at the top */}
                <div className="mt-12">
                    <CellBreakGameFixed
                        onAuthClick={() => setShowAuthModal(true)}
                        onOpenShop={() => setShowShop(true)}
                        onGameEnd={handleGameEnd}
                    />
                </div>

                {/* Leaderboard and Missions below in a grid */}
                <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
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
