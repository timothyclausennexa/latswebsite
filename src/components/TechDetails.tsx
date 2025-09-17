import React from 'react';
import { shortCA } from '../utils/helpers';
import { CONFIG } from '../config';

const DetailItem: React.FC<{ title: string, value: string | React.ReactNode }> = ({ title, value }) => (
    <div className="border-t-2 border-ash-white/20 py-3">
        <div className="flex justify-between items-center">
            <dt className="font-pixel-heading text-ash-white/70">{title}</dt>
            <dd className="font-mono text-sm text-ash-white text-right">{value}</dd>
        </div>
    </div>
);


const TechDetails: React.FC = () => {
    const caDisplay = CONFIG.TOKEN_CONTRACT_ADDRESS 
        ? shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)
        : "// PENDING - CHECK STREAM";

    return (
        <section id="tech" className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-center font-pixel-heading text-2xl uppercase text-ash-white sm:text-3xl lg:text-4xl">
                        Immutable Ledger
                    </h2>
                     <p className="mt-2 text-center font-body text-ash-white/70">
                        The raw, unchangeable facts of the contract.
                    </p>
                    <dl className="mt-8">
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