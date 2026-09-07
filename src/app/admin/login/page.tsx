'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { hapticFeedback } from '@/lib/haptics';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      hapticFeedback.warning();
      setError('Please enter your admin password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      hapticFeedback.success();
      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      hapticFeedback.warning();
      setError(err instanceof Error ? err.message : 'Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-content flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-surface-card/90 border border-edge rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
        {/* Lock Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 dark:text-blue-400 mx-auto mb-5 shadow-lg shadow-blue-500/10">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-content tracking-tight">Admin Portal</h1>
          <p className="text-sm text-content-muted mt-1.5">
            Enter admin password to access the database management dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 text-xs text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl leading-relaxed">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                autoFocus
                required
                className="w-full pl-10 pr-11 py-3 bg-surface-input border border-edge-strong rounded-xl text-content placeholder-content-muted text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Sign In to Admin</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-edge text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-content-muted hover:text-content transition group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Icebreaker Questions</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
