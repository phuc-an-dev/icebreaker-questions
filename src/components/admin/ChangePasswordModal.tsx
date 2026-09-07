'use client';

import React, { useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isForced = false,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    if (isForced) return; // Prevent closing if password change is mandatory
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isForced && !currentPassword) {
      hapticFeedback.warning();
      setError('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      hapticFeedback.warning();
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      hapticFeedback.warning();
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: isForced ? undefined : currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      hapticFeedback.success();
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      hapticFeedback.warning();
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={isForced ? 'Set New Password' : 'Change Password'}
      subtitle={
        isForced
          ? 'First-time login security: Please choose a new password before continuing.'
          : 'Update your administrator account password.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {isForced && (
          <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Your account requires a password update upon initial login for security compliance.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl">
            {error}
          </div>
        )}

        {!isForced && (
          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-content-muted mb-1.5">
            New Password (min 6 characters)
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter new password"
              className="w-full pl-3.5 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-content-muted mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter new password"
              className="w-full pl-3.5 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2.5">
          {!isForced && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-content-muted hover:text-content hover:bg-surface-hover rounded-xl transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <KeyRound className="w-4 h-4" />
            <span>Update Password</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
