'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  LogOut,
  ExternalLink,
  KeyRound,
  Users,
  History,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { AdminUserPublic } from '@/types/admin';
import { hapticFeedback } from '@/lib/haptics';
import { SPRING_PHYSICS } from '@/lib/motion';

interface AdminProfileDropdownProps {
  currentAdmin: AdminUserPublic;
  onChangePassword: () => void;
  onNavigateTab: (tab: 'questions' | 'categories' | 'types' | 'analytics' | 'admins' | 'audit_logs') => void;
  onLogout: () => void;
  isLogoutPending?: boolean;
}

export const AdminProfileDropdown: React.FC<AdminProfileDropdownProps> = ({
  currentAdmin,
  onChangePassword,
  onNavigateTab,
  onLogout,
  isLogoutPending = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMaster = currentAdmin.role === 'master_admin';

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    hapticFeedback.light();
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border transition-all cursor-pointer min-h-[40px] select-none ${
          isOpen
            ? 'bg-surface-elevated border-blue-500/50 shadow-md shadow-blue-500/10'
            : 'bg-surface-card hover:bg-surface-elevated border-edge hover:border-edge-strong shadow-sm'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase transition shrink-0 ${
            isMaster
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
          }`}
        >
          {currentAdmin.name ? currentAdmin.name.charAt(0) : 'A'}
        </div>

        {/* User Info (Hidden on mobile, visible on sm+) */}
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-content truncate max-w-[120px]">
              {currentAdmin.name}
            </span>
            {isMaster ? (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 uppercase tracking-wide">
                Master
              </span>
            ) : (
              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 uppercase tracking-wide">
                Admin
              </span>
            )}
          </div>
          <span className="text-[10px] text-content-muted truncate max-w-[130px]">
            {currentAdmin.email}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={SPRING_PHYSICS.snappy}
            className="absolute right-0 mt-2 w-72 bg-surface-card/95 backdrop-blur-xl border border-edge rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
          >
            {/* Header: User identity card */}
            <div className="p-3 bg-surface-elevated/60 rounded-xl mb-1 border border-edge/60">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase shrink-0 ${
                    isMaster
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {currentAdmin.name ? currentAdmin.name.charAt(0) : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-content truncate">
                      {currentAdmin.name}
                    </span>
                  </div>
                  <p className="text-xs text-content-muted truncate" title={currentAdmin.email}>
                    {currentAdmin.email}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {isMaster ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                        <Shield className="w-2.5 h-2.5" />
                        Master Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Administrator
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation / Settings items */}
            <div className="space-y-0.5 py-1 text-xs">
              {/* Public App */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2 text-content hover:text-blue-500 hover:bg-surface-hover rounded-xl transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-content-muted group-hover:text-blue-500 transition" />
                  <span className="font-medium">Open Public App</span>
                </div>
                <span className="text-[10px] text-content-muted">New Tab</span>
              </a>

              {/* Change Password */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onChangePassword();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-content hover:text-blue-500 hover:bg-surface-hover rounded-xl transition group cursor-pointer text-left"
              >
                <KeyRound className="w-4 h-4 text-content-muted group-hover:text-blue-500 transition" />
                <span className="font-medium">Change Password</span>
              </button>

              {/* Master Admin Direct Shortcuts */}
              {isMaster && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateTab('admins');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-content hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition group cursor-pointer text-left"
                  >
                    <Users className="w-4 h-4 text-content-muted group-hover:text-purple-500 transition" />
                    <span className="font-medium">Manage Administrators</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateTab('audit_logs');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-content hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition group cursor-pointer text-left"
                  >
                    <History className="w-4 h-4 text-content-muted group-hover:text-amber-500 transition" />
                    <span className="font-medium">View Audit Logs</span>
                  </button>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="my-1 border-t border-edge" />

            {/* Sign Out */}
            <button
              type="button"
              disabled={isLogoutPending}
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer disabled:opacity-50 text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLogoutPending ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
