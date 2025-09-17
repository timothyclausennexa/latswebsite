import React from 'react';
import { shortCA } from '../utils/helpers';
import { CONFIG } from '../config';

const DetailItem: React.FC<{ title: string, value: string | React.ReactNode }> = ({ title, value }) => (
    <div className="border-t-2 border-ash-white/20 py-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4">
            <dt className="font-pixel-heading text-sm sm:text-base text-ash-white/70">{title}</dt>
            <dd className="font-mono text-xs sm:text-sm text-ash-white text-left sm:text-right break-all sm:break-normal">{value}</dd>
        </div>
    </div>
);


const TechDetails: React.FC = () => {
    const caDisplay = CONFIG.TOKEN_CONTRACT_ADDRESS 
        ? shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)
        : "// PENDING - CHECK STREAM";

    return (
        <section id="tech" className="py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-center font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                        Immutable Ledger
                    </h2>
                     <p className="mt-2 text-center font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed">
                        The raw, unchangeable facts of the contract.
                    </p>
                    <dl className="mt-6 sm:mt-8">
                        <DetailItem title="Chain" value="Solana" />
                        <DetailItem title="Contract Address" value={caDisplay} />
                        <DetailItem title="Total Supply" value="1,000,000,000" />
                        <DetailItem title="Taxes" value="0% Buy / 0% Sell" />
                        <DetailItem title="Liquidity" value="100% Burnt" />
                        <DetailItem title="Ownership" value="Renounced at Timer=0" />
                    </dl>
                </div>
            </div>
        </section>
    );
};

export default TechDetails;