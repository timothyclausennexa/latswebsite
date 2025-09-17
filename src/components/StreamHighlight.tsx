
import React from 'react';
import { Icon } from './ui/Icon';
import { CONFIG } from '../config';

const StreamHighlight: React.FC = () => {
    const isLive = !!CONFIG.LIVE_STREAM_LINK;

    return (
        <div className="relative aspect-video w-full border-2 border-ash-white/20 bg-prison-black shadow-pixel-lg">
            {isLive ? (
                 <iframe
                    src={CONFIG.LIVE_STREAM_LINK!}
                    title="Lats Live Stream"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
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
                    </div>
                </div>
            )}
             <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-2 rounded bg-alarm-red px-2 py-1 font-pixel-heading text-xs text-prison-black shadow-md sm:text-sm">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                </span>
                LIVE
            </div>
        </div>
    );
};

export default StreamHighlight;
