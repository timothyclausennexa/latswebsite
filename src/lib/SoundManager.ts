// Sound Manager using Web Audio API for game sound effects
export class SoundManager {
    private audioContext: AudioContext | null = null;
    private masterVolume: number = 0.7;
    private sounds: Map<string, AudioBuffer> = new Map();
    private isInitialized: boolean = false;

    constructor() {
        // Initialize on first user interaction
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.isInitialized = true;

            // Create synthesized sounds
            await this.createSounds();
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    private async createSounds() {
        if (!this.audioContext) return;

        // Create synthesized sound effects
        this.sounds.set('dash', this.createDashSound());
        this.sounds.set('perfectDodge', this.createPerfectDodgeSound());
        this.sounds.set('explosion', this.createExplosionSound());
        this.sounds.set('powerup', this.createPowerUpSound());
        this.sounds.set('combo', this.createComboSound());
        this.sounds.set('death', this.createDeathSound());
        this.sounds.set('nearMiss', this.createNearMissSound());
        this.sounds.set('scoreBonus', this.createScoreBonusSound());
    }

    private createDashSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.2;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Whoosh sound - noise with quick fade
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10); // Quick decay
            const noise = (Math.random() - 0.5);
            const frequency = 800 + Math.sin(t * 40) * 400; // Swooping frequency
            data[i] = noise * envelope * Math.sin(2 * Math.PI * frequency * t) * 0.3;
        }

        return buffer;
    }

    private createPerfectDodgeSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.3;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Ding sound - high pitched bell
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3);
            // Multiple harmonics for bell sound
            data[i] = envelope * 0.3 * (
                Math.sin(2 * Math.PI * 1200 * t) +
                Math.sin(2 * Math.PI * 2400 * t) * 0.5 +
                Math.sin(2 * Math.PI * 3600 * t) * 0.25
            );
        }

        return buffer;
    }

    private createExplosionSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.5;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Explosion - noise burst with low frequency rumble
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5);
            const noise = (Math.random() - 0.5);
            const rumble = Math.sin(2 * Math.PI * 50 * t);
            data[i] = (noise * 0.5 + rumble * 0.5) * envelope * 0.4;
        }

        return buffer;
    }

    private createPowerUpSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.4;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Power up - ascending arpeggio
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = 1 - t / duration;
            const freq = 400 * Math.pow(2, t * 2); // Rising pitch
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }

        return buffer;
    }

    private createComboSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.2;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Combo - quick ascending notes
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);
            const step = Math.floor(t * 8); // 8 quick notes
            const freq = 600 * Math.pow(1.2, step);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }

        return buffer;
    }

    private createDeathSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 1;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Death - descending pitch with distortion
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2);
            const freq = 400 * Math.exp(-t * 2); // Falling pitch
            const signal = Math.sin(2 * Math.PI * freq * t);
            // Add distortion
            data[i] = Math.tanh(signal * 3) * envelope * 0.4;
        }

        return buffer;
    }

    private createNearMissSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.15;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Near miss - quick swoosh
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.sin(Math.PI * t / duration); // Smooth envelope
            const freq = 2000 - t * 8000; // Quickly falling frequency
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
        }

        return buffer;
    }

    private createScoreBonusSound(): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const duration = 0.3;
        const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Score bonus - coin sound
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5);
            // Two tones for metallic sound
            data[i] = envelope * 0.3 * (
                Math.sin(2 * Math.PI * 988 * t) + // B5
                Math.sin(2 * Math.PI * 1319 * t)   // E6
            );
        }

        return buffer;
    }

    play(soundName: string, volume: number = 1, pitch: number = 1) {
        if (!this.audioContext || !this.isInitialized) {
            this.initialize();
            return;
        }

        const buffer = this.sounds.get(soundName);
        if (!buffer) return;

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = buffer;
            source.playbackRate.value = pitch;

            gainNode.gain.value = volume * this.masterVolume;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            source.start(0);

            // Clean up after playing
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.error('Error playing sound:', soundName, error);
        }
    }

    playCombo(multiplier: number) {
        // Higher pitch for higher combos
        const pitch = 1 + (multiplier - 1) * 0.1;
        this.play('combo', 0.5, pitch);
    }

    playNearMiss(distance: number) {
        // Volume based on how close
        const volume = Math.max(0.2, 1 - distance / 50);
        this.play('nearMiss', volume);
    }

    setMasterVolume(volume: number) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    // Play background music (looping)
    async playMusic() {
        if (!this.audioContext) return;

        // Create a simple looping beat
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.value = 110; // A2
        gainNode.gain.value = 0.1;

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();

        // Create bass pattern
        let noteIndex = 0;
        const bassPattern = [110, 110, 138, 110, 146, 110, 138, 110];

        setInterval(() => {
            oscillator.frequency.value = bassPattern[noteIndex % bassPattern.length];
            noteIndex++;
        }, 250); // 240 BPM
    }
}

// Global instance
export const soundManager = new SoundManager();