import React from 'react';
import { TOKENOMICS_DATA } from '../constants';
import { TokenomicItem } from '../types';
import { Icon } from './ui/Icon';

const Tokenomics: React.FC = () => {
    return (
        <section id="tokenomics" className="bg-prison-black/90 py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <h2 className="text-center font-pixel-heading text-2xl uppercase text-ash-white sm:text-3xl lg:text-4xl">
                    THE CELLBLOCK: TOKENOMICS
                </h2>
                <p className="mt-2 text-center font-body text-ash-white/70">
                    The immutable laws of our prison. These cannot be changed.
                </p>
                <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {TOKENOMICS_DATA.map((item: TokenomicItem, index: number) => (
                        <div key={index} className="border-2 border-ash-white/20 bg-prison-black/30 p-6 text-center shadow-pixel-md">
                            <Icon type={item.icon} className="mx-auto h-8 w-8 text-warning-orange" />
                            <h3 className="mt-4 font-pixel-heading text-lg text-ash-white">{item.title}</h3>
                            <p className="mt-2 font-body text-sm text-ash-white/70">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Tokenomics;
