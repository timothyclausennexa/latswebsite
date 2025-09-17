import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabaseClient';

// --- Game Constants ---
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 6;
const OBSTACLE_SIZE = 35;
const OBSTACLE_SPAWN_RATE_INITIAL = 0.05;
const OBSTACLE_SPEED_INITIAL = 2;
const OBSTACLE_SPEED_INCREASE = 0.08;
const POWERUP_SPAWN_CHANCE = 0.008;
const POWERUP_DURATION = 5000;
const NUKE_RARITY = 0.15;

// --- Game Types ---
type GameState = 'idle' | 'playing' | 'gameOver' | 'paused';
type PowerUpType = 'shield' | 'slow' | 'nuke' | 'coin' | 'magnet';
type ParticleType = 'explosion' | 'collect' | 'trail';

interface GameObject { x: number; y: number; }
interface Player extends GameObject { vx: number; bob: number; trail: Trail[]; }
interface Obstacle extends GameObject { vx: number; vy: number; type: 'buy' | 'sell'; rotation: number; movePattern: 'straight' | 'zigzag' | 'wave'; zigzagTimer?: number; }
interface PowerUp extends GameObject { type: PowerUpType; vy: number; pulse: number; }
interface ActivePowerUp { type: PowerUpType; endTime: number; }
interface Particle extends GameObject { vx: number; vy: number; life: number; color: string; size: number; type: ParticleType; }
interface Trail extends GameObject { opacity: number; }

