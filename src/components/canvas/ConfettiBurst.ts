import confetti from 'canvas-confetti';

export function fireConfetti(options?: { count?: number; origin?: { x: number; y: number } }) {
  if (typeof window === 'undefined') return;

  const count = options?.count ?? 60;
  const origin = options?.origin ?? { x: 0.5, y: 0.6 };

  // First burst
  confetti({
    particleCount: count,
    spread: 70,
    origin,
    colors: ['#f59e0b', '#06b6d4', '#f43f5e', '#10b981', '#a855f7', '#38bdf8'],
    disableForReducedMotion: true,
  });

  // Secondary burst with stars/circles
  setTimeout(() => {
    confetti({
      particleCount: Math.floor(count * 0.5),
      angle: 60,
      spread: 55,
      origin: { x: Math.max(0.1, origin.x - 0.2), y: origin.y },
      colors: ['#eab308', '#06b6d4', '#f97316'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: Math.floor(count * 0.5),
      angle: 120,
      spread: 55,
      origin: { x: Math.min(0.9, origin.x + 0.2), y: origin.y },
      colors: ['#a855f7', '#10b981', '#f43f5e'],
      disableForReducedMotion: true,
    });
  }, 120);
}
