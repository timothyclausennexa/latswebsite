import React, { useState } from 'react';
import { DETAILED_ROADMAP_DATA } from '../constants';
import { Milestone } from '../types';

const MilestoneCard: React.FC<{ milestone: Milestone; index: number }> = ({ milestone, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Different gradient colors for different price ranges
    const getGradient = () => {
        const value = parseInt(milestone.marketCap.replace(/[^0-9]/g, ''));
        if (value < 100000) return 'from-yellow-400 to-orange-400';
        if (value < 1000000) return 'from-orange-400 to-red-400';
        if (value < 1000000000) return 'from-red-400 to-purple-400';
        return 'from-purple-400 to-pink-400';
    };

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* Connection line */}
            {index < DETAILED_ROADMAP_DATA.length - 1 && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-yellow-400/50 to-transparent"></div>
            )}

            {/* Card */}
            <div className={`
                relative p-6 rounded-2xl transition-all duration-500
                ${isHovered ? 'scale-105 z-10' : 'scale-100'}
                glass-yellow hover:shadow-2xl hover:shadow-yellow-400/30
            `}>
                {/* Glow effect on hover */}
                {isHovered && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/20 to-orange-400/20 blur-xl animate-pulse"></div>
                )}

                {/* Content */}
                <div className="relative z-10">
                    {/* Price badge */}
                    <div className={`
                        inline-block px-4 py-2 rounded-full mb-4
                        bg-gradient-to-r ${getGradient()}
                        text-black font-bold text-sm sm:text-base
                        animate-shimmer bg-[length:200%_100%]
                    `}>
                        {milestone.marketCap}
                    </div>

                    {/* Description */}
                    <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                        {milestone.description}
                    </p>

                    {/* Special indicators */}
                    {milestone.description.includes('MAYO MEN BRAND') && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            <span className="text-yellow-400 font-bold text-xs uppercase animate-pulse">
                                Major Milestone
                            </span>
                        </div>
                    )}
                    {milestone.description.includes('MENTOS') && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-2xl">💥</span>
                            <span className="text-red-400 font-bold text-xs uppercase">
                                Explosive Event
                            </span>
                        </div>
                    )}
                    {milestone.description.includes('FIREWORKS') && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-2xl">🎆</span>
                            <span className="text-orange-400 font-bold text-xs uppercase">
                                Pyrotechnic Show
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StunningRoadmap: React.FC = () => {
    const [visibleCount, setVisibleCount] = useState(10);
    const [filter, setFilter] = useState<'all' | 'mayo' | 'special'>('all');

    const filteredMilestones = DETAILED_ROADMAP_DATA.filter(milestone => {
        if (filter === 'all') return true;
        if (filter === 'mayo') return milestone.description.toLowerCase().includes('mayo');
        if (filter === 'special') {
            return milestone.description.includes('MENTOS') ||
                   milestone.description.includes('FIREWORKS') ||
                   milestone.description.includes('MAYO MEN BRAND');
        }
        return true;
    });

    const visibleMilestones = filteredMilestones.slice(0, visibleCount);

    return (
        <section id="roadmap" className="py-16 sm:py-24 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-yellow-900/10 to-black"></div>
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23fbbf2410' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
            }}></div>

            <div className="relative z-10 container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="
                        font-pixel-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                        text-transparent bg-clip-text
                        bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400
                        mb-4 neon-yellow
                    ">
                        MAYO MILESTONES
                    </h2>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        From sauce to empire - every market cap milestone unlocks new mayo madness!
                        At $1B we launch the Mayo Men brand and conquer the condiment industry! 🥫
                    </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex justify-center gap-3 mb-12">
                    {(['all', 'mayo', 'special'] as const).map(filterType => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={`
                                px-6 py-2 rounded-full font-pixel-heading text-sm
                                transition-all duration-300 transform hover:scale-105
                                ${filter === filterType
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'
                                    : 'glass border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10'
                                }
                            `}
                        >
                            {filterType === 'all' && '🌟 All'}
                            {filterType === 'mayo' && '🥫 Mayo Only'}
                            {filterType === 'special' && '💥 Special Events'}
                        </button>
                    ))}
                </div>

                {/* Milestones Grid */}
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-8">
                        {visibleMilestones.map((milestone, index) => (
                            <MilestoneCard
                                key={milestone.marketCap}
                                milestone={milestone}
                                index={index}
                            />
                        ))}
                    </div>
                </div>

                {/* Load More */}
                {visibleCount < filteredMilestones.length && (
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="
                                px-8 py-3 rounded-full
                                bg-gradient-to-r from-yellow-400 to-orange-400
                                text-black font-bold
                                transform hover:scale-110 transition-all duration-300
                                hover:shadow-2xl hover:shadow-yellow-400/50
                                animate-shimmer bg-[length:200%_100%]
                            "
                        >
                            Load More Milestones ({filteredMilestones.length - visibleCount} remaining)
                        </button>
                    </div>
                )}

                {/* Progress Indicator */}
                <div className="mt-16 max-w-2xl mx-auto">
                    <div className="p-6 rounded-2xl glass-yellow">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-yellow-400 font-bold">Current Progress</span>
                            <span className="text-white/60 text-sm">Live Market Cap</span>
                        </div>
                        <div className="relative h-4 bg-black/50 rounded-full overflow-hidden">
                            <div className="
                                absolute inset-y-0 left-0 w-1/5
                                bg-gradient-to-r from-green-400 to-yellow-400
                                animate-shimmer bg-[length:200%_100%]
                            "></div>
                        </div>
                        <div className="mt-3 flex justify-between text-xs text-white/60">
                            <span>$0</span>
                            <span className="text-yellow-400 font-bold">Next: $67k (Mentos Explosion!)</span>
                            <span>$1B</span>
                        </div>
                    </div>
                </div>

                {/* Floating Mayo Decorations */}
                <div className="absolute top-20 left-10 text-6xl opacity-10 animate-mayo-float">
                    🥫
                </div>
                <div className="absolute bottom-20 right-10 text-6xl opacity-10 animate-mayo-float" style={{animationDelay: '2s'}}>
                    🥫
                </div>
            </div>
        </section>
    );
};

export default StunningRoadmap;