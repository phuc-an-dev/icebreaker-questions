'use client';

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react';
import { hapticFeedback } from '@/lib/haptics';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** User-selected preference: 'light' | 'dark' | 'system' */
  theme: Theme;
  /** Actual computed theme after resolving 'system' against OS preference */
  resolvedTheme: ResolvedTheme;
  /** Update theme preference and persist to localStorage */
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'icebreaker-theme';
const THEME_CHANGE_EVENT = 'icebreaker-theme-change';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function themeSubscribe(callback: () => void) {
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(THEME_CHANGE_EVENT, handler);
  };
}

function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

function getThemeServerSnapshot(): Theme {
  return 'system';
}

function applyThemeClass(resolved: ResolvedTheme, animate: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (animate) {
    root.classList.add('theme-transitioning');
  }

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (animate) {
    const id = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 400);
    return () => clearTimeout(id);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use React 19 recommended useSyncExternalStore for external storage (localStorage)
  const theme = useSyncExternalStore(themeSubscribe, getThemeSnapshot, getThemeServerSnapshot);

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? getSystemTheme() : theme;

  // Listen for OS theme changes when using 'system' mode
  useEffect(() => {
    if (theme !== 'system') {
      applyThemeClass(theme, false);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyThemeClass(mq.matches ? 'dark' : 'light', false);

    const handler = (e: MediaQueryListEvent) => {
      applyThemeClass(e.matches ? 'dark' : 'light', true);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    hapticFeedback.light();

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage unavailable
    }

    const resolved: ResolvedTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    applyThemeClass(resolved, true);

    // Notify all subscribers
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

/**
 * Access current theme state and setter.
 * Must be used within a <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
