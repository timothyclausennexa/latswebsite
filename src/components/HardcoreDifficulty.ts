// Hardcore Difficulty System - Makes the game actually challenging

export interface DifficultyLevel {
    spawnInterval: number;  // Frames between spawns
    obstacleSpeed: number;  // Base speed multiplier
    sideSpawnChance: number;  // Chance of side spawns
    multiSpawnChance: number;  // Chance of multiple obstacles
    complexPatternChance: number;  // Chance of complex patterns
    waveName: string;
    dangerLevel: number;  // 1-10
}

export class HardcoreDifficulty {
    private baseSpeed = 4;  // Much faster base speed
    private score = 0;
    private timeAlive = 0;
    private currentWave = 0;
    private waveStartTime = 0;

    updateScore(score: number, timeAlive: number) {
        this.score = score;
        this.timeAlive = timeAlive;
    }

    getDifficulty(): DifficultyLevel {
        // Wave-based difficulty with rest periods
        const WAVE_DURATION = 15; // 15 seconds of intense action
        const REST_DURATION = 5;  // 5 seconds of calm
        const CYCLE_DURATION = WAVE_DURATION + REST_DURATION;

        const cycleTime = this.timeAlive % CYCLE_DURATION;
        const isRestPeriod = cycleTime >= WAVE_DURATION;
        const waveNumber = Math.floor(this.timeAlive / CYCLE_DURATION);

        // Special handling after 60 seconds - progressive difficulty
        const afterMinute = this.timeAlive >= 60;
        const minuteMultiplier = afterMinute ? 1 + ((this.timeAlive - 60) * 0.003) : 1; // +0.3% per second after minute

        if (isRestPeriod) {
            // Rest period - much easier
            return {
                spawnInterval: 45,
                obstacleSpeed: 0.8 * minuteMultiplier,
                sideSpawnChance: 0,
                multiSpawnChance: 0,
                complexPatternChance: 0.1,
                waveName: "BREATHER",
                dangerLevel: 1
            };
        }

        // Calculate wave difficulty based on wave number
        if (waveNumber === 0) {
            // First wave - warm up
            return {
                spawnInterval: 30,
                obstacleSpeed: 1.0 * minuteMultiplier,
                sideSpawnChance: 0,
                multiSpawnChance: 0.1,
                complexPatternChance: 0.2,
                waveName: "WAVE 1: WARM UP",
                dangerLevel: 2
            };
        }

        if (waveNumber === 1) {
            // Wave 2
            return {
                spawnInterval: 25,
                obstacleSpeed: 1.3 * minuteMultiplier,
                sideSpawnChance: 0.05,
                multiSpawnChance: 0.2,
                complexPatternChance: 0.3,
                waveName: "WAVE 2: GETTING REAL",
                dangerLevel: 3
            };
        }

        if (waveNumber === 2) {
            // Wave 3
            return {
                spawnInterval: 20,
                obstacleSpeed: 1.6 * minuteMultiplier,
                sideSpawnChance: 0.1,
                multiSpawnChance: 0.3,
                complexPatternChance: 0.4,
                waveName: "WAVE 3: DANGER ZONE",
                dangerLevel: 4
            };
        }

        if (waveNumber === 3) {
            // Wave 4
            return {
                spawnInterval: 15,
                obstacleSpeed: 2.0 * minuteMultiplier,
                sideSpawnChance: 0.15,
                multiSpawnChance: 0.4,
                complexPatternChance: 0.5,
                waveName: "WAVE 4: CHAOS",
                dangerLevel: 5
            };
        }

        if (waveNumber === 4) {
            // Wave 5
            return {
                spawnInterval: 12,
                obstacleSpeed: 2.3 * minuteMultiplier,
                sideSpawnChance: 0.2,
                multiSpawnChance: 0.5,
                complexPatternChance: 0.6,
                waveName: "WAVE 5: SURVIVAL",
                dangerLevel: 6
            };
        }

        if (waveNumber === 5) {
            // Wave 6 (after ~2 minutes)
            return {
                spawnInterval: 10,
                obstacleSpeed: 2.6 * minuteMultiplier,
                sideSpawnChance: 0.25,
                multiSpawnChance: 0.6,
                complexPatternChance: 0.7,
                waveName: "WAVE 6: NIGHTMARE",
                dangerLevel: 7
            };
        }

        // Wave 7+ - progressively harder but with cap
        const maxSpeed = 4.0; // Never go above 4x speed to keep it playable
        const baseWaveSpeed = Math.min(2.8 + (waveNumber - 6) * 0.2, maxSpeed);
        const finalSpeed = baseWaveSpeed * minuteMultiplier;

        // Cap the absolute maximum speed
        const cappedSpeed = Math.min(finalSpeed, 5.0);

        return {
            spawnInterval: Math.max(8 - (waveNumber - 6), 5), // Never faster than every 5 frames
            obstacleSpeed: cappedSpeed,
            sideSpawnChance: Math.min(0.3 + (waveNumber - 6) * 0.02, 0.5), // Cap at 50%
            multiSpawnChance: Math.min(0.7 + (waveNumber - 6) * 0.02, 0.9), // Cap at 90%
            complexPatternChance: Math.min(0.8 + (waveNumber - 6) * 0.02, 1.0),
            waveName: `WAVE ${waveNumber + 1}: ${waveNumber > 8 ? 'LEGENDARY' : 'EXTREME'}`,
            dangerLevel: Math.min(waveNumber + 2, 10)
        };
    }

