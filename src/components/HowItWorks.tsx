import React from 'react';
import { Icon } from './ui/Icon';

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="border-2 border-ash-white/20 bg-black/30 p-6 text-center shadow-pixel-md hover:border-yellow-400 hover:scale-105 transition-all">
        {icon}
        <h3 className="mt-4 font-pixel-heading text-lg text-ash-white">{title}</h3>
        <p className="mt-2 font-body text-sm text-ash-white/70">{description}</p>
    </div>
);


const HowItWorks: React.FC = () => {
    return (
        <section id="how-it-works" className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <h2 className="text-center font-pixel-heading text-2xl uppercase text-yellow-400 sm:text-3xl lg:text-4xl">
                    📈 HOW YOU MAKE MONEY 📈
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-center font-body text-ash-white text-lg">
                    Simple: Buy early, watch it go viral, profit massively. Here's the genius mechanism:
                </p>
                <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoCard
                        icon={<div className="font-pixel-timer text-4xl text-green-400 mx-auto animate-pulse">BUY 📈</div>}
                        title="SMART MONEY MOVES"
                        description="Each $LATS purchase adds 30 mins to stream. More stream time = more viral clips = more buyers = YOUR GAINS MULTIPLY!"
                    />
                    <InfoCard
                        icon={<div className="font-pixel-timer text-4xl text-red-400 mx-auto">💸 SELL</div>}
                        title="PAPER HANDS LOSE"
                        description="Selling reduces stream by 1 hour. But why sell when you're holding the next 10,000x? Diamond hands get Lambos!"
                    />
                    <InfoCard
                        icon={<Icon type="fire" className="mx-auto h-10 w-10 text-warning-orange animate-pulse" />}
                        title="VIRAL CATALYST EVENTS"
                        description="24/7 stream creates CONSTANT content. Sleep deprivation, mental breakdowns, wild moments = Twitter trends = PRICE EXPLOSIONS!"
                    />
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