const EnhancedCellBreakGame: React.FC<{ onAuthClick: () => void; onOpenShop: () => void; }> = ({ onAuthClick, onOpenShop }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { user, profile } = useAuth();

    // UI State
    const [uiState, setUiState] = useState<GameState>('idle');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [coins, setCoins] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
    const [isMobile, setIsMobile] = useState(false);
    const [touchZone, setTouchZone] = useState<'left' | 'right' | null>(null);

    // Game State Ref
    const gameState = useRef<{
        player: Player;
        obstacles: Obstacle[];
        powerUps: PowerUp[];
        particles: Particle[];
        activePowerUps: ActivePowerUp[];
        keys: { [key: string]: boolean };
        animationFrameId: number | null;
        lastTime: number;
        obstacleSpeed: number;
        obstacleSpawnRate: number;
        gameOverTime: number | null;
        lastObstacleTime: number;
        comboTimer: number;
        difficulty: number;
    }>({
        player: { x: 0, y: 0, vx: 0, bob: 0, trail: [] },
        obstacles: [],
        powerUps: [],
        particles: [],
        activePowerUps: [],
        keys: {},
        animationFrameId: null,
        lastTime: 0,
        obstacleSpeed: OBSTACLE_SPEED_INITIAL,
        obstacleSpawnRate: OBSTACLE_SPAWN_RATE_INITIAL,
        gameOverTime: null,
        lastObstacleTime: 0,
        comboTimer: 0,
        difficulty: 1,
    });

    const skinColor = profile?.current_skin ?
        (profile.current_skin === 'shadow' ? '#0D0D0D' :
         profile.current_skin === 'ghost' ? '#E5E5E5' :
         profile.current_skin === 'blood' ? '#9E3039' :
         profile.current_skin === 'gold' ? '#FFD700' :
         profile.current_skin === 'neon' ? '#39FF14' :
         profile.current_skin === 'cyber' ? '#00FFFF' :
         profile.current_skin === 'prison' ? '#FF8A00' : '#FF8A00')
        : '#FF8A00';

    // Create particles
    const createParticles = (x: number, y: number, type: ParticleType, count: number = 10) => {
        const particles = gameState.current.particles;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = type === 'explosion' ? 3 + Math.random() * 2 : 1 + Math.random();
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: type === 'explosion' ? '#FF4444' :
                       type === 'collect' ? '#FFD700' : skinColor,
                size: type === 'explosion' ? 4 : 2,
                type
            });
        }
    };

    const resetGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        gameState.current = {
            player: {
                x: canvas.width / 2 - PLAYER_WIDTH / 2,
                y: canvas.height - PLAYER_HEIGHT - 10,
                vx: 0,
                bob: 0,
                trail: []
            },
            obstacles: [],
            powerUps: [],
            particles: [],
            activePowerUps: [],
            keys: {},
            animationFrameId: null,
            lastTime: performance.now(),
            obstacleSpeed: OBSTACLE_SPEED_INITIAL,
            obstacleSpawnRate: OBSTACLE_SPAWN_RATE_INITIAL,
            gameOverTime: null,
            lastObstacleTime: 0,
            comboTimer: 0,
            difficulty: 1,
        };
        setScore(0);
        setCombo(0);
        setCoins(0);
        setFeedback('');
        setSubmitStatus('idle');
    }, []);

    const startGame = () => {
        resetGame();
        setUiState('playing');
        gameLoop(performance.now());
    };

    const pauseGame = () => {
        setUiState(uiState === 'paused' ? 'playing' : 'paused');
    };

    const endGame = useCallback(() => {
        if (gameState.current.animationFrameId) {
            cancelAnimationFrame(gameState.current.animationFrameId);
            gameState.current.animationFrameId = null;
        }
        gameState.current.gameOverTime = Date.now();
        setUiState('gameOver');

        if (score > highScore) {
            localStorage.setItem('cellBreakHighScore', score.toString());
            setHighScore(score);
            setFeedback('NEW HIGH SCORE! 🎉');
        } else if (score > highScore * 0.8) {
            setFeedback('SO CLOSE! 💪');
        } else {
            setFeedback('TRY AGAIN! 🎮');
        }
    }, [score, highScore]);

    const handleSubmitScore = async () => {
        if (!user) {
            onAuthClick();
            return;
        }
        setSubmitStatus('submitting');
        try {
            const { data, error } = await supabase.rpc('submit_game_score', {
                new_score: score,
                coins_earned: coins
            });
            if (error) throw error;
            setFeedback(data || 'Score Submitted!');
            setSubmitStatus('submitted');
        } catch (error: any) {
            setFeedback(`Error: ${error.message}`);
            setSubmitStatus('idle');
        }
    };

    const gameLoop = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || uiState === 'paused') return;

        const deltaTime = (timestamp - gameState.current.lastTime) / 16.67; // Normalize to 60fps
        gameState.current.lastTime = timestamp;

        // Update score and difficulty
        setScore(prev => prev + Math.ceil(gameState.current.difficulty));
        gameState.current.difficulty += 0.001;

        // --- UPDATE ---
        const { player, obstacles, powerUps, particles, keys, activePowerUps } = gameState.current;

        // Player movement
        player.vx = 0;
        if (keys['a'] || keys['arrowleft']) player.vx = -PLAYER_SPEED;
        if (keys['d'] || keys['arrowright']) player.vx = PLAYER_SPEED;

        // Mobile touch controls
        if (touchZone === 'left') player.vx = -PLAYER_SPEED;
        if (touchZone === 'right') player.vx = PLAYER_SPEED;

        // Magnet effect
        const hasMagnet = activePowerUps.some(p => p.type === 'magnet');
        if (hasMagnet) {
            powerUps.forEach(p => {
                if (p.type === 'coin') {
                    const dx = player.x - p.x;
                    const dy = player.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        p.x += dx * 0.1;
                        p.y += dy * 0.1;
                    }
                }
            });
        }

        player.x += player.vx * deltaTime;
        player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));

        // Player animation
        if (player.vx !== 0) {
            player.bob = Math.sin(timestamp / 100) * 2;
            // Add trail
            if (Math.random() < 0.3) {
                player.trail.push({
                    x: player.x + PLAYER_WIDTH / 2,
                    y: player.y + PLAYER_HEIGHT,
                    opacity: 0.5
                });
            }
        } else {
            player.bob *= 0.9;
        }

        // Update trail
        player.trail = player.trail.filter(t => {
            t.opacity -= 0.05;
            return t.opacity > 0;
        });

        // Update obstacles with movement patterns
        obstacles.forEach(o => {
            o.y += o.vy * deltaTime;
            o.rotation += 0.05;

            // Apply movement patterns
            if (o.movePattern === 'zigzag') {
                o.zigzagTimer = (o.zigzagTimer || 0) + 1;
                if (o.zigzagTimer % 30 === 0) { // Change direction every 30 frames
                    o.vx = -o.vx;
                }
                o.x += o.vx * deltaTime;
            } else if (o.movePattern === 'wave') {
                o.x += Math.sin(o.y * 0.02) * 2 * deltaTime;
            }

            // Keep obstacles on screen horizontally
            if (o.x < 0) o.x = 0;
            if (o.x > canvas.width - OBSTACLE_SIZE) o.x = canvas.width - OBSTACLE_SIZE;
        });
        // Filter obstacles that go off screen (both top and bottom)
        gameState.current.obstacles = obstacles.filter(o => {
            if (o.vy > 0) return o.y < canvas.height; // BUY blocks going down
            else return o.y > -OBSTACLE_SIZE; // SELL blocks going up
        });

        // Update powerups
        powerUps.forEach(p => {
            p.y += p.vy * deltaTime;
            p.pulse = Math.sin(timestamp / 200) * 0.2 + 1;
        });
        gameState.current.powerUps = powerUps.filter(p => p.y < canvas.height);

        // Update particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life -= 0.02;
            p.vx *= 0.98; // Friction
        });
        gameState.current.particles = particles.filter(p => p.life > 0);

        // Spawn obstacles with patterns - SELL blocks from bottom, BUY blocks from top
        if (timestamp - gameState.current.lastObstacleTime > 1000 / gameState.current.obstacleSpawnRate) {
            const pattern = Math.floor(gameState.current.difficulty / 10);
            const numObstacles = Math.min(pattern + 1, 3);

            for (let i = 0; i < numObstacles; i++) {
                const spacing = canvas.width / (numObstacles + 1);
                const x = spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.5;
                const isSell = Math.random() > 0.5;
                const movePattern = Math.random() < 0.3 ? 'straight' : (Math.random() < 0.6 ? 'zigzag' : 'wave');
                obstacles.push({
                    x: x - OBSTACLE_SIZE / 2,
                    y: isSell ? canvas.height + OBSTACLE_SIZE : -OBSTACLE_SIZE,  // SELL from bottom, BUY from top
                    vx: movePattern === 'zigzag' ? (Math.random() > 0.5 ? 2 : -2) : 0,
                    vy: isSell ? -gameState.current.obstacleSpeed : gameState.current.obstacleSpeed, // SELL goes up, BUY goes down
                    type: isSell ? 'sell' : 'buy',
                    rotation: 0,
                    movePattern,
                    zigzagTimer: 0
                });
            }
            gameState.current.lastObstacleTime = timestamp;
        }

        // Progressive difficulty
        gameState.current.obstacleSpeed += OBSTACLE_SPEED_INCREASE / 60 * deltaTime;
        gameState.current.obstacleSpawnRate += 0.0001 * deltaTime;

        // Spawn Powerups
        if (Math.random() < POWERUP_SPAWN_CHANCE) {
            const rand = Math.random();
            const type: PowerUpType =
                rand < 0.3 ? 'coin' :
                rand < 0.5 ? 'shield' :
                rand < 0.7 ? 'slow' :
                rand < 0.85 ? 'magnet' : 'nuke';

            powerUps.push({
                x: Math.random() * (canvas.width - 20),
                y: -20,
                type,
                vy: OBSTACLE_SPEED_INITIAL * 0.8,
                pulse: 1
            });
        }

        // Handle active power-ups
        gameState.current.activePowerUps = activePowerUps.filter(p => {
            if (timestamp > p.endTime) {
                if (p.type === 'slow') {
                    obstacles.forEach(o => o.vy *= 2);
                }
                return false;
            }
            return true;
        });

        // Combo timer
        if (gameState.current.comboTimer > 0) {
            gameState.current.comboTimer -= deltaTime;
            if (gameState.current.comboTimer <= 0) {
                setCombo(0);
            }
        }

        // --- COLLISIONS ---
        // Check obstacle collisions
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            if (
                player.x < o.x + OBSTACLE_SIZE &&
                player.x + PLAYER_WIDTH > o.x &&
                player.y < o.y + OBSTACLE_SIZE &&
                player.y + PLAYER_HEIGHT > o.y
            ) {
                if (o.type === 'sell') {
                    // SELL blocks give points instead of killing!
                    obstacles.splice(i, 1);
                    createParticles(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2, 'collect', 10);
                    setScore(prev => prev + 100 * Math.max(1, combo));
                    setCombo(prev => prev + 1);
                    setCoins(prev => prev + 5);
                    gameState.current.comboTimer = 120; // 2 seconds at 60fps
                } else if (activePowerUps.some(p => p.type === 'shield')) {
                    // BUY blocks destroyed by shield
                    obstacles.splice(i, 1);
                    createParticles(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2, 'explosion', 15);
                    setCombo(prev => prev + 1);
                    gameState.current.comboTimer = 120; // 2 seconds at 60fps
                } else {
                    // BUY blocks still kill the player
                    createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'explosion', 20);
                    endGame();
                    return;
                }
            }
        }

        // Check powerup collisions
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const p = powerUps[i];
            if (
                player.x < p.x + 20 &&
                player.x + PLAYER_WIDTH > p.x &&
                player.y < p.y + 20 &&
                player.y + PLAYER_HEIGHT > p.y
            ) {
                powerUps.splice(i, 1);
                createParticles(p.x + 10, p.y + 10, 'collect', 8);

                switch (p.type) {
                    case 'coin':
                        setCoins(prev => prev + 10 * Math.max(1, combo));
                        break;
                    case 'nuke':
                        gameState.current.obstacles = [];
                        createParticles(canvas.width / 2, canvas.height / 2, 'explosion', 30);
                        break;
                    case 'slow':
                        obstacles.forEach(o => o.vy /= 2);
                        activePowerUps.push({ type: 'slow', endTime: timestamp + POWERUP_DURATION });
                        break;
                    case 'shield':
                        activePowerUps.push({ type: 'shield', endTime: timestamp + POWERUP_DURATION });
                        break;
                    case 'magnet':
                        activePowerUps.push({ type: 'magnet', endTime: timestamp + POWERUP_DURATION * 0.6 });
                        break;
                }
            }
        }

        // --- DRAW ---
        // Clear canvas - solid black background for better visibility
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw trail
        player.trail.forEach(t => {
            ctx.fillStyle = `rgba(255, 138, 0, ${t.opacity})`;
            ctx.fillRect(t.x - 2, t.y, 4, 4);
        });

        // Draw particles
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        // Draw obstacles
        obstacles.forEach(o => {
            ctx.save();
            ctx.translate(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2);
            ctx.rotate(o.rotation);
            // Bright colors for better visibility
            ctx.fillStyle = o.type === 'buy' ? '#FF0000' : '#00FF00';
            ctx.fillRect(-OBSTACLE_SIZE / 2, -OBSTACLE_SIZE / 2, OBSTACLE_SIZE, OBSTACLE_SIZE);
            // Add white border for better visibility
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(-OBSTACLE_SIZE / 2, -OBSTACLE_SIZE / 2, OBSTACLE_SIZE, OBSTACLE_SIZE);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(o.type === 'buy' ? 'BUY' : 'SELL', 0, 0);
            ctx.restore();
        });

        // Draw powerups
        powerUps.forEach(p => {
            ctx.save();
            ctx.translate(p.x + 10, p.y + 10);
            ctx.scale(p.pulse, p.pulse);

            const colors: { [key: string]: string } = {
                coin: '#FFD700',
                shield: '#00FF00',
                slow: '#00FFFF',
                nuke: '#FF0000',
                magnet: '#FF00FF'
            };

            ctx.strokeStyle = colors[p.type] || '#FF8A00';
            ctx.lineWidth = 2;
            ctx.strokeRect(-10, -10, 20, 20);

            ctx.fillStyle = colors[p.type] || '#FF8A00';
            ctx.font = '12px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const icons: { [key: string]: string } = {
                coin: '$',
                shield: 'S',
                slow: 'T',
                nuke: 'N',
                magnet: 'M'
            };

            ctx.fillText(icons[p.type] || '?', 0, 0);
            ctx.restore();
        });

        // Draw Player
        ctx.fillStyle = skinColor;
        if (profile?.current_skin === 'prison') {
            for (let i = 0; i < PLAYER_HEIGHT; i += 4) {
                ctx.fillStyle = i % 8 < 4 ? '#FF8A00' : '#0D0D0D';
                ctx.fillRect(player.x, player.y + player.bob + i, PLAYER_WIDTH, 2);
            }
        } else {
            if (profile?.current_skin && ['gold', 'cyber', 'neon'].includes(profile.current_skin)) {
                ctx.shadowColor = skinColor;
                ctx.shadowBlur = 15;
            }
            ctx.fillRect(player.x, player.y + player.bob, PLAYER_WIDTH, PLAYER_HEIGHT);
            ctx.shadowBlur = 0;
        }

        // Shield effect
        if (activePowerUps.some(p => p.type === 'shield')) {
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(timestamp / 100) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, PLAYER_WIDTH + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Magnet effect
        if (activePowerUps.some(p => p.type === 'magnet')) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(timestamp / 100) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw UI
        ctx.fillStyle = '#E5E5E5';
        ctx.font = '20px "VT323"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 30);

        if (combo > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`COMBO x${combo}`, 10, 55);
        }

        if (coins > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`COINS: ${coins}`, 10, 80);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#E5E5E5';
        ctx.fillText(`HI: ${highScore}`, canvas.width - 10, 30);

        // Active powerups display
        let yOffset = 55;
        activePowerUps.forEach(p => {
            const timeLeft = (p.endTime - timestamp) / 1000;
            ctx.fillStyle = p.type === 'shield' ? '#00FF00' :
                           p.type === 'slow' ? '#00FFFF' : '#FF00FF';
            ctx.textAlign = 'right';
            ctx.fillText(`${p.type.toUpperCase()}: ${timeLeft.toFixed(1)}s`, canvas.width - 10, yOffset);
            yOffset += 25;
        });

        gameState.current.animationFrameId = requestAnimationFrame(gameLoop);
    }, [endGame, score, highScore, skinColor, touchZone, profile, uiState, combo]);

    // Event handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key) {
                gameState.current.keys[e.key.toLowerCase()] = true;
                if (e.key === 'Escape' && uiState === 'playing') {
                    pauseGame();
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key) gameState.current.keys[e.key.toLowerCase()] = false;
        };

        // Touch controls
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const midpoint = rect.width / 2;

            setTouchZone(x < midpoint ? 'left' : 'right');
        };

        const handleTouchEnd = () => {
            setTouchZone(null);
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const midpoint = rect.width / 2;

            setTouchZone(x < midpoint ? 'left' : 'right');
        };

        // Detect mobile
        setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchmove', handleTouchMove);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            if (gameState.current.animationFrameId) {
                cancelAnimationFrame(gameState.current.animationFrameId);
            }
        };
    }, [uiState]);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('cellBreakHighScore');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const resizeObserver = new ResizeObserver(() => {
                const { width } = canvas.getBoundingClientRect();
                canvas.width = width;
                canvas.height = width / (16/9);
                if (uiState === 'idle') resetGame();
            });
            resizeObserver.observe(canvas.parentElement!);
            return () => resizeObserver.disconnect();
        }
    }, [uiState, resetGame]);

    return (
        <div className="relative aspect-video w-full border-2 border-ash-white/20 bg-prison-black shadow-pixel-lg touch-none select-none">
            <canvas ref={canvasRef} className="h-full w-full"></canvas>

            {uiState === 'idle' && (
                <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/90 p-4 text-center">
                    <h3 className="font-pixel-heading text-4xl text-warning-orange mb-4">CELL BREAK</h3>
                    <div className="my-4 max-w-md border-t-2 border-ash-white/30 pt-4 font-body text-ash-white/80">
                        <p className="text-lg mb-2">🔴 Dodge BUY blocks! 🟢 Collect SELL blocks for points!</p>
                        <p className="mt-2 text-sm">
                            {isMobile ? '📱 TAP & HOLD sides to move' : '⌨️ Use A/D or Arrow Keys'}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            <div className="text-yellow-400">💰 Coins = Points!</div>
                            <div className="text-green-400">🛡️ Shield = Protection</div>
                            <div className="text-cyan-400">⏱️ Slow = Time Control</div>
                            <div className="text-red-400">💣 Nuke = Clear All</div>
                            <div className="text-purple-400">🧲 Magnet = Attract Coins</div>
                            <div className="text-orange-400">🔥 Combo = More Coins!</div>
                        </div>
                    </div>
                    {user ? (
                        <Button variant="primary" size="lg" onClick={startGame} className="mt-4">
                            START ESCAPE
                        </Button>
                    ) : (
                        <Button variant="primary" size="lg" onClick={onAuthClick} className="mt-4">
                            LOGIN TO PLAY & SAVE SCORES
                        </Button>
                    )}
                </div>
            )}

            {uiState === 'paused' && (
                <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/90 p-4 text-center">
                    <h3 className="font-pixel-heading text-3xl text-warning-orange mb-4">PAUSED</h3>
                    <Button variant="primary" size="lg" onClick={pauseGame}>
                        RESUME
                    </Button>
                </div>
            )}

            {uiState === 'gameOver' && (
                <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/90 p-4 text-center">
                    <h3 className="font-pixel-heading text-4xl text-alarm-red mb-2">CAPTURED!</h3>
                    <div className="my-4">
                        <p className="font-pixel-heading text-2xl text-ash-white">
                            SCORE: <span className="text-warning-orange">{score}</span>
                        </p>
                        {coins > 0 && (
                            <p className="font-pixel-heading text-lg text-yellow-400 mt-2">
                                COINS EARNED: {coins}
                            </p>
                        )}
                        <p className="mt-2 font-pixel-heading text-base text-ash-white/70">
                            HIGH SCORE: {highScore}
                        </p>
                    </div>
                    <p className="font-pixel-heading text-xl text-yellow-400 animate-pulse mb-4">
                        {feedback}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="primary" size="md" onClick={startGame}>
                            PLAY AGAIN
                        </Button>
                        {user ? (
                            <>
                                <Button
                                    variant="secondary"
                                    size="md"
                                    onClick={handleSubmitScore}
                                    disabled={submitStatus !== 'idle'}
                                >
                                    {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Score'}
                                </Button>
                                <Button variant="ghost" size="md" onClick={onOpenShop}>
                                    Shop 🛍️
                                </Button>
                            </>
                        ) : (
                            <Button variant="secondary" size="md" onClick={onAuthClick}>
                                Login to Save Score
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedCellBreakGame;