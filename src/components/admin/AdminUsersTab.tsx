'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminUserPublic, AdminRole, AdminStatus } from '@/types/admin';
import { ModalShell } from '@/components/ui/ModalShell';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  UserX,
  UserCheck,
  Search,
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface AdminUsersTabProps {
  currentAdmin: AdminUserPublic;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  currentAdmin,
  onToast,
}) => {
  const [admins, setAdmins] = useState<AdminUserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Admin Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<AdminRole>('admin');
  const [addMustChange, setAddMustChange] = useState(true);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAdminForReset, setSelectedAdminForReset] = useState<AdminUserPublic | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Delete Admin Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdminForDelete, setSelectedAdminForDelete] = useState<AdminUserPublic | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch admin users');
      }
      setAdmins(data.users || []);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Error fetching admin users');
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch admin users');
        }
        if (isMounted) setAdmins(data.users || []);
      } catch (err) {
        if (isMounted) onToast('error', err instanceof Error ? err.message : 'Error fetching admin users');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [onToast]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleOpenAdd = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword(generateRandomPassword());
    setAddRole('admin');
    setAddMustChange(true);
    setIsAddModalOpen(true);
    hapticFeedback.light();
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          password: addPassword,
          role: addRole,
          mustChangePassword: addMustChange,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      hapticFeedback.success();
      onToast('success', `Admin "${data.user.name}" created successfully`);
      setIsAddModalOpen(false);
      fetchAdmins();
    } catch (err) {
      hapticFeedback.warning();
      onToast('error', err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUserPublic) => {
    const newStatus: AdminStatus = admin.status === 'active' ? 'suspended' : 'active';
    hapticFeedback.medium();

    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admin status');
      }

      onToast(
        'info',
        newStatus === 'suspended'
          ? `Admin ${admin.name} suspended. Sessions revoked immediately.`
          : `Admin ${admin.name} activated.`
      );
      fetchAdmins();
    } catch (err) {
      hapticFeedback.warning();
      onToast('error', err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleOpenReset = (admin: AdminUserPublic) => {
    setSelectedAdminForReset(admin);
    setResetPasswordValue(generateRandomPassword());
    setIsResetModalOpen(true);
    hapticFeedback.light();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminForReset) return;

    setIsSubmittingReset(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedAdminForReset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      hapticFeedback.success();
      onToast('success', `Password reset for ${selectedAdminForReset.name}. Active sessions revoked.`);
      setIsResetModalOpen(false);
    } catch (err) {
      hapticFeedback.warning();
      onToast('error', err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleOpenDelete = (admin: AdminUserPublic) => {
    setSelectedAdminForDelete(admin);
    setIsDeleteModalOpen(true);
    hapticFeedback.medium();
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdminForDelete) return;

    setIsSubmittingDelete(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedAdminForDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete admin');
      }

      hapticFeedback.success();
      onToast('success', `Admin "${selectedAdminForDelete.name}" deleted`);
      setIsDeleteModalOpen(false);
      fetchAdmins();
    } catch (err) {
      hapticFeedback.warning();
      onToast('error', err instanceof Error ? err.message : 'Failed to delete admin');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    hapticFeedback.light();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleOptions: DropdownOption[] = [
    { id: 'admin', label: 'Admin (Manage Questions & Categories)' },
    { id: 'master_admin', label: 'Master Admin (Full Access & Admin Management)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-surface-card border border-edge rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-content">Administrator Management</h2>
            <p className="text-xs text-content-muted">
              Add, suspend, or reset credentials for question database managers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              hapticFeedback.light();
              fetchAdmins();
            }}
            disabled={isLoading}
            className="p-2.5 bg-surface-input border border-edge rounded-xl text-content-muted hover:text-content hover:bg-surface-hover transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Administrator</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search administrators by name or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-edge rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Admins Table / Cards */}
      <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
        {isLoading && admins.length === 0 ? (
          <div className="p-12 text-center text-content-muted flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading administrators...</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-content-muted text-xs">
            No administrators match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-input/50 text-content-muted border-b border-edge font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge text-content">
                {filteredAdmins.map((admin) => {
                  const isSelf = admin.id === currentAdmin.id;
                  const isMaster = admin.role === 'master_admin';

                  return (
                    <tr key={admin.id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              <span>{admin.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-normal px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-content-muted text-[11px]">{admin.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isMaster ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px] border border-purple-500/20">
                            <Shield className="w-3 h-3" />
                            Master Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[11px] border border-blue-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {admin.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-content-muted text-[11px]">
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-4 text-content-muted text-[11px]">
                        {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Suspend / Activate toggle */}
                          {!isSelf && !isMaster && (
                            <button
                              onClick={() => handleToggleStatus(admin)}
                              title={admin.status === 'active' ? 'Suspend Admin' : 'Activate Admin'}
                              className={`p-1.5 rounded-lg border transition ${
                                admin.status === 'active'
                                  ? 'text-amber-500 hover:bg-amber-500/10 border-transparent hover:border-amber-500/30'
                                  : 'text-emerald-500 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/30'
                              }`}
                            >
                              {admin.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenReset(admin)}
                            title="Reset Password"
                            className="p-1.5 text-content-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete Admin */}
                          {!isSelf && !isMaster && (
                            <button
                              onClick={() => handleOpenDelete(admin)}
                              title="Delete Admin"
                              className="p-1.5 text-content-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <ModalShell
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Administrator"
        subtitle="Create an administrator account with access to manage the questions database."
        maxWidth="md"
      >
        <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="sarah@example.com"
              className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-content-muted">Initial Password</label>
              <button
                type="button"
                onClick={() => setAddPassword(generateRandomPassword())}
                className="text-[11px] text-blue-500 hover:underline"
              >
                Regenerate
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                minLength={6}
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm font-mono text-content focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => handleCopyCredentials(addPassword, 'add-pwd')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                title="Copy password"
              >
                {copiedId === 'add-pwd' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <SearchableDropdown
              label="Role Assignment"
              options={roleOptions}
              value={addRole}
              onChange={(val) => setAddRole(val as AdminRole)}
              placeholder="Select role"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-content">
              <input
                type="checkbox"
                checked={addMustChange}
                onChange={(e) => setAddMustChange(e.target.checked)}
                className="w-4 h-4 rounded border-edge-strong text-blue-600 focus:ring-blue-500"
              />
              <span>Require password change upon first login</span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-content-muted hover:text-content hover:bg-surface-hover rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdd}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmittingAdd && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Create Administrator</span>
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Reset Password Modal */}
      <ModalShell
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Administrator Password"
        subtitle={`Set a new temporary password for ${selectedAdminForReset?.name || 'this administrator'}. Active sessions will be revoked.`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type="text"
                required
                minLength={6}
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm font-mono text-content focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => handleCopyCredentials(resetPasswordValue, 'reset-pwd')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                title="Copy password"
              >
                {copiedId === 'reset-pwd' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 text-sm text-content-muted hover:text-content hover:bg-surface-hover rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReset}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmittingReset && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Confirm Password Reset</span>
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Delete Admin Confirmation Modal */}
      <ModalShell
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Administrator Account"
        subtitle="Are you sure you want to remove this administrator? This action cannot be undone."
        maxWidth="md"
      >
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>
              Account for <strong>{selectedAdminForDelete?.name}</strong> ({selectedAdminForDelete?.email}) will be permanently deleted.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-content-muted hover:text-content hover:bg-surface-hover rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmittingDelete}
              onClick={handleDeleteAdmin}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-red-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmittingDelete && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};
