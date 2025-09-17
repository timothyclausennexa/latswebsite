import React from 'react';
import { TOKENOMICS_DATA } from '../constants';
import { TokenomicItem } from '../types';
import { Icon } from './ui/Icon';

const Tokenomics: React.FC = () => {
    return (
        <section id="tokenomics" className="bg-prison-black/90 py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <h2 className="text-center font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                    THE CELLBLOCK: TOKENOMICS
                </h2>
                <p className="mt-2 text-center font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed">
                    The immutable laws of our prison. These cannot be changed.
                </p>
                <div className="mx-auto mt-8 sm:mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {TOKENOMICS_DATA.map((item: TokenomicItem, index: number) => (
                        <div key={index} className="border-2 border-ash-white/20 bg-prison-black/30 p-4 sm:p-6 text-center shadow-pixel-md">
                            <Icon type={item.icon} className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-warning-orange" />
                            <h3 className="mt-3 sm:mt-4 font-pixel-heading text-base sm:text-lg text-ash-white leading-tight">{item.title}</h3>
                            <p className="mt-2 font-body text-xs sm:text-sm text-ash-white/70 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Tokenomics;
