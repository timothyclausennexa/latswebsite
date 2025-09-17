import React from 'react';
import { Button } from './ui/Button';
import { CONFIG } from '../config';

const Community: React.FC = () => {
    return (
        <section id="community" className="py-16 sm:py-24">
            <div className="container mx-auto px-4 text-center">
                <h2 className="font-pixel-heading text-2xl uppercase text-ash-white sm:text-3xl lg:text-4xl">
                    JOIN THE CELLBLOCK
                </h2>
                <p className="mx-auto mt-2 max-w-2xl font-body text-ash-white/70">
                    The experiment is live. The timer is ticking. Memes, chaos, and financial ruin await in our Telegram and on X.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Button 
                        size="lg"
                        variant='primary'
                        onClick={() => window.open(CONFIG.TELEGRAM_LINK, '_blank', 'noopener,noreferrer')}
                    >
                        Enter Telegram
                    </Button>
                    <Button 
                        size="lg"
                        variant='secondary'
                        onClick={() => window.open(CONFIG.X_LINK, '_blank', 'noopener,noreferrer')}
                    >
                        Follow on X
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Community;
