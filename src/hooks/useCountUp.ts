'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Hook to smoothly count up from current number to a target number using requestAnimationFrame
 * @param targetValue The destination number
 * @param duration Duration in milliseconds (default 750ms)
 */
export function useCountUp(targetValue: number, duration = 750): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const prevTargetRef = useRef(targetValue);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    prevTargetRef.current = targetValue;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    const startTime = performance.now();

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateFrame);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}
