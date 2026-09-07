'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { SPRING_PHYSICS } from '@/lib/motion';
import { hapticFeedback } from '@/lib/haptics';

interface ThemeOption {
  id: 'light' | 'dark' | 'system';
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light',
    sublabel: 'Clean & bright',
    icon: Sun,
    iconColor: 'text-amber-500',
  },
  {
    id: 'dark',
    label: 'Dark',
    sublabel: 'Deep & sleek',
    icon: Moon,
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'system',
    label: 'System',
    sublabel: 'Sync with device',
    icon: Monitor,
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
];

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    hapticFeedback.light();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (newTheme: 'light' | 'dark' | 'system') => {
    hapticFeedback.light();
    setTheme(newTheme);
    setIsOpen(false);
  };

  // Close on outside click or touch
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const activeOption = THEME_OPTIONS.find((opt) => opt.id === theme) || THEME_OPTIONS[2];
  const ActiveIcon = activeOption.icon;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        suppressHydrationWarning
        title={`Theme: ${activeOption.label} (Click to change)`}
        aria-label={`Current theme: ${activeOption.label}. Click to choose theme`}
        className={`flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-edge bg-surface-card hover:bg-surface-elevated text-content-secondary hover:text-content transition-all shadow-sm active:scale-95 cursor-pointer ${
          isOpen ? 'ring-2 ring-blue-500/30 border-blue-500/60' : ''
        } ${className}`}
      >
        <div className="flex items-center justify-center" suppressHydrationWarning>
          <ActiveIcon className={`w-4 h-4 ${activeOption.iconColor}`} />
        </div>
        <span className="hidden sm:inline text-xs font-semibold" suppressHydrationWarning>
          {activeOption.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-content-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* Relative Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-label="Select theme"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={SPRING_PHYSICS.snappy}
            className="absolute right-0 top-full mt-2 z-50 w-48 p-1.5 bg-surface-card border border-edge rounded-2xl shadow-2xl shadow-black/15 overflow-hidden"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-content-muted border-b border-edge/60 mb-1 flex items-center justify-between">
              <span>Theme</span>
              <span className="text-[9px] font-mono text-content-muted/80 lowercase">active: {theme}</span>
            </div>

            <div className="space-y-0.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.id;
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-content hover:bg-surface-elevated text-content-secondary hover:text-content'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500/30'
                            : 'bg-surface-elevated border-edge'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                      </div>
                      <div className="truncate">
                        <div className="leading-tight">{opt.label}</div>
                        <div className="text-[10px] text-content-muted mt-0.5 leading-none">
                          {opt.sublabel}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ThemeToggle as ThemeDropdown };
