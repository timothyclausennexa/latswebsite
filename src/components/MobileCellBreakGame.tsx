import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabaseClient';

// --- Mobile Game Constants ---
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 24;
const PLAYER_SPEED = 7;
const OBSTACLE_SIZE = 32;
const OBSTACLE_SPAWN_RATE_INITIAL = 0.04;
const OBSTACLE_SPEED_INITIAL = 2.5;
const OBSTACLE_SPEED_INCREASE = 0.08;
const POWERUP_SPAWN_CHANCE = 0.01;
const POWERUP_DURATION = 5000;
const NUKE_RARITY = 0.15;

// Touch control constants
const TOUCH_DEADZONE = 20;
const SWIPE_THRESHOLD = 30;
const TAP_THRESHOLD = 200; // ms for distinguishing tap from hold
const FULLSCREEN_SWIPE_THRESHOLD = 50;

// --- Game Types ---
type GameState = 'idle' | 'playing' | 'gameOver' | 'paused' | 'fullscreen';
type PowerUpType = 'shield' | 'slow' | 'nuke' | 'coin' | 'magnet' | 'multishot' | 'speed';
type ParticleType = 'explosion' | 'collect' | 'trail' | 'sparkle';
type TouchAction = 'move' | 'shoot' | 'special' | 'pause';

interface GameObject { x: number; y: number; }

interface Player extends GameObject {
  vx: number;
  bob: number;
  trail: Trail[];
  shootCooldown: number;
  bullets: Bullet[];
}

interface Bullet extends GameObject {
  vx: number;
  vy: number;
  life: number;
  damage: number;
}

interface Obstacle extends GameObject {
  vx: number;
  vy: number;
  type: 'buy' | 'sell';
  rotation: number;
  movePattern: 'straight' | 'zigzag' | 'wave' | 'homing';
  zigzagTimer?: number;
  health?: number;
  maxHealth?: number;
}

interface PowerUp extends GameObject {
  type: PowerUpType;
  vy: number;
  pulse: number;
  magnetized?: boolean;
}

interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

interface Particle extends GameObject {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type: ParticleType;
  rotation?: number;
}

interface Trail extends GameObject {
  opacity: number;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  action: TouchAction;
  isDragging: boolean;
  identifier: number;
}

