'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { formatSeconds } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';

interface TimerWidgetProps {
  initialSeconds?: number;
  className?: string;
  onFinish?: () => void;
  compact?: boolean;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  initialSeconds = 60,
  className = '',
  onFinish,
  compact = false,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gentle web audio chime when timer ends
  const playChime = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.05);
      };

      playTone(523.25, 0, 0.25); // C5
      playTone(659.25, 0.15, 0.25); // E5
      playTone(783.99, 0.3, 0.4); // G5
    } catch {
      // Audio not allowed or unavailable
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            hapticFeedback.warning();
            playChime();
            if (onFinish) onFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, onFinish, playChime]);

  const toggleTimer = () => {
    hapticFeedback.light();
    setIsRunning(!isRunning);
  };

  const resetTimer = (newSeconds?: number) => {
    hapticFeedback.light();
    setIsRunning(false);
    const sec = newSeconds ?? totalSeconds;
    setTotalSeconds(sec);
    setTimeLeft(sec);
  };

  const progress = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  // Circular progress specs
  const radius = compact ? 16 : 24;
  const strokeWidth = compact ? 3 : 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-edge-strong bg-surface-card/80 px-3 py-2 backdrop-blur-md ${className}`}
    >
      {/* SVG Progress Ring */}
      <div className="relative flex items-center justify-center">
        <svg
          className="rotate-[-90deg]"
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
        >
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            className="stroke-edge"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            className={`transition-all duration-500 ease-linear ${
              isUrgent ? 'stroke-rose-500' : 'stroke-blue-400'
            }`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <TimerIcon
            className={`w-3.5 h-3.5 ${
              isUrgent ? 'animate-pulse text-rose-400' : 'text-content-muted'
            }`}
          />
        </div>
      </div>

      {/* Countdown Digits */}
      <div className="flex flex-col">
        <span
          className={`font-mono font-bold tracking-wider ${
            compact ? 'text-sm' : 'text-base'
          } ${isUrgent ? 'animate-pulse text-rose-400' : 'text-content'}`}
        >
          {formatSeconds(timeLeft)}
        </span>
        {!compact && (
          <div className="flex gap-1 pt-0.5">
            {[30, 60, 90].map((s) => (
              <button
                key={s}
                onClick={() => resetTimer(s)}
                className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                  totalSeconds === s
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 font-semibold'
                    : 'text-content-muted hover:text-content'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 pl-1">
        <button
          onClick={toggleTimer}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
            isRunning
              ? 'border-blue-500/40 bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/30'
              : 'border-edge bg-black/5 dark:bg-white/5 text-content hover:bg-black/10 dark:hover:bg-white/10'
          }`}
          title={isRunning ? 'Pause' : 'Start'}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>

        <button
          onClick={() => resetTimer()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-black/5 dark:bg-white/5 text-content-muted transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-content"
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
