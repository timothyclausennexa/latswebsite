import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useConfig } from '../hooks/useConfig';

const StunningHero: React.FC = () => {
    const CONFIG = useConfig();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section className="
            relative min-h-screen flex items-center justify-center
            overflow-hidden bg-gradient-to-br from-black via-yellow-900/20 to-black
        ">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                {/* Gradient Orbs */}
                <div
                    className="absolute w-96 h-96 rounded-full bg-yellow-400/30 blur-3xl animate-pulse"
                    style={{
                        top: '10%',
                        left: `${mousePosition.x * 0.5}%`,
                        transform: `translateX(-50%)`,
                    }}
                />
                <div
                    className="absolute w-96 h-96 rounded-full bg-orange-400/20 blur-3xl animate-pulse"
                    style={{
                        bottom: '10%',
                        right: `${mousePosition.x * 0.3}%`,
                        animationDelay: '1s'
                    }}
                />
                <div className="absolute w-64 h-64 rounded-full bg-yellow-300/20 blur-2xl animate-float-up"
                     style={{ left: '20%', animationDelay: '0s' }} />
                <div className="absolute w-64 h-64 rounded-full bg-orange-300/20 blur-2xl animate-float-up"
                     style={{ left: '60%', animationDelay: '5s' }} />
                <div className="absolute w-64 h-64 rounded-full bg-yellow-400/20 blur-2xl animate-float-up"
                     style={{ left: '80%', animationDelay: '10s' }} />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23fbbf2410' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
            }} />

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-4 text-center">
                {/* Animated Badge */}
                <div className="mb-8 inline-block">
                    <div className="
                        relative px-6 py-3 rounded-full
                        bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20
                        border border-yellow-400/50 backdrop-blur-md
                        animate-shimmer bg-[length:200%_100%]
                    ">
                        <span className="font-pixel-heading text-sm sm:text-base text-yellow-300 animate-pulse">
                            🥫 MAYO TIMER CONTROLS YOUR FATE 🥫
                        </span>
                    </div>
                </div>

                {/* Main Title with stunning effects */}
                <div className="mb-8">
                    <h1 className="
                        font-pixel-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
                        leading-none mb-4
                    ">
                        <span className="
                            block text-transparent bg-clip-text
                            bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400
                            animate-gradient neon-yellow
                        ">
                            MAYO MEN
                        </span>
                        <span className="
                            block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-4
                            text-transparent bg-clip-text
                            bg-gradient-to-r from-white via-yellow-200 to-white
                            animate-shimmer bg-[length:200%_100%]
                        ">
                            THE SAUCIEST CRYPTO EXPERIMENT
                        </span>
                    </h1>
                </div>

                {/* Dynamic Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                    <div className="
                        p-6 rounded-2xl glass-yellow
                        transform hover:scale-105 transition-all duration-300
                        hover:shadow-xl hover:shadow-yellow-400/30
                    ">
                        <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2 neon-yellow">
                            100 HRS
                        </div>
                        <div className="text-sm text-yellow-200/80">Starting Timer</div>
                    </div>
                    <div className="
                        p-6 rounded-2xl glass-yellow
                        transform hover:scale-105 transition-all duration-300
                        hover:shadow-xl hover:shadow-green-400/30
                    ">
                        <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                            +2 HRS
                        </div>
                        <div className="text-sm text-green-200/80">Per Buy</div>
                    </div>
                    <div className="
                        p-6 rounded-2xl glass-yellow
                        transform hover:scale-105 transition-all duration-300
                        hover:shadow-xl hover:shadow-red-400/30
                    ">
                        <div className="text-3xl sm:text-4xl font-bold text-red-400 mb-2">
                            -0.5 HRS
                        </div>
                        <div className="text-sm text-red-200/80">Per Sell</div>
                    </div>
                </div>

                {/* Description */}
                <p className="
                    text-lg sm:text-xl md:text-2xl text-white/80 mb-8
                    max-w-3xl mx-auto leading-relaxed
                ">
                    I'm trapped doing mayo challenges controlled by YOUR trades!
                    Every market cap milestone = MORE MAYO MADNESS!
                    At $1B we launch our own Mayo Men brand! 🥫
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        onClick={() => CONFIG.PUMP_FUN_LINK && window.open(CONFIG.PUMP_FUN_LINK, '_blank')}
                        disabled={!CONFIG.PUMP_FUN_LINK}
                        className="
                            group relative px-8 py-4 text-lg font-bold
                            bg-gradient-to-r from-green-400 via-emerald-400 to-green-400
                            text-black rounded-full
                            transform hover:scale-110 transition-all duration-300
                            hover:shadow-2xl hover:shadow-green-400/50
                            animate-shimmer bg-[length:200%_100%]
                            btn-stunning
                        "
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <span className="text-2xl group-hover:animate-bounce">🚀</span>
                            BUY $MAYOMEN NOW
                            <span className="text-2xl group-hover:animate-bounce" style={{animationDelay: '0.1s'}}>🚀</span>
                        </span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => CONFIG.LIVE_STREAM_LINK && window.open(CONFIG.LIVE_STREAM_LINK, '_blank')}
                        disabled={!CONFIG.LIVE_STREAM_LINK}
                        className="
                            px-8 py-4 text-lg font-bold
                            glass border-2 border-yellow-400/50
                            text-yellow-400 rounded-full
                            transform hover:scale-105 transition-all duration-300
                            hover:bg-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30
                        "
                    >
                        <span className="flex items-center gap-2">
                            <span>📺</span>
                            WATCH LIVE STREAM
                        </span>
                    </Button>
                </div>

                {/* Live Activity Ticker */}
                <div className="mt-12 max-w-2xl mx-auto">
                    <div className="
                        p-4 rounded-2xl glass-yellow
                        border border-yellow-400/30
                    ">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-green-400 animate-pulse">
                                🟢 LIVE NOW
                            </span>
                            <span className="text-yellow-400/80">
                                Next Challenge: Mayo Wrestling @ $350k
                            </span>
                            <span className="text-white/60">
                                Viewers: 1,337
                            </span>
                        </div>
                    </div>
                </div>

                {/* Floating Mayo Icons */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-4xl opacity-20 animate-mayo-float"
                            style={{
                                left: `${20 + i * 15}%`,
                                top: `${20 + i * 10}%`,
                                animationDelay: `${i * 2}s`,
                                animationDuration: `${10 + i * 2}s`
                            }}
                        >
                            🥫
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" className="w-full h-auto">
                    <path
                        fill="url(#wave-gradient)"
                        d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,48C1248,53,1344,75,1392,85.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                    />
                    <defs>
                        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </section>
    );
};

export default StunningHero;