const MobileCellBreakGame: React.FC<{ onAuthClick: () => void; onOpenShop: () => void; }> = ({ onAuthClick, onOpenShop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  // UI State
  const [uiState, setUiState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [coins, setCoins] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Mobile-specific state
  const [touches, setTouches] = useState<Map<number, TouchState>>(new Map());
  const [playerMovement, setPlayerMovement] = useState<{ left: boolean; right: boolean; }>({ left: false, right: false });
  const [showTouchHints, setShowTouchHints] = useState(true);
  const [hapticSupported, setHapticSupported] = useState(false);

  // Performance tracking
  const performanceRef = useRef({
    frameCount: 0,
    lastFpsUpdate: 0,
    fps: 60,
    particleLimit: 50, // Reduced for mobile
    drawCalls: 0
  });

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
    isPaused: boolean;
    lastVisibilityChange: number;
  }>({
    player: { x: 0, y: 0, vx: 0, bob: 0, trail: [], shootCooldown: 0, bullets: [] },
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
    isPaused: false,
    lastVisibilityChange: 0,
  });

  // Get dynamic skin color
  const skinColor = profile?.current_skin ?
    (profile.current_skin === 'shadow' ? '#0D0D0D' :
     profile.current_skin === 'ghost' ? '#E5E5E5' :
     profile.current_skin === 'blood' ? '#9E3039' :
     profile.current_skin === 'gold' ? '#FFD700' :
     profile.current_skin === 'neon' ? '#39FF14' :
     profile.current_skin === 'cyber' ? '#00FFFF' :
     profile.current_skin === 'prison' ? '#FF8A00' : '#FF8A00')
    : '#FF8A00';

  // Haptic Feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
    if (!hapticSupported) return;

    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [50],
          selection: [10, 5, 10]
        };
        navigator.vibrate(patterns[type]);
      }
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  }, [hapticSupported]);

  // Fullscreen Management
  const enterFullscreen = useCallback(async () => {
    if (!gameContainerRef.current) return;

    try {
      if (gameContainerRef.current.requestFullscreen) {
        await gameContainerRef.current.requestFullscreen();
      } else if ((gameContainerRef.current as any).webkitRequestFullscreen) {
        await (gameContainerRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setUiState('fullscreen');
      triggerHaptic('medium');
    } catch (error) {
      console.log('Fullscreen not available');
    }
  }, [triggerHaptic]);

  const exitFullscreen = useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
      if (uiState === 'fullscreen') setUiState('playing');
    } catch (error) {
      console.log('Exit fullscreen failed');
    }
  }, [uiState]);

  // Particle System
  const createParticles = useCallback((x: number, y: number, type: ParticleType, count: number = 8) => {
    const particles = gameState.current.particles;
    const maxParticles = performanceRef.current.particleLimit;

    // Limit particles for performance
    if (particles.length >= maxParticles) {
      particles.splice(0, Math.min(count, particles.length));
    }

    for (let i = 0; i < count && particles.length < maxParticles; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = type === 'explosion' ? 3 + Math.random() * 2 : 1 + Math.random();
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: type === 'sparkle' ? 0.5 : 1,
        color: type === 'explosion' ? '#FF4444' :
               type === 'collect' ? '#FFD700' :
               type === 'sparkle' ? skinColor : skinColor,
        size: type === 'explosion' ? 6 : type === 'sparkle' ? 2 : 4,
        type,
        rotation: Math.random() * Math.PI * 2
      });
    }
  }, [skinColor]);

  // Touch Handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only prevent default if the touch is on the canvas
    if (e.target === canvasRef.current) {
      e.preventDefault();
    } else {
      return; // Let other touches pass through
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const canvas = canvasRef.current;
      if (!canvas) continue;

      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const now = Date.now();

      // Determine touch action based on position
      let action: TouchAction = 'move';
      if (y < rect.height * 0.2) {
        action = 'pause';
      } else if (x < rect.width * 0.3) {
        action = 'move'; // Left side for movement
      } else if (x > rect.width * 0.7) {
        action = 'move'; // Right side for movement
      } else {
        action = 'shoot'; // Center for shooting
      }

      const touchState: TouchState = {
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        startTime: now,
        action,
        isDragging: false,
        identifier: touch.identifier
      };

      setTouches(prev => new Map(prev).set(touch.identifier, touchState));

      // Handle immediate actions
      if (action === 'pause' && uiState === 'playing') {
        pauseGame();
        triggerHaptic('medium');
      } else if (action === 'move') {
        const isLeft = x < rect.width / 2;
        setPlayerMovement(prev => ({
          ...prev,
          [isLeft ? 'left' : 'right']: true
        }));
        triggerHaptic('light');
      } else if (action === 'shoot' && uiState === 'playing') {
        // Trigger immediate shot
        const player = gameState.current.player;
        if (player.shootCooldown <= 0) {
          shoot();
          triggerHaptic('selection');
        }
      }
    }

    // Hide touch hints after first interaction
    setShowTouchHints(false);
  }, [uiState, triggerHaptic]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Only prevent default if the touch is on the canvas
    if (e.target === canvasRef.current) {
      e.preventDefault();
    } else {
      return; // Let other touches pass through
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const canvas = canvasRef.current;
      if (!canvas) continue;

      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const touchState = touches.get(touch.identifier);
      if (!touchState) continue;

      const deltaX = x - touchState.startX;
      const deltaY = y - touchState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const updatedTouch = {
        ...touchState,
        currentX: x,
        currentY: y,
        isDragging: distance > TOUCH_DEADZONE
      };

      setTouches(prev => new Map(prev).set(touch.identifier, updatedTouch));

      // Handle movement
      if (touchState.action === 'move' && distance > TOUCH_DEADZONE) {
        const isLeft = touchState.startX < rect.width / 2;
        const isMovingTowardsEdge = isLeft ? deltaX < 0 : deltaX > 0;

        setPlayerMovement(prev => ({
          ...prev,
          [isLeft ? 'left' : 'right']: isMovingTowardsEdge
        }));
      }

      // Check for swipe gestures
      if (distance > SWIPE_THRESHOLD && !touchState.isDragging) {
        const swipeDirection = Math.abs(deltaX) > Math.abs(deltaY) ?
          (deltaX > 0 ? 'right' : 'left') :
          (deltaY > 0 ? 'down' : 'up');

        if (swipeDirection === 'up' && Math.abs(deltaY) > FULLSCREEN_SWIPE_THRESHOLD) {
          if (!isFullscreen && uiState === 'playing') {
            enterFullscreen();
          }
        } else if (swipeDirection === 'down' && isFullscreen) {
          exitFullscreen();
        }
      }
    }
  }, [touches, isFullscreen, uiState, enterFullscreen, exitFullscreen]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Only prevent default if the touch is on the canvas
    if (e.target === canvasRef.current) {
      e.preventDefault();
    } else {
      return; // Let other touches pass through
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchState = touches.get(touch.identifier);

      if (touchState) {
        const now = Date.now();
        const touchDuration = now - touchState.startTime;
        const deltaX = touchState.currentX - touchState.startX;
        const deltaY = touchState.currentY - touchState.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Handle tap vs hold
        if (touchDuration < TAP_THRESHOLD && distance < TOUCH_DEADZONE) {
          // Quick tap - special actions based on area
          if (touchState.action === 'shoot') {
            // Already handled in touchStart
          } else if (touchState.action === 'special') {
            // Use special power if available
            useSpecialPower();
            triggerHaptic('heavy');
          }
        }

        // Clear movement for this touch
        if (touchState.action === 'move') {
          const isLeft = touchState.startX < (canvasRef.current?.getBoundingClientRect().width || 0) / 2;
          setPlayerMovement(prev => ({
            ...prev,
            [isLeft ? 'left' : 'right']: false
          }));
        }

        setTouches(prev => {
          const newTouches = new Map(prev);
          newTouches.delete(touch.identifier);
          return newTouches;
        });
      }
    }
  }, [touches, triggerHaptic]);

  // Game Actions
  const shoot = useCallback(() => {
    const player = gameState.current.player;
    const canvas = canvasRef.current;
    if (!canvas || player.shootCooldown > 0) return;

    const hasMultishot = gameState.current.activePowerUps.some(p => p.type === 'multishot');
    const bulletCount = hasMultishot ? 3 : 1;
    const spreadAngle = hasMultishot ? Math.PI / 6 : 0;

    for (let i = 0; i < bulletCount; i++) {
      const angle = spreadAngle * (i - (bulletCount - 1) / 2);
      player.bullets.push({
        x: player.x + PLAYER_WIDTH / 2,
        y: player.y,
        vx: Math.sin(angle) * 8,
        vy: -8 + Math.cos(angle) * 8,
        life: 1,
        damage: 1
      });
    }

    player.shootCooldown = hasMultishot ? 15 : 10; // Frames
  }, []);

  const useSpecialPower = useCallback(() => {
    const activePowerUps = gameState.current.activePowerUps;
    // Use the first available special power
    for (const powerUp of activePowerUps) {
      if (powerUp.type === 'nuke') {
        gameState.current.obstacles = [];
        createParticles(400, 300, 'explosion', 30);
        return;
      }
    }
  }, [createParticles]);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameState.current = {
      player: {
        x: canvas.width / 2 - PLAYER_WIDTH / 2,
        y: canvas.height - PLAYER_HEIGHT - 30, // Higher up for mobile
        vx: 0,
        bob: 0,
        trail: [],
        shootCooldown: 0,
        bullets: []
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
      isPaused: false,
      lastVisibilityChange: 0,
    };

    setScore(0);
    setCombo(0);
    setCoins(0);
    setFeedback('');
    setSubmitStatus('idle');
    setPlayerMovement({ left: false, right: false });
    setTouches(new Map());
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setUiState('playing');
    setShowTouchHints(true);
    setTimeout(() => setShowTouchHints(false), 5000); // Hide after 5 seconds
    gameLoop(performance.now());
    triggerHaptic('medium');
  }, [resetGame, triggerHaptic]);

  const pauseGame = useCallback(() => {
    if (uiState === 'playing') {
      setUiState('paused');
      gameState.current.isPaused = true;
    } else if (uiState === 'paused') {
      setUiState('playing');
      gameState.current.isPaused = false;
      gameLoop(performance.now());
    }
  }, [uiState]);

  const endGame = useCallback(() => {
    if (gameState.current.animationFrameId) {
      cancelAnimationFrame(gameState.current.animationFrameId);
      gameState.current.animationFrameId = null;
    }
    gameState.current.gameOverTime = Date.now();
    setUiState('gameOver');
    triggerHaptic('heavy');

    if (score > highScore) {
      localStorage.setItem('cellBreakHighScore', score.toString());
      setHighScore(score);
      setFeedback('NEW HIGH SCORE! 🎉');
    } else if (score > highScore * 0.8) {
      setFeedback('SO CLOSE! 💪');
    } else {
      setFeedback('TRY AGAIN! 🎮');
    }
  }, [score, highScore, triggerHaptic]);

  const handleSubmitScore = async () => {
    if (!user) {
      onAuthClick();
      return;
    }
    setSubmitStatus('submitting');
    triggerHaptic('light');

    try {
      const { data, error } = await supabase.rpc('submit_game_score', {
        new_score: score,
        coins_earned: coins
      });
      if (error) throw error;
      setFeedback(data || 'Score Submitted!');
      setSubmitStatus('submitted');
      triggerHaptic('selection');
    } catch (error: any) {
      setFeedback(`Error: ${error.message}`);
      setSubmitStatus('idle');
      triggerHaptic('heavy');
    }
  };

  // Main Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || gameState.current.isPaused) return;

    const deltaTime = Math.min((timestamp - gameState.current.lastTime) / 16.67, 2); // Cap delta time for performance
    gameState.current.lastTime = timestamp;

    // Performance tracking
    performanceRef.current.frameCount++;
    if (timestamp - performanceRef.current.lastFpsUpdate > 1000) {
      performanceRef.current.fps = performanceRef.current.frameCount;
      performanceRef.current.frameCount = 0;
      performanceRef.current.lastFpsUpdate = timestamp;

      // Adjust particle limit based on performance
      if (performanceRef.current.fps < 45) {
        performanceRef.current.particleLimit = Math.max(20, performanceRef.current.particleLimit - 5);
      } else if (performanceRef.current.fps > 55) {
        performanceRef.current.particleLimit = Math.min(80, performanceRef.current.particleLimit + 2);
      }
    }

    // Update score and difficulty
    setScore(prev => prev + Math.ceil(gameState.current.difficulty));
    gameState.current.difficulty += 0.001;

    // --- UPDATE ---
    const { player, obstacles, powerUps, particles, activePowerUps } = gameState.current;

    // Player movement (mobile controls)
    player.vx = 0;
    if (playerMovement.left) player.vx = -PLAYER_SPEED;
    if (playerMovement.right) player.vx = PLAYER_SPEED;

    // Apply speed boost
    const hasSpeedBoost = activePowerUps.some(p => p.type === 'speed');
    if (hasSpeedBoost) player.vx *= 1.5;

    player.x += player.vx * deltaTime;
    player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));

    // Update shoot cooldown
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }

    // Player animation
    if (player.vx !== 0) {
      player.bob = Math.sin(timestamp / 100) * 3;
      // Add trail particles for moving player
      if (Math.random() < 0.2) {
        createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT, 'sparkle', 1);
      }
    } else {
      player.bob *= 0.9;
    }

    // Update bullets
    player.bullets.forEach(bullet => {
      bullet.x += bullet.vx * deltaTime;
      bullet.y += bullet.vy * deltaTime;
      bullet.life -= 0.01;
    });
    player.bullets = player.bullets.filter(bullet =>
      bullet.life > 0 &&
      bullet.y > -10 &&
      bullet.x > -10 &&
      bullet.x < canvas.width + 10
    );

    // Update obstacles with enhanced movement patterns
    obstacles.forEach(o => {
      o.y += o.vy * deltaTime;
      o.rotation += 0.03;

      if (o.movePattern === 'homing' && Math.random() < 0.02) {
        // Gentle homing towards player
        const dx = player.x - o.x;
        o.vx += dx > 0 ? 0.1 : -0.1;
        o.vx = Math.max(-1, Math.min(1, o.vx));
      }

      o.x += o.vx * deltaTime;
      o.x = Math.max(0, Math.min(canvas.width - OBSTACLE_SIZE, o.x));
    });

    // Filter obstacles and bullets
    gameState.current.obstacles = obstacles.filter(o => {
      if (o.vy > 0) return o.y < canvas.height + OBSTACLE_SIZE;
      else return o.y > -OBSTACLE_SIZE * 2;
    });

    // Update powerups with magnet effect
    const hasMagnet = activePowerUps.some(p => p.type === 'magnet');
    powerUps.forEach(p => {
      p.y += p.vy * deltaTime;
      p.pulse = Math.sin(timestamp / 200) * 0.3 + 1;

      if (hasMagnet && p.type === 'coin') {
        const dx = player.x + PLAYER_WIDTH / 2 - p.x;
        const dy = player.y + PLAYER_HEIGHT / 2 - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x += dx * 0.08;
          p.y += dy * 0.08;
          p.magnetized = true;
        }
      }
    });
    gameState.current.powerUps = powerUps.filter(p => p.y < canvas.height + 20);

    // Update particles with optimizations
    particles.forEach(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 0.15; // Gravity
      p.life -= 0.025;
      p.vx *= 0.99; // Friction
      if (p.rotation !== undefined) p.rotation += 0.1;
    });
    gameState.current.particles = particles.filter(p => p.life > 0);

    // Spawn obstacles with mobile-optimized patterns
    if (timestamp - gameState.current.lastObstacleTime > 1200 / gameState.current.obstacleSpawnRate) {
      const pattern = Math.floor(gameState.current.difficulty / 12);
      const numObstacles = Math.min(pattern + 1, 2); // Reduced for mobile

      for (let i = 0; i < numObstacles; i++) {
        const spacing = canvas.width / (numObstacles + 1);
        const x = spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.4;
        const isSell = Math.random() > 0.6; // Favor sell blocks slightly
        const movePattern = Math.random() < 0.7 ? 'straight' : 'homing';

        obstacles.push({
          x: x - OBSTACLE_SIZE / 2,
          y: isSell ? canvas.height + OBSTACLE_SIZE : -OBSTACLE_SIZE,
          vx: 0,
          vy: isSell ? -gameState.current.obstacleSpeed : gameState.current.obstacleSpeed,
          type: isSell ? 'sell' : 'buy',
          rotation: 0,
          movePattern,
          health: 1,
          maxHealth: 1
        });
      }
      gameState.current.lastObstacleTime = timestamp;
    }

    // Progressive difficulty
    gameState.current.obstacleSpeed += OBSTACLE_SPEED_INCREASE / 60 * deltaTime;
    gameState.current.obstacleSpawnRate += 0.00015 * deltaTime;

    // Spawn Powerups
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
      const rand = Math.random();
      const type: PowerUpType =
        rand < 0.35 ? 'coin' :
        rand < 0.5 ? 'shield' :
        rand < 0.65 ? 'slow' :
        rand < 0.75 ? 'magnet' :
        rand < 0.85 ? 'speed' :
        rand < 0.95 ? 'multishot' : 'nuke';

      powerUps.push({
        x: Math.random() * (canvas.width - 25),
        y: -25,
        type,
        vy: OBSTACLE_SPEED_INITIAL * 0.7,
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
    // Bullet vs Obstacle collisions
    for (let i = player.bullets.length - 1; i >= 0; i--) {
      const bullet = player.bullets[i];
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const obstacle = obstacles[j];
        if (
          bullet.x < obstacle.x + OBSTACLE_SIZE &&
          bullet.x + 4 > obstacle.x &&
          bullet.y < obstacle.y + OBSTACLE_SIZE &&
          bullet.y + 4 > obstacle.y
        ) {
          // Hit!
          player.bullets.splice(i, 1);
          obstacles.splice(j, 1);
          createParticles(obstacle.x + OBSTACLE_SIZE / 2, obstacle.y + OBSTACLE_SIZE / 2, 'explosion', 8);
          setScore(prev => prev + 50 * Math.max(1, combo));
          setCombo(prev => prev + 1);
          gameState.current.comboTimer = 120;
          triggerHaptic('light');
          break;
        }
      }
    }

    // Player vs Obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (
        player.x < o.x + OBSTACLE_SIZE &&
        player.x + PLAYER_WIDTH > o.x &&
        player.y < o.y + OBSTACLE_SIZE &&
        player.y + PLAYER_HEIGHT > o.y
      ) {
        if (o.type === 'sell') {
          // SELL blocks give points
          obstacles.splice(i, 1);
          createParticles(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2, 'collect', 12);
          setScore(prev => prev + 150 * Math.max(1, combo));
          setCombo(prev => prev + 1);
          setCoins(prev => prev + 8);
          gameState.current.comboTimer = 120;
          triggerHaptic('selection');
        } else if (activePowerUps.some(p => p.type === 'shield')) {
          // BUY blocks destroyed by shield
          obstacles.splice(i, 1);
          createParticles(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2, 'explosion', 15);
          setCombo(prev => prev + 1);
          gameState.current.comboTimer = 120;
          triggerHaptic('medium');
        } else {
          // BUY blocks kill the player
          createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'explosion', 25);
          endGame();
          return;
        }
      }
    }

    // Player vs PowerUp collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const powerUpSize = 25;
      if (
        player.x < p.x + powerUpSize &&
        player.x + PLAYER_WIDTH > p.x &&
        player.y < p.y + powerUpSize &&
        player.y + PLAYER_HEIGHT > p.y
      ) {
        powerUps.splice(i, 1);
        createParticles(p.x + powerUpSize / 2, p.y + powerUpSize / 2, 'collect', 10);
        triggerHaptic('selection');

        switch (p.type) {
          case 'coin':
            setCoins(prev => prev + 15 * Math.max(1, combo));
            break;
          case 'nuke':
            gameState.current.obstacles = [];
            createParticles(canvas.width / 2, canvas.height / 2, 'explosion', 40);
            triggerHaptic('heavy');
            break;
          case 'slow':
            obstacles.forEach(o => o.vy /= 2);
            activePowerUps.push({ type: 'slow', endTime: timestamp + POWERUP_DURATION });
            break;
          case 'shield':
            activePowerUps.push({ type: 'shield', endTime: timestamp + POWERUP_DURATION });
            break;
          case 'magnet':
            activePowerUps.push({ type: 'magnet', endTime: timestamp + POWERUP_DURATION * 0.8 });
            break;
          case 'speed':
            activePowerUps.push({ type: 'speed', endTime: timestamp + POWERUP_DURATION * 0.6 });
            break;
          case 'multishot':
            activePowerUps.push({ type: 'multishot', endTime: timestamp + POWERUP_DURATION });
            break;
        }
      }
    }

    // --- DRAW ---
    performanceRef.current.drawCalls = 0;

    // Clear canvas with mobile-optimized background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    performanceRef.current.drawCalls++;

    // Draw particles (optimized for mobile)
    if (particles.length > 0) {
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.type === 'sparkle') {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      });
      ctx.globalAlpha = 1;
      performanceRef.current.drawCalls++;
    }

    // Draw bullets
    ctx.fillStyle = skinColor;
    player.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y - 6, 4, 8);
    });
    if (player.bullets.length > 0) performanceRef.current.drawCalls++;

    // Draw obstacles with enhanced mobile visibility
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + OBSTACLE_SIZE / 2, o.y + OBSTACLE_SIZE / 2);
      ctx.rotate(o.rotation);

      // Enhanced colors and borders for mobile visibility
      ctx.fillStyle = o.type === 'buy' ? '#FF2222' : '#22FF22';
      ctx.fillRect(-OBSTACLE_SIZE / 2, -OBSTACLE_SIZE / 2, OBSTACLE_SIZE, OBSTACLE_SIZE);

      // Thick white border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(-OBSTACLE_SIZE / 2, -OBSTACLE_SIZE / 2, OBSTACLE_SIZE, OBSTACLE_SIZE);

      // Large, clear text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.type === 'buy' ? 'BUY' : 'SELL', 0, 0);
      ctx.restore();
    });
    if (obstacles.length > 0) performanceRef.current.drawCalls++;

    // Draw powerups with mobile-friendly sizing
    powerUps.forEach(p => {
      ctx.save();
      ctx.translate(p.x + 12, p.y + 12);
      ctx.scale(p.pulse, p.pulse);

      const colors: { [key: string]: string } = {
        coin: '#FFD700',
        shield: '#00FF00',
        slow: '#00FFFF',
        nuke: '#FF0000',
        magnet: '#FF00FF',
        speed: '#FFFF00',
        multishot: '#FF8800'
      };

      // Larger powerup size for mobile
      const size = p.magnetized ? 28 : 24;
      ctx.strokeStyle = colors[p.type] || '#FF8A00';
      ctx.lineWidth = 3;
      ctx.strokeRect(-size/2, -size/2, size, size);

      ctx.fillStyle = colors[p.type] || '#FF8A00';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icons: { [key: string]: string } = {
        coin: '$',
        shield: 'S',
        slow: 'T',
        nuke: 'N',
        magnet: 'M',
        speed: '>>',
        multishot: '+++'
      };

      ctx.fillText(icons[p.type] || '?', 0, 0);
      ctx.restore();
    });
    if (powerUps.length > 0) performanceRef.current.drawCalls++;

    // Draw Player with enhanced mobile visibility
    ctx.fillStyle = skinColor;
    if (profile?.current_skin === 'prison') {
      for (let i = 0; i < PLAYER_HEIGHT; i += 4) {
        ctx.fillStyle = i % 8 < 4 ? '#FF8A00' : '#0D0D0D';
        ctx.fillRect(player.x, player.y + player.bob + i, PLAYER_WIDTH, 3);
      }
    } else {
      // Enhanced glow for better visibility
      if (profile?.current_skin && ['gold', 'cyber', 'neon'].includes(profile.current_skin)) {
        ctx.shadowColor = skinColor;
        ctx.shadowBlur = 20;
      }
      ctx.fillRect(player.x, player.y + player.bob, PLAYER_WIDTH, PLAYER_HEIGHT);
      ctx.shadowBlur = 0;
    }
    performanceRef.current.drawCalls++;

    // Enhanced power-up effects
    if (activePowerUps.some(p => p.type === 'shield')) {
      ctx.strokeStyle = `rgba(0, 255, 0, ${0.6 + Math.sin(timestamp / 100) * 0.4})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, PLAYER_WIDTH + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (activePowerUps.some(p => p.type === 'magnet')) {
      ctx.strokeStyle = `rgba(255, 0, 255, ${0.4 + Math.sin(timestamp / 80) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Mobile-optimized UI
    const fontSize = Math.min(canvas.width / 25, 24);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Score with outline for better visibility
    ctx.textAlign = 'left';
    ctx.strokeText(`SCORE: ${score}`, 15, 35);
    ctx.fillText(`SCORE: ${score}`, 15, 35);

    if (combo > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.strokeText(`COMBO x${combo}`, 15, 65);
      ctx.fillText(`COMBO x${combo}`, 15, 65);
    }

    if (coins > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.strokeText(`COINS: ${coins}`, 15, combo > 1 ? 95 : 65);
      ctx.fillText(`COINS: ${coins}`, 15, combo > 1 ? 95 : 65);
    }

    // High score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeText(`HI: ${highScore}`, canvas.width - 15, 35);
    ctx.fillText(`HI: ${highScore}`, canvas.width - 15, 35);

    // Active powerups display (mobile optimized)
    let yOffset = 65;
    activePowerUps.forEach(p => {
      const timeLeft = (p.endTime - timestamp) / 1000;
      const color = p.type === 'shield' ? '#00FF00' :
                    p.type === 'slow' ? '#00FFFF' :
                    p.type === 'magnet' ? '#FF00FF' :
                    p.type === 'speed' ? '#FFFF00' :
                    p.type === 'multishot' ? '#FF8800' : '#FFFFFF';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      const text = `${p.type.toUpperCase()}: ${timeLeft.toFixed(1)}s`;
      ctx.strokeText(text, canvas.width - 15, yOffset);
      ctx.fillText(text, canvas.width - 15, yOffset);
      yOffset += 30;
    });

    // Touch hints for new players
    if (showTouchHints && uiState === 'playing') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';

      // Movement hints
      ctx.fillText('TAP & HOLD', canvas.width * 0.15, canvas.height * 0.8);
      ctx.fillText('SIDES TO MOVE', canvas.width * 0.15, canvas.height * 0.85);

      ctx.fillText('TAP & HOLD', canvas.width * 0.85, canvas.height * 0.8);
      ctx.fillText('SIDES TO MOVE', canvas.width * 0.85, canvas.height * 0.85);

      // Shoot hint
      ctx.fillText('TAP CENTER', canvas.width * 0.5, canvas.height * 0.7);
      ctx.fillText('TO SHOOT', canvas.width * 0.5, canvas.height * 0.75);

      // Swipe hint
      ctx.fillText('SWIPE UP FOR', canvas.width * 0.5, canvas.height * 0.9);
      ctx.fillText('FULLSCREEN', canvas.width * 0.5, canvas.height * 0.95);
    }

    performanceRef.current.drawCalls += 3; // UI elements

    gameState.current.animationFrameId = requestAnimationFrame(gameLoop);
  }, [endGame, score, highScore, skinColor, profile, uiState, combo, playerMovement, showTouchHints, createParticles, triggerHaptic, shoot]);

  // Initialize and cleanup
  useEffect(() => {
    // Detect haptic support
    setHapticSupported('vibrate' in navigator || 'hapticFeedback' in navigator);

    // Orientation change handling
    const handleOrientationChange = () => {
      const isLandscape = window.innerHeight < window.innerWidth;
      setOrientation(isLandscape ? 'landscape' : 'portrait');

      // Reset game layout after orientation change
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas && uiState === 'idle') {
          resetGame();
        }
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Visibility change handling for mobile
    const handleVisibilityChange = () => {
      if (document.hidden && uiState === 'playing') {
        setUiState('paused');
        gameState.current.isPaused = true;
        gameState.current.lastVisibilityChange = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add touch event listeners
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFullscreen);
      if (!isFullscreen && uiState === 'fullscreen') {
        setUiState('playing');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }

      if (gameState.current.animationFrameId) {
        cancelAnimationFrame(gameState.current.animationFrameId);
      }
    };
  }, [uiState, resetGame, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Load high score and setup canvas
  useEffect(() => {
    const storedHighScore = localStorage.getItem('cellBreakHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const resizeObserver = new ResizeObserver(() => {
        const container = canvas.parentElement;
        if (!container) return;

        const { width, height } = container.getBoundingClientRect();

        // Mobile-optimized canvas sizing for iPhone 12-16
        if (orientation === 'portrait') {
          canvas.width = Math.min(width, 428); // iPhone 14 Pro Max width
          canvas.height = Math.min(height, width * 1.8); // Taller aspect ratio for mobile
        } else {
          canvas.width = Math.min(width, 932); // iPhone 14 Pro Max landscape width
          canvas.height = Math.min(height, width * 0.6);
        }

        if (uiState === 'idle') resetGame();
      });

      resizeObserver.observe(canvas.parentElement!);
      return () => resizeObserver.disconnect();
    }
  }, [uiState, resetGame, orientation]);

  // Mobile-specific CSS classes based on state
  const containerClasses = `
    relative w-full border-2 border-ash-white/20 bg-prison-black shadow-pixel-lg
    select-none overflow-hidden
    ${isFullscreen ? 'fixed inset-0 z-50 border-0 touch-manipulation' : 'max-w-full'}
    ${orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-[16/10]'}
  `;

  return (
    <div ref={gameContainerRef} className={containerClasses}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-manipulation ${isFullscreen ? 'object-contain' : ''}`}
        style={{ touchAction: uiState === 'playing' ? 'none' : 'auto' }}
      />

      {uiState === 'idle' && (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/95 p-4 text-center">
          <h3 className="font-pixel-heading text-4xl text-warning-orange mb-6">CELL BREAK</h3>
          <div className="my-4 max-w-sm border-t-2 border-ash-white/30 pt-4 font-body text-ash-white/80">
            <p className="text-lg mb-3">🔴 Dodge BUY blocks! 🟢 Collect SELL blocks!</p>
            <div className="bg-ash-white/10 rounded-lg p-3 mb-4">
              <p className="text-yellow-400 mb-2 font-bold">📱 MOBILE CONTROLS:</p>
              <p className="text-sm mb-1">• TAP & HOLD sides to move</p>
              <p className="text-sm mb-1">• TAP center to shoot</p>
              <p className="text-sm mb-1">• SWIPE UP for fullscreen</p>
              <p className="text-sm">• TAP top area to pause</p>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="text-yellow-400">💰 Coins</div>
              <div className="text-green-400">🛡️ Shield</div>
              <div className="text-cyan-400">⏱️ Slow</div>
              <div className="text-red-400">💣 Nuke</div>
              <div className="text-purple-400">🧲 Magnet</div>
              <div className="text-orange-400">⚡ Speed</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {user ? (
              <Button variant="primary" size="lg" onClick={startGame} className="w-full text-lg py-4">
                🎮 START ESCAPE
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={onAuthClick} className="w-full text-lg py-4">
                🔑 LOGIN TO PLAY & SAVE
              </Button>
            )}

            {!isFullscreen && (
              <Button variant="secondary" size="md" onClick={enterFullscreen} className="w-full">
                📱 FULLSCREEN MODE
              </Button>
            )}
          </div>
        </div>
      )}

      {uiState === 'paused' && (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/95 p-4 text-center">
          <h3 className="font-pixel-heading text-3xl text-warning-orange mb-6">⏸️ PAUSED</h3>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Button variant="primary" size="lg" onClick={pauseGame} className="w-full text-lg py-4">
              ▶️ RESUME
            </Button>
            <Button variant="secondary" size="md" onClick={() => setUiState('idle')} className="w-full">
              🏠 MAIN MENU
            </Button>
            {isFullscreen && (
              <Button variant="ghost" size="md" onClick={exitFullscreen} className="w-full">
                🔙 EXIT FULLSCREEN
              </Button>
            )}
          </div>
        </div>
      )}

      {uiState === 'gameOver' && (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/95 p-4 text-center">
          <h3 className="font-pixel-heading text-4xl text-alarm-red mb-4">💀 CAPTURED!</h3>
          <div className="my-4 bg-ash-white/10 rounded-lg p-4">
            <p className="font-pixel-heading text-2xl text-ash-white mb-2">
              SCORE: <span className="text-warning-orange">{score}</span>
            </p>
            {coins > 0 && (
              <p className="font-pixel-heading text-lg text-yellow-400 mb-2">
                💰 COINS: {coins}
              </p>
            )}
            {combo > 1 && (
              <p className="font-pixel-heading text-base text-cyan-400 mb-2">
                🔥 MAX COMBO: x{combo}
              </p>
            )}
            <p className="font-pixel-heading text-base text-ash-white/70">
              HIGH SCORE: {highScore}
            </p>
          </div>
          <p className="font-pixel-heading text-xl text-yellow-400 animate-pulse mb-6">
            {feedback}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button variant="primary" size="lg" onClick={startGame} className="w-full text-lg py-4">
              🔄 PLAY AGAIN
            </Button>
            {user ? (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleSubmitScore}
                  disabled={submitStatus !== 'idle'}
                  className="w-full"
                >
                  {submitStatus === 'submitting' ? '⏳ Submitting...' : '📊 Submit Score'}
                </Button>
                <Button variant="ghost" size="md" onClick={onOpenShop} className="w-full">
                  🛍️ SHOP
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="md" onClick={onAuthClick} className="w-full">
                🔑 LOGIN TO SAVE SCORE
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Performance indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && uiState === 'playing' && (
        <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
          FPS: {performanceRef.current.fps} | Particles: {gameState.current.particles.length}
        </div>
      )}

      {/* Mobile-specific pause button overlay */}
      {uiState === 'playing' && !showTouchHints && (
        <button
          className="absolute top-4 right-4 w-12 h-12 bg-black/50 border-2 border-white/30 rounded-lg flex items-center justify-center text-white text-xl font-bold"
          onClick={pauseGame}
        >
          ⏸️
        </button>
      )}
    </div>
  );
};

export default MobileCellBreakGame;