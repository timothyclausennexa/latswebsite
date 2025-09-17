// FIX: Removed invalid file start and end markers that were causing parsing errors.
import React, { useState } from 'react';
import { DETAILED_ROADMAP_DATA } from '../constants';
import { Milestone } from '../types';
import { Icon } from './ui/Icon';

const INITIAL_VISIBLE_COUNT = 7;

const MilestoneItem: React.FC<{ milestone: Milestone }> = ({ milestone }) => {
    return (
        <li className="relative border-l-2 border-ash-white/20 py-3 pl-6 sm:py-4 sm:pl-8 lg:pl-12">
            <div className="absolute -left-[9px] top-4 h-4 w-4 rounded-full border-2 border-ash-white/50 bg-prison-black sm:top-6"></div>
            <p className="font-pixel-timer text-base text-warning-orange sm:text-lg lg:text-xl leading-tight">
                {milestone.marketCap}
            </p>
            <p className="font-body text-sm text-ash-white/70 mt-1 leading-relaxed sm:text-base lg:text-sm">
                {milestone.description}
            </p>
        </li>
    );
};

const Roadmap: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const totalMilestones = DETAILED_ROADMAP_DATA.length;
    
    const visibleMilestones = isExpanded 
        ? DETAILED_ROADMAP_DATA 
        : DETAILED_ROADMAP_DATA.slice(0, INITIAL_VISIBLE_COUNT);

    return (
        <section id="roadmap" className="py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <button
                    className="w-full cursor-pointer rounded-lg p-3 sm:p-4 text-left transition-colors active:bg-ash-white/10 hover:bg-ash-white/5 touch-manipulation min-h-[44px] flex items-center"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-controls="roadmap-list"
                >
                    <div className="flex items-start sm:items-center justify-between w-full gap-3">
                        <div className="flex-1 min-w-0">
                            <h2 className="font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                                Roadmap to Freedom (or Ruin)
                            </h2>
                            <p className="mt-2 font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed max-w-none sm:max-w-2xl">
                                The journey begins with "The Grind." Below $1B, it's a series of marketing pushes and personal challenges. Above $1B, the game shifts to global expansion.
                            </p>
                        </div>
                        {totalMilestones > INITIAL_VISIBLE_COUNT && (
                             <Icon
                                type="chevron-down"
                                className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 text-ash-white/70 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        )}
                    </div>
                </button>

                <div id="roadmap-list" className="mx-auto mt-6 sm:mt-8 max-w-none sm:max-w-2xl">
                    <ul className="list-none">
                        {visibleMilestones.map((milestone) => (
                           <MilestoneItem key={milestone.marketCap} milestone={milestone} />
                        ))}
                    </ul>
                </div>

                {totalMilestones > INITIAL_VISIBLE_COUNT && !isExpanded && (
                    <div className="mt-4 text-center font-pixel-heading text-xs sm:text-sm text-ash-white/60 animate-pulse">
                        Tap header to expand...
                    </div>
                )}
            </div>
        </section>
    );
};

export default Roadmap;
