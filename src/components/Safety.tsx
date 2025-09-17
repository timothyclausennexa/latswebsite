import React from 'react';

const Safety: React.FC = () => {
    return (
        <section className="bg-prison-black py-8 sm:py-10 lg:py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="mx-auto max-w-4xl border-4 border-alarm-red bg-prison-black p-4 sm:p-6 lg:p-8 shadow-pixel-lg shadow-alarm-red/20">
                    <h2 className="flex items-center justify-center gap-2 text-center font-pixel-heading text-lg uppercase text-alarm-red sm:text-xl lg:text-2xl leading-tight">
                        <span>// SYSTEM WARNING</span>
                        <span className="h-4 w-2 sm:h-5 sm:w-3 animate-pulse bg-alarm-red"></span>
                    </h2>
                    <div className="mt-3 sm:mt-4 border-t-2 border-alarm-red/30 pt-3 sm:pt-4">
                        <p className="font-body text-xs sm:text-sm lg:text-base text-ash-white/80 leading-relaxed">
                            For legal reasons, we cannot promise financial returns. Lats is a high-risk memecoin and a social experiment. Think of participating like buying a ticket and candy at the movies; you're paying for the entertainment and to be part of an insane story. However, unlike a movie ticket, this one comes with the thrilling possibility of a life-changing payout. It's high-risk, high-reward entertainment. This is not financial advice. Participate responsibly.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Safety;