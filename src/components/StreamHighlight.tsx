import React from 'react';
import { Icon } from './ui/Icon';
import { useConfig } from '../hooks/useConfig';

const StreamHighlight: React.FC = () => {
    const CONFIG = useConfig();
    const isLive = !!CONFIG.LIVE_STREAM_LINK;
    const hasPumpLink = !!CONFIG.PUMP_FUN_LINK;

    const handleStreamClick = () => {
        if (CONFIG.LIVE_STREAM_LINK) {
            window.open(CONFIG.LIVE_STREAM_LINK, '_blank', 'noopener,noreferrer');
        }
    };

    const handleBuyClick = () => {
        if (CONFIG.PUMP_FUN_LINK) {
            window.open(CONFIG.PUMP_FUN_LINK, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="relative aspect-video w-full border-2 border-ash-white/20 bg-prison-black shadow-pixel-lg overflow-hidden">
            {isLive ? (
                // Always show click-to-open interface for all links (no more iframes)
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black p-4">
                    <div className="text-center font-pixel-heading">
                        {/* Animated live indicator */}
                        <div className="flex items-center justify-center mb-6">
                            <span className="relative flex h-6 w-6">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex h-6 w-6 rounded-full bg-red-500 animate-pulse"></span>
                            </span>
                            <span className="ml-4 text-3xl text-alarm-red uppercase tracking-wider animate-pulse">
                                LIVE NOW
                            </span>
                        </div>

                        <p className="text-2xl text-ash-white mb-3">
                            The Stream is ACTIVE!
                        </p>
                        <p className="text-ash-white/70 mb-8 max-w-md mx-auto">
                            Click below to watch the 24/7 stream on external platform
                        </p>

                        {/* Main stream button */}
                        <button
                            onClick={handleStreamClick}
                            className="bg-alarm-red hover:bg-red-600 text-black px-10 py-5 rounded-lg font-pixel-heading text-xl uppercase transition-all hover:scale-105 shadow-2xl mb-4 animate-pulse"
                        >
                            🔴 WATCH STREAM NOW
                        </button>

                        {/* Buy button if pump link exists */}
                        {hasPumpLink && (
                            <div className="mt-6">
                                <p className="text-ash-white/60 mb-3 text-sm">Or get $LATS now:</p>
                                <button
                                    onClick={handleBuyClick}
                                    className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 rounded font-pixel-heading text-sm uppercase transition-all hover:scale-105 shadow-lg"
                                >
                                    🚀 BUY $LATS ON PUMP.FUN
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Corner indicators */}
                    <div className="absolute top-4 left-4">
                        <div className="bg-alarm-red/20 border border-alarm-red rounded px-3 py-1">
                            <span className="text-alarm-red font-pixel-heading text-xs">24/7 STREAM</span>
                        </div>
                    </div>
                </div>
            ) : (
                // Stream offline state
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black p-4">
                    <div className="text-center font-pixel-heading">
                        <p className="text-3xl text-alarm-red mb-4">// STREAM OFFLINE</p>
                        <p className="text-ash-white/70 mb-2">
                            Awaiting launch sequence.
                        </p>
                        <p className="text-ash-white/70 mb-8">
                            The cell will be opened soon.
                        </p>

                        {hasPumpLink && (
                            <>
                                <p className="text-ash-white/60 mb-3 text-sm">Get ready for launch:</p>
                                <button
                                    onClick={handleBuyClick}
                                    className="bg-green-500 hover:bg-green-600 text-black px-8 py-4 rounded-lg font-pixel-heading text-base uppercase transition-all hover:scale-105 shadow-lg"
                                >
                                    🚀 BUY $LATS ON PUMP.FUN
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreamHighlight;