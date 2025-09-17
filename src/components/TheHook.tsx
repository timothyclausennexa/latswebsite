import React from 'react';
import StreamHighlight from './StreamHighlight';
import LiveEventFeed from './LiveEventFeed';
import SentenceCalculator from './SentenceCalculator';
import { Button } from './ui/Button';
import { useConfig } from '../hooks/useConfig';


const TheHook: React.FC = () => {
    const CONFIG = useConfig();
    return (
        <section className="relative overflow-hidden border-b-4 border-black bg-gray-900 py-8 sm:py-12 md:py-16">
             <div className="absolute inset-0 bg-[url('/img/stream-bg.png')] bg-cover bg-center opacity-10" />
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
            <div className="container relative mx-auto px-3 sm:px-4">
                <div className="text-center">
                    <div className="mb-3 sm:mb-4">
                        <span className="inline-block px-2 py-1 sm:px-4 sm:py-1 bg-yellow-500/20 border border-yellow-500 rounded-full">
                            <span className="font-pixel-heading text-xs sm:text-sm text-yellow-400 animate-pulse">
                                🔥 FIRST MEMECOIN WITH REAL HUMAN STAKES 🔥
                            </span>
                        </span>
                    </div>
                    <h1 className="font-pixel-heading text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl uppercase text-ash-white leading-tight">
                        <span className="text-green-400 block xs:inline">10,000X POTENTIAL</span> <span className="block xs:inline">MEETS</span> <span className="text-alarm-red block xs:inline">LIVE CHAOS</span>
                    </h1>
                    <p className="mt-2 sm:mt-3 font-pixel-heading text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-yellow-400 animate-pulse px-2 leading-tight">
                        EVERY $LATS YOU BUY = MORE STREAM TIME = MORE VIRAL MOMENTS
                    </p>
                    <p className="mt-2 font-pixel-heading text-xs xs:text-sm sm:text-base md:text-lg text-ash-white/90 px-2">
                        I'M STUCK STREAMING 24/7 UNTIL THE TIMER HITS ZERO
                    </p>
                    <p className="mt-1 font-pixel-heading text-xs sm:text-sm md:text-base text-green-400 px-2">
                        💎 EARLY BUYERS CONTROL MY FATE = MASSIVE GAINS 💎
                    </p>
                </div>

                <div className="my-6 sm:my-8 text-center">
                    <h2 className="font-pixel-heading text-sm xs:text-base sm:text-lg md:text-xl uppercase text-warning-orange animate-pulse px-2">
                        ⚠️ STREAM TIMER - MY DIGITAL PRISON ⚠️
                    </h2>
                    <div className="font-pixel-timer text-alarm-red text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mt-2">
                        100,000
                        <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl block xs:inline"> HOURS</span>
                    </div>
                    <p className="mt-2 font-body text-xs sm:text-sm text-ash-white/70 px-2">
                        That's 11+ YEARS of non-stop streaming... unless YOU change it
                    </p>

                    <div className="mt-3 sm:mt-4 flex justify-center gap-2 sm:gap-4 flex-wrap px-2">
                        <div className="px-2 py-1 sm:px-3 sm:py-1 bg-green-500/10 border border-green-500 rounded">
                            <span className="font-pixel-heading text-xs text-green-400">📈 MARKET CAP: GROWING</span>
                        </div>
                        <div className="px-2 py-1 sm:px-3 sm:py-1 bg-yellow-500/10 border border-yellow-500 rounded">
                            <span className="font-pixel-heading text-xs text-yellow-400">🔥 HOLDERS: MULTIPLYING</span>
                        </div>
                        <div className="px-2 py-1 sm:px-3 sm:py-1 bg-red-500/10 border border-red-500 rounded animate-pulse">
                            <span className="font-pixel-heading text-xs text-red-400">⏰ TIME: NOW OR NEVER</span>
                        </div>
                    </div>

                     <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 px-3">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank', 'noopener,noreferrer')}
                            disabled={!CONFIG.PUMP_FUN_LINK}
                            className="animate-pulse shadow-green-400/40 bg-green-600 hover:bg-green-500 text-black font-bold w-full text-sm sm:text-base min-h-[48px] touch-manipulation"
                        >
                            🚀 BUY $LATS NOW - GET IN EARLY 🚀
                        </Button>
                        <div>
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => CONFIG.LIVE_STREAM_LINK && window.open(CONFIG.LIVE_STREAM_LINK, '_blank', 'noopener,noreferrer')}
                                disabled={!CONFIG.LIVE_STREAM_LINK}
                                tooltip="Stream is not live yet"
                                className="shadow-alarm-red/20 w-full sm:w-auto text-sm sm:text-base min-h-[44px] touch-manipulation"
                            >
                                📺 WATCH THE MADNESS LIVE
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 mt-6 sm:mt-8">
                    <div className="lg:col-span-2">
                        <StreamHighlight />
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                        <LiveEventFeed />
                        <SentenceCalculator />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TheHook;