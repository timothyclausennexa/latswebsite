import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabaseClient';
import { soundManager } from '../lib/SoundManager';
import { HardcoreDifficulty } from './HardcoreDifficulty';

// Game Constants
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 20;
const PLAYER_BASE_SPEED = 3;
const PLAYER_MAX_SPEED = 7;
const OBSTACLE_SIZE = 30;
const OBSTACLE_SPEED = 3;
const POWERUP_SIZE = 20;

// Types
type GameState = 'idle' | 'playing' | 'gameOver' | 'modeSelect';
type GameMode = 'classic';

interface GameObject {
    x: number;
    y: number;
}

interface Obstacle extends GameObject {
    speed: number;
    type: 'buy' | 'sell';
    fromSide?: 'left' | 'right' | 'top';
    horizontalSpeed?: number;
    horizontalDirection?: 1 | -1;
    movementPattern?: 'straight' | 'zigzag' | 'wave' | 'spiral' | 'sine' | 'random' | 'homing' | 'bounce';
    patternPhase?: number;
    spawnDelay?: number;
    frozen?: boolean;
    targetX?: number;
    amplitude?: number;
    frequency?: number;
    lastBulletTime?: number; // For sell blocks to shoot bullets
}

interface Bullet extends GameObject {
    vx: number;
    vy: number;
    damage: number;
}

interface PowerUp extends GameObject {
    type: 'shield' | 'slow' | 'nuke' | 'speed' | 'score' | 'laser' | 'freeze' | 'bomb' | 'magnet';
}

interface ActivePowerUp {
    type: string;
    endTime: number;
}

interface GameProps {
    onAuthClick: () => void;
    onOpenShop: () => void;
    onGameEnd?: () => void;
}

