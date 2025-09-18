import React, { useEffect, useState } from 'react';

const MayoEffects: React.FC = () => {
    const [drips, setDrips] = useState<Array<{ id: number; left: number; delay: number }>>([]);
    const [splashes, setSplashes] = useState<Array<{ id: number; x: number; y: number }>>([]);

    // Generate random drips
    useEffect(() => {
        const generateDrips = () => {
            const newDrips = Array.from({ length: 8 }, (_, i) => ({
                id: Date.now() + i,
                left: Math.random() * 100,
                delay: Math.random() * 10
            }));
            setDrips(newDrips);
        };

        generateDrips();
        const interval = setInterval(generateDrips, 15000);

        return () => clearInterval(interval);
    }, []);

    // Add splash on click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Random chance to create mayo splash
            if (Math.random() > 0.7) {
                const newSplash = {
                    id: Date.now(),
                    x: e.clientX,
                    y: e.clientY
                };

                setSplashes(prev => [...prev, newSplash]);

                // Remove splash after animation
                setTimeout(() => {
                    setSplashes(prev => prev.filter(s => s.id !== newSplash.id));
                }, 1000);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <>
            {/* Mayo Drips */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
                {drips.map(drip => (
                    <div
                        key={drip.id}
                        className="absolute animate-drip opacity-20"
                        style={{
                            left: `${drip.left}%`,
                            animationDelay: `${drip.delay}s`
                        }}
                    >
                        <div className="text-4xl sm:text-5xl md:text-6xl">🥛</div>
                    </div>
                ))}
            </div>

            {/* Mayo Splashes */}
            {splashes.map(splash => (
                <div
                    key={splash.id}
                    className="mayo-splatter"
                    style={{
                        left: `${splash.x}px`,
                        top: `${splash.y}px`
                    }}
                >
                    💧
                </div>
            ))}

            {/* Floating Mayo Jars */}
            <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[4]">
                <div className="relative h-32">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bottom-4 animate-mayo-float opacity-10"
                            style={{
                                left: `${20 + i * 30}%`,
                                animationDelay: `${i * 1.5}s`
                            }}
                        >
                            <div className="text-6xl sm:text-7xl md:text-8xl">🥫</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corner Mayo Decorations */}
            <div className="fixed top-20 left-4 pointer-events-none z-[3] hidden lg:block">
                <div className="animate-mayo-float opacity-20">
                    <div className="text-8xl rotate-12">🥫</div>
                </div>
            </div>
            <div className="fixed top-20 right-4 pointer-events-none z-[3] hidden lg:block">
                <div className="animate-mayo-float opacity-20">
                    <div className="text-8xl -rotate-12">🥫</div>
                </div>
            </div>

            {/* Random Mayo Particles */}
            <div className="fixed inset-0 pointer-events-none z-[2]">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={`particle-${i}`}
                        className="absolute animate-mayo-float opacity-5"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`
                        }}
                    >
                        <div
                            className="text-2xl"
                            style={{
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        >
                            🥛
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default MayoEffects;