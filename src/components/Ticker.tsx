import React from 'react';
import { MOCK_TICKER_ITEMS } from '../constants';

const Ticker: React.FC = () => {
    // Duplicate items to ensure a smooth, continuous loop for the marquee effect.
    const items = [...MOCK_TICKER_ITEMS, ...MOCK_TICKER_ITEMS, ...MOCK_TICKER_ITEMS, ...MOCK_TICKER_ITEMS];

    return (
        <div className="w-full overflow-hidden border-y-2 border-black/50 bg-gradient-to-r from-green-500 to-yellow-500 py-2 font-pixel-heading text-sm text-black font-bold sm:text-base">
            <div className="flex whitespace-nowrap animate-marquee motion-reduce:animate-none">
                {items.map((item, index) => (
                    <div key={index} className="mx-4 flex items-center">
                        <span className="mr-2 opacity-70">•</span>
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Ticker;
