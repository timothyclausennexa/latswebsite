
import React from 'react';
import CommunityPlaylist from './CommunityPlaylist';
import DailySongPoll from './DailySongPoll';

const MusicSection: React.FC = () => {
    return (
        <section id="music-section" className="py-12 sm:py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6">
                <h2 className="text-center font-pixel-heading text-xl uppercase text-ash-white sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                    COMMUNITY JUKEBOX
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-center font-body text-sm text-ash-white/70 sm:text-base lg:text-lg leading-relaxed">
                    SLURP is forced to listen to your music. Submit songs to the playlist and vote on the daily track that will be put on repeat.
                </p>
                <div className="mx-auto mt-8 sm:mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <CommunityPlaylist />
                    </div>
                    <div className="lg:col-span-2">
                        <DailySongPoll />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MusicSection;
