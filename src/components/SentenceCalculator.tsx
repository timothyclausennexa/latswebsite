import React, { useState, useMemo } from 'react';
import { Button } from './ui/Button';

const SentenceCalculator: React.FC = () => {
    const [amount, setAmount] = useState<string>('100');
    const [action, setAction] = useState<'buy' | 'sell'>('buy');
    
    const solAmount = parseFloat(amount) || 0;

    const timeChange = useMemo(() => {
        // This is a mock calculation.
        // In reality, this would be based on the number of tokens bought/sold.
        // For this UI demo, we'll assume a simple ratio.
        // e.g., 1 SOL buy = 10 buys = 5 hours. 1 SOL sell = 10 sells = 15 hours.
        const mockBuysPerSol = 10;
        const mockSellsPerSol = 10;
        
        if (action === 'buy') {
            return solAmount * mockBuysPerSol * 0.5; // +0.5 hours per buy
        } else {
            return solAmount * mockSellsPerSol * -1.5; // -1.5 hours per sell
        }
    }, [amount, action]);

    return (
        <div className="border-2 border-ash-white/20 bg-prison-black/30 p-6 shadow-pixel-md">
            <h3 className="mb-4 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                Sentence Calculator
            </h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="sol-amount" className="block font-pixel-heading text-sm text-ash-white/70">
                        Amount (in SOL)
                    </label>
                    <input
                        id="sol-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 w-full border-2 border-prison-black bg-ash-white/10 p-2 font-mono text-ash-white focus:border-warning-orange focus:outline-none"
                        placeholder="e.g., 5"
                    />
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setAction('buy')}
                        className={`w-full ${action === 'buy' ? 'bg-alarm-red' : 'bg-prison-black text-ash-white/70'}`}
                    >
                        BUY
                    </Button>
                    <Button 
                        onClick={() => setAction('sell')}
                        className={`w-full ${action === 'sell' ? 'bg-ash-white text-prison-black' : 'bg-prison-black text-ash-white/70'}`}
                    >
                        SELL
                    </Button>
                </div>
                <div className="mt-4 border-t-2 border-ash-white/20 pt-4 text-center">
                    <p className="font-pixel-heading text-ash-white/70">Estimated Time Change:</p>
                    <p className={`font-pixel-timer text-3xl ${timeChange > 0 ? 'text-alarm-red' : 'text-ash-white'}`}>
                        {timeChange > 0 ? '+' : ''}{timeChange.toFixed(2)} Hours
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SentenceCalculator;
