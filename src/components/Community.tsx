import React from 'react';
import { Button } from './ui/Button';
import { CONFIG } from '../config';

const Community: React.FC = () => {
    return (
        <section id="community" className="py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6 text-center">
                <h2 className="font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                    JOIN THE CELLBLOCK
                </h2>
                <p className="mx-auto mt-2 max-w-2xl font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed">
                    The experiment is live. The timer is ticking. Memes, chaos, and financial ruin await in our Telegram and on X.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <Button
                        size="lg"
                        variant='primary'
                        onClick={() => window.open(CONFIG.TELEGRAM_LINK, '_blank', 'noopener,noreferrer')}
                        className="w-full sm:w-auto min-w-[200px]"
                    >
                        Enter Telegram
                    </Button>
                    <Button
                        size="lg"
                        variant='secondary'
                        onClick={() => window.open(CONFIG.X_LINK, '_blank', 'noopener,noreferrer')}
                        className="w-full sm:w-auto min-w-[200px]"
                    >
                        Follow on X
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Community;
