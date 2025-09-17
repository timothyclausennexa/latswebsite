import React, { useState } from 'react';
import { MOCK_FIGHTERS, MOCK_WARDENS } from '../constants';
import { CONFIG } from '../config';
import { LeaderboardEntry } from '../types';
import { shortCA } from '../utils/helpers';
import { Button } from './ui/Button';

// --- Sub-components ---

const LeaderboardTable: React.FC<{ data: LeaderboardEntry[] }> = ({ data }) => (
    <div className="border-2 border-ash-white/20 bg-prison-black/30 p-3 sm:p-4 shadow-pixel-lg overflow-hidden">
        {/* Mobile-optimized header */}
        <div className="hidden sm:flex border-b-2 border-ash-white/30 pb-2 font-pixel-heading text-sm text-warning-orange">
            <div className="w-1/6 text-center">RANK</div>
            <div className="w-3/6">ADDRESS</div>
            <div className="w-2/6 text-right">±HOURS</div>
        </div>

        {/* Mobile header */}
        <div className="flex sm:hidden border-b-2 border-ash-white/30 pb-2 font-pixel-heading text-xs text-warning-orange">
            <div className="w-1/5 text-center">#</div>
            <div className="w-2/5">ADDRESS</div>
            <div className="w-2/5 text-right">±HOURS</div>
        </div>

        <ul className="mt-2 space-y-1">
            {data.map((entry) => (
                <li
                    key={entry.rank}
                    className={`flex items-center rounded p-2 font-body text-ash-white transition-colors ${
                        entry.isCurrentUser ? 'bg-warning-orange/20' : ''
                    } ${entry.amount > 0 ? 'text-alarm-red' : 'text-ash-white'}`}
                >
                    {/* Desktop layout */}
                    <div className="hidden sm:flex w-full items-center">
                        <div className="w-1/6 text-center font-pixel-timer text-lg">{entry.rank}</div>
                        <div className="w-3/6 font-mono text-sm truncate pr-2">{shortCA(entry.address)}</div>
                        <div className="w-2/6 text-right font-pixel-timer text-lg">
                            {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(1)}h
                        </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex sm:hidden w-full items-center">
                        <div className="w-1/5 text-center font-pixel-timer text-sm">{entry.rank}</div>
                        <div className="w-2/5 font-mono text-xs truncate pr-1">{shortCA(entry.address)}</div>
                        <div className="w-2/5 text-right font-pixel-timer text-sm">
                            {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(1)}h
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`font-pixel-heading border-2 px-3 py-2 text-xs transition-all touch-manipulation min-h-[44px] flex items-center justify-center sm:px-4 sm:py-3 sm:text-sm lg:px-6 lg:text-base ${
            active
                ? 'border-alarm-red bg-alarm-red text-prison-black shadow-pixel-md'
                : 'border-ash-white/30 bg-prison-black text-ash-white/70 active:bg-ash-white/20 hover:bg-ash-white/10'
        }`}
    >
        {children}
    </button>
);


// --- Main Component ---

const Leaderboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'guards' | 'fighters'>('guards');

    const holderExplorerUrl = `https://birdeye.so/token/${CONFIG.TOKEN_CONTRACT_ADDRESS || 'So11111111111111111111111111111111111111112'}?chain=solana`;

    return (
        <section id="leaderboard" className="py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <h2 className="text-center font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                    COMMUNITY LEADERS
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-center font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed">
                    The inmates who define the sentence. Will you be a Guard or a Freedom Fighter?
                </p>

                <div className="mt-8 sm:mt-10 flex justify-center gap-1 sm:gap-2">
                    <TabButton active={activeTab === 'guards'} onClick={() => setActiveTab('guards')}>
                        <span className="hidden sm:inline">Prison Guards</span>
                        <span className="sm:hidden">Guards</span>
                    </TabButton>
                    <TabButton active={activeTab === 'fighters'} onClick={() => setActiveTab('fighters')}>
                        <span className="hidden sm:inline">Freedom Fighters</span>
                        <span className="sm:hidden">Fighters</span>
                    </TabButton>
                </div>

                <div className="mx-auto mt-6 max-w-none sm:max-w-2xl overflow-x-auto">
                    {activeTab === 'guards' ? (
                        <LeaderboardTable data={MOCK_WARDENS} />
                    ) : (
                        <LeaderboardTable data={MOCK_FIGHTERS} />
                    )}
                </div>

                <div className="mt-6 sm:mt-8 text-center">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => window.open(holderExplorerUrl, '_blank', 'noopener,noreferrer')}
                        disabled={!CONFIG.TOKEN_CONTRACT_ADDRESS || !CONFIG.TOKEN_LOCKED}
                        tooltip="View all token holders on Birdeye (available at launch)"
                    >
                        <span className="hidden sm:inline">See Live Holder Amounts</span>
                        <span className="sm:hidden">View Live Holdings</span>
                    </Button>
                </div>

            </div>
        </section>
    );
};

export default Leaderboard;