function CellBreakGameFixed({ onAuthClick, onOpenShop, onGameEnd }: GameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const { user, profile } = useAuth();

    // Debug: Log user state on mount and changes
    useEffect(() => {
        console.log('🔍 CellBreakGameFixed - User auth state:', {
            user: user ? { id: user.id, email: user.email } : null,
            profile: profile ? { username: profile.username, id: profile.id } : null,
            authenticated: !!user,
            timestamp: new Date().toISOString()
        });
    }, [user, profile]);

    // Game state
    const [gameState, setGameState] = useState<GameState>('idle');
    const [gameMode, setGameMode] = useState<GameMode>('classic');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [skinColor, setSkinColor] = useState('#FF8A00'); // Default prison orange
    const [comboMultiplier, setComboMultiplier] = useState(1);
    const [perfectDodges, setPerfectDodges] = useState(0);
    const hardcoreModeRef = useRef(false);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [showAchievement, setShowAchievement] = useState<string | null>(null);

    // Game objects
    const playerRef = useRef({
        x: 0,
        y: 0,
        vx: 0, // Ice physics - velocity X
        speed: PLAYER_BASE_SPEED,
        isDashing: false,
        dashCooldown: 0,
        dashDirection: 0,
        invulnerable: false
    });
    const keyHoldTimeRef = useRef({ left: 0, right: 0 });
    const moveAccelerationRef = useRef(1);

    // Achievement system
    const achievementRef = useRef({
        firstDodge: false,
        combo10: false,
        combo25: false,
        combo50: false,
        survivor30: false,
        survivor60: false,
        survivor120: false,
        perfectStreak: 0,
        maxCombo: 0
    });

    // New gameplay mechanics
    const dashRef = useRef({
        lastTapTime: { left: 0, right: 0 },
        doubleTapThreshold: 300, // ms
        dashDistance: 100,
        dashDuration: 10, // frames
        dashCooldownTime: 60, // frames (1 second at 60fps)
        currentDashFrame: 0
    });

    const comboRef = useRef({
        multiplier: 1,
        nearMissStreak: 0,
        perfectDodgeStreak: 0,
        lastDodgeTime: 0,
        comboTimeout: 120 // 2 seconds at 60fps
    });

    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        color: string;
        size: number;
        type: 'dash' | 'dodge' | 'explosion' | 'trail' | 'combo' | 'mega';
    }>>([]);

    // Screen shake effect
    const screenShakeRef = useRef({
        intensity: 0,
        duration: 0,
        offsetX: 0,
        offsetY: 0
    });
    const obstaclesRef = useRef<Obstacle[]>([]);
    const continuousSpawnRef = useRef({
        nextSpawnTime: 0,
        spawnInterval: 30,  // Start with hardcore difficulty
        coverageMap: new Array(20).fill(0), // Track screen coverage
        lastColumnSpawned: -1
    });

    // Hardcore difficulty manager
    const hardcoreDifficultyRef = useRef(new HardcoreDifficulty());
    const bulletsRef = useRef<Bullet[]>([]);  // Bullets shot by sell blocks
    const powerUpsRef = useRef<PowerUp[]>([]);
    const activePowerUpsRef = useRef<ActivePowerUp[]>([]);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const frameCountRef = useRef(0);
    const gameTimeRef = useRef(0);
    const lastMinuteShieldRef = useRef(0);
    const playerPositionHistoryRef = useRef<{x: number, frame: number}[]>([]);
    const lastCampingWarningRef = useRef(0);
    const isCampingRef = useRef(false);
    const streakRef = useRef(0);
    const dailyStreakRef = useRef(0);
    const nearMissCountRef = useRef(0);
    const lastPlayDateRef = useRef(new Date().toDateString());

    // AI Learning System
    const playerBehaviorRef = useRef({
        preferredX: 0,
        avgSpeed: 0,
        dodgeDirection: 0, // -1 left, 1 right, 0 neutral
        reactionTime: 0,
        movementPatterns: [] as number[],
        heatmap: new Array(10).fill(0), // Divide screen into 10 zones
        lastPositions: [] as number[],
        dodgeCount: { left: 0, right: 0 },
        campingTendency: 0
    });

    // Smart Difficulty System
    const difficultyRef = useRef({
        skillLevel: 0, // 0-1, tracks player skill
        dodgeSuccess: 0, // Successful dodges
        dodgeFails: 0, // Hit count
        nearMisses: 0, // Close calls
        perfectStreak: 0, // Consecutive perfect dodges
        lastDeathTime: 0, // Track when player last died
        difficultyMultiplier: 1.0, // Dynamic difficulty adjustment
        performanceHistory: [] as number[], // Track recent performance
        adaptiveSpeed: 1.0, // Speed modifier based on performance
        frustrationLevel: 0 // Track if player is struggling
    });

    // Initialize canvas dimensions
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        if (container) {
            const { width, height } = container.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;

            // Set initial player position
            playerRef.current.x = width / 2 - PLAYER_WIDTH / 2;
            playerRef.current.y = height - PLAYER_HEIGHT - 20;
            playerRef.current.vx = 0; // Reset velocity
        }
    }, []);

    // Reset game
    const resetGame = useCallback(() => {
        initCanvas();
        obstaclesRef.current = [];
        bulletsRef.current = [];  // Clear bullets
        powerUpsRef.current = [];
        activePowerUpsRef.current = [];
        frameCountRef.current = 0;
        gameTimeRef.current = 0;
        lastMinuteShieldRef.current = 0;
        playerPositionHistoryRef.current = [];
        lastCampingWarningRef.current = 0;
        isCampingRef.current = false;
        playerRef.current.speed = PLAYER_BASE_SPEED;
        playerRef.current.vx = 0; // Reset ice physics velocity
        keyHoldTimeRef.current = { left: 0, right: 0 };
        moveAccelerationRef.current = 1;

        // Reset continuous spawn system - THIS FIXES THE DELAY
        continuousSpawnRef.current = {
            nextSpawnTime: 0,
            spawnInterval: 30,  // Start with hardcore difficulty
            coverageMap: new Array(20).fill(0),
            lastColumnSpawned: -1
        };

        // Reset hardcore difficulty
        hardcoreDifficultyRef.current = new HardcoreDifficulty();

        setScore(0);
    }, [initCanvas]);

    // Get game mode configuration
    const getGameModeConfig = (mode: GameMode) => {
        // Always classic mode - more addictive with real stakes
        return {
            invulnerable: false,
            spawnRateMultiplier: 1,
            scoreMultiplier: 1,
            obstacleSpeedMultiplier: 1,
            dashCooldownMultiplier: 1,
            description: 'Original survival mode',
                    powerUpRate: 1,
                    timeLimit: undefined as number | undefined
                };
    };

    // Define 100 different wave patterns
    const getWavePattern = (waveNumber: number, score: number) => {
        const patterns = [
            // Basic patterns (1-20)
            { name: 'rain', spawn: 1, speed: 1, horizontal: 0, pattern: 'straight' },
            { name: 'diagonal_left', spawn: 1, speed: 1.2, horizontal: -0.5, pattern: 'straight' },
            { name: 'diagonal_right', spawn: 1, speed: 1.2, horizontal: 0.5, pattern: 'straight' },
            { name: 'zigzag_slow', spawn: 1, speed: 0.8, horizontal: 0, pattern: 'zigzag' },
            { name: 'wave_gentle', spawn: 1, speed: 1, horizontal: 0, pattern: 'wave' },
            { name: 'double_rain', spawn: 2, speed: 1, horizontal: 0, pattern: 'straight' },
            { name: 'triple_diagonal', spawn: 3, speed: 0.9, horizontal: 0.3, pattern: 'straight' },
            { name: 'spiral_intro', spawn: 1, speed: 1.1, horizontal: 0, pattern: 'spiral' },
            { name: 'sine_wave', spawn: 1, speed: 1, horizontal: 0, pattern: 'sine' },
            { name: 'spread_shot', spawn: 3, speed: 1.2, horizontal: 0.5, pattern: 'straight' },
            { name: 'converge', spawn: 2, speed: 1, horizontal: -0.3, pattern: 'straight' },
            { name: 'random_walk', spawn: 1, speed: 0.9, horizontal: 0, pattern: 'random' },
            { name: 'wall_left', spawn: 5, speed: 1, horizontal: 0.2, pattern: 'straight' },
            { name: 'wall_right', spawn: 5, speed: 1, horizontal: -0.2, pattern: 'straight' },
            { name: 'fast_single', spawn: 1, speed: 2, horizontal: 0, pattern: 'straight' },
            { name: 'slow_crowd', spawn: 4, speed: 0.5, horizontal: 0, pattern: 'straight' },
            { name: 'bounce_walls', spawn: 2, speed: 1.3, horizontal: 1, pattern: 'bounce' },
            { name: 'homing_slow', spawn: 1, speed: 0.7, horizontal: 0, pattern: 'homing' },
            { name: 'v_formation', spawn: 5, speed: 1.1, horizontal: 0, pattern: 'straight' },
            { name: 'random_speed', spawn: 3, speed: Math.random() * 2, horizontal: 0, pattern: 'straight' },

            // Intermediate patterns (21-50)
            { name: 'zigzag_fast', spawn: 2, speed: 1.5, horizontal: 0, pattern: 'zigzag' },
            { name: 'spiral_double', spawn: 2, speed: 1.3, horizontal: 0, pattern: 'spiral' },
            { name: 'wave_intense', spawn: 3, speed: 1.4, horizontal: 0, pattern: 'wave' },
            { name: 'cross_pattern', spawn: 4, speed: 1.2, horizontal: 0.5, pattern: 'straight' },
            { name: 'diamond', spawn: 4, speed: 1.1, horizontal: 0.3, pattern: 'zigzag' },
            { name: 'circle_spawn', spawn: 6, speed: 1, horizontal: 0, pattern: 'spiral' },
            { name: 'random_burst', spawn: Math.floor(Math.random() * 5) + 1, speed: 1.3, horizontal: Math.random() - 0.5, pattern: 'random' },
            { name: 'sine_double', spawn: 2, speed: 1.2, horizontal: 0, pattern: 'sine' },
            { name: 'homing_double', spawn: 2, speed: 0.9, horizontal: 0, pattern: 'homing' },
            { name: 'bounce_chaos', spawn: 3, speed: 1.5, horizontal: 1.5, pattern: 'bounce' },
            { name: 'acceleration', spawn: 1, speed: 0.5 + (score / 5000), horizontal: 0, pattern: 'straight' },
            { name: 'deceleration', spawn: 1, speed: 2 - (score / 10000), horizontal: 0, pattern: 'straight' },
            { name: 'split_stream', spawn: 2, speed: 1.3, horizontal: 0.7, pattern: 'straight' },
            { name: 'merge_stream', spawn: 2, speed: 1.3, horizontal: -0.7, pattern: 'straight' },
            { name: 'pulse_wave', spawn: Math.abs(Math.sin(score / 100)) * 5 + 1, speed: 1.2, horizontal: 0, pattern: 'wave' },
            { name: 'spiral_triple', spawn: 3, speed: 1.4, horizontal: 0, pattern: 'spiral' },
            { name: 'zigzag_wall', spawn: 4, speed: 1.2, horizontal: 0, pattern: 'zigzag' },
            { name: 'sine_wall', spawn: 4, speed: 1.1, horizontal: 0, pattern: 'sine' },
            { name: 'random_wall', spawn: 5, speed: 1, horizontal: 0, pattern: 'random' },
            { name: 'homing_wall', spawn: 3, speed: 0.8, horizontal: 0, pattern: 'homing' },
            { name: 'grid_spawn', spawn: 6, speed: 1.2, horizontal: 0, pattern: 'straight' },
            { name: 'shotgun', spawn: 7, speed: 1.5, horizontal: Math.random() * 2 - 1, pattern: 'straight' },
            { name: 'laser_left', spawn: 8, speed: 2, horizontal: 0.1, pattern: 'straight' },
            { name: 'laser_right', spawn: 8, speed: 2, horizontal: -0.1, pattern: 'straight' },
            { name: 'helix', spawn: 2, speed: 1.3, horizontal: 0, pattern: 'spiral' },
            { name: 'double_helix', spawn: 4, speed: 1.3, horizontal: 0, pattern: 'spiral' },
            { name: 'chaos_mode', spawn: Math.random() * 8 + 1, speed: Math.random() * 2 + 0.5, horizontal: Math.random() * 2 - 1, pattern: 'random' },
            { name: 'snake', spawn: 5, speed: 1.2, horizontal: 0, pattern: 'sine' },
            { name: 'pyramid', spawn: 5, speed: 1.1, horizontal: 0, pattern: 'straight' },
            { name: 'reverse_pyramid', spawn: 5, speed: 1.1, horizontal: 0, pattern: 'straight' },

            // Advanced patterns (51-80)
            { name: 'quantum_flux', spawn: Math.floor(Math.random() * 10) + 1, speed: Math.random() * 3, horizontal: Math.random() * 3 - 1.5, pattern: 'random' },
            { name: 'blackhole', spawn: 10, speed: 0.5, horizontal: 0, pattern: 'spiral' },
            { name: 'supernova', spawn: 12, speed: 3, horizontal: Math.random() * 2 - 1, pattern: 'straight' },
            { name: 'matrix_rain', spawn: 15, speed: 1 + Math.random(), horizontal: 0, pattern: 'straight' },
            { name: 'tornado', spawn: 6, speed: 1.5, horizontal: 0, pattern: 'spiral' },
            { name: 'earthquake', spawn: 8, speed: Math.random() * 2 + 0.5, horizontal: Math.random() * 3 - 1.5, pattern: 'random' },
            { name: 'tsunami', spawn: 20, speed: 0.8, horizontal: 0.2, pattern: 'wave' },
            { name: 'meteor_shower', spawn: Math.floor(Math.random() * 15) + 5, speed: 2 + Math.random(), horizontal: Math.random() - 0.5, pattern: 'straight' },
            { name: 'laser_grid', spawn: 10, speed: 2.5, horizontal: 0, pattern: 'straight' },
            { name: 'pinwheel', spawn: 8, speed: 1.4, horizontal: 0, pattern: 'spiral' },
            { name: 'dna_strand', spawn: 4, speed: 1.3, horizontal: 0, pattern: 'spiral' },
            { name: 'fractal', spawn: 7, speed: 1.2, horizontal: 0, pattern: 'sine' },
            { name: 'lightning', spawn: 3, speed: 4, horizontal: Math.random() * 2 - 1, pattern: 'zigzag' },
            { name: 'blizzard', spawn: 12, speed: 0.6, horizontal: Math.random() * 0.5, pattern: 'random' },
            { name: 'firestorm', spawn: 8, speed: 2.2, horizontal: 0, pattern: 'wave' },
            { name: 'gravity_well', spawn: 6, speed: Math.sin(score / 50) * 2 + 1, horizontal: 0, pattern: 'spiral' },
            { name: 'time_warp', spawn: 5, speed: Math.abs(Math.cos(score / 100)) * 3, horizontal: 0, pattern: 'straight' },
            { name: 'dimension_rift', spawn: 4, speed: 1.5, horizontal: Math.sin(score / 30), pattern: 'sine' },
            { name: 'plasma_burst', spawn: 9, speed: 1.8, horizontal: 0, pattern: 'random' },
            { name: 'neutron_star', spawn: 11, speed: 0.4, horizontal: 0, pattern: 'spiral' },
            { name: 'gamma_ray', spawn: 2, speed: 5, horizontal: 0, pattern: 'straight' },
            { name: 'solar_flare', spawn: 7, speed: 2.5, horizontal: Math.random() - 0.5, pattern: 'wave' },
            { name: 'asteroid_belt', spawn: 13, speed: Math.random() * 2 + 0.8, horizontal: 0.1, pattern: 'straight' },
            { name: 'comet_tail', spawn: 6, speed: 1.6, horizontal: 0.3, pattern: 'wave' },
            { name: 'pulsar', spawn: Math.abs(Math.sin(score / 20)) * 10 + 1, speed: 2, horizontal: 0, pattern: 'straight' },
            { name: 'quasar', spawn: 8, speed: 1.7, horizontal: 0, pattern: 'spiral' },
            { name: 'void', spawn: 0, speed: 0, horizontal: 0, pattern: 'straight' }, // Brief pause
            { name: 'singularity', spawn: 1, speed: 0.3, horizontal: 0, pattern: 'homing' },
            { name: 'multiverse', spawn: Math.floor(Math.random() * 20) + 1, speed: Math.random() * 4, horizontal: Math.random() * 4 - 2, pattern: ['straight', 'zigzag', 'wave', 'spiral', 'sine', 'random', 'homing', 'bounce'][Math.floor(Math.random() * 8)] },
            { name: 'infinity_loop', spawn: 8, speed: 1.5, horizontal: 0, pattern: 'sine' },

            // Extreme patterns (81-100)
            { name: 'apocalypse', spawn: 25, speed: 2, horizontal: Math.random() * 2 - 1, pattern: 'random' },
            { name: 'armageddon', spawn: 30, speed: 1.5, horizontal: 0, pattern: 'straight' },
            { name: 'ragnarok', spawn: 20, speed: 2.5, horizontal: Math.random() - 0.5, pattern: 'zigzag' },
            { name: 'omega_wave', spawn: 15, speed: 3, horizontal: 0, pattern: 'wave' },
            { name: 'alpha_storm', spawn: 18, speed: 1.8, horizontal: Math.random() * 1.5 - 0.75, pattern: 'spiral' },
            { name: 'hyperdrive', spawn: 10, speed: 4, horizontal: 0, pattern: 'straight' },
            { name: 'wormhole', spawn: 12, speed: Math.random() * 3 + 1, horizontal: Math.sin(score / 50) * 2, pattern: 'spiral' },
            { name: 'dark_matter', spawn: 14, speed: 0.8, horizontal: Math.random() * 0.5, pattern: 'homing' },
            { name: 'antimatter', spawn: 8, speed: 3.5, horizontal: 0, pattern: 'bounce' },
            { name: 'big_bang', spawn: 40, speed: 0.5, horizontal: 0, pattern: 'straight' },
            { name: 'heat_death', spawn: 1, speed: 0.1, horizontal: 0, pattern: 'straight' },
            { name: 'cosmic_strings', spawn: 6, speed: 2.8, horizontal: Math.random() * 2 - 1, pattern: 'sine' },
            { name: 'higgs_field', spawn: 11, speed: 1.6, horizontal: 0, pattern: 'random' },
            { name: 'planck_scale', spawn: Math.floor(Math.random() * 30) + 10, speed: Math.random() * 5, horizontal: Math.random() * 4 - 2, pattern: 'random' },
            { name: 'event_horizon', spawn: 16, speed: 0.6, horizontal: 0, pattern: 'spiral' },
            { name: 'tachyon_burst', spawn: 5, speed: 6, horizontal: Math.random() - 0.5, pattern: 'straight' },
            { name: 'chronosphere', spawn: 9, speed: Math.abs(Math.sin(score / 100)) * 4, horizontal: 0, pattern: 'wave' },
            { name: 'paradox', spawn: Math.floor(Math.random() * 2) * 20, speed: Math.random() * 5, horizontal: Math.random() * 3 - 1.5, pattern: 'random' },
            { name: 'entropy_max', spawn: 35, speed: Math.random() * 3 + 0.5, horizontal: Math.random() * 2 - 1, pattern: 'random' },
            { name: 'final_boss', spawn: 50, speed: 2, horizontal: 0, pattern: 'homing' }
        ];

        // Select pattern based on wave number or score
        const index = waveNumber % patterns.length;
        const pattern = patterns[index];

        // Scale difficulty based on score
        const difficultyScale = 1 + (score / 10000);
        pattern.speed *= difficultyScale;
        const maxScale = Math.min(difficultyScale, 3);
        pattern.spawn = Math.floor(pattern.spawn * maxScale);

        return pattern;
    };

    // Start streaming game
    const startGame = useCallback(async () => {
        resetGame();
        setGameState('playing');
        // Initialize sound system on user interaction
        await soundManager.initialize();
    }, [resetGame]);

    // Show mode select
    const showModeSelect = useCallback(() => {
        console.log('🎮 showModeSelect called - switching to mode select');
        setGameState('modeSelect');
    }, []);

    // State for tracking if score was submitted
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastGameScore, setLastGameScore] = useState(0);
    const [lastSurvivalTime, setLastSurvivalTime] = useState(0);

    // Manual score submission function
    const submitScoreManually = useCallback(async () => {
        if (!user) {
            alert('Please log in to submit your score!');
            return;
        }

        if (isSubmitting || scoreSubmitted) return;

        setIsSubmitting(true);

        // Use current score if lastGameScore is 0
        const scoreToSubmit = lastGameScore || score;
        const timeToSubmit = lastSurvivalTime || frameCountRef.current / 60;

        console.log('🎮 Manual score submission initiated:', {
            score: scoreToSubmit,
            time: timeToSubmit,
            user: user.email
        });

        try {
            const { data: result, error } = await supabase.rpc('submit_game_score', {
                new_score: scoreToSubmit,
                new_survival_time: timeToSubmit
            });

            if (error) {
                console.error('❌ Manual submission error:', error);
                alert(`Failed to submit score: ${error.message}`);
            } else {
                console.log('✅ Score submitted manually!', result);
                setScoreSubmitted(true);
                alert('Score submitted successfully!');

                // Refresh leaderboard
                if (onGameEnd) {
                    setTimeout(() => onGameEnd(), 500);
                }
            }
        } catch (error) {
            console.error('❌ Exception during manual submission:', error);
            alert('Error submitting score. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [user, lastGameScore, lastSurvivalTime, score, isSubmitting, scoreSubmitted, onGameEnd]);

    // End game
    const endGame = useCallback(async () => {
        // Store final score and survival time BEFORE changing state
        const finalScore = score;
        const finalSurvivalTime = gameTimeRef.current;

        setGameState('gameOver');
        setScoreSubmitted(false); // Reset submission status for new game over
        setLastGameScore(finalScore); // Store the score for manual submission
        setLastSurvivalTime(finalSurvivalTime); // Store survival time

        console.log('Game ended - Score:', finalScore, 'Survival time:', finalSurvivalTime);

        // Update daily streak system for addiction
        const today = new Date().toDateString();
        const lastPlay = localStorage.getItem('lastPlayDate');
        const currentStreak = parseInt(localStorage.getItem('dailyStreak') || '0');

        if (lastPlay !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastPlay === yesterday.toDateString()) {
                // Consecutive day - increase streak
                dailyStreakRef.current = currentStreak + 1;
                localStorage.setItem('dailyStreak', dailyStreakRef.current.toString());
            } else {
                // Missed a day - reset streak (harsh punishment)
                dailyStreakRef.current = 1;
                localStorage.setItem('dailyStreak', '1');
            }
            localStorage.setItem('lastPlayDate', today);
        } else {
            dailyStreakRef.current = currentStreak;
        }

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('cellBreakHighScore', score.toString());
        }

        // Auto-submit score and award SLURP if user is logged in
        console.log('🎮 EndGame called:', {
            score: score,
            user: user ? user.email : 'NULL',
            userId: user?.id,
            profile: profile?.username,
            timestamp: new Date().toISOString()
        });

        if (!user) {
            console.warn('❌ User object is NULL - cannot save score');
            console.log('Full user object:', user);
            console.log('Profile object:', profile);
            alert('⚠️ You must be logged in to save your score to the leaderboard!');
        } else if (score > 0) {
            console.log('✅ User authenticated, proceeding with score submission...');
            try {
                // Check if user is properly authenticated
                console.log('🔐 Verifying auth with Supabase.auth.getUser()...');
                const { data: authUser, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error('❌ Auth verification error:', authError);
                    alert(`Auth error: ${authError.message}`);
                    return;
                }

                if (!authUser.user) {
                    console.error('❌ No authenticated user in Supabase response');
                    console.log('Auth response:', authUser);
                    alert('Your session expired. Please log in again to save scores.');
                    return;
                }

                console.log('✅ Auth verified:', {
                    userId: authUser.user.id,
                    email: authUser.user.email
                });

                // Calculate survival time in seconds
                const survivalTime = gameTimeRef.current;

                // Log the score being submitted
                console.log(`🚀 Submitting score:`, {
                    user: user.email,
                    userId: user.id,
                    score: score,
                    survivalTime: survivalTime,
                    gameMode: gameMode || 'standard'
                });

                // Use the database function that handles both score submission and SLURP awarding
                console.log('💾 Calling supabase.rpc("submit_game_score") with params:', {
                    new_score: score,
                    new_survival_time: survivalTime
                });

                const { data: result, error } = await supabase.rpc('submit_game_score', {
                    new_score: score,
                    new_survival_time: survivalTime
                });

                if (error) {
                    console.error('❌ RPC Error submitting score:', error);
                    console.error('Error details:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    // Show error to user
                    alert(`❌ Failed to submit score: ${error.message}\n\nPlease try refreshing the page.`);
                } else {
                    console.log('✅ Score submitted successfully!');
                    console.log('RPC Response:', result);
                    console.log('Score details:', {
                        score: score,
                        survivalTime: survivalTime,
                        timestamp: new Date().toISOString()
                    });

                    setScoreSubmitted(true); // Mark as submitted

                    // Force immediate leaderboard refresh
                    if (onGameEnd) {
                        setTimeout(() => {
                            onGameEnd();
                        }, 500);
                    }

                    // Update mission progress
                    const { data: missionResult, error: missionError } = await supabase.rpc('update_mission_progress', {
                        p_user_id: user.id,
                        p_score: score,
                        p_survival_time: survivalTime,
                        p_daily_streak: dailyStreakRef.current
                    });

                    if (missionError) {
                        console.error('Mission progress error:', missionError);
                    } else if (missionResult && missionResult.completed_missions > 0) {
                        console.log(`Completed ${missionResult.completed_missions} missions!`);
                    }
                }
            } catch (error) {
                console.error('❌ Exception during score submission:', error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
                alert(`Error submitting score: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            console.log('⚠️ Score is 0, not submitting');
        }

        // Trigger leaderboard refresh after score submission
        if (onGameEnd && user) {
            console.log('Will refresh leaderboard after score submission...');
            // Wait 3 seconds for score to be submitted to database
            setTimeout(() => {
                console.log('Refreshing leaderboard (3s)...');
                onGameEnd();
            }, 3000);
            // Also refresh again after 5 seconds in case of delay
            setTimeout(() => {
                console.log('Refreshing leaderboard again (5s)...');
                onGameEnd();
            }, 5000);
            // And once more after 8 seconds for good measure
            setTimeout(() => {
                console.log('Final leaderboard refresh (8s)...');
                onGameEnd();
            }, 8000);
        }
    }, [score, highScore, user, onGameEnd]);

    // Game loop
    const gameLoop = () => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const player = playerRef.current;
        const obstacles = obstaclesRef.current;
        const powerUps = powerUpsRef.current;
        const activePowerUps = activePowerUpsRef.current;
        const keys = keysRef.current;

        frameCountRef.current++;
        gameTimeRef.current = frameCountRef.current / 60; // Convert to seconds

        // Check Rush mode time limit
        const gameModeConfig = getGameModeConfig(gameMode);
        if (gameModeConfig.timeLimit && gameTimeRef.current >= gameModeConfig.timeLimit) {
            // Time's up in Rush mode!
            soundManager.play('powerup', 1.0); // Victory sound
            endGame();
            return;
        }

        // Update screen shake
        const shake = screenShakeRef.current;
        if (shake.duration > 0) {
            shake.duration--;
            shake.offsetX = (Math.random() - 0.5) * shake.intensity;
            shake.offsetY = (Math.random() - 0.5) * shake.intensity;
            shake.intensity *= 0.9; // Decay
        } else {
            shake.offsetX = 0;
            shake.offsetY = 0;
        }

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Risk/Reward Zones
        const zoneTime = frameCountRef.current % 600; // Change zones every 10 seconds
        if (zoneTime < 300) {
            // Golden Zone - left side for 5 seconds
            const gradient = ctx.createLinearGradient(0, 0, canvas.width / 3, 0);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width / 3, canvas.height);

            // Text indicator
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = '16px Arial';
            ctx.fillText('2X ZONE', 10, canvas.height - 20);
        } else {
            // Golden Zone - right side for 5 seconds
            const gradient = ctx.createLinearGradient(canvas.width * 2/3, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(canvas.width * 2/3, 0, canvas.width / 3, canvas.height);

            // Text indicator
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = '16px Arial';
            ctx.fillText('2X ZONE', canvas.width - 80, canvas.height - 20);
        }

        // Danger Zone - center always
        const dangerGradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/3);
        dangerGradient.addColorStop(0, 'rgba(255, 0, 0, 0.05)');
        dangerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = dangerGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply screen shake transform
        ctx.save();
        ctx.translate(shake.offsetX, shake.offsetY);

        // Check for minute marks and give shield
        const currentMinute = Math.floor(gameTimeRef.current / 60);
        if (currentMinute > lastMinuteShieldRef.current) {
            lastMinuteShieldRef.current = currentMinute;
            // Add 10-second shield
            activePowerUps.push({
                type: 'shield',
                endTime: frameCountRef.current + (10 * 60) // 10 seconds at 60fps
            });
        }

        // Update active power-ups
        for (let i = activePowerUps.length - 1; i >= 0; i--) {
            if (frameCountRef.current >= activePowerUps[i].endTime) {
                const expiredPowerUp = activePowerUps.splice(i, 1)[0];
                // Reset effects when power-up expires
                if (expiredPowerUp.type === 'speed') {
                    player.speed = PLAYER_BASE_SPEED;
                }
            }
        }

        // Handle dash movement
        const dash = dashRef.current;
        if (player.isDashing) {
            dash.currentDashFrame++;

            // Dash movement
            const dashSpeed = dash.dashDistance / dash.dashDuration;
            player.x += dashSpeed * player.dashDirection;
            player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));

            // Create dash trail particles
            particlesRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y + PLAYER_HEIGHT / 2,
                vx: -player.dashDirection * 2,
                vy: 0,
                life: 20,
                color: '#00ffff88',
                size: PLAYER_WIDTH / 2,
                type: 'trail'
            });

            // End dash
            if (dash.currentDashFrame >= dash.dashDuration) {
                player.isDashing = false;
                player.invulnerable = false;
                // Keep some momentum from dash
                player.vx = player.dashDirection * 3;
            }
        }

        // Reduce dash cooldown
        const dashConfig = getGameModeConfig(gameMode);
        if (player.dashCooldown > 0) {
            // Apply mode dash cooldown multiplier
            player.dashCooldown -= dashConfig.dashCooldownMultiplier;
            player.dashCooldown = Math.max(0, player.dashCooldown);
        }

        // ICE PHYSICS MOVEMENT - Player continues drifting
        if (!player.isDashing) {
            const isMovingLeft = keys['ArrowLeft'] || keys['a'];
            const isMovingRight = keys['ArrowRight'] || keys['d'];

            // Ice acceleration (lower = more slippery)
            const ICE_ACCELERATION = 0.4;
            // Ice friction (lower = more slippery)
            const ICE_FRICTION = 0.92;
            const MAX_VELOCITY = 8;

            // Apply acceleration based on input
            if (isMovingLeft) {
                player.vx -= ICE_ACCELERATION;
                keyHoldTimeRef.current.left += 1;
                keyHoldTimeRef.current.right = 0;
            } else {
                keyHoldTimeRef.current.left = 0;
            }

            if (isMovingRight) {
                player.vx += ICE_ACCELERATION;
                keyHoldTimeRef.current.right += 1;
                keyHoldTimeRef.current.left = 0;
            } else {
                keyHoldTimeRef.current.right = 0;
            }

            // Apply friction when no input (but never fully stop)
            if (!isMovingLeft && !isMovingRight) {
                player.vx *= ICE_FRICTION;
                // Small threshold to eventually stop
                if (Math.abs(player.vx) < 0.1) {
                    player.vx *= 0.9; // Extra friction when very slow
                }
            }

            // Cap maximum velocity
            player.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, player.vx));

            // Apply velocity to position
            player.x += player.vx;

            // Bounce off walls (reverse momentum)
            if (player.x <= 0) {
                player.x = 0;
                player.vx = Math.abs(player.vx) * 0.5; // Bounce right with reduced speed
            } else if (player.x >= canvas.width - PLAYER_WIDTH) {
                player.x = canvas.width - PLAYER_WIDTH;
                player.vx = -Math.abs(player.vx) * 0.5; // Bounce left with reduced speed
            }
        }

        // Anti-camping system & AI Learning - track player movement
        const currentFrame = frameCountRef.current;
        const currentPlayerX = player.x;

        // Add current position to history
        playerPositionHistoryRef.current.push({ x: currentPlayerX, frame: currentFrame });

        // Keep only last 3 seconds of history (180 frames at 60fps)
        playerPositionHistoryRef.current = playerPositionHistoryRef.current.filter(
            pos => currentFrame - pos.frame <= 180
        );

        // AI Learning System - Analyze player behavior
        const behavior = playerBehaviorRef.current;

        // Update heatmap (which zone player is in)
        const zoneIndex = Math.floor((currentPlayerX / canvas.width) * 10);
        if (zoneIndex >= 0 && zoneIndex < 10) {
            behavior.heatmap[zoneIndex]++;
        }

        // Track movement patterns
        behavior.lastPositions.push(currentPlayerX);
        if (behavior.lastPositions.length > 30) {
            behavior.lastPositions.shift();

            // Calculate average position (preferred zone)
            behavior.preferredX = behavior.lastPositions.reduce((a, b) => a + b, 0) / behavior.lastPositions.length;

            // Track dodge direction preference
            const movements = behavior.lastPositions.slice(-10);
            let leftMoves = 0, rightMoves = 0;
            for (let i = 1; i < movements.length; i++) {
                const diff = movements[i] - movements[i - 1];
                if (diff < -5) leftMoves++;
                if (diff > 5) rightMoves++;
            }
            behavior.dodgeCount.left += leftMoves;
            behavior.dodgeCount.right += rightMoves;

            // Calculate dodge preference
            const total = behavior.dodgeCount.left + behavior.dodgeCount.right;
            if (total > 20) {
                behavior.dodgeDirection = behavior.dodgeCount.left > behavior.dodgeCount.right ? -1 : 1;
            }
        }

        // Check if player is camping (staying in small area for too long)
        isCampingRef.current = false;
        if (playerPositionHistoryRef.current.length > 120) { // At least 2 seconds of data
            const positions = playerPositionHistoryRef.current;
            const minX = Math.min(...positions.map(p => p.x));
            const maxX = Math.max(...positions.map(p => p.x));
            const movementRange = maxX - minX;

            // Update camping tendency for AI
            behavior.campingTendency = Math.max(0, Math.min(1, 1 - (movementRange / 200)));

            // If player hasn't moved more than 60 pixels in 2 seconds, they're camping
            if (movementRange < 60) {
                isCampingRef.current = true;
            }
        }

        // SMART ADAPTIVE DIFFICULTY - 50% faster progression with intelligent adjustments
        const gameTimeSeconds = gameTimeRef.current;
        const difficulty = difficultyRef.current;

        // Calculate player skill level
        const totalAttempts = difficulty.dodgeSuccess + difficulty.dodgeFails;
        if (totalAttempts > 10) {
            difficulty.skillLevel = difficulty.dodgeSuccess / totalAttempts;
        }

        // Update performance history
        if (frameCountRef.current % 300 === 0) { // Every 5 seconds
            const currentPerformance = difficulty.perfectStreak > 5 ? 1 :
                                       difficulty.perfectStreak > 2 ? 0.7 :
                                       difficulty.frustrationLevel > 3 ? 0.2 : 0.5;
            difficulty.performanceHistory.push(currentPerformance);
            if (difficulty.performanceHistory.length > 6) { // Keep last 30 seconds
                difficulty.performanceHistory.shift();
            }
        }

        // Calculate adaptive difficulty multiplier
        const avgPerformance = difficulty.performanceHistory.length > 0 ?
            difficulty.performanceHistory.reduce((a, b) => a + b, 0) / difficulty.performanceHistory.length : 0.5;

        // Smart adjustment based on performance
        if (avgPerformance > 0.8 && difficulty.perfectStreak > 3) {
            // Player is doing too well - increase difficulty
            difficulty.difficultyMultiplier = Math.min(1.5, difficulty.difficultyMultiplier + 0.02);
        } else if (avgPerformance < 0.3 || difficulty.frustrationLevel > 5) {
            // Player is struggling - ease up
            difficulty.difficultyMultiplier = Math.max(0.7, difficulty.difficultyMultiplier - 0.03);
        } else {
            // Normalize back to standard
            difficulty.difficultyMultiplier += (1.0 - difficulty.difficultyMultiplier) * 0.01;
        }

        // UPDATE HARDCORE DIFFICULTY
        const hardcoreDifficulty = hardcoreDifficultyRef.current;
        hardcoreDifficulty.updateScore(score, gameTimeRef.current);
        const difficultyLevel = hardcoreDifficulty.getDifficulty();
        const specialEvent = hardcoreDifficulty.getSpecialEvent();

        // Use hardcore difficulty spawn interval
        let baseSpawnFrequency = difficultyLevel.spawnInterval;

        // Apply hardcore multipliers
        let spawnFrequency = baseSpawnFrequency;

        // Special event handling
        if (specialEvent) {
            // INSANE difficulty spikes
            if (specialEvent.type === 'BULLET_HELL') {
                spawnFrequency = 3; // Spawn every 3 frames!
            } else if (specialEvent.type === 'SWARM_ATTACK') {
                spawnFrequency = 4;
            } else if (specialEvent.type === 'LASER_WALLS') {
                spawnFrequency = 5;
            }
        }

        // No mercy mode - keep it hardcore
        spawnFrequency = Math.max(3, Math.floor(spawnFrequency)); // Minimum 3 frames (absolutely insane)

        // CONTINUOUS RANDOM SPAWNING SYSTEM
        const spawn = continuousSpawnRef.current;
        const columnWidth = canvas.width / spawn.coverageMap.length;

        // Update coverage map
        spawn.coverageMap = spawn.coverageMap.map((_, i) => {
            const columnX = i * columnWidth;
            return obstacles.filter(o =>
                o.x >= columnX &&
                o.x < columnX + columnWidth &&
                o.y > -OBSTACLE_SIZE &&
                o.y < canvas.height
            ).length;
        });

        // Use hardcore difficulty intervals
        const spawnConfig = getGameModeConfig(gameMode);
        let targetInterval = spawnFrequency;

        // Add some randomness to keep it unpredictable
        targetInterval += Math.random() * 3 - 1.5;
        targetInterval = Math.max(3, targetInterval);

        // Apply mode multiplier
        targetInterval = targetInterval / spawnConfig.spawnRateMultiplier;

        // Spawn new obstacles continuously
        if (frameCountRef.current >= spawn.nextSpawnTime) {
            // Find columns with least coverage
            const minCoverage = Math.min(...spawn.coverageMap);
            const emptyCols = spawn.coverageMap
                .map((count, i) => ({ count, index: i }))
                .filter(col => col.count <= minCoverage + 1)
                .map(col => col.index);

            // Choose column (prefer empty ones)
            let targetColumn;
            if (emptyCols.length > 0) {
                targetColumn = emptyCols[Math.floor(Math.random() * emptyCols.length)];
            } else {
                // All columns have obstacles, choose randomly
                do {
                    targetColumn = Math.floor(Math.random() * spawn.coverageMap.length);
                } while (targetColumn === spawn.lastColumnSpawned && Math.random() < 0.7);
            }

            spawn.lastColumnSpawned = targetColumn;

            // Calculate X position with slight randomness
            const baseX = targetColumn * columnWidth;
            const obstacleX = baseX + Math.random() * (columnWidth - OBSTACLE_SIZE);

            // Determine obstacle properties
            const obstacleType = Math.random() > 0.5 ? 'buy' : 'sell';

            // Use hardcore difficulty speed
            const speedConfig = getGameModeConfig(gameMode);
            let speed = OBSTACLE_SPEED * difficultyLevel.obstacleSpeed;

            // Add variety between obstacle types
            speed *= (obstacleType === 'buy' ? 1.15 : 1.0);

            // Apply hardcore mode double speed
            if (hardcoreModeRef.current) {
                speed *= 2.0;
            }

            // Apply mode speed multiplier
            speed *= speedConfig.obstacleSpeedMultiplier;

            // Random variation for unpredictability
            speed += (Math.random() - 0.5) * 1.0;

            // No cap - let it get insane!
            speed = Math.max(OBSTACLE_SPEED, speed);

            // Get pattern from hardcore difficulty
            let pattern = hardcoreDifficulty.getPattern();

            // Special event patterns override
            if (specialEvent) {
                if (specialEvent.type === 'BULLET_HELL') {
                    pattern = Math.random() > 0.5 ? 'random' : 'homing';
                } else if (specialEvent.type === 'LASER_WALLS') {
                    pattern = 'straight'; // Fast straight lines
                } else if (specialEvent.type === 'TRAP_FORMATION') {
                    pattern = Math.random() > 0.5 ? 'spiral' : 'zigzag';
                }
            }

            let horizontalSpeed = 0;
            let horizontalDirection: 1 | -1 | undefined = undefined;

            if (score > 3000) {
                // Even more complex combinations
                const ultraPatterns = ['random', 'homing', 'bounce', 'spiral'];
                if (Math.random() < 0.5) {
                    pattern = ultraPatterns[Math.floor(Math.random() * ultraPatterns.length)] as any;
                }
            }

            // Stagger spawn with slight delay for visual interest
            const spawnDelay = Math.random() * 10;

            obstacles.push({
                x: obstacleX,
                y: -OBSTACLE_SIZE - spawnDelay,
                speed: speed,
                type: obstacleType,
                fromSide: 'top',
                horizontalSpeed: horizontalSpeed || (Math.random() - 0.5) * 2,
                horizontalDirection: horizontalDirection,
                movementPattern: pattern as any,
                patternPhase: 0,
                spawnDelay: spawnDelay,
                amplitude: Math.random() * 50 + 25,
                frequency: Math.random() * 0.1 + 0.05,
                frozen: false
            });

            // HARDCORE MULTI-SPAWN based on difficulty
            if (Math.random() < difficultyLevel.multiSpawnChance) {
                // Spawn multiple obstacles based on difficulty
                const burstPattern = hardcoreDifficulty.getBurstPattern(gameTimeRef.current);
                const extraCount = Math.min(burstPattern.count - 1, 8); // Already spawned 1
                for (let i = 0; i < extraCount; i++) {
                    const availableCols = spawn.coverageMap
                        .map((_, idx) => idx)
                        .filter(idx => idx !== targetColumn);

                    if (availableCols.length > 0) {
                        const extraCol = availableCols[Math.floor(Math.random() * availableCols.length)];
                        const extraX = extraCol * columnWidth + Math.random() * (columnWidth - OBSTACLE_SIZE);

                        obstacles.push({
                            x: extraX,
                            y: -OBSTACLE_SIZE - (i + 1) * 30 - Math.random() * 20,
                            speed: speed + (Math.random() - 0.5),
                            type: Math.random() > 0.5 ? 'buy' : 'sell',
                            fromSide: 'top',
                            horizontalSpeed: Math.random() < 0.3 ? Math.random() * 1.5 : 0,
                            horizontalDirection: Math.random() > 0.5 ? 1 : -1,
                            movementPattern: 'straight',
                            patternPhase: 0
                        });
                    }
                }
            }

            // Set next spawn time with randomness
            spawn.nextSpawnTime = frameCountRef.current + targetInterval;

        }

        // CORNER SPAWN - Anti-camping mechanism
        // If player is in corner, spawn blocks targeting that corner
        const cornerThreshold = 60; // pixels from corner
        const isInCorner = (
            (player.x < cornerThreshold || player.x > canvas.width - cornerThreshold - PLAYER_WIDTH) &&
            (player.y < cornerThreshold || player.y > canvas.height - cornerThreshold - PLAYER_HEIGHT)
        );

        if (isInCorner && frameCountRef.current % 45 === 0) { // Every 0.75 seconds in corner
            console.log('Player camping in corner - spawning corner block!');

            // Determine which corner
            const isLeft = player.x < canvas.width / 2;
            const isTop = player.y < canvas.height / 2;

            // Spawn diagonal block from opposite corner
            const cornerObstacle: Obstacle = {
                x: isLeft ? canvas.width : -OBSTACLE_SIZE,
                y: isTop ? canvas.height : -OBSTACLE_SIZE,
                speed: OBSTACLE_SPEED * difficultyLevel.obstacleSpeed * 1.5, // Faster corner blocks
                type: 'buy', // Always dangerous
                fromSide: isLeft ? 'right' : 'left',
                horizontalSpeed: 3, // Fast diagonal movement
                horizontalDirection: isLeft ? -1 : 1,
                movementPattern: 'homing', // Track player
                patternPhase: 0,
                targetX: player.x,
                amplitude: 0,
                frequency: 0
            };
            obstacles.push(cornerObstacle);

            // Also spawn from the same corner to trap
            const trapObstacle: Obstacle = {
                x: isLeft ? -OBSTACLE_SIZE : canvas.width,
                y: isTop ? -OBSTACLE_SIZE : canvas.height,
                speed: OBSTACLE_SPEED * difficultyLevel.obstacleSpeed * 1.3,
                type: 'sell',
                fromSide: isLeft ? 'left' : 'right',
                horizontalSpeed: 2.5,
                horizontalDirection: isLeft ? 1 : -1,
                movementPattern: 'straight',
                patternPhase: 0
            };
            obstacles.push(trapObstacle);
        }

        // HARDCORE SIDE SPAWNS - based on difficulty
        const shouldSpawnSide = Math.random() < difficultyLevel.sideSpawnChance;

        if (shouldSpawnSide && frameCountRef.current % 30 === 0) { // Check every half second
            const behavior = playerBehaviorRef.current;

            // Spawn from left or right based on player's dodge preference
            const spawnFromLeft = behavior.dodgeDirection > 0 ? Math.random() < 0.7 : Math.random() < 0.3;

            // AI-targeted vertical position
            let targetY = player.y;

            // Predict where player will be based on movement patterns
            if (behavior.campingTendency < 0.3) {
                // Active player - predict movement
                targetY += (Math.random() - 0.5) * 100;
            } else {
                // Camping player - target directly
                targetY += (Math.random() - 0.5) * 30;
            }

            // Ensure targetY is within bounds
            targetY = Math.max(100, Math.min(canvas.height - 100, targetY));

            const sideObstacle: Obstacle = {
                x: spawnFromLeft ? -OBSTACLE_SIZE : canvas.width,
                y: targetY,
                speed: OBSTACLE_SPEED * difficultyLevel.obstacleSpeed * 1.2, // Faster side attacks
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                fromSide: spawnFromLeft ? 'left' : 'right'
            };

            obstacles.push(sideObstacle);

            // ALWAYS spawn from both sides at higher difficulty
            if (difficultyLevel.dangerLevel >= 5 || (behavior.campingTendency > 0.6 && Math.random() < 0.5)) {
                const oppositeObstacle: Obstacle = {
                    x: spawnFromLeft ? canvas.width : -OBSTACLE_SIZE,
                    y: targetY + (Math.random() - 0.5) * 50,
                    speed: OBSTACLE_SPEED * difficultyLevel.obstacleSpeed * 1.2,
                    type: Math.random() > 0.5 ? 'buy' : 'sell',
                    fromSide: spawnFromLeft ? 'right' : 'left'
                };
                obstacles.push(oppositeObstacle);
            }
        }

        // Variable reward powerup spawning for addiction
        const baseSpawnRate = 240; // Base: every 4 seconds
        const streakBonus = Math.max(0, dailyStreakRef.current - 1) * 20; // More frequent with streaks
        const variableRate = baseSpawnRate - streakBonus + (Math.random() * 120 - 60); // Add randomness

        if (frameCountRef.current % Math.max(120, Math.floor(variableRate)) === 0) {
            const types: PowerUp['type'][] = ['shield', 'slow', 'nuke', 'speed', 'score'];
            const weights = [0.25, 0.25, 0.15, 0.2, 0.15]; // Different spawn rates

            let random = Math.random();
            let selectedType: PowerUp['type'] = 'shield';

            for (let i = 0; i < types.length; i++) {
                if (random < weights[i]) {
                    selectedType = types[i];
                    break;
                }
                random -= weights[i];
            }

            // Spawn power-ups with adjusted size after 5000 score
            const spawnSize = score > 5000 ? POWERUP_SIZE * 3 : POWERUP_SIZE;
            powerUps.push({
                x: Math.random() * Math.max(0, canvas.width - spawnSize),
                y: -spawnSize,
                type: selectedType
            });
        }

        // Check if freeze is active and unfreeze when expired
        const freezeActive = activePowerUps.some(p => p.type === 'freeze');
        if (!freezeActive) {
            obstacles.forEach(o => {
                if (o.frozen) {
                    o.frozen = false;
                    o.speed = o.speed * 10; // Restore original speed - reverse the 0.1 multiplier
                }
            });
        }

        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];

            // Move obstacles based on their origin
            if (obstacle.fromSide === 'left') {
                obstacle.x += obstacle.speed;
            } else if (obstacle.fromSide === 'right') {
                obstacle.x -= obstacle.speed;
            } else {
                obstacle.y += obstacle.speed;

                // Apply COMPLEX ALGORITHMIC movement patterns
                obstacle.patternPhase = (obstacle.patternPhase || 0) + 0.05;

                if (obstacle.movementPattern === 'zigzag') {
                    // Sharp zigzag with acceleration
                    const zigzagSpeed = Math.sin(obstacle.patternPhase * 3) * 4;
                    obstacle.x += zigzagSpeed;
                } else if (obstacle.movementPattern === 'wave') {
                    // Smooth sine wave
                    const waveAmp = obstacle.amplitude || 40;
                    obstacle.x += Math.sin(obstacle.patternPhase * 2) * waveAmp * 0.1;
                } else if (obstacle.movementPattern === 'spiral') {
                    // Expanding spiral
                    const spiralRadius = (obstacle.patternPhase * 10) % 50;
                    obstacle.x += Math.cos(obstacle.patternPhase * 4) * spiralRadius * 0.05;
                    obstacle.y += Math.sin(obstacle.patternPhase * 4) * 0.5; // Slight Y variation
                } else if (obstacle.movementPattern === 'sine') {
                    // Complex sine with multiple frequencies
                    const freq1 = Math.sin(obstacle.patternPhase * 2);
                    const freq2 = Math.sin(obstacle.patternPhase * 5) * 0.3;
                    obstacle.x += (freq1 + freq2) * 3;
                } else if (obstacle.movementPattern === 'random') {
                    // Perlin noise-like random movement
                    if (Math.random() < 0.1) {
                        obstacle.horizontalDirection = (Math.random() - 0.5) > 0 ? 1 : -1;
                    }
                    obstacle.x += (Math.random() - 0.5) * 4 + (obstacle.horizontalDirection || 0) * 2;
                } else if (obstacle.movementPattern === 'homing') {
                    // Slowly home toward player
                    const playerCenterX = player.x + PLAYER_WIDTH / 2;
                    const obstacleCenterX = obstacle.x + OBSTACLE_SIZE / 2;
                    const diff = playerCenterX - obstacleCenterX;
                    obstacle.x += Math.sign(diff) * Math.min(Math.abs(diff * 0.02), 2);
                } else if (obstacle.movementPattern === 'bounce') {
                    // Bouncing ball physics
                    obstacle.x += (obstacle.horizontalSpeed || 3) * (obstacle.horizontalDirection || 1);
                    // Add gravity-like acceleration
                    obstacle.horizontalSpeed = (obstacle.horizontalSpeed || 3) * 1.01;
                } else if (obstacle.horizontalSpeed && obstacle.horizontalDirection) {
                    // Default movement with drift
                    obstacle.x += obstacle.horizontalSpeed * obstacle.horizontalDirection;
                    // Add slight drift over time
                    obstacle.horizontalSpeed *= 1.002;
                }

                // Bounce off walls
                if (obstacle.horizontalDirection && (obstacle.x <= 0 || obstacle.x >= canvas.width - OBSTACLE_SIZE)) {
                    obstacle.horizontalDirection *= -1;
                    obstacle.x = Math.max(0, Math.min(canvas.width - OBSTACLE_SIZE, obstacle.x));
                }
            }

            // Remove off-screen obstacles
            const isOffScreen = obstacle.fromSide === 'left' ? obstacle.x > canvas.width :
                               obstacle.fromSide === 'right' ? obstacle.x < -OBSTACLE_SIZE :
                               obstacle.y > canvas.height;

            if (isOffScreen) {
                obstacles.splice(i, 1);

                // Comeback mechanic: extra points if player is doing poorly
                let basePoints = 10;
                if (score < 50 && gameTimeRef.current > 10) {
                    basePoints = 15; // Boost struggling players
                }

                // Streak multiplier for progression addiction
                const streakMultiplier = 1 + (dailyStreakRef.current * 0.1);
                const finalPoints = Math.floor(basePoints * streakMultiplier);

                // Apply mode score multiplier
                const scoreConfig = getGameModeConfig(gameMode);
                let modeAdjustedPoints = Math.floor(finalPoints * scoreConfig.scoreMultiplier);

                // Double points in hardcore mode
                if (hardcoreModeRef.current) {
                    modeAdjustedPoints *= 2;
                }

                setScore(prev => {
                    // Play score sound for significant points
                    if (modeAdjustedPoints >= 20) {
                        soundManager.play('scoreBonus', 0.3);
                    }
                    return prev + modeAdjustedPoints;
                });
                continue;
            }

            // Achievement checking
            if (comboMultiplier >= 10 && !achievementRef.current.combo10) {
                achievementRef.current.combo10 = true;
                setShowAchievement('🏆 COMBO MASTER! 10x Combo!');
                setTimeout(() => setShowAchievement(null), 3000);
                setScore(prev => prev + 500); // Bonus points
            }
            if (comboMultiplier >= 25 && !achievementRef.current.combo25) {
                achievementRef.current.combo25 = true;
                setShowAchievement('🔥 UNSTOPPABLE! 25x Combo!');
                setTimeout(() => setShowAchievement(null), 3000);
                setScore(prev => prev + 1500); // Big bonus
            }
            if (comboMultiplier >= 50 && !achievementRef.current.combo50) {
                achievementRef.current.combo50 = true;
                setShowAchievement('💥 LEGENDARY! 50x Combo!');
                setTimeout(() => setShowAchievement(null), 3000);
                setScore(prev => prev + 5000); // Huge bonus
            }

            // Time-based achievements
            const survivalTime = gameTimeRef.current;
            if (survivalTime >= 30 && !achievementRef.current.survivor30) {
                achievementRef.current.survivor30 = true;
                setShowAchievement('⏰ 30 SECONDS SURVIVED!');
                setTimeout(() => setShowAchievement(null), 3000);
                setScore(prev => prev + 1000);
            }
            if (survivalTime >= 60 && !achievementRef.current.survivor60) {
                achievementRef.current.survivor60 = true;
                setShowAchievement('🕑 ONE MINUTE WARRIOR!');
                setTimeout(() => setShowAchievement(null), 3000);
                setScore(prev => prev + 3000);
            }
            if (survivalTime >= 120 && !achievementRef.current.survivor120) {
                achievementRef.current.survivor120 = true;
                setShowAchievement('🎆 LEGENDARY STREAMER!');
                setTimeout(() => setShowAchievement(null), 3000);
                setScore(prev => prev + 10000);
            }

            // Near-miss detection for addictive dopamine hits
            const playerCenterX = player.x + PLAYER_WIDTH / 2;
            const playerCenterY = player.y + PLAYER_HEIGHT / 2;
            const obstacleCenterX = obstacle.x + OBSTACLE_SIZE / 2;
            const obstacleCenterY = obstacle.y + OBSTACLE_SIZE / 2;
            const distance = Math.sqrt(
                Math.pow(playerCenterX - obstacleCenterX, 2) +
                Math.pow(playerCenterY - obstacleCenterY, 2)
            );

            // Near miss if within 35 pixels but not colliding
            if (distance < 35 && distance > 20) {
                nearMissCountRef.current++;
                if (nearMissCountRef.current % 3 === 0) { // Every 3rd near miss
                    setScore(prev => prev + 2); // Small dopamine reward
                }
            }

            // Track near misses for skill assessment
            const distX = Math.min(
                Math.abs(player.x - (obstacle.x + OBSTACLE_SIZE)),
                Math.abs((player.x + PLAYER_WIDTH) - obstacle.x)
            );
            const distY = Math.min(
                Math.abs(player.y - (obstacle.y + OBSTACLE_SIZE)),
                Math.abs((player.y + PLAYER_HEIGHT) - obstacle.y)
            );

            // Near miss detection - reward skilled dodging
            if (distX < 15 && distY < 15 && !(
                player.x < obstacle.x + OBSTACLE_SIZE &&
                player.x + PLAYER_WIDTH > obstacle.x &&
                player.y < obstacle.y + OBSTACLE_SIZE &&
                player.y + PLAYER_HEIGHT > obstacle.y
            )) {
                // Close dodge!
                difficulty.nearMisses++;
                difficulty.dodgeSuccess++;
                difficulty.perfectStreak++;
                nearMissCountRef.current++;

                // Reward based on how close the dodge was
                if (distX < 5 || distY < 5) {
                    setScore(prev => prev + 10); // Very close dodge
                    difficulty.frustrationLevel = Math.max(0, difficulty.frustrationLevel - 0.5);
                } else {
                    setScore(prev => prev + 5); // Close dodge
                }
            }

            // Check for perfect dodge (within 5 pixels but not colliding)
            const PERFECT_DODGE_THRESHOLD = 8;
            const isNearMiss = (
                Math.abs(player.x - (obstacle.x + OBSTACLE_SIZE)) < PERFECT_DODGE_THRESHOLD ||
                Math.abs((player.x + PLAYER_WIDTH) - obstacle.x) < PERFECT_DODGE_THRESHOLD
            ) && (
                Math.abs(player.y - (obstacle.y + OBSTACLE_SIZE)) < 50 ||
                Math.abs((player.y + PLAYER_HEIGHT) - obstacle.y) < 50
            );

            // Check collision with player
            if (
                player.x < obstacle.x + OBSTACLE_SIZE &&
                player.x + PLAYER_WIDTH > obstacle.x &&
                player.y < obstacle.y + OBSTACLE_SIZE &&
                player.y + PLAYER_HEIGHT > obstacle.y
            ) {
                // Check if player is invulnerable (dashing)
                if (player.invulnerable) {
                    // DASH THROUGH! Big points!
                    obstacles.splice(i, 1);

                    // Update combo
                    const combo = comboRef.current;
                    combo.perfectDodgeStreak++;
                    const dashMultiplier = 1 + Math.floor(combo.perfectDodgeStreak / 3);
                    combo.multiplier = Math.min(10, dashMultiplier);
                    setComboMultiplier(combo.multiplier);

                    // Play explosion and combo sound
                    soundManager.play('explosion', 0.6);
                    if (combo.multiplier > 1 && soundManager.playCombo) {
                        soundManager.playCombo(combo.multiplier);
                    }

                    // Screen shake on dash through!
                    screenShakeRef.current.intensity = 10;
                    screenShakeRef.current.duration = 10;

                    // Huge points for dash through
                    const dashBonus = 100 * combo.multiplier;
                    setScore(prev => prev + dashBonus);
                    setPerfectDodges(prev => prev + 1);

                    // Create explosion particles
                    for (let j = 0; j < 15; j++) {
                        particlesRef.current.push({
                            x: obstacle.x + OBSTACLE_SIZE / 2,
                            y: obstacle.y + OBSTACLE_SIZE / 2,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            life: 40,
                            color: obstacle.type === 'buy' ? '#00ff00' : '#ff0000',
                            size: Math.random() * 6 + 2,
                            type: 'explosion'
                        });
                    }
                    continue;
                }

                // Check if player has shield
                const hasShield = activePowerUps.some(p => p.type === 'shield');
                if (hasShield) {
                    // Destroy obstacle but keep playing
                    obstacles.splice(i, 1);
                    setScore(prev => prev + 25); // Bonus points for shield block
                    difficulty.dodgeSuccess++;
                    difficulty.perfectStreak++;
                } else {

                    // Player hit - reset combo
                    comboRef.current.multiplier = 1;
                    comboRef.current.perfectDodgeStreak = 0;
                    setComboMultiplier(1);

                    // Track for difficulty adjustment
                    difficulty.dodgeFails++;
                    difficulty.perfectStreak = 0;
                    difficulty.frustrationLevel = Math.min(10, difficulty.frustrationLevel + 2);
                    difficulty.lastDeathTime = gameTimeSeconds;

                    // Play death sound
                    soundManager.play('death', 0.8);

                    // Big screen shake on death!
                    screenShakeRef.current.intensity = 20;
                    screenShakeRef.current.duration = 30;

                    endGame();
                    return;
                }
            } else if (isNearMiss && !player.invulnerable) {
                // Perfect dodge detection!
                const combo = comboRef.current;
                combo.nearMissStreak++;
                combo.lastDodgeTime = frameCountRef.current;

                // Check if player is in golden zone for double points
                const zoneTime = frameCountRef.current % 600;
                const inLeftZone = zoneTime < 300 && player.x < canvas.width / 3;
                const inRightZone = zoneTime >= 300 && player.x > canvas.width * 2/3;
                let zoneBonus = 1;

                if (inLeftZone || inRightZone) {
                    zoneBonus = 2; // Double points in golden zone!
                    // Extra particles for zone bonus
                    for (let j = 0; j < 8; j++) {
                        particlesRef.current.push({
                            x: player.x + PLAYER_WIDTH / 2,
                            y: player.y + PLAYER_HEIGHT / 2,
                            vx: (Math.random() - 0.5) * 12,
                            vy: (Math.random() - 0.5) * 12,
                            life: 50,
                            color: '#FFD700',
                            size: Math.random() * 8 + 4,
                            type: 'mega'
                        });
                    }
                    setShowAchievement('💰 ZONE BONUS!');
                    setTimeout(() => setShowAchievement(null), 1000);
                }

                // Create perfect dodge particles
                for (let j = 0; j < 5; j++) {
                    particlesRef.current.push({
                        x: player.x + PLAYER_WIDTH / 2,
                        y: player.y + PLAYER_HEIGHT / 2,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -Math.random() * 3,
                        life: 25,
                        color: '#ffff00',
                        size: Math.random() * 3 + 1,
                        type: 'dodge'
                    });
                }

                // Award perfect dodge points
                if (distX < 5 || distY < 5) {
                    // ULTRA CLOSE!
                    soundManager.play('perfectDodge', 0.7);
                    if (soundManager.playNearMiss) {
                        soundManager.playNearMiss(Math.min(distX, distY));
                    }

                    const perfectBonus = 50 * comboRef.current.multiplier * zoneBonus;
                    setScore(prev => prev + perfectBonus);
                    setPerfectDodges(prev => prev + 1);
                    combo.perfectDodgeStreak++;
                    const newMultiplier = 1 + Math.floor(combo.perfectDodgeStreak / 2);
                    combo.multiplier = Math.min(10, newMultiplier);
                    setComboMultiplier(combo.multiplier);

                    if (combo.multiplier > 1 && soundManager.playCombo) {
                        soundManager.playCombo(combo.multiplier);
                    }
                }
            }
        } // End obstacles loop

        // Update powerups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            powerUp.y += 2;

            // MUCH BIGGER power-ups after 5000 score
            const powerUpSize = score > 5000 ? POWERUP_SIZE * 3 : POWERUP_SIZE;

            // Remove off-screen powerups
            if (powerUp.y > canvas.height) {
                powerUps.splice(i, 1);
                continue;
            }

            // Check collision with player (with bigger hitbox after 5000 score)
            if (
                player.x < powerUp.x + powerUpSize &&
                player.x + PLAYER_WIDTH > powerUp.x &&
                player.y < powerUp.y + powerUpSize &&
                player.y + PLAYER_HEIGHT > powerUp.y
            ) {
                // Play powerup sound
                soundManager.play('powerup', 0.6);

                // Handle powerup effect
                switch (powerUp.type) {
                    case 'nuke':
                        soundManager.play('explosion', 0.8);
                        obstaclesRef.current = [];
                        setScore(prev => prev + obstacles.length * 10 + 50);
                        break;
                    case 'shield':
                        // Add 8-second shield
                        activePowerUps.push({
                            type: 'shield',
                            endTime: frameCountRef.current + (8 * 60)
                        });
                        break;
                    case 'slow':
                        // Slow all obstacles for 6 seconds
                        activePowerUps.push({
                            type: 'slow',
                            endTime: frameCountRef.current + (6 * 60)
                        });
                        obstacles.forEach(o => o.speed = Math.max(1, o.speed * 0.5));
                        break;
                    case 'speed':
                        // Increase player speed for 5 seconds
                        player.speed = PLAYER_BASE_SPEED * 2.5;
                        activePowerUps.push({
                            type: 'speed',
                            endTime: frameCountRef.current + (5 * 60)
                        });
                        break;
                    case 'score':
                        // Instant score boost
                        setScore(prev => prev + 100 + Math.floor(gameTimeRef.current * 5));
                        break;
                    case 'laser':
                        // Activate laser that burns all obstacles in a column
                        activePowerUps.push({
                            type: 'laser',
                            endTime: frameCountRef.current + (3 * 60) // 3 second laser
                        });
                        // Create laser beam effect
                        const laserX = player.x + PLAYER_WIDTH / 2;
                        obstacles.forEach((obstacle) => {
                            if (Math.abs(obstacle.x + OBSTACLE_SIZE / 2 - laserX) < 50) {
                                // Burn obstacles in laser path
                                particlesRef.current.push(
                                    ...Array.from({ length: 10 }, () => ({
                                        x: obstacle.x + OBSTACLE_SIZE / 2,
                                        y: obstacle.y + OBSTACLE_SIZE / 2,
                                        vx: (Math.random() - 0.5) * 4,
                                        vy: (Math.random() - 0.5) * 4,
                                        size: Math.random() * 3 + 1,
                                        color: '#FF0000',
                                        life: 30,
                                        type: 'explosion' as const
                                    }))
                                );
                            }
                        });
                        // Remove burned obstacles
                        obstaclesRef.current = obstacles.filter(
                            obstacle => Math.abs(obstacle.x + OBSTACLE_SIZE / 2 - laserX) >= 50
                        );
                        soundManager.play('explosion', 0.8);
                        setScore(prev => prev + 200);
                        break;
                    case 'freeze':
                        // Freeze all obstacles for 5 seconds
                        activePowerUps.push({
                            type: 'freeze',
                            endTime: frameCountRef.current + (5 * 60)
                        });
                        // Freeze all obstacles
                        obstacles.forEach(o => {
                            o.frozen = true;
                            o.speed = Math.max(0.5, o.speed * 0.1); // Almost stop them
                        });
                        soundManager.play('powerup', 0.6);
                        break;
                    default:
                        // Handle unknown powerup types (bomb, magnet, etc.)
                        console.warn('Unknown powerup type:', powerUp.type);
                        break;
                }
                powerUps.splice(i, 1);
            }
        }

        // Draw obstacles with visual indication of speed difference and side indicators
        obstacles.forEach(obstacle => {
            // Add warning glow for side obstacles
            if (obstacle.fromSide === 'left' || obstacle.fromSide === 'right') {
                ctx.save();
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(obstacle.x - 2, obstacle.y - 2, OBSTACLE_SIZE + 4, OBSTACLE_SIZE + 4);
                ctx.restore();
            }

            // Buy orders are red/orange (faster), sell orders are blue/white (slower)
            ctx.fillStyle = obstacle.type === 'buy' ? '#FF4444' : '#4444FF';
            ctx.fillRect(obstacle.x, obstacle.y, OBSTACLE_SIZE, OBSTACLE_SIZE);

            ctx.strokeStyle = obstacle.type === 'buy' ? '#FF8800' : '#8888FF';
            ctx.lineWidth = 3;
            ctx.strokeRect(obstacle.x, obstacle.y, OBSTACLE_SIZE, OBSTACLE_SIZE);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Show directional arrow for side obstacles
            let symbol = obstacle.type === 'buy' ? '+' : '-';
            if (obstacle.fromSide === 'left') {
                symbol = '→';
            } else if (obstacle.fromSide === 'right') {
                symbol = '←';
            }

            ctx.fillText(
                symbol,
                obstacle.x + OBSTACLE_SIZE / 2,
                obstacle.y + OBSTACLE_SIZE / 2
            );
        });

        // Draw powerups with pulsing effect
        powerUps.forEach(powerUp => {
            const colors = {
                shield: '#00FF00',
                slow: '#00FFFF',
                nuke: '#FF00FF',
                speed: '#FFFF00',
                score: '#FFD700',
                laser: '#FF0000',
                freeze: '#00BFFF',
                bomb: '#FF4500',
                magnet: '#9400D3'
            };

            // MUCH BIGGER power-ups after 5000 score for easier collection
            const baseSize = score > 5000 ? POWERUP_SIZE * 3 : POWERUP_SIZE;
            const pulse = Math.sin(frameCountRef.current * 0.1) * 0.3 + 1;
            const size = baseSize * pulse;

            ctx.fillStyle = colors[powerUp.type];
            ctx.fillRect(
                powerUp.x - (size - baseSize) / 2,
                powerUp.y - (size - baseSize) / 2,
                size,
                size
            );

            // Extra glow for high scores
            if (score > 5000) {
                ctx.shadowColor = colors[powerUp.type];
                ctx.shadowBlur = 20;
            }

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = score > 5000 ? 4 : 2;
            ctx.strokeRect(
                powerUp.x - (size - baseSize) / 2,
                powerUp.y - (size - baseSize) / 2,
                size,
                size
            );

            ctx.shadowBlur = 0;

            ctx.fillStyle = '#000000';
            ctx.font = score > 5000 ? 'bold 28px Arial' : 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const icons = {
                shield: 'S',
                slow: 'T',
                nuke: 'N',
                speed: 'F',
                score: '$',
                laser: 'L',
                freeze: '❄',
                bomb: 'B',
                magnet: 'M'
            };
            ctx.fillText(
                icons[powerUp.type] || '?',
                powerUp.x + baseSize / 2,
                powerUp.y + baseSize / 2
            );
        });

        // Update and draw particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vy += 0.2; // Gravity

            if (particle.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            // Draw particle
            const alpha = particle.life / 40;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;

            if (particle.type === 'trail') {
                // Dash trail - elongated
                ctx.fillRect(particle.x - particle.size / 2, particle.y - 2, particle.size, 4);
            } else {
                // Regular circular particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Draw player with power-up effects
        const isDashing = player.isDashing;
        if (isDashing) {
            // Dash effect - glowing cyan outline
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
        }

        if (profile?.current_skin === 'prison') {
            // Prison stripes pattern
            for (let i = 0; i < PLAYER_HEIGHT; i += 4) {
                ctx.fillStyle = i % 8 < 4 ? '#FF8A00' : '#000000';
                ctx.fillRect(player.x, player.y + i, PLAYER_WIDTH, Math.min(4, PLAYER_HEIGHT - i));
            }
        } else {
            ctx.fillStyle = isDashing ? '#00ffff' : skinColor;
            ctx.fillRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
        }

        ctx.shadowBlur = 0;

        // Visual effects for active power-ups
        if (activePowerUps.some(p => p.type === 'shield')) {
            // Glowing shield effect
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(
                player.x + PLAYER_WIDTH / 2,
                player.y + PLAYER_HEIGHT / 2,
                PLAYER_WIDTH + Math.sin(frameCountRef.current * 0.2) * 3,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }

        if (activePowerUps.some(p => p.type === 'speed')) {
            // Speed trail effect
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(player.x - 2, player.y - 2, PLAYER_WIDTH + 4, PLAYER_HEIGHT + 4);
        }

        // Laser beam effect when active
        if (activePowerUps.some(p => p.type === 'laser')) {
            const laserX = player.x + PLAYER_WIDTH / 2;
            ctx.save();

            // Create gradient for laser beam
            const gradient = ctx.createLinearGradient(laserX, 0, laserX, canvas.height);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)');

            // Draw laser beam
            ctx.fillStyle = gradient;
            ctx.fillRect(laserX - 25, 0, 50, canvas.height);

            // Add glow effect
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(laserX, 0);
            ctx.lineTo(laserX, canvas.height);
            ctx.stroke();

            // Draw laser particles
            for (let y = 0; y < canvas.height; y += 20) {
                const size = Math.sin(frameCountRef.current * 0.1 + y * 0.05) * 3 + 2;
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(laserX + Math.sin(y * 0.1) * 10, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Burn obstacles in laser path continuously
            obstaclesRef.current = obstacles.filter(obstacle => {
                if (Math.abs(obstacle.x + OBSTACLE_SIZE / 2 - laserX) < 30) {
                    // Create burn particles
                    particlesRef.current.push(
                        ...Array.from({ length: 3 }, () => ({
                            x: obstacle.x + OBSTACLE_SIZE / 2,
                            y: obstacle.y + OBSTACLE_SIZE / 2,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                            size: Math.random() * 2 + 1,
                            color: '#FF4500',
                            life: 20,
                            type: 'explosion' as const
                        }))
                    );
                    setScore(prev => prev + 5); // Points for burning
                    return false; // Remove obstacle
                }
                return true; // Keep obstacle
            });
        }

        // Freeze effect visualization
        if (freezeActive) {
            // Draw frost overlay
            ctx.save();
            ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw snowflakes
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 20; i++) {
                const x = Math.sin(frameCountRef.current * 0.01 + i) * canvas.width / 2 + canvas.width / 2;
                const y = (frameCountRef.current * 0.5 + i * 50) % canvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

        // Draw mobile touch zone indicators
        const isMobile = 'ontouchstart' in window;
        if (isMobile && gameState === 'playing') {
            ctx.save();

            // Left touch zone
            if (touchRef.current.touchZones.left) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                ctx.fillRect(0, 0, canvas.width / 2, canvas.height);

                // Active touch indicator
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(canvas.width / 4, canvas.height - 100, 40, 0, Math.PI * 2);
                ctx.fill();
            }

            // Right touch zone
            if (touchRef.current.touchZones.right) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);

                // Active touch indicator
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(canvas.width * 0.75, canvas.height - 100, 40, 0, Math.PI * 2);
                ctx.fill();
            }

            // Touch zone divider
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height * 0.7);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Touch instructions
            if (!touchRef.current.activeTouch) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('TAP TO MOVE', canvas.width / 4, canvas.height - 50);
                ctx.fillText('DOUBLE TAP TO DASH', canvas.width / 4, canvas.height - 30);
                ctx.fillText('TAP TO MOVE', canvas.width * 0.75, canvas.height - 50);
                ctx.fillText('DOUBLE TAP TO DASH', canvas.width * 0.75, canvas.height - 30);
            }

            ctx.restore();
        }

        // Draw UI with glow effects
        ctx.save();

        // Score with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = comboMultiplier > 1 ? '#ffff00' : '#ffffff';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 25);

        // Combo indicator with pulsing effect
        if (comboMultiplier > 1) {
            const pulse = Math.sin(frameCountRef.current * 0.1) * 0.5 + 0.5;
            ctx.shadowBlur = 20 + pulse * 10;
            ctx.shadowColor = '#ffff00';
            ctx.fillStyle = '#ffff00';
            ctx.font = `bold ${18 + pulse * 4}px Arial`;
            ctx.fillText(`COMBO x${comboMultiplier}`, 10, 50);
        }

        ctx.shadowBlur = 0;
        ctx.restore();

        // Game time
        const minutes = Math.floor(gameTimeRef.current / 60);
        const seconds = Math.floor(gameTimeRef.current % 60);
        ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 50);

        // Time until next minute shield
        const timeToMinute = 60 - (gameTimeRef.current % 60);
        if (timeToMinute <= 10) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Shield in: ${Math.ceil(timeToMinute)}s`, 10, 75);
        }

        // DIFFICULTY LEVEL INDICATOR
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';

        // Color based on danger level
        const dangerColors = [
            '#00FF00', '#80FF00', '#FFFF00', '#FFC000',
            '#FF8000', '#FF4000', '#FF0000', '#FF0080',
            '#FF00FF', '#8000FF'
        ];
        const dangerLevel = Math.min(difficultyLevel.dangerLevel - 1, dangerColors.length - 1);
        ctx.fillStyle = dangerColors[dangerLevel];
        ctx.shadowBlur = 15;
        ctx.shadowColor = dangerColors[dangerLevel];

        // Display wave name with pulsing effect
        const pulse = Math.sin(frameCountRef.current * 0.1) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillText(`[${difficultyLevel.waveName}]`, canvas.width / 2, 30);

        // Show rest period countdown
        if (difficultyLevel.waveName === "BREATHER") {
            const cycleTime = gameTimeRef.current % 20; // 20 second cycles
            const restTimeLeft = Math.max(0, 20 - cycleTime);
            ctx.fillStyle = '#00FF00';
            ctx.font = '14px Arial';
            ctx.fillText(`Next wave in: ${restTimeLeft.toFixed(0)}s`, canvas.width / 2, 50);
        }

        // Special event warning
        if (specialEvent) {
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 24px Arial';
            ctx.fillText(`⚠ ${specialEvent.type} ⚠`, canvas.width / 2, 60);
        }

        ctx.restore();


        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`High: ${highScore}`, canvas.width - 10, 25);

        // Daily streak display for FOMO addiction
        if (dailyStreakRef.current > 0) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`🔥 ${dailyStreakRef.current}d streak`, canvas.width - 10, 50);
        }

        // Active power-ups display
        let yOffset = dailyStreakRef.current > 0 ? 75 : 50;
        activePowerUps.forEach(powerUp => {
            const timeLeft = (powerUp.endTime - frameCountRef.current) / 60;
            const colors = {
                shield: '#00FF00',
                slow: '#00FFFF',
                speed: '#FFFF00'
            };

            ctx.fillStyle = colors[powerUp.type as keyof typeof colors] || '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(
                `${powerUp.type.toUpperCase()}: ${timeLeft.toFixed(1)}s`,
                canvas.width - 10,
                yOffset
            );
            yOffset += 20;
        });

        // Restore canvas transform (remove screen shake)
        ctx.restore();

        animationRef.current = requestAnimationFrame(gameLoop);
    }; // End of gameLoop function

    // Handle keyboard input with dash detection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Quick start with Enter key
            if (e.key === 'Enter' && gameState === 'idle') {
                console.log('Enter pressed - starting game');
                showModeSelect();
                return;
            }

            const key = e.key;
            const dash = dashRef.current;
            const player = playerRef.current;
            const now = Date.now();

            // Check for double-tap dash
            if (key === 'ArrowLeft' && !player.isDashing && player.dashCooldown <= 0) {
                if (now - dash.lastTapTime.left < dash.doubleTapThreshold) {
                    // Initiate left dash!
                    player.isDashing = true;
                    player.dashDirection = -1;
                    player.dashCooldown = dash.dashCooldownTime;
                    dash.currentDashFrame = 0;
                    player.invulnerable = true;

                    // Play dash sound
                    soundManager.play('dash', 0.8);

                    // Create dash particles
                    for (let i = 0; i < 10; i++) {
                        particlesRef.current.push({
                            x: player.x + PLAYER_WIDTH / 2,
                            y: player.y + PLAYER_HEIGHT / 2,
                            vx: Math.random() * 4 + 2,
                            vy: (Math.random() - 0.5) * 4,
                            life: 30,
                            color: '#00ffff',
                            size: Math.random() * 4 + 2,
                            type: 'dash'
                        });
                    }
                }
                dash.lastTapTime.left = now;
            } else if (key === 'ArrowRight' && !player.isDashing && player.dashCooldown <= 0) {
                if (now - dash.lastTapTime.right < dash.doubleTapThreshold) {
                    // Initiate right dash!
                    player.isDashing = true;
                    player.dashDirection = 1;
                    player.dashCooldown = dash.dashCooldownTime;
                    dash.currentDashFrame = 0;
                    player.invulnerable = true;

                    // Play dash sound
                    soundManager.play('dash', 0.8);

                    // Create dash particles
                    for (let i = 0; i < 10; i++) {
                        particlesRef.current.push({
                            x: player.x + PLAYER_WIDTH / 2,
                            y: player.y + PLAYER_HEIGHT / 2,
                            vx: Math.random() * -4 - 2,
                            vy: (Math.random() - 0.5) * 4,
                            life: 30,
                            color: '#00ffff',
                            size: Math.random() * 4 + 2,
                            type: 'dash'
                        });
                    }
                }
                dash.lastTapTime.right = now;
            }

            keysRef.current[key] = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState, showModeSelect]);

    // Enhanced mobile touch controls with dash support
    const touchRef = useRef({
        lastTapTime: { left: 0, right: 0 },
        activeTouch: null as 'left' | 'right' | null,
        touchStartX: 0,
        touchZones: { left: false, right: false }
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const now = Date.now();
            const dash = dashRef.current;
            const player = playerRef.current;

            touchRef.current.touchStartX = x;

            // Determine which side was touched
            const isLeft = x < rect.width / 2;
            const side = isLeft ? 'left' : 'right';
            touchRef.current.activeTouch = side;

            // Check for double-tap dash
            const timeSinceLastTap = now - touchRef.current.lastTapTime[side];

            if (timeSinceLastTap < 300 && !player.isDashing && player.dashCooldown <= 0) {
                // Double tap detected - initiate dash!
                player.isDashing = true;
                player.dashDirection = isLeft ? -1 : 1;
                player.dashCooldown = dash.dashCooldownTime;
                dash.currentDashFrame = 0;
                player.invulnerable = true;

                // Play dash sound
                soundManager.play('dash', 0.8);

                // Create dash particles
                for (let i = 0; i < 10; i++) {
                    particlesRef.current.push({
                        x: player.x + PLAYER_WIDTH / 2,
                        y: player.y + PLAYER_HEIGHT / 2,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 4,
                        life: 30,
                        color: '#00ffff',
                        size: Math.random() * 4 + 2,
                        type: 'dash'
                    });
                }

                // Haptic feedback if available
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            } else {
                // Single tap - normal movement
                if (isLeft) {
                    keysRef.current['ArrowLeft'] = true;
                    touchRef.current.touchZones.left = true;
                } else {
                    keysRef.current['ArrowRight'] = true;
                    touchRef.current.touchZones.right = true;
                }
            }

            touchRef.current.lastTapTime[side] = now;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;

            // Update movement based on current touch position
            const isLeft = x < rect.width / 2;

            // Reset all keys first
            keysRef.current['ArrowLeft'] = false;
            keysRef.current['ArrowRight'] = false;
            touchRef.current.touchZones.left = false;
            touchRef.current.touchZones.right = false;

            // Set the appropriate key
            if (isLeft) {
                keysRef.current['ArrowLeft'] = true;
                touchRef.current.touchZones.left = true;
            } else {
                keysRef.current['ArrowRight'] = true;
                touchRef.current.touchZones.right = true;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            keysRef.current['ArrowLeft'] = false;
            keysRef.current['ArrowRight'] = false;
            touchRef.current.touchZones.left = false;
            touchRef.current.touchZones.right = false;
            touchRef.current.activeTouch = null;
        };

        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, []);

    // Initialize canvas and start game loop
    useEffect(() => {
        initCanvas();

        const handleResize = () => {
            initCanvas();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [initCanvas]);

    // Load high score
    useEffect(() => {
        const saved = localStorage.getItem('cellBreakHighScore');
        if (saved) {
            setHighScore(parseInt(saved, 10));
        }
    }, []);

    // Load skin color from profile
    useEffect(() => {
        const loadSkinColor = async () => {
            if (profile?.current_skin && profile.current_skin !== 'default') {
                try {
                    const { data } = await supabase
                        .from('skins')
                        .select('color')
                        .eq('id', profile.current_skin)
                        .single();

                    if (data?.color) {
                        setSkinColor(data.color);
                    }
                } catch (error) {
                    console.error('Error loading skin:', error);
                }
            } else {
                setSkinColor('#FF8A00'); // Default prison orange
            }
        };

        loadSkinColor();
    }, [profile]);

    // Run game loop
    useEffect(() => {
        if (gameState === 'playing') {
            animationRef.current = requestAnimationFrame(gameLoop);
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [gameState]);

    return (
        <div className="relative aspect-video w-full border-2 border-warning-orange bg-black">
            <canvas
                ref={canvasRef}
                className="w-full h-full touch-manipulation"
                style={{ imageRendering: 'pixelated' }}
            />

            {/* Achievement Popup */}
            {showAchievement && (
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce">
                    <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-2xl border-4 border-yellow-300">
                        <p className="text-xl font-bold">{showAchievement}</p>
                    </div>
                </div>
            )}

            {/* In-game UI */}
            {gameState === 'playing' && (
                <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                    <div className="text-white">
                        <p className="text-2xl font-bold">Score: {score}</p>
                        {comboMultiplier > 1 && (
                            <p className="text-xl text-yellow-400 animate-pulse">COMBO x{comboMultiplier}</p>
                        )}
                        {perfectDodges > 0 && (
                            <p className="text-lg text-cyan-400">Perfect: {perfectDodges}</p>
                        )}
                        {/* Combo indicator */}
                        {comboMultiplier > 5 && (
                            <p className="text-lg font-bold mt-2 text-yellow-400 animate-pulse">
                                🔥 COMBO x{comboMultiplier}!
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        {playerRef.current?.dashCooldown > 0 ? (
                            <p className="text-lg text-gray-400">Dash: {Math.ceil(playerRef.current.dashCooldown / 60)}s</p>
                        ) : (
                            <p className="text-lg text-cyan-400 animate-pulse">⚡ DASH READY!</p>
                        )}
                    </div>
                </div>
            )}

            {gameState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                    <h2 className="text-4xl font-bold text-warning-orange mb-2">SLURP BREAK</h2>
                    <p className="text-2xl font-bold text-alarm-red mb-2 animate-pulse">SURVIVE 2 MINUTES = LEGENDARY STREAMER!</p>
                    <p className="text-ash-white mb-4">Survive the trading blocks live on stream!</p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-ash-white/70 mb-4 max-w-md">
                        <div>
                            <p className="text-red-400">🔴 BUY orders (faster)</p>
                            <p className="text-blue-400">🔵 SELL orders (slower)</p>
                        </div>
                        <div>
                            <p className="text-green-400">S = Shield</p>
                            <p className="text-cyan-400">T = Time Slow</p>
                        </div>
                        <div>
                            <p className="text-purple-400">N = Nuke All</p>
                            <p className="text-yellow-400">F = Fast Player</p>
                        </div>
                        <div>
                            <p className="text-yellow-500">$ = Score Boost</p>
                            <p className="text-orange-400">🛡️ Auto-shield every minute!</p>
                        </div>
                    </div>
                    <div className="space-y-1 text-sm text-ash-white/70 mb-6">
                        <p>Use A/D or Arrow Keys to move</p>
                        <p className="text-cyan-400 font-bold">⚡ DOUBLE-TAP to DASH through obstacles!</p>
                        <p>Mobile: Tap left/right sides</p>
                        <p className="text-yellow-400">Perfect dodges = HUGE combo multipliers!</p>
                        <p className="text-warning-orange">Speed increases as minute approaches!</p>
                    </div>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => {
                            console.log('Start button clicked!');
                            showModeSelect();
                        }}
                        style={{ zIndex: 9999, position: 'relative' }}
                    >
                        START STREAMING
                    </Button>
                    <p className="text-xs text-ash-white/50 mt-2">Or press ENTER to start</p>
                </div>
            )}

            {gameState === 'modeSelect' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                    <h2 className="text-3xl font-bold text-warning-orange mb-6">SELECT GAME MODE</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        <button
                            onClick={() => { setGameMode('classic'); startGame(); }}
                            className="border-2 border-warning-orange bg-black/80 p-6 hover:bg-warning-orange/20 transition-all hover:scale-105"
                        >
                            <h3 className="text-xl font-bold text-yellow-400 mb-2">CLASSIC</h3>
                            <p className="text-sm text-ash-white/80">Earn SLURP by surviving</p>
                            <p className="text-xs text-green-400 mt-2">⭐ High scores tracked</p>
                        </button>

                        <button
                            onClick={() => { setGameMode('classic'); hardcoreModeRef.current = true; startGame(); }}
                            className="border-2 border-red-600 bg-black/80 p-6 hover:bg-red-600/20 transition-all hover:scale-105"
                        >
                            <h3 className="text-xl font-bold text-red-600 mb-2">HARDCORE</h3>
                            <p className="text-sm text-ash-white/80">Double speed, double points</p>
                            <p className="text-xs text-red-400 mt-2">💀 For true legends</p>
                        </button>
                    </div>
                    <button
                        onClick={() => setGameState('idle')}
                        className="mt-6 text-ash-white/60 hover:text-ash-white transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            )}

            {gameState === 'gameOver' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                    <h2 className="text-4xl font-bold text-alarm-red mb-4">
                        GAME OVER
                    </h2>
                    {comboMultiplier > 10 && (
                        <p className="text-xl font-bold mb-2 text-yellow-400 animate-pulse">
                            🔥 INSANE COMBO x{comboMultiplier}!
                        </p>
                    )}
                    <div className="text-center mb-4">
                        <p className="text-2xl text-ash-white mb-2">Score: {score}</p>
                        <p className="text-xl text-yellow-400 mb-2">⚡ Perfect Dodges: {perfectDodges}</p>
                        <p className="text-lg text-cyan-400 mb-2">Max Combo: x{Math.max(comboMultiplier, ...Array.from({length: frameCountRef.current}, () => comboRef.current?.multiplier || 1))}</p>
                        <p className="text-xl text-warning-orange mb-2">
                            ⏱️ Survived: {(frameCountRef.current / 60).toFixed(1)} seconds
                        </p>
                        <p className="text-lg text-green-400 mb-2">
                            🔥 Daily Streak: {dailyStreakRef.current} days
                        </p>
                        <p className="text-md text-blue-400 mb-2">
                            ⚡ Near Misses: {nearMissCountRef.current}
                        </p>
                        {gameMode === 'classic' && score === highScore && score > 0 && (
                            <p className="text-warning-orange mb-2">🎉 NEW HIGH SCORE! 🎉</p>
                        )}
                        {dailyStreakRef.current >= 3 && (
                            <p className="text-yellow-400 mb-2">🎁 Streak Bonus Active!</p>
                        )}
                    </div>

                    {/* Submit Score Button - Always show if logged in and score > 0 */}
                    {user && score > 0 && !scoreSubmitted && (
                        <div className="mb-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={submitScoreManually}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700 animate-pulse"
                            >
                                {isSubmitting ? 'SUBMITTING...' : '📤 SUBMIT SCORE TO LEADERBOARD'}
                            </Button>
                            <p className="text-xs text-ash-white/50 mt-2">Score: {score} | Time: {(frameCountRef.current / 60).toFixed(1)}s</p>
                        </div>
                    )}

                    {scoreSubmitted && (
                        <p className="text-green-400 mb-4 font-bold">✅ Score Submitted!</p>
                    )}

                    <div className="space-x-4">
                        <Button variant="primary" size="lg" onClick={() => { setGameMode('classic'); showModeSelect(); }}>
                            MODE SELECT
                        </Button>
                        <Button variant="secondary" size="lg" onClick={startGame}>
                            PLAY AGAIN
                        </Button>
                        {!user && (
                            <Button variant="secondary" size="lg" onClick={onAuthClick}>
                                LOGIN
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CellBreakGameFixed;