    // Special event waves for extra difficulty spikes
    getSpecialEvent(): { type: string, duration: number } | null {
        // Random difficulty spikes
        if (Math.random() < 0.02) {  // 2% chance per frame
            const events = [
                { type: 'BULLET_HELL', duration: 180 },  // 3 seconds of madness
                { type: 'LASER_WALLS', duration: 120 },  // 2 seconds of walls
                { type: 'SWARM_ATTACK', duration: 150 },  // 2.5 seconds of swarm
                { type: 'SPEED_BURST', duration: 90 },   // 1.5 seconds of double speed
                { type: 'TRAP_FORMATION', duration: 240 } // 4 seconds of traps
            ];

            // More likely to get harder events at higher times
            const hardnessBonus = Math.min(4, Math.floor(this.timeAlive / 60));
            return events[Math.min(events.length - 1, Math.floor(Math.random() * (events.length - hardnessBonus) + hardnessBonus))];
        }

        return null;
    }

    // Pattern selection based on difficulty
    getPattern(): string {
        const diff = this.getDifficulty();

        if (Math.random() > diff.complexPatternChance) {
            return 'straight';
        }

        const patterns = [
            'zigzag',
            'wave',
            'spiral',
            'sine',
            'homing',
            'random',
            'bounce'
        ];

        // Bias toward harder patterns at higher difficulty
        if (diff.dangerLevel > 5) {
            const hardPatterns = ['homing', 'random', 'spiral', 'bounce'];
            if (Math.random() < 0.6) {
                return hardPatterns[Math.floor(Math.random() * hardPatterns.length)];
            }
        }

        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    // Spawn burst patterns
    getBurstPattern(timeAlive: number): { count: number, spread: number, pattern: string } {
        // More aggressive burst patterns over time
        if (timeAlive < 30) {
            return { count: 2, spread: 100, pattern: 'line' };
        } else if (timeAlive < 60) {
            return { count: 3, spread: 150, pattern: 'triangle' };
        } else if (timeAlive < 120) {
            return { count: 5, spread: 200, pattern: 'pentagon' };
        } else if (timeAlive < 180) {
            return { count: 7, spread: 250, pattern: 'circle' };
        } else {
            return { count: 10, spread: 300, pattern: 'chaos' };
        }
    }

    // Calculate score multiplier based on survival
    getScoreMultiplier(): number {
        const diff = this.getDifficulty();
        return 1 + (diff.dangerLevel - 1) * 0.5;  // Up to 5.5x multiplier at max difficulty
    }
}

export default HardcoreDifficulty;