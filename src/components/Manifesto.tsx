import React from 'react';

const Manifesto: React.FC = () => {
    return (
        <section id="manifesto" className="bg-black/90 py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="font-pixel-heading text-xl uppercase text-yellow-400 sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                        WHY $SLURP WILL MAKE HISTORY
                    </h2>
                    <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-left font-body text-ash-white/80">
                        <p className="text-sm sm:text-base leading-relaxed">
                            Every memecoin promises the moon. Dog coins, cat coins, AI coins - they're all the same pump and dump. No real innovation. No viral mechanism. No human story that captures the world's attention.
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed">
                            <span className="font-pixel-heading text-green-400 text-base sm:text-lg">$SLURP IS DIFFERENT.</span> It's the first memecoin with REAL STAKES. A human being streaming 24/7, controlled by the market. Every buy extends the stream, creating more viral content, driving more buyers. It's a self-fulfilling prophecy of profit.
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed">
                            Your buy isn't just an investment; it's CONTENT CREATION. 30 more minutes of stream = more clips = more tweets = more FOMO = higher price. You're not just buying a token, you're buying into the most viral marketing machine ever created.
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed">
                            This isn't another rug pull waiting to happen. The stream is REAL. The timer is LIVE. The gains are INEVITABLE. Early buyers control the narrative AND the profits. Late arrivals will pay YOUR price.
                        </p>
                        <p className="font-pixel-heading text-green-400 text-lg sm:text-xl animate-pulse leading-tight">
                            BE EARLY. BE SMART. BE RICH. WELCOME TO THE 10,000X.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Manifesto;
