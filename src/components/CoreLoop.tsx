import React from 'react';

const CoreLoop: React.FC = () => {
    return (
        <section className="border-y-2 border-black/50 bg-gradient-to-r from-green-900/20 to-red-900/20 py-8 sm:py-10 lg:py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 text-center md:grid-cols-3 md:text-left">
                    <div className="md:col-span-1">
                        <h3 className="font-pixel-heading text-lg sm:text-xl lg:text-2xl text-yellow-400 animate-pulse leading-tight">🥫 THE MAYO TIMER 🥫</h3>
                        <p className="mt-2 font-body text-ash-white text-sm sm:text-base leading-relaxed">Starting at 100 HOURS! Every BUY adds 2 hours of mayo challenges. Every SELL removes 0.5 hours. YOU control my mayo fate!</p>
                    </div>
                    <div className="flex items-center justify-center gap-3 sm:gap-4 md:col-span-2">
                        <div className="flex flex-col items-center">
                            <div className="font-pixel-timer text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-green-400 animate-pulse">BUY</div>
                            <div className="font-pixel-heading text-xs sm:text-sm lg:text-base xl:text-lg text-green-300 leading-tight">+2 HOURS</div>
                            <div className="font-body text-xs sm:text-sm text-yellow-400 mt-1">= MORE MAYO</div>
                        </div>
                        <div className="font-pixel-heading text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-yellow-500">🥫</div>
                        <div className="flex flex-col items-center">
                            <div className="font-pixel-timer text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-red-400">SELL</div>
                            <div className="font-pixel-heading text-xs sm:text-sm lg:text-base xl:text-lg text-red-300 leading-tight">-0.5 HOURS</div>
                            <div className="font-body text-xs sm:text-sm text-gray-400 mt-1">= LESS MAYO</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CoreLoop;
