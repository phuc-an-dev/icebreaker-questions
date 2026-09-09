'use client';

import React, { useRef, useEffect, useState, useSyncExternalStore } from 'react';

interface HoloCanvasCardProps {
  categoryColor: string;
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
  intensity?: number;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  phase: number;
}

function createInitialSparkles(count = 16): Sparkle[] {
  const list: Sparkle[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random(),
      y: Math.random(),
      size: 1 + Math.random() * 2,
      alpha: Math.random(),
      speed: 0.02 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return list;
}

const subscribeHover = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
};

const getHoverSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
};

const getServerSnapshot = () => false;

export const HoloCanvasCard: React.FC<HoloCanvasCardProps> = ({
  categoryColor,
  className = '',
  children,
  interactive = true,
  intensity = 1.0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Detect hoverable desktop devices vs touch screens using React 19 useSyncExternalStore
  const canHover = useSyncExternalStore(subscribeHover, getHoverSnapshot, getServerSnapshot);

  // Mouse & Tilt animation tracking refs
  const [isHovered, setIsHovered] = useState(false);
  const mousePos = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const tilt = useRef({ rx: 0, ry: 0, targetRx: 0, targetRy: 0 });
  const sparklesRef = useRef<Sparkle[]>(createInitialSparkles(16));
  const isCanvasReadyRef = useRef(false);

  // Sync canvas size ONLY when device supports hover
  useEffect(() => {
    if (!canHover) return;

    const updateSize = () => {
      const card = cardRef.current;
      const canvas = canvasRef.current;
      if (!card || !canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      isCanvasReadyRef.current = true;
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [canHover]);

  // Animation frame loop: runs ONLY when hovered on desktop
  useEffect(() => {
    if (!canHover || !interactive) return;

    let animId: number;

    if (!isHovered) {
      if (cardRef.current) {
        cardRef.current.style.transform =
          'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      }
      const canvas = canvasRef.current;
      if (canvas && isCanvasReadyRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isDark = document.documentElement.classList.contains('dark');

      // Smooth lerp tilt & mouse
      const lerp = 0.12;
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * lerp;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * lerp;
      tilt.current.rx += (tilt.current.targetRx - tilt.current.rx) * lerp;
      tilt.current.ry += (tilt.current.targetRy - tilt.current.ry) * lerp;

      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${tilt.current.rx.toFixed(
          2
        )}deg) rotateY(${tilt.current.ry.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      }

      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(400px circle at ${(
          mousePos.current.x * 100
        ).toFixed(1)}% ${(mousePos.current.y * 100).toFixed(1)}%, ${categoryColor}88, transparent 70%)`;
      }

      const w = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, w, h);

      if (w === 0 || h === 0) return;

      const mx = mousePos.current.x * w;
      const my = mousePos.current.y * h;

      // 1. Holographic Rainbow Spectrum Gradient
      const angle = (mousePos.current.x - 0.5) * 1.5 + (mousePos.current.y - 0.5) * 1.2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cx = w / 2;
      const cy = h / 2;
      const gradLen = Math.sqrt(w * w + h * h) * 0.85;

      const x0 = cx - cosA * gradLen * 0.5;
      const y0 = cy - sinA * gradLen * 0.5;
      const x1 = cx + cosA * gradLen * 0.5;
      const y1 = cy + sinA * gradLen * 0.5;

      const holoGrad = ctx.createLinearGradient(x0, y0, x1, y1);
      const alphaBase = (isDark ? 0.22 : 0.12) * intensity;

      holoGrad.addColorStop(0.0, `rgba(255, 0, 128, ${alphaBase * 0.8})`);
      holoGrad.addColorStop(0.18, `rgba(255, 140, 0, ${alphaBase * 0.9})`);
      holoGrad.addColorStop(0.35, `rgba(255, 225, 0, ${alphaBase * 1.1})`);
      holoGrad.addColorStop(0.52, `rgba(0, 240, 180, ${alphaBase * 1.0})`);
      holoGrad.addColorStop(0.7, `rgba(0, 180, 255, ${alphaBase * 1.1})`);
      holoGrad.addColorStop(0.88, `rgba(160, 32, 240, ${alphaBase * 0.9})`);
      holoGrad.addColorStop(1.0, `rgba(255, 0, 128, ${alphaBase * 0.8})`);

      ctx.save();
      ctx.globalCompositeOperation = isDark ? 'color-dodge' : 'soft-light';
      ctx.fillStyle = holoGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 2. Specular Hotspot (Cursor Flare)
      const spotGrad = ctx.createRadialGradient(mx, my, 10, mx, my, Math.max(w, h) * 0.75);
      const spotAlpha = isDark ? 0.45 : 0.2;
      spotGrad.addColorStop(0.0, `rgba(255, 255, 255, ${spotAlpha * intensity})`);
      spotGrad.addColorStop(0.2, `${categoryColor}44`);
      spotGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.04)');
      spotGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.globalCompositeOperation = isDark ? 'screen' : 'overlay';
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 3. Diagonal Foil Glint Sheen
      const sheenX = mousePos.current.x * w * 1.6 - w * 0.3;
      const sheenGrad = ctx.createLinearGradient(sheenX - 60, 0, sheenX + 60, h);
      const sheenAlpha = isDark ? 0.35 : 0.15;
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.5, `rgba(255, 255, 255, ${sheenAlpha * intensity})`);
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 4. Sparkling Foil Stardust Particles
      ctx.save();
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'overlay';
      const sparkleColor = isDark ? '255, 255, 255' : '0, 0, 0';
      for (const sp of sparklesRef.current) {
        sp.phase += sp.speed;
        const currentAlpha = Math.abs(Math.sin(sp.phase)) * (isDark ? 0.85 : 0.35) * intensity;
        const sx = sp.x * w;
        const sy = sp.y * h;

        const dist = Math.hypot(sx - mx, sy - my);
        const proxBoost = Math.max(0, 1 - dist / (w * 0.5)) * 0.6;
        const finalAlpha = Math.min(1, currentAlpha + proxBoost);

        if (finalAlpha > 0.05) {
          ctx.fillStyle = `rgba(${sparkleColor}, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
          ctx.fill();

          if (finalAlpha > 0.6) {
            ctx.strokeStyle = `rgba(${sparkleColor}, ${finalAlpha * 0.7})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(sx - sp.size * 2, sy);
            ctx.lineTo(sx + sp.size * 2, sy);
            ctx.moveTo(sx, sy - sp.size * 2);
            ctx.lineTo(sx, sy + sp.size * 2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [categoryColor, intensity, isHovered, interactive, canHover]);

  // Handle pointer interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !canHover) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mousePos.current.targetX = Math.max(0, Math.min(1, x));
    mousePos.current.targetY = Math.max(0, Math.min(1, y));

    const maxTilt = 12;
    tilt.current.targetRy = (x - 0.5) * maxTilt * 2;
    tilt.current.targetRx = (0.5 - y) * maxTilt * 2;
  };

  const handleMouseEnter = () => {
    if (!interactive || !canHover) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!interactive || !canHover) return;
    setIsHovered(false);
    mousePos.current.targetX = 0.5;
    mousePos.current.targetY = 0.5;
    tilt.current.targetRx = 0;
    tilt.current.targetRy = 0;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-2xl transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Holographic Canvas Layer — Desktop only */}
      {canHover && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full rounded-2xl opacity-90 transition-opacity duration-300"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* Dynamic Border Glow on Hover — Desktop only */}
      {canHover && (
        <div
          ref={glowRef}
          className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      {/* Content wrapper */}
      <div className="relative z-20 h-full w-full">{children}</div>
    </div>
  );
};
