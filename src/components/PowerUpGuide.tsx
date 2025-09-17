import React from 'react';

const PowerUpItem: React.FC<{ name: string; description: string; icon: React.ReactNode }> = ({ name, description, icon }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">{icon}</div>
        <div>
            <p className="font-pixel-heading text-base text-ash-white">{name}</p>
            <p className="font-body text-sm text-ash-white/70">{description}</p>
        </div>
    </div>
);

const PowerUpGuide: React.FC = () => {
    return (
        <div className="border-2 border-ash-white/20 bg-prison-black/30 p-4 shadow-pixel-lg">
            <h3 className="mb-3 border-b-2 border-ash-white/20 pb-2 font-pixel-heading text-lg text-warning-orange">
                Power-Up Guide
            </h3>
            <div className="space-y-4">
                <PowerUpItem 
                    name="Shield"
                    description="Makes you invincible and destroys one obstacle on contact."
                    icon={<div className="h-6 w-6 rounded-full bg-yellow-400 border-2 border-yellow-200" />}
                />
                 <PowerUpItem 
                    name="Time Slow"
                    description="Briefly slows down the speed of all obstacles by 50%."
                    icon={<div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-blue-300" />}
                />
                 <PowerUpItem 
                    name="Nuke"
                    description="Instantly destroys all obstacles currently on the screen."
                    icon={<div className="h-6 w-6 rounded-full bg-red-600 border-2 border-red-400" />}
                />
            </div>
        </div>
    );
};

export default PowerUpGuide;
