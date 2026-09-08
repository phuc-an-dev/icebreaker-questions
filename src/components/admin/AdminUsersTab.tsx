'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminUserPublic, AdminRole, AdminStatus } from '@/types/admin';
import { ModalShell } from '@/components/ui/ModalShell';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';
import {
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
  Plus,
  Edit2,
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

  // Edit Admin Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUserPublic | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('admin');
  const [editStatus, setEditStatus] = useState<AdminStatus>('active');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

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

  const handleOpenEdit = (admin: AdminUserPublic) => {
    setSelectedAdminForEdit(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditRole(admin.role);
    setEditStatus(admin.status);
    setIsEditModalOpen(true);
    hapticFeedback.light();
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminForEdit) return;

    setIsSubmittingEdit(true);
    try {
      const isSelf = selectedAdminForEdit.id === currentAdmin.id;
      const res = await fetch(`/api/admin/users/${selectedAdminForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          // Do not allow demoting self or suspending self
          role: isSelf ? undefined : editRole,
          status: isSelf ? undefined : editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admin');
      }

      hapticFeedback.success();
      onToast('success', `Admin "${data.user?.name || editName}" updated successfully`);
      setIsEditModalOpen(false);
      fetchAdmins();
    } catch (err) {
      hapticFeedback.warning();
      onToast('error', err instanceof Error ? err.message : 'Failed to update admin');
    } finally {
      setIsSubmittingEdit(false);
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

  const statusOptions: DropdownOption[] = [
    { id: 'active', label: 'Active' },
    { id: 'suspended', label: 'Suspended (Revoke Access)' },
  ];

  return (
    <div className="space-y-4">
      {/* Header — Synchronized flat typography with Question Types & Categories */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-content">Administrator Management</h2>
          <p className="text-xs text-content-muted">
            Add, edit, suspend, or reset credentials for question database managers
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => {
              hapticFeedback.light();
              fetchAdmins();
            }}
            disabled={isLoading}
            className="p-2 bg-surface-card hover:bg-surface-elevated border border-edge rounded-xl text-content-muted hover:text-content transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Administrator</span>
          </button>
        </div>
      </div>

      {/* Search & Mobile Refresh Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search administrators by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-edge rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <button
          onClick={() => {
            hapticFeedback.light();
            fetchAdmins();
          }}
          disabled={isLoading}
          className="sm:hidden p-2.5 bg-surface-card border border-edge rounded-xl text-content-muted hover:text-content transition"
          title="Refresh list"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content State: Loading, Empty, or Cards/Table */}
      {isLoading && admins.length === 0 ? (
        <div className="p-12 text-center text-content-muted flex flex-col items-center justify-center gap-3 bg-surface-card border border-edge rounded-2xl">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading administrators...</span>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="p-12 text-center text-content-muted text-xs bg-surface-card border border-edge rounded-2xl">
          No administrators match your search query.
        </div>
      ) : (
        <>
          {/* ── MOBILE CARDS VIEW (Synchronized with Categories & Types) ── */}
          <div className="grid grid-cols-1 gap-3.5 sm:hidden">
            {filteredAdmins.map((admin) => {
              const isSelf = admin.id === currentAdmin.id;
              const isMaster = admin.role === 'master_admin';

              return (
                <div
                  key={admin.id}
                  className="p-4 rounded-2xl border border-edge bg-surface-card/70 hover:border-edge-strong transition flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar on Left + Action Icons on Right */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase shrink-0 ${
                          isMaster
                            ? 'bg-purple-500/10 border border-purple-500/30 text-purple-500'
                            : 'bg-blue-500/10 border border-blue-500/30 text-blue-500'
                        }`}
                      >
                        {admin.name.charAt(0)}
                      </div>

                      {/* Action buttons (Edit, Reset, Suspend, Delete) */}
                      <div className="flex items-center gap-0.5">
                        {/* Edit Admin */}
                        <button
                          onClick={() => handleOpenEdit(admin)}
                          className="p-2 text-content-muted hover:text-blue-500 hover:bg-surface-elevated rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Edit Administrator"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleOpenReset(admin)}
                          className="p-2 text-content-muted hover:text-amber-500 hover:bg-surface-elevated rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Suspend / Activate toggle */}
                        {!isSelf && !isMaster && (
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            className={`p-2 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                              admin.status === 'active'
                                ? 'text-content-muted hover:text-amber-500 hover:bg-surface-elevated'
                                : 'text-emerald-500 hover:bg-surface-elevated'
                            }`}
                            title={admin.status === 'active' ? 'Suspend Admin' : 'Activate Admin'}
                          >
                            {admin.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Delete Admin */}
                        {!isSelf && !isMaster && (
                          <button
                            onClick={() => handleOpenDelete(admin)}
                            className="p-2 text-content-muted hover:text-red-500 hover:bg-surface-elevated rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Admin Name & Email */}
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-content">{admin.name}</h3>
                        {isSelf && (
                          <span className="text-[10px] font-normal px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-muted mt-0.5 truncate">{admin.email}</p>
                    </div>

                    {/* Badges: Role & Status */}
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
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

                      {admin.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-[11px] border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Suspended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer (Metadata) */}
                  <div className="mt-4 pt-3 border-t border-edge/80 flex items-center justify-between text-xs text-content-muted">
                    <span>Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</span>
                    <span>Last: {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── DESKTOP TABLE VIEW (sm and larger) ── */}
          <div className="hidden sm:block bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
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
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                                isMaster
                                  ? 'bg-purple-500/10 border border-purple-500/20 text-purple-600'
                                  : 'bg-blue-600/10 border border-blue-500/20 text-blue-600'
                              }`}
                            >
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
                            {/* Edit Admin */}
                            <button
                              onClick={() => handleOpenEdit(admin)}
                              title="Edit Admin"
                              className="p-1.5 text-content-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => handleOpenReset(admin)}
                              title="Reset Password"
                              className="p-1.5 text-content-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

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
          </div>
        </>
      )}

      {/* Mobile Floating Action Button (FAB) (Synchronized with Add Type / Add Category) */}
      <div className="fixed bottom-6 right-4 sm:hidden z-30">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 active:scale-95 text-white font-semibold rounded-full shadow-2xl shadow-blue-600/60 transition-transform"
          aria-label="Add Administrator"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Add Admin</span>
        </button>
      </div>

      {/* Add Admin Modal */}
      <ModalShell
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Administrator"
        subtitle="Create an administrator account with access to manage the questions database."
        icon={<Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
        maxWidth="md"
        contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
      >
        <form onSubmit={handleCreateAdmin} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-4 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Initial Password *
                </label>
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
                  className="w-full pl-4 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm font-mono text-content focus:outline-none focus:border-blue-500 transition"
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
                label="Role Assignment *"
                options={roleOptions}
                value={addRole}
                onChange={(val) => setAddRole(val as AdminRole)}
                placeholder="Select role"
              />
            </div>

            <div className="pt-1">
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
          </div>

          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmittingAdd}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:text-content bg-surface-elevated hover:bg-surface-elevated/80 border border-edge rounded-xl transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSubmittingAdd && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Create Administrator</span>
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      {/* Edit Admin Modal */}
      <ModalShell
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Administrator"
        subtitle={`Update account details and privileges for ${selectedAdminForEdit?.name || 'this administrator'}.`}
        icon={<ShieldCheck className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
        maxWidth="md"
        contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
      >
        <form onSubmit={handleUpdateAdmin} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-4 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Role selection — disabled if editing self to prevent locking self out */}
            <div>
              <SearchableDropdown
                label="Role Assignment *"
                options={roleOptions}
                value={editRole}
                onChange={(val) => setEditRole(val as AdminRole)}
                placeholder="Select role"
                disabled={selectedAdminForEdit?.id === currentAdmin.id}
              />
              {selectedAdminForEdit?.id === currentAdmin.id && (
                <p className="text-[11px] text-content-muted mt-1">
                  You cannot modify your own administrator role.
                </p>
              )}
            </div>

            {/* Status selection — disabled if editing self */}
            <div>
              <SearchableDropdown
                label="Account Status *"
                options={statusOptions}
                value={editStatus}
                onChange={(val) => setEditStatus(val as AdminStatus)}
                placeholder="Select status"
                disabled={selectedAdminForEdit?.id === currentAdmin.id}
              />
              {selectedAdminForEdit?.id === currentAdmin.id && (
                <p className="text-[11px] text-content-muted mt-1">
                  You cannot suspend your own account.
                </p>
              )}
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmittingEdit}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:text-content bg-surface-elevated hover:bg-surface-elevated/80 border border-edge rounded-xl transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSubmittingEdit && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      {/* Reset Password Modal */}
      <ModalShell
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Administrator Password"
        subtitle={`Set a new temporary password for ${selectedAdminForReset?.name || 'this administrator'}. Active sessions will be revoked.`}
        icon={<KeyRound className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
        maxWidth="md"
        contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
      >
        <form onSubmit={handleResetPassword} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  minLength={6}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-sm font-mono text-content focus:outline-none focus:border-blue-500 transition"
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
          </div>

          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isSubmittingReset}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:text-content bg-surface-elevated hover:bg-surface-elevated/80 border border-edge rounded-xl transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReset}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSubmittingReset && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Confirm Password Reset</span>
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      {/* Delete Admin Confirmation Modal */}
      <ModalShell
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Administrator Account"
        subtitle="Are you sure you want to remove this administrator? This action cannot be undone."
        icon={<ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400" />}
        variant="danger"
        maxWidth="md"
        contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p>
                Account for <strong>{selectedAdminForDelete?.name}</strong> ({selectedAdminForDelete?.email}) will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmittingDelete}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:text-content bg-surface-elevated hover:bg-surface-elevated/80 border border-edge rounded-xl transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDelete}
                onClick={handleDeleteAdmin}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSubmittingDelete && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};
