import React, { useState, useMemo } from 'react';

const GOALS = [
    { marketCap: '$1B MCAP' },
    { marketCap: '$3B MCAP' },
    { marketCap: '$8B MCAP' },
    { marketCap: '$10B MCAP' },
    { marketCap: '$100B MCAP' },
    { marketCap: '$1T MCAP' },
];

const parseMarketCap = (mcStr: string): number => {
    const numPart = parseFloat(mcStr.replace(/[^0-9.]/g, ''));
    if (mcStr.toUpperCase().includes('T')) return numPart * 1e12;
    if (mcStr.toUpperCase().includes('B')) return numPart * 1e9;
    if (mcStr.toUpperCase().includes('M')) return numPart * 1e6;
    if (mcStr.toUpperCase().includes('K')) return numPart * 1e3;
    return numPart;
};

const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1).replace('.0', '')}T+`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1).replace('.0', '')}B+`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1).replace('.0', '')}M+`;
    if (value >= 1e3) return `$${(value / 1e3).toLocaleString('en-US', { maximumFractionDigits: 0 })}K+`;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};


const HighStakes: React.FC = () => {
    const [goalIndex, setGoalIndex] = useState(0);

    const handleNextGoal = () => setGoalIndex((prev) => (prev + 1) % GOALS.length);
    const handlePrevGoal = () => setGoalIndex((prev) => (prev - 1 + GOALS.length) % GOALS.length);

    const calculation = useMemo(() => {
        const INITIAL_STAKE = 1000;
        const targetMc = parseMarketCap(GOALS[goalIndex].marketCap);
        // We now assume a fixed entry point for simplicity and impact.
        // Using $1M as the baseline for a "sub-1M" entry calculation.
        const entryMc = 1_000_000;
        
        if (targetMc <= entryMc) {
            return { multiplier: '0x', returnValue: `$${INITIAL_STAKE}` };
        }

        const multiplier = targetMc / entryMc;
        const returnValue = INITIAL_STAKE * multiplier;

        return {
            multiplier: `${multiplier.toLocaleString('en-US', { maximumFractionDigits: 0 })}x`,
            returnValue: formatCurrency(returnValue)
        };
    }, [goalIndex]);

    return (
        <section id="high-stakes" className="py-8 sm:py-12 md:py-16 lg:py-24">
            <div className="container mx-auto px-3 sm:px-4">
                <div className="mx-auto max-w-3xl border-2 border-green-400/50 bg-gradient-to-br from-green-900/20 to-yellow-900/20 p-4 sm:p-6 md:p-8 text-center shadow-pixel-lg shadow-green-400/30 animate-pulse-slow">
                    <h2 className="font-pixel-heading text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase text-green-400 animate-pulse leading-tight">
                        💰 YOUR LAMBO CALCULATOR 💰
                    </h2>
                    <p className="mt-2 font-body text-yellow-400 text-sm xs:text-base sm:text-lg font-bold px-2">See what happens when you get in EARLY on the next <span className="text-green-400 animate-pulse">10,000X MOONSHOT!</span></p>

                    <div className="mt-4 sm:mt-6 md:mt-8 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 items-center gap-2 sm:gap-4 md:grid-cols-2">
                            <div className="font-pixel-heading text-sm sm:text-base md:text-lg text-ash-white/80 md:text-right">INITIAL STAKE:</div>
                            <div className="font-pixel-timer text-2xl sm:text-3xl md:text-4xl text-ash-white md:text-left">
                                $1,000
                            </div>
                        </div>

                         <div className="grid grid-cols-1 items-center gap-2 sm:gap-4 md:grid-cols-2">
                            <div className="font-pixel-heading text-sm sm:text-base md:text-lg text-ash-white/80 md:text-right">ASSUMED ENTRY:</div>
                            <div className="font-pixel-timer text-2xl sm:text-3xl md:text-4xl text-ash-white md:text-left">
                                &lt; $1M MCAP
                            </div>
                        </div>
                        
                        <div className="my-4 border-t-2 border-dashed border-ash-white/20"></div>
                        
                        {/* --- Interactive Goal Carousel --- */}
                        <div className="grid grid-cols-1 items-center gap-2 sm:gap-4 md:grid-cols-2">
                            <div className="font-pixel-heading text-sm sm:text-base md:text-lg text-warning-orange md:text-right">PROJECT GOAL:</div>
                            <div className="flex items-center justify-center gap-1 sm:gap-2 md:justify-start">
                                <button
                                    onClick={handlePrevGoal}
                                    aria-label="Previous goal"
                                    className="px-2 py-1 font-pixel-heading text-xl sm:text-2xl text-warning-orange/50 transition-colors hover:text-warning-orange touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                                >
                                    &lt;
                                </button>
                                <div className="font-pixel-timer w-32 sm:w-40 md:w-48 text-2xl sm:text-3xl md:text-4xl text-warning-orange text-center">
                                    {GOALS[goalIndex].marketCap}
                                </div>
                                <button
                                    onClick={handleNextGoal}
                                    aria-label="Next goal"
                                    className="px-2 py-1 font-pixel-heading text-xl sm:text-2xl text-warning-orange/50 transition-colors hover:text-warning-orange touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-4 sm:mt-6 rounded bg-alarm-red/10 p-3 sm:p-4">
                             <p className="font-pixel-heading text-sm sm:text-base md:text-lg text-ash-white">POTENTIAL MULTIPLIER:</p>
                             <p key={`${goalIndex}-multiplier`} className="font-pixel-timer text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-warning-orange">
                                {calculation.multiplier}
                            </p>
                             <p className="mt-3 sm:mt-4 font-pixel-heading text-sm sm:text-base md:text-lg text-ash-white">TURNS $1K INTO:</p>
                             <p key={`${goalIndex}-return`} className="font-pixel-timer animate-pulse text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-alarm-red">
                                {calculation.returnValue}
                            </p>
                        </div>
                    </div>

                    <p className="mt-6 sm:mt-8 font-body text-xs sm:text-sm text-ash-white/60 px-2">
                        Cycle through the goals to see the potential. Low market cap entries on pump.fun can lead to legendary returns, but the risk is total. The bold may be rewarded. NFA.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default HighStakes;