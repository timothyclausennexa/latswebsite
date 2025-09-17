// FIX: Removed invalid file start and end markers that were causing parsing errors.
import React, { useState } from 'react';
import { DETAILED_ROADMAP_DATA } from '../constants';
import { Milestone } from '../types';
import { Icon } from './ui/Icon';

const INITIAL_VISIBLE_COUNT = 7;

const MilestoneItem: React.FC<{ milestone: Milestone }> = ({ milestone }) => {
    return (
        <li className="relative border-l-2 border-ash-white/20 py-4 pl-8 sm:pl-12">
            <div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full border-2 border-ash-white/50 bg-prison-black"></div>
            <p className="font-pixel-timer text-lg text-warning-orange sm:text-xl">
                {milestone.marketCap}
            </p>
            <p className="font-body text-sm text-ash-white/70">
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
        <section id="roadmap" className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <button
                    className="w-full cursor-pointer rounded-lg p-4 text-left transition-colors hover:bg-ash-white/5"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-controls="roadmap-list"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="font-pixel-heading text-2xl uppercase text-ash-white sm:text-3xl lg:text-4xl">
                            Roadmap to Freedom (or Ruin)
                        </h2>
                        {totalMilestones > INITIAL_VISIBLE_COUNT && (
                             <Icon 
                                type="chevron-down" 
                                className={`h-8 w-8 flex-shrink-0 text-ash-white/70 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                        )}
                    </div>
                    <p className="mt-2 max-w-2xl font-body text-ash-white/70">
                        The journey begins with "The Grind." Below $1B, it's a series of marketing pushes and personal challenges. Above $1B, the game shifts to global expansion.
                    </p>
                </button>

                <div id="roadmap-list" className="mx-auto mt-8 max-w-2xl">
                    <ul className="list-none">
                        {visibleMilestones.map((milestone) => (
                           <MilestoneItem key={milestone.marketCap} milestone={milestone} />
                        ))}
                    </ul>
                </div>
                
                {totalMilestones > INITIAL_VISIBLE_COUNT && !isExpanded && (
                    <div className="mt-4 text-center font-pixel-heading text-sm text-ash-white/60 animate-pulse">
                        Click header to expand...
                    </div>
                )}
            </div>
        </section>
    );
};

export default Roadmap;
