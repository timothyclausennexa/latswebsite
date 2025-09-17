import React from 'react';
import { MOCK_LIVE_EVENTS } from '../constants';
import { LiveEvent } from '../types';
import { Icon } from './ui/Icon';

const EventIcon: React.FC<{ type: LiveEvent['type'] }> = ({ type }) => {
    switch (type) {
        case 'buy':
            return <Icon type="user" className="h-4 w-4 text-alarm-red" />;
        case 'sell':
            return <Icon type="user" className="h-4 w-4 text-ash-white" />;
        case 'event':
            return <Icon type="fire" className="h-4 w-4 text-warning-orange" />;
        default:
            return null;
    }
};

const LiveEventFeed: React.FC = () => {
    return (
        <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-md">
            <h3 className="mb-3 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                Live Sentence Log
            </h3>
            <div className="h-64 overflow-y-auto pr-2">
                <ul className="space-y-3">
                    {MOCK_LIVE_EVENTS.map(event => (
                        <li key={event.id} className="flex items-start gap-3">
                            <div className="mt-1">
                                <EventIcon type={event.type} />
                            </div>
                            <div className="flex-1">
                                <p className="font-body text-sm text-ash-white">
                                    {event.description}
                                </p>
                                <p className="font-mono text-xs text-ash-white/50">
                                    {event.timestamp} ({event.amount > 0 ? '+' : ''}{event.amount}h)
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default LiveEventFeed;