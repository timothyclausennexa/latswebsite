import React from 'react';
import { Icon } from './ui/Icon';
import { CONFIG } from '../config';

const Footer: React.FC = () => {
    return (
        <footer className="border-t-2 border-prison-black/50 bg-prison-black py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 sm:flex-row">
                     <div className="font-pixel-heading text-lg text-alarm-red sm:text-xl">
                        Lats
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <a
                            href={CONFIG.TELEGRAM_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Telegram"
                            className="text-ash-white/70 transition-all active:scale-95 hover:scale-110 hover:text-ash-white touch-manipulation p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            <Icon type="telegram" className="h-6 w-6 sm:h-7 sm:w-7" />
                        </a>
                        <a
                            href={CONFIG.X_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="X / Twitter"
                            className="text-ash-white/70 transition-all active:scale-95 hover:scale-110 hover:text-ash-white touch-manipulation p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            <Icon type="x" className="h-6 w-6 sm:h-7 sm:w-7" />
                        </a>
                    </div>
                </div>
                <div className="mt-4 sm:mt-6 text-center font-body text-xs text-ash-white/50 sm:text-sm leading-relaxed">
                    <p>&copy; {new Date().getFullYear()} Lats. All rights reserved.</p>
                    <p className="mt-2 uppercase leading-relaxed">
                        THIS IS A SOCIAL EXPERIMENT. NOT FINANCIAL ADVICE.<br className="sm:hidden" />
                        <span className="hidden sm:inline"> </span>THE TIMER IS REAL.
                    </p>
                    <p className="mt-1 uppercase">NO COOKIES, NO TRACKING.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
