import React from 'react';
import { useConfig } from '../hooks/useConfig';

const PixelatedHero: React.FC = () => {
    const CONFIG = useConfig();

    return (
        <section className="relative min-h-screen bg-black overflow-hidden">
            {/* Pixelated grid background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, #fbbf24 0, #fbbf24 2px, transparent 2px, transparent 20px),
                                        repeating-linear-gradient(90deg, #fbbf24 0, #fbbf24 2px, transparent 2px, transparent 20px)`
                    }}
                />
            </div>

            {/* Blocky decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 pixel-shadow"></div>
                <div className="absolute top-32 right-20 w-32 h-32 bg-orange-400/20 pixel-shadow"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-yellow-400/20 pixel-shadow"></div>
                <div className="absolute bottom-40 right-10 w-16 h-16 bg-orange-400/20 pixel-shadow"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-4 py-20 flex items-center justify-center min-h-screen">
                <div className="text-center max-w-4xl">
                    {/* Pixelated Badge */}
                    <div className="mb-8 inline-block">
                        <div className="
                            px-6 py-3 bg-black
                            border-3 border-yellow-400
                            pixel-shadow animate-pixel-blink
                        ">
                            <span className="font-pixel-heading text-sm sm:text-base text-yellow-400">
                                MAYO TIMER ACTIVE
                            </span>
                        </div>
                    </div>

                    {/* Main Title - Blocky pixelated */}
                    <div className="mb-8">
                        <h1 className="font-pixel-heading leading-none mb-4">
                            <span className="
                                block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
                                text-yellow-400 pixel-text-lg
                            ">
                                MAYO MEN
                            </span>
                            <span className="
                                block text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-4
                                text-white pixel-text
                            ">
                                PIXELATED CHAOS
                            </span>
                        </h1>
                    </div>

                    {/* Stats Blocks - Hard edges */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                        <div className="
                            p-6 bg-black border-3 border-yellow-400
                            pixel-shadow hover:translate-x-1 hover:translate-y-1
                            hover:shadow-none transition-transform
                        ">
                            <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">
                                100 HRS
                            </div>
                            <div className="text-xs text-white uppercase">Start Timer</div>
                        </div>
                        <div className="
                            p-6 bg-black border-3 border-green-400
                            pixel-shadow hover:translate-x-1 hover:translate-y-1
                            hover:shadow-none transition-transform
                        ">
                            <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                                +2 HRS
                            </div>
                            <div className="text-xs text-white uppercase">Per Buy</div>
                        </div>
                        <div className="
                            p-6 bg-black border-3 border-red-400
                            pixel-shadow hover:translate-x-1 hover:translate-y-1
                            hover:shadow-none transition-transform
                        ">
                            <div className="text-3xl sm:text-4xl font-bold text-red-400 mb-2">
                                -0.5 HRS
                            </div>
                            <div className="text-xs text-white uppercase">Per Sell</div>
                        </div>
                    </div>

                    {/* Description - Pixelated box */}
                    <div className="mb-8 p-6 bg-black border-3 border-white/50 pixel-shadow-sm max-w-3xl mx-auto">
                        <p className="font-pixel-heading text-sm sm:text-base text-white leading-relaxed">
                            I'M TRAPPED IN MAYO CHALLENGES! YOUR TRADES CONTROL THE TIMER!
                            EVERY MILESTONE = MORE MAYO! AT $1B WE LAUNCH MAYO MEN BRAND!
                        </p>
                    </div>

                    {/* CTA Buttons - Blocky pixelated */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank')}
                            disabled={!CONFIG.PUMP_FUN_LINK}
                            className="
                                group px-8 py-4 text-base font-pixel-heading font-bold
                                bg-green-400 text-black border-4 border-black
                                pixel-shadow-lg hover:translate-x-2 hover:translate-y-2
                                hover:shadow-none transition-transform
                                animate-pixel-blink
                            "
                        >
                            <span className="flex items-center gap-2">
                                <span>🚀</span>
                                BUY $MAYOMEN NOW
                                <span>🚀</span>
                            </span>
                        </button>

                        <button
                            onClick={() => CONFIG.LIVE_STREAM_LINK && window.open(CONFIG.LIVE_STREAM_LINK, '_blank')}
                            disabled={!CONFIG.LIVE_STREAM_LINK}
                            className="
                                px-8 py-4 text-base font-pixel-heading font-bold
                                bg-black text-yellow-400 border-4 border-yellow-400
                                pixel-shadow hover:translate-x-1 hover:translate-y-1
                                hover:shadow-none transition-transform
                                hover:bg-yellow-400 hover:text-black
                            "
                        >
                            <span className="flex items-center gap-2">
                                <span>📺</span>
                                WATCH STREAM
                            </span>
                        </button>
                    </div>

                    {/* Live Status - Pixelated ticker */}
                    <div className="mt-12 max-w-2xl mx-auto">
                        <div className="
                            p-4 bg-black border-3 border-yellow-400
                            pixel-shadow-sm
                        ">
                            <div className="flex items-center justify-between text-xs font-pixel-heading">
                                <span className="text-green-400 animate-pixel-blink">
                                    [LIVE]
                                </span>
                                <span className="text-yellow-400">
                                    NEXT: MAYO @ $350K
                                </span>
                                <span className="text-white">
                                    1337 WATCHING
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Pixel Mayo */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute text-3xl animate-mayo-float"
                                style={{
                                    left: `${10 + i * 12}%`,
                                    top: `${10 + (i % 3) * 30}%`,
                                    animationDelay: `${i * 0.5}s`,
                                    animationDuration: `${8 + i}s`
                                }}
                            >
                                <span className="pixelated">🥫</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pixelated bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-yellow-400"></div>
            <div className="absolute bottom-4 left-0 right-0 h-2 bg-orange-400"></div>
            <div className="absolute bottom-6 left-0 right-0 h-1 bg-yellow-400/50"></div>
        </section>
    );
};

export default PixelatedHero;