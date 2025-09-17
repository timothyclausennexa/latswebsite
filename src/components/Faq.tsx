import React, { useState } from 'react';
import { FAQ_DATA } from '../constants';
import { Icon } from './ui/Icon';

const FaqItemComponent: React.FC<{ item: { question: string, answer: string }, isOpen: boolean, onClick: () => void }> = ({ item, isOpen, onClick }) => (
    <div className="border-b-2 border-ash-white/20">
        <button
            className="flex w-full items-center justify-between py-4 text-left font-pixel-heading text-ash-white"
            onClick={onClick}
            aria-expanded={isOpen}
        >
            <span className="text-base sm:text-lg">{item.question}</span>
            <Icon type="chevron-down" className={`h-6 w-6 flex-shrink-0 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-4' : 'max-h-0'}`}
        >
            <p className="font-body text-sm text-ash-white/80 sm:text-base">
                {item.answer}
            </p>
        </div>
    </div>
);

const Faq: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <h2 className="text-center font-pixel-heading text-2xl uppercase text-ash-white sm:text-3xl lg:text-4xl">
                    Frequently Asked Questions
                </h2>
                <div className="mx-auto mt-12 max-w-3xl">
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
