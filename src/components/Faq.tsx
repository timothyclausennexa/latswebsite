import React, { useState } from 'react';
import { FAQ_DATA } from '../constants';
import { Icon } from './ui/Icon';
import { useTouchButton } from '../hooks/useTouch';

const FaqItemComponent: React.FC<{ item: { question: string, answer: string }, isOpen: boolean, onClick: () => void }> = ({ item, isOpen, onClick }) => {
    const { ref, triggerHaptic } = useTouchButton({
        enableHaptics: true,
        hapticOnPress: 'impactLight',
        hapticOnRelease: 'selection',
        enableRipple: true,
        rippleColor: 'rgba(229, 229, 229, 0.1)',
        enableScale: false, // Don't scale FAQ items
        onTap: () => {
            triggerHaptic('selection');
            onClick();
        },
    });

    return (
        <div className="border-b-2 border-ash-white/20">
            <button
                ref={ref}
                className="flex w-full items-start justify-between py-3 sm:py-4 text-left font-pixel-heading text-ash-white touch-manipulation min-h-[44px] transition-colors active:bg-ash-white/5 hover:bg-ash-white/5 hover-to-touch touch-optimized touch-focus touch-ripple touch-target-min"
                onClick={(e) => {
                    triggerHaptic('selection');
                    onClick();
                }}
                aria-expanded={isOpen}
            >
            <span className="text-sm sm:text-base lg:text-lg pr-3 leading-relaxed">{item.question}</span>
            <Icon type="chevron-down" className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 transform transition-transform duration-200 mt-0.5 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-3 sm:pb-4' : 'max-h-0'}`}
            >
                <p className="font-body text-sm text-ash-white/80 sm:text-base leading-relaxed">
                    {item.answer}
                </p>
            </div>
        </div>
    );
};

const Faq: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <h2 className="text-center font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                    Frequently Asked Questions
                </h2>
                <div className="mx-auto mt-8 sm:mt-12 max-w-3xl">
                    {FAQ_DATA.map((item, index) => (
                        <FaqItemComponent
                            key={index}
                            item={item}
                            isOpen={openIndex === index}
                            onClick={() => handleClick(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Faq;
