import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export interface PixelDustHandle {
  fire: (x: number, y: number) => void;
}

const PixelDust = forwardRef<PixelDustHandle>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const colors = ['#FF2A2A', '#FF8A00', '#E5E5E5'];

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas for next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter out dead particles
    particles.current = particles.current.filter(p => p.alpha > 0);

    // Update and draw each particle
    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.alpha -= 0.02; // fade out

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Continue animation loop if particles exist
    if (particles.current.length > 0) {
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Final clear
    }
  }, []);

  useImperativeHandle(ref, () => ({
    fire: (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const count = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        particles.current.push({
          x: x - canvas.offsetLeft,
          y: y - canvas.offsetTop,
          vx: (Math.random() - 0.5) * 4,
          vy: -2 - Math.random() * 2,
          alpha: 1,
          size: Math.random() > 0.5 ? 2 : 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      
      // Start animation loop if not already running
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-50 h-full w-full"
      width={typeof window !== 'undefined' ? window.innerWidth : 1024}
      height={typeof window !== 'undefined' ? window.innerHeight : 768}
      aria-hidden="true"
    />
  );
});

PixelDust.displayName = 'PixelDust';

export default PixelDust;
