import React from 'react';

const Safety: React.FC = () => {
    return (
        <section className="bg-prison-black py-12">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl border-4 border-alarm-red bg-prison-black p-6 shadow-pixel-lg shadow-alarm-red/20 sm:p-8">
                    <h2 className="flex items-center gap-2 text-center font-pixel-heading text-xl uppercase text-alarm-red sm:text-2xl">
                        <span>// SYSTEM WARNING</span>
                        <span className="h-5 w-3 animate-pulse bg-alarm-red"></span>
                    </h2>
                    <div className="mt-4 border-t-2 border-alarm-red/30 pt-4">
                        <p className="font-body text-sm text-ash-white/80">
                            For legal reasons, we cannot promise financial returns. Lats is a high-risk memecoin and a social experiment. Think of participating like buying a ticket and candy at the movies; you're paying for the entertainment and to be part of an insane story. However, unlike a movie ticket, this one comes with the thrilling possibility of a life-changing payout. It's high-risk, high-reward entertainment. This is not financial advice. Participate responsibly.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Safety;