import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabaseClient';
import { Icon } from './ui/Icon';

// --- Game Constants ---
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;
const OBSTACLE_SIZE = 30;
const OBSTACLE_SPAWN_RATE_INITIAL = 0.015; // Spawn rate per frame
const OBSTACLE_SPEED_INITIAL = 2;
const OBSTACLE_SPEED_INCREASE = 0.1; // Speed increases faster over time
const POWERUP_SPAWN_CHANCE = 0.005;
const POWERUP_DURATION = 5000; // 5 seconds for shield/slow
const NUKE_RAREITY = 0.1; // 10% chance a powerup is a nuke

// --- Game Types ---
type GameState = 'idle' | 'playing' | 'gameOver';
type PowerUpType = 'shield' | 'slow' | 'nuke';

interface GameObject { x: number; y: number; }
interface Player extends GameObject { vx: number; bob: number; }
interface Obstacle extends GameObject { vy: number; type: 'buy' | 'sell'; rotation?: number; }
interface PowerUp extends GameObject { type: PowerUpType; }
interface ActivePowerUp { type: PowerUpType; endTime: number; }

const CellBreakGame: React.FC<{ onAuthClick: () => void; onOpenShop: () => void; }> = ({ onAuthClick, onOpenShop }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { user, profile } = useAuth();
    
    // Use state for UI changes, refs for game loop data
    const [uiState, setUiState] = useState<GameState>('idle');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
    const [isMobile, setIsMobile] = useState(false);
    const [touchZone, setTouchZone] = useState<'left' | 'right' | null>(null);

    const gameState = useRef<{
        player: Player;
        obstacles: Obstacle[];
        powerUps: PowerUp[];
        activePowerUp: ActivePowerUp | null;
        keys: { [key: string]: boolean };
        animationFrameId: number | null;
        lastTime: number;
        obstacleSpeed: number;
        obstacleSpawnRate: number;
        gameOverTime: number | null;
    }>({
        player: { x: 0, y: 0, vx: 0, bob: 0 },
        obstacles: [],
        powerUps: [],
        activePowerUp: null,
        keys: {},
        animationFrameId: null,
        lastTime: 0,
        obstacleSpeed: OBSTACLE_SPEED_INITIAL,
        obstacleSpawnRate: OBSTACLE_SPAWN_RATE_INITIAL,
        gameOverTime: null,
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

    const resetGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        gameState.current.player = {
            x: canvas.width / 2 - PLAYER_WIDTH / 2,
            y: canvas.height - PLAYER_HEIGHT - 10,
            vx: 0,
            bob: 0
        };
        gameState.current.obstacles = [];
        gameState.current.powerUps = [];
        gameState.current.activePowerUp = null;
        gameState.current.obstacleSpeed = OBSTACLE_SPEED_INITIAL;
        gameState.current.obstacleSpawnRate = OBSTACLE_SPAWN_RATE_INITIAL;
        gameState.current.lastTime = performance.now();
        setScore(0);
        setFeedback('');
        setSubmitStatus('idle');
    }, []);

    const startGame = () => {
        console.log('Starting game...');
        resetGame();
        setUiState('playing');

        // Spawn some initial obstacles for testing
        const canvas = canvasRef.current;
        if (canvas) {
            gameState.current.obstacles = [
                { x: 100, y: 50, vy: 2, type: 'buy', rotation: 0 },
                { x: 200, y: 100, vy: 2, type: 'sell', rotation: 0 },
                { x: 300, y: 0, vy: 2, type: 'buy', rotation: 0 }
            ];
            console.log('Initial obstacles:', gameState.current.obstacles);
        }

        gameLoop(performance.now());
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
            setFeedback('NEW HIGH SCORE!');
        } else if (score > highScore * 0.8) {
            setFeedback('SO CLOSE!');
        } else {
            setFeedback('TRY AGAIN!');
        }
    }, [score, highScore]);
    
    const handleSubmitScore = async () => {
        if (!user) {
            onAuthClick();
            return;
        }
        setSubmitStatus('submitting');
        try {
            const { data, error } = await supabase.rpc('submit_game_score', { new_score: score });
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
        if (!canvas || !ctx) {
            console.log('Canvas or context not available');
            return;
        }

        if (uiState !== 'playing') {
            console.log('Game not in playing state');
            return;
        }

        const deltaTime = timestamp - gameState.current.lastTime;
        gameState.current.lastTime = timestamp;

        // Update score
        setScore(prev => prev + 1);

        // --- UPDATE ---
        const { player, obstacles, powerUps, keys, activePowerUp } = gameState.current;
        
        // Player movement
        player.vx = 0;
        if (keys['a'] || keys['arrowleft']) player.vx = -PLAYER_SPEED;
        if (keys['d'] || keys['arrowright']) player.vx = PLAYER_SPEED;

        // Mobile touch controls
        if (touchZone === 'left') player.vx = -PLAYER_SPEED;
        if (touchZone === 'right') player.vx = PLAYER_SPEED;

        player.x += player.vx;
        player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));

        // Player bobbing animation
        if (player.vx !== 0) {
            player.bob = Math.sin(timestamp / 100) * 2;
        } else {
            player.bob = 0;
        }

        // Update obstacles
        obstacles.forEach(o => {
            o.y += o.vy;
            if (o.rotation !== undefined) o.rotation += 0.05;
        });
        gameState.current.obstacles = obstacles.filter(o => o.y < canvas.height);

        // Update powerups
        powerUps.forEach(p => p.y += OBSTACLE_SPEED_INITIAL); // Slower fall speed
        gameState.current.powerUps = powerUps.filter(p => p.y < canvas.height);


        // Spawn new obstacles
        if (Math.random() < gameState.current.obstacleSpawnRate) {
            const buffer = 0.1; // 10% buffer from edges
            const spawnX = Math.random() * (canvas.width * (1 - buffer * 2)) + (canvas.width * buffer);
            const newObstacle = { x: spawnX, y: -OBSTACLE_SIZE, vy: gameState.current.obstacleSpeed, type: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell', rotation: 0 };
            obstacles.push(newObstacle);
        }
        
        // Progressive difficulty - only increase every 60 frames (~1 second)
        if (Math.floor(timestamp / 1000) % 2 === 0) {
            gameState.current.obstacleSpeed = Math.min(gameState.current.obstacleSpeed + 0.001, 8);
            gameState.current.obstacleSpawnRate = Math.min(gameState.current.obstacleSpawnRate + 0.00001, 0.05);
        }
        
        // Spawn Powerups
        if (Math.random() < POWERUP_SPAWN_CHANCE) {
            const type: PowerUpType = Math.random() < NUKE_RAREITY ? 'nuke' : (Math.random() < 0.5 ? 'shield' : 'slow');
            powerUps.push({ x: Math.random() * (canvas.width - 20), y: -20, type });
        }
        
        // Handle active power-up
        if (activePowerUp && timestamp > activePowerUp.endTime) {
            if (activePowerUp.type === 'slow') {
                 obstacles.forEach(o => o.vy *= 2);
            }
            gameState.current.activePowerUp = null;
        }
        
        // --- COLLISIONS ---
        // Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            if (
                player.x < o.x + OBSTACLE_SIZE &&
                player.x + PLAYER_WIDTH > o.x &&
                player.y < o.y + OBSTACLE_SIZE &&
                player.y + PLAYER_HEIGHT > o.y
            ) {
                if (activePowerUp?.type === 'shield') {
                    obstacles.splice(i, 1);
                } else {
                    endGame();
                    return;
                }
            }
        }
        // Powerups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const p = powerUps[i];
            if (
                player.x < p.x + 20 &&
                player.x + PLAYER_WIDTH > p.x &&
                player.y < p.y + 20 &&
                // FIX: Corrected a typo in the collision detection logic. The variable 'o' was used instead of 'p'.
                player.y + PLAYER_HEIGHT > p.y
            ) {
                powerUps.splice(i, 1);
                if (p.type === 'nuke') {
                    gameState.current.obstacles = [];
                } else if (p.type === 'slow') {
                    obstacles.forEach(o => o.vy /= 2);
                    gameState.current.activePowerUp = { type: 'slow', endTime: timestamp + POWERUP_DURATION };
                } else { // shield
                    gameState.current.activePowerUp = { type: 'shield', endTime: timestamp + POWERUP_DURATION };
                }
            }
        }
        

        // --- DRAW ---
        // Set black background
        ctx.fillStyle = '#0D0D0D';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw obstacles
        if (obstacles.length > 0 && Math.random() < 0.01) {
            console.log('Drawing obstacles:', obstacles.length, 'First obstacle:', obstacles[0]);
        }
        obstacles.forEach(o => {
            ctx.save();

            // Draw with or without rotation
            if (o.rotation !== undefined && o.rotation !== 0) {
                ctx.translate(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2);
                ctx.rotate(o.rotation);
                ctx.fillStyle = o.type === 'buy' ? '#FF4444' : '#FFFFFF';
                ctx.fillRect(-OBSTACLE_SIZE / 2, -OBSTACLE_SIZE / 2, OBSTACLE_SIZE, OBSTACLE_SIZE);

                // Draw border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(-OBSTACLE_SIZE / 2, -OBSTACLE_SIZE / 2, OBSTACLE_SIZE, OBSTACLE_SIZE);

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(o.type === 'buy' ? '+' : '-', 0, 0);
            } else {
                ctx.fillStyle = o.type === 'buy' ? '#FF4444' : '#FFFFFF';
                ctx.fillRect(o.x, o.y, OBSTACLE_SIZE, OBSTACLE_SIZE);

                // Draw border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(o.x, o.y, OBSTACLE_SIZE, OBSTACLE_SIZE);

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(o.type === 'buy' ? '+' : '-', o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2);
            }
            ctx.restore();
        });

        // Draw powerups
        powerUps.forEach(p => {
             ctx.strokeStyle = '#FF8A00';
             ctx.lineWidth = 2;
             ctx.strokeRect(p.x, p.y, 20, 20);
             ctx.fillStyle = '#FF8A00';
             ctx.font = '14px "Press Start 2P"';
             ctx.fillText(p.type === 'shield' ? 'S' : p.type === 'slow' ? 'T' : 'N', p.x + 10, p.y + 10);
        });

        // Draw Player
        ctx.fillStyle = skinColor;
        if (profile?.current_skin === 'prison') {
            // Draw prison stripes
            for (let i = 0; i < PLAYER_HEIGHT; i += 4) {
                ctx.fillStyle = i % 8 < 4 ? '#FF8A00' : '#0D0D0D';
                ctx.fillRect(player.x, player.y + player.bob + i, PLAYER_WIDTH, 2);
            }
        } else {
            ctx.fillRect(player.x, player.y + player.bob, PLAYER_WIDTH, PLAYER_HEIGHT);
        }

        // Add glow effect for epic/legendary skins
        if (profile?.current_skin && ['gold', 'cyber', 'prison', 'neon'].includes(profile.current_skin)) {
            ctx.shadowColor = skinColor;
            ctx.shadowBlur = 10;
            ctx.fillRect(player.x, player.y + player.bob, PLAYER_WIDTH, PLAYER_HEIGHT);
            ctx.shadowBlur = 0;
        }

        // Shield effect
        if (activePowerUp?.type === 'shield') {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, PLAYER_WIDTH, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw UI
        ctx.fillStyle = '#E5E5E5';
        ctx.font = '24px "VT323"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`HI: ${highScore}`, canvas.width - 10, 30);
        
        if (activePowerUp) {
            const timeLeft = (activePowerUp.endTime - timestamp) / 1000;
            ctx.textAlign = 'center';
            ctx.font = '20px "VT323"';
            ctx.fillText(`${activePowerUp.type.toUpperCase()}: ${timeLeft.toFixed(1)}s`, canvas.width / 2, 30);
        }

        gameState.current.animationFrameId = requestAnimationFrame(gameLoop);
    }, [endGame, score, highScore, skinColor, touchZone, profile, uiState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key) gameState.current.keys[e.key.toLowerCase()] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key) gameState.current.keys[e.key.toLowerCase()] = false;
        };

        // Touch controls for mobile
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

        // Detect if mobile
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
    }, []);

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
                 <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/80 p-4 text-center">
                    <h3 className="font-pixel-heading text-3xl text-warning-orange">CELL BREAK</h3>
                    <div className="my-4 border-t-2 border-ash-white/30 pt-4 font-body text-ash-white/80">
                         <p>Dodge the [+] and [-] blocks.</p>
                         <p className="mt-2 text-sm">
                            {isMobile ? 'TAP & HOLD sides to move' : 'Use A/D or Arrow Keys'}
                        </p>
                        <div className="mt-2 flex justify-center gap-4 text-xs">
                            <span className="text-yellow-400">S=Shield</span>
                            <span className="text-cyan-400">T=Time Slow</span>
                            <span className="text-red-400">N=Nuke</span>
                        </div>
                    </div>
                    <Button variant="primary" size="lg" onClick={startGame}>
                        START ESCAPE
                    </Button>
                    {!user && (
                        <Button variant="secondary" size="sm" onClick={onAuthClick} className="mt-2">
                            Login to Save Scores
                        </Button>
                    )}
                </div>
            )}
            
            {uiState === 'gameOver' && (
                <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/80 p-4 text-center">
                    <h3 className="font-pixel-heading text-3xl text-alarm-red">CAPTURED</h3>
                    <p className="mt-2 font-pixel-heading text-xl text-ash-white">SCORE: <span className="text-warning-orange">{score}</span></p>
                    <p className="mt-1 font-pixel-heading text-base text-ash-white/70">HIGH SCORE: {highScore}</p>
                    <p className="mt-4 font-pixel-heading text-lg text-yellow-400 animate-pulse">{feedback}</p>
                    
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
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
                                <Button variant="ghost" size="md" onClick={onOpenShop} icon="shop">
                                    Enter Shop
                                </Button>
                            </>
                         ) : (
                             <Button variant="secondary" size="md" onClick={onAuthClick}>
                                Login to Submit
                            </Button>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CellBreakGame;