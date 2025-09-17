import React from 'react';
import StreamHighlight from './StreamHighlight';
import LiveEventFeed from './LiveEventFeed';
import SentenceCalculator from './SentenceCalculator';
import { Button } from './ui/Button';
import { useConfig } from '../hooks/useConfig';


const TheHook: React.FC = () => {
    const CONFIG = useConfig();
    return (
        <section className="relative overflow-hidden border-b-4 border-black bg-gray-900 py-12 sm:py-16">
             <div className="absolute inset-0 bg-[url('/img/stream-bg.png')] bg-cover bg-center opacity-10" />
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
            <div className="container relative mx-auto px-4">
                <div className="text-center">
                    <div className="mb-4">
                        <span className="inline-block px-4 py-1 bg-yellow-500/20 border border-yellow-500 rounded-full">
                            <span className="font-pixel-heading text-sm text-yellow-400 animate-pulse">
                                🔥 FIRST MEMECOIN WITH REAL HUMAN STAKES 🔥
                            </span>
                        </span>
                    </div>
                    <h1 className="font-pixel-heading text-3xl uppercase text-ash-white sm:text-4xl lg:text-5xl">
                        <span className="text-green-400">10,000X POTENTIAL</span> MEETS <span className="text-alarm-red">LIVE CHAOS</span>
                    </h1>
                    <p className="mt-3 font-pixel-heading text-xl text-yellow-400 sm:text-2xl animate-pulse">
                        EVERY $LATS YOU BUY = MORE STREAM TIME = MORE VIRAL MOMENTS
                    </p>
                    <p className="mt-2 font-pixel-heading text-base text-ash-white/90 sm:text-lg">
                        I'M STUCK STREAMING 24/7 UNTIL THE TIMER HITS ZERO
                    </p>
                    <p className="mt-1 font-pixel-heading text-sm text-green-400 sm:text-base">
                        💎 EARLY BUYERS CONTROL MY FATE = MASSIVE GAINS 💎
                    </p>
                </div>

                <div className="my-8 text-center">
                    <h2 className="font-pixel-heading text-xl uppercase text-warning-orange animate-pulse">
                        ⚠️ STREAM TIMER - MY DIGITAL PRISON ⚠️
                    </h2>
                    <div className="font-pixel-timer text-alarm-red text-6xl sm:text-7xl lg:text-8xl">
                        100,000
                        <span className="text-4xl sm:text-5xl lg:text-6xl"> HOURS</span>
                    </div>
                    <p className="mt-2 font-body text-sm text-ash-white/70">
                        That's 11+ YEARS of non-stop streaming... unless YOU change it
                    </p>

                    <div className="mt-4 flex justify-center gap-4 flex-wrap">
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500 rounded">
                            <span className="font-pixel-heading text-xs text-green-400">📈 MARKET CAP: GROWING</span>
                        </div>
                        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500 rounded">
                            <span className="font-pixel-heading text-xs text-yellow-400">🔥 HOLDERS: MULTIPLYING</span>
                        </div>
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500 rounded animate-pulse">
                            <span className="font-pixel-heading text-xs text-red-400">⏰ TIME: NOW OR NEVER</span>
                        </div>
                    </div>

                     <div className="mt-6 space-y-3">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank', 'noopener,noreferrer')}
                            disabled={!CONFIG.PUMP_FUN_LINK}
                            className="animate-pulse shadow-green-400/40 bg-green-600 hover:bg-green-500 text-black font-bold w-full sm:w-auto"
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
                                className="shadow-alarm-red/20"
                            >
                                📺 WATCH THE MADNESS LIVE
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <StreamHighlight />
                    </div>
                    <div className="space-y-6">
                        <LiveEventFeed />
                        <SentenceCalculator />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TheHook;