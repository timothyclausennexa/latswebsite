import React from 'react';
import { Icon } from './ui/Icon';
import { useConfig } from '../hooks/useConfig';

const StreamHighlight: React.FC = () => {
    const CONFIG = useConfig();
    const isLive = !!CONFIG.LIVE_STREAM_LINK;
    const hasPumpLink = !!CONFIG.PUMP_FUN_LINK;

    const handleLiveClick = () => {
        if (hasPumpLink) {
            window.open(CONFIG.PUMP_FUN_LINK!, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="relative aspect-video w-full border-2 border-ash-white/20 bg-prison-black shadow-pixel-lg">
            {isLive ? (
                <>
                    <iframe
                        src={CONFIG.LIVE_STREAM_LINK!}
                        title="Lats Live Stream"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    {hasPumpLink && (
                        <button
                            onClick={handleLiveClick}
                            className="absolute top-2 left-2 flex items-center gap-2 rounded bg-alarm-red hover:bg-red-600 px-3 py-1.5 font-pixel-heading text-xs text-prison-black shadow-md sm:text-sm transition-all hover:scale-105 cursor-pointer"
                            style={{ zIndex: 10 }}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                            </span>
                            BUY $LATS LIVE
                        </button>
                    )}
                </>
            ) : (
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
                                onClick={handleLiveClick}
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