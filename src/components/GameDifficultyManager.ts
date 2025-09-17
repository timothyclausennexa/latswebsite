// Game Difficulty Manager - Progressive difficulty curve like Galaga
// Provides dopamine rushes through power-ups, combos, and wave completion bonuses

export interface WaveConfig {
    waveNumber: number;
    enemyCount: number;
    enemySpeed: number;
    spawnRate: number;
    powerUpChance: number;
    bonusMultiplier: number;
    specialEvent?: 'bonus' | 'boss' | 'swarm' | 'speed';
}

export interface PowerUp {
    type: 'shield' | 'rapid_fire' | 'multi_shot' | 'slow_time' | 'nuke' | 'magnet' | 'double_points';
    duration: number;
    color: string;
    effect: string;
}

export class GameDifficultyManager {
    private baseSpeed = 1;
    private baseSpawnRate = 1000; // ms between spawns
    private waveNumber = 0;
    private comboCount = 0;
    private lastKillTime = 0;
    private comboTimeWindow = 2000; // 2 seconds for combo

    // Dopamine rush triggers
    private readonly COMBO_THRESHOLDS = [3, 5, 10, 15, 20, 30, 50];
    private readonly WAVE_COMPLETE_BONUS = 500;
    private readonly PERFECT_WAVE_BONUS = 1000;

    constructor() {
        this.reset();
    }

    reset() {
        this.waveNumber = 0;
        this.comboCount = 0;
        this.lastKillTime = 0;
    }

    getNextWave(): WaveConfig {
        this.waveNumber++;

        // Progressive difficulty curve inspired by Galaga
        const waveConfig: WaveConfig = {
            waveNumber: this.waveNumber,
            enemyCount: this.calculateEnemyCount(),
            enemySpeed: this.calculateEnemySpeed(),
            spawnRate: this.calculateSpawnRate(),
            powerUpChance: this.calculatePowerUpChance(),
            bonusMultiplier: this.calculateBonusMultiplier(),
            specialEvent: this.getSpecialEvent()
        };

        return waveConfig;
    }

    private calculateEnemyCount(): number {
        // Start small, gradually increase with occasional jumps
        if (this.waveNumber <= 3) return 5 + this.waveNumber;
        if (this.waveNumber <= 10) return 8 + Math.floor(this.waveNumber * 1.5);
        if (this.waveNumber <= 20) return 15 + Math.floor(this.waveNumber * 2);
        return Math.min(50, 20 + Math.floor(this.waveNumber * 2.5));
    }

    private calculateEnemySpeed(): number {
        // Gradual speed increase with plateaus
        const speedCurve = [
            { wave: 5, speed: 1.2 },
            { wave: 10, speed: 1.5 },
            { wave: 15, speed: 1.8 },
            { wave: 20, speed: 2.0 },
            { wave: 30, speed: 2.5 },
            { wave: 40, speed: 3.0 },
            { wave: 50, speed: 3.5 }
        ];

        let speed = this.baseSpeed;
        for (const curve of speedCurve) {
            if (this.waveNumber >= curve.wave) {
                speed = curve.speed;
            }
        }

        // Add slight randomization for variety
        return speed * (0.9 + Math.random() * 0.2);
    }

    private calculateSpawnRate(): number {
        // Faster spawns as waves progress
        const rate = this.baseSpawnRate / (1 + this.waveNumber * 0.05);
        return Math.max(200, rate); // Minimum 200ms between spawns
    }

    private calculatePowerUpChance(): number {
        // Higher chance of power-ups every 5 waves (reward cycles)
        if (this.waveNumber % 5 === 0) return 0.3;
        if (this.waveNumber % 10 === 0) return 0.5;
        return 0.1 + (this.waveNumber * 0.005);
    }

    private calculateBonusMultiplier(): number {
        // Bonus rounds every 10 waves
        if (this.waveNumber % 10 === 0) return 3;
        if (this.waveNumber % 5 === 0) return 2;
        return 1 + (this.waveNumber * 0.02);
    }

    private getSpecialEvent(): 'bonus' | 'boss' | 'swarm' | 'speed' | undefined {
        // Special events for variety and excitement
        if (this.waveNumber % 25 === 0) return 'boss';
        if (this.waveNumber % 10 === 0) return 'bonus';
        if (this.waveNumber % 7 === 0) return 'swarm';
        if (this.waveNumber % 5 === 3) return 'speed';
        return undefined;
    }

    // Combo system for dopamine rushes
    registerKill(timestamp: number): { combo: number, bonus: number, message?: string } {
        const timeSinceLastKill = timestamp - this.lastKillTime;

        if (timeSinceLastKill <= this.comboTimeWindow) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }

        this.lastKillTime = timestamp;

        // Calculate combo bonus
        let bonus = 10 * this.comboCount;
        let message: string | undefined;

        // Check for combo milestones (dopamine triggers)
        if (this.COMBO_THRESHOLDS.includes(this.comboCount)) {
            bonus *= 2;
            message = this.getComboMessage(this.comboCount);
        }

        return { combo: this.comboCount, bonus, message };
    }

    private getComboMessage(combo: number): string {
        const messages: { [key: number]: string } = {
            3: "COMBO x3!",
            5: "NICE STREAK!",
            10: "UNSTOPPABLE!",
            15: "GODLIKE!",
            20: "LEGENDARY!",
            30: "MYTHICAL!",
            50: "TRANSCENDENT!"
        };
        return messages[combo] || `COMBO x${combo}!`;
    }

    // Wave completion bonuses
    getWaveCompleteBonus(enemiesKilled: number, totalEnemies: number): { bonus: number, perfect: boolean } {
        const percentage = enemiesKilled / totalEnemies;
        let bonus = this.WAVE_COMPLETE_BONUS;

        if (percentage === 1) {
            bonus = this.PERFECT_WAVE_BONUS;
            return { bonus, perfect: true };
        }

        bonus = Math.floor(bonus * percentage);
        return { bonus, perfect: false };
    }

    // Power-up system for variety
    getRandomPowerUp(): PowerUp {
        const powerUps: PowerUp[] = [
            { type: 'shield', duration: 5000, color: '#00ffff', effect: 'Invincibility!' },
            { type: 'rapid_fire', duration: 8000, color: '#ff00ff', effect: 'Rapid Fire!' },
            { type: 'multi_shot', duration: 6000, color: '#ffff00', effect: 'Triple Shot!' },
            { type: 'slow_time', duration: 4000, color: '#00ff00', effect: 'Time Slow!' },
            { type: 'nuke', duration: 0, color: '#ff0000', effect: 'NUKE!' },
            { type: 'magnet', duration: 10000, color: '#ff8800', effect: 'Coin Magnet!' },
            { type: 'double_points', duration: 15000, color: '#8800ff', effect: 'Double Points!' }
        ];

        // Weighted random selection (rarer power-ups less likely)
        const weights = [30, 25, 20, 15, 5, 20, 15];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < powerUps.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return powerUps[i];
            }
        }

        return powerUps[0]; // Fallback
    }

    // Difficulty spike events
    getTensionEvent(score: number): { type: string, message: string } | null {
        // Random tension events to keep players on edge
        if (Math.random() < 0.02) { // 2% chance per frame
            const events = [
                { type: 'warning', message: 'INCOMING SWARM!' },
                { type: 'alert', message: 'SPEED SURGE!' },
                { type: 'danger', message: 'CHAOS MODE!' },
                { type: 'critical', message: 'SURVIVAL CHALLENGE!' }
            ];

            return events[Math.floor(Math.random() * events.length)];
        }

        return null;
    }
}

export default GameDifficultyManager;