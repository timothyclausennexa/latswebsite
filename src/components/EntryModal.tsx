import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { useConfig } from '../hooks/useConfig';
import { shortCA } from '../utils/helpers';

interface EntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose }) => {
    const CONFIG = useConfig();
    const [isCopied, setIsCopied] = useState(false);
    const isLive = !!CONFIG.TOKEN_CONTRACT_ADDRESS;

    const handleCopy = () => {
        if (CONFIG.TOKEN_CONTRACT_ADDRESS) {
            navigator.clipboard.writeText(CONFIG.TOKEN_CONTRACT_ADDRESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const title = isLive ? "VERIFY CONTRACT" : "CONFIRM LIVESTREAM";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-black border-4 border-alarm-red p-6 sm:p-8 rounded-lg max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-ash-white/70 hover:text-ash-white p-2"
                    aria-label="Close modal"
                >
                    <Icon type="x" className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-pixel-heading text-alarm-red mb-6 text-center">{title}</h2>
            {isLive ? (
                // Post-launch content
                <div className="text-center font-body">
                    <p className="text-ash-white/80">
                        Scams are everywhere. Before buying, triple-check this is the official contract address.
                    </p>
                    <div className="my-4 flex items-center justify-center gap-2 rounded border-2 border-ash-white/20 bg-black p-3 font-mono text-lg text-warning-orange">
                        <span>{shortCA(CONFIG.TOKEN_CONTRACT_ADDRESS)}</span>
                        <button onClick={handleCopy} aria-label="Copy contract address" className="text-ash-white/70 transition-colors hover:text-ash-white">
                            {isCopied ? <Icon type="check" className="h-5 w-5 text-green-400" /> : <Icon type="copy" className="h-5 w-5" />}
                        </button>
                    </div>
                    <Button variant="primary" size="lg" onClick={onClose} className="mt-4 w-full">
                        I HAVE VERIFIED
                    </Button>
                </div>
            ) : (
                // Pre-launch content
                <div className="text-center font-body">
                    <p className="text-ash-white/80">
                        The official Contract Address is being set <span className="text-alarm-red">LIVE ON STREAM.</span>
                    </p>
                    <p className="mt-2 text-warning-orange">
                       Join the stream to verify the CA before you buy anything.
                    </p>
                     <Button 
                        variant="secondary" 
                        size="lg" 
                        onClick={() => CONFIG.LIVE_STREAM_LINK && window.open(CONFIG.LIVE_STREAM_LINK, '_blank')} 
                        className="mt-6 w-full"
                        disabled={!CONFIG.LIVE_STREAM_LINK}
                        tooltip="Stream link will be live soon"
                    >
                        GO TO STREAM
                    </Button>
                    <Button variant="primary" size="md" onClick={onClose} className="mt-2 w-full">
                        I UNDERSTAND, ENTER SITE
                    </Button>
                </div>
            )}
            </div>
        </div>
    );
};

export default EntryModal;