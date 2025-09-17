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

    // Check if link is embeddable (YouTube, Twitch, Kick, etc)
    const isEmbeddableStream = (url: string | null): boolean => {
        if (!url) return false;
        // These platforms allow embedding
        const embeddablePatterns = [
            /youtube\.com/i,
            /youtu\.be/i,
            /twitch\.tv/i,
            /kick\.com/i,
            /vimeo\.com/i
        ];
        return embeddablePatterns.some(pattern => pattern.test(url));
    };

    const canEmbed = isLive && isEmbeddableStream(CONFIG.LIVE_STREAM_LINK);

    return (
        <div className="relative aspect-video w-full border-2 border-ash-white/20 bg-prison-black shadow-pixel-lg">
            {isLive ? (
                <>
                    {canEmbed ? (
                        // Only show iframe for embeddable streams (YouTube, Twitch, etc)
                        <iframe
                            src={CONFIG.LIVE_STREAM_LINK!}
                            title="Lats Live Stream"
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        // For non-embeddable links (like pump.fun), show a click-to-open interface
                        <div className="flex h-full w-full flex-col items-center justify-center bg-black p-4">
                            <div className="text-center font-pixel-heading">
                                <div className="flex items-center justify-center mb-4">
                                    <span className="relative flex h-4 w-4">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
                                    </span>
                                    <span className="ml-3 text-2xl text-alarm-red">LIVE NOW</span>
                                </div>
                                <p className="text-xl text-ash-white mb-2">
                                    Stream is LIVE!
                                </p>
                                <p className="text-ash-white/70 mb-6">
                                    Click below to watch on external platform
                                </p>
                                <button
                                    onClick={handleStreamClick}
                                    className="bg-alarm-red hover:bg-red-600 text-black px-8 py-4 rounded font-pixel-heading text-lg uppercase transition-all hover:scale-105 shadow-lg"
                                >
                                    🔴 WATCH STREAM NOW
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Buy button overlay for when stream is live */}
                    {hasPumpLink && (
                        <button
                            onClick={handleBuyClick}
                            className="absolute top-2 left-2 flex items-center gap-2 rounded bg-green-500 hover:bg-green-600 px-3 py-1.5 font-pixel-heading text-xs text-black shadow-md sm:text-sm transition-all hover:scale-105 cursor-pointer"
                            style={{ zIndex: 10 }}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                            </span>
                            BUY $LATS NOW
                        </button>
                    )}
                </>
            ) : (
                // Stream offline state
                <div className="flex h-full w-full flex-col items-center justify-center bg-black p-4">
                    <div className="text-center font-pixel-heading">
                        <p className="text-3xl text-alarm-red">// STREAM OFFLINE</p>
                        <p className="mt-2 text-ash-white/70">
                            Awaiting launch sequence.
                        </p>
                        <p className="mt-1 text-ash-white/70">
                            The cell will be opened soon.
                        </p>
                        {hasPumpLink && (
                            <button
                                onClick={handleBuyClick}
                                className="mt-6 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-pixel-heading text-sm uppercase transition-all hover:scale-105 shadow-lg"
                            >
                                🚀 BUY $LATS ON PUMP.FUN
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreamHighlight;