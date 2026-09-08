'use client';

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { hapticFeedback } from '@/lib/haptics';
import { ModalShell } from '@/components/ui/ModalShell';
import {
  Sparkles,
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  Layers,
  MessageSquareQuote,
  Database,
  ArrowLeft,
  ArrowRight,
  DownloadCloud,
  CheckSquare,
  Square,
  RefreshCw,
  SlidersHorizontal,
  Copy,
  Check,
  X,
  Users,
  UserCheck,
  History,
} from 'lucide-react';
import { CategoryMeta, Question, TypeMeta } from '@/types/question';
import { AdminUserPublic } from '@/types/admin';
import { IconHelper } from '@/components/ui/IconHelper';
import { QuestionFormModal } from './QuestionFormModal';
import { CategoryTypeModal } from './CategoryTypeModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ImportExportModal } from './ImportExportModal';
import { AdminUsersTab } from './AdminUsersTab';
import { AuditLogsTab } from './AuditLogsTab';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminProfileDropdown } from './AdminProfileDropdown';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

interface AdminDashboardProps {
  currentAdmin: AdminUserPublic;
  initialCategories: CategoryMeta[];
  initialTypes: TypeMeta[];
  initialAdmins?: AdminUserPublic[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  initialCategories,
  initialTypes,
  initialAdmins = [],
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toasts, toast, dismiss } = useToast();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'questions' | 'categories' | 'types' | 'admins' | 'audit_logs'>('questions');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(Boolean(currentAdmin.mustChangePassword));

  // Categories & Types state
  const [categories, setCategories] = useState<CategoryMeta[]>(initialCategories);
  const [types, setTypes] = useState<TypeMeta[]>(initialTypes);
  const [admins] = useState<AdminUserPublic[]>(initialAdmins);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Filter & Sorting State (Default author is current logged in admin)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>(currentAdmin.id);
  const [sortBy, setSortBy] = useState<'id' | 'text' | 'category' | 'type' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Author Dropdown Options (Concise labels for optimal compact toolbar layout)
  const authorOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      {
        id: currentAdmin.id,
        label: 'My Questions',
        sublabel: `Signed in as ${currentAdmin.name}`,
        iconName: 'UserCheck',
      },
      {
        id: 'all',
        label: 'All Authors',
        sublabel: 'Show questions by anyone',
        iconName: 'Users',
      },
      {
        id: 'system',
        label: 'System Default',
        sublabel: 'Initial seed questions',
        iconName: 'Database',
      },
    ];

    const otherAdmins = admins.filter((a) => a.id !== currentAdmin.id);
    for (const admin of otherAdmins) {
      list.push({
        id: admin.id,
        label: admin.name,
        sublabel: admin.role === 'master_admin' ? 'Master Admin' : admin.email,
        iconName: 'User',
      });
    }

    return list;
  }, [currentAdmin, admins]);

  // Mobile drawer & interaction states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [isCatTypeModalOpen, setIsCatTypeModalOpen] = useState(false);
  const [catTypeMode, setCatTypeMode] = useState<'category' | 'type'>('category');
  const [editingCatType, setEditingCatType] = useState<CategoryMeta | TypeMeta | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single_question' | 'bulk_questions' | 'category' | 'type';
    id?: number | string;
    title: string;
    message: string;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Refresh trigger counter
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerReloadQuestions = useCallback(() => {
    setIsLoadingQuestions(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Fetch Questions from API
  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedAuthor !== 'all') params.set('author', selectedAuthor);

    fetch(`/api/admin/questions?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch questions');
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setQuestions(data.questions || []);
          setTotalQuestions(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setIsLoadingQuestions(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          toast({ type: 'error', title: 'Loading error', description: 'Could not fetch questions from server.' });
          setIsLoadingQuestions(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, limit, debouncedSearch, selectedCategory, selectedType, selectedAuthor, sortBy, sortOrder, refreshKey, toast]);

  // Fetch Categories & Types refresh
  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sign out handler
  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.push('/admin/login');
        router.refresh();
      } catch {
        router.push('/admin/login');
      }
    });
  };

  // Copy Question Text
  const handleCopyQuestionText = (q: Question) => {
    navigator.clipboard.writeText(q.text);
    setCopiedId(q.id);
    toast({ type: 'info', title: 'Copied to clipboard', description: `Question #${q.id} text copied.` });
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Sorting helper
  const handleToggleSort = (field: 'id' | 'text' | 'category' | 'type' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'updatedAt' || field === 'id' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  // Bulk selection helpers
  const handleToggleSelectAllOnPage = () => {
    const pageIds = questions.map((q) => q.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const newSet = new Set([...selectedIds, ...pageIds]);
      setSelectedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Delete Action Dispatcher
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'single_question') {
        const res = await fetch(`/api/admin/questions/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast({ type: 'success', title: 'Question deleted', description: `Question #${deleteTarget.id} was removed.` });
          setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
          triggerReloadQuestions();
        } else {
          toast({ type: 'error', title: 'Delete failed', description: 'Could not delete the question.' });
        }
      } else if (deleteTarget.type === 'bulk_questions') {
        const res = await fetch('/api/admin/questions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        });
        if (res.ok) {
          const data = await res.json();
          toast({
            type: 'success',
            title: 'Bulk deletion completed',
            description: `Permanently removed ${data.deletedCount} questions.`,
          });
          setSelectedIds([]);
          triggerReloadQuestions();
        } else {
          toast({ type: 'error', title: 'Bulk delete failed', description: 'Could not delete selected questions.' });
        }
      } else if (deleteTarget.type === 'category') {
        const res = await fetch(`/api/admin/categories?id=${deleteTarget.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast({ type: 'success', title: 'Category deleted', description: `"${deleteTarget.title}" has been removed.` });
          refreshCategories();
        } else {
          toast({ type: 'error', title: 'Delete failed', description: 'Could not delete the category.' });
        }
      } else if (deleteTarget.type === 'type') {
        const res = await fetch(`/api/admin/types?id=${deleteTarget.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast({ type: 'success', title: 'Type deleted', description: `"${deleteTarget.title}" has been removed.` });
          refreshTypes();
        } else {
          toast({ type: 'error', title: 'Delete failed', description: 'Could not delete the question type.' });
        }
      }
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast({ type: 'error', title: 'Unexpected error', description: 'Something went wrong. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Question Form Submission
  const handleSubmitQuestion = async (formData: {
    id?: number;
    text: string;
    category: string;
    type: string;
    tags: string[];
  }) => {
    if (editingQuestion) {
      const res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update question');
      }
      toast({ type: 'success', title: 'Question updated', description: `Question #${editingQuestion.id} has been saved successfully.` });
    } else {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create question');
      }
      toast({ type: 'success', title: 'Question created', description: 'New question has been added to the collection.' });
    }
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    triggerReloadQuestions();
  };

  // Category Form Submission
  const handleSubmitCategory = async (cat: CategoryMeta) => {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save category');
    }
    toast({ type: 'success', title: 'Category saved', description: `"${cat.label}" has been saved successfully.` });
    setIsCatTypeModalOpen(false);
    setEditingCatType(null);
    refreshCategories();
  };

  // Type Form Submission
  const handleSubmitType = async (typeMeta: TypeMeta) => {
    const res = await fetch('/api/admin/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(typeMeta),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save question type');
    }
    toast({ type: 'success', title: 'Question type saved', description: `"${typeMeta.label}" has been saved successfully.` });
    setIsCatTypeModalOpen(false);
    setEditingCatType(null);
    refreshTypes();
  };

  const getCategoryMeta = (catId: string): CategoryMeta => {
    const found = categories.find((c) => c.id.toLowerCase() === catId.toLowerCase());
    if (found) return found;
    return {
      id: catId,
      label: catId.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
      description: '',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      glowColor: 'rgba(59, 130, 246, 0.4)',
      borderGlow: 'rgba(59, 130, 246, 0.6)',
      iconName: 'HelpCircle',
    };
  };

  const getTypeMeta = (typeId: string): TypeMeta => {
    const found = types.find((t) => t.id.toLowerCase() === typeId.toLowerCase());
    if (found) return found;
    return {
      id: typeId,
      label: typeId.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
      hint: '',
      iconName: 'MessageSquareQuote',
    };
  };

  const isPageAllSelected =
    questions.length > 0 && questions.every((q) => selectedIds.includes(q.id));

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedAuthor !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-surface text-content flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Admin Header (Mobile Optimized - Never Cut Off) */}
      <header className="sticky top-0 z-30 border-b border-edge bg-surface/85 backdrop-blur-md px-3 sm:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10 shrink-0">
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-bold text-content tracking-tight truncate">
                Icebreaker Admin
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full shrink-0">
                Portal v2.0
              </span>
            </div>
            <p className="text-xs text-content-muted hidden sm:block">
              Connected to MongoDB Atlas &bull; {totalQuestions} Questions Live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <AdminProfileDropdown
            currentAdmin={currentAdmin}
            onChangePassword={() => setIsChangePasswordOpen(true)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              hapticFeedback.light();
            }}
            onLogout={handleLogout}
            isLogoutPending={isPending}
          />
        </div>
      </header>

      {/* Main Body with Mobile Safe Area Padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 md:p-8 space-y-5 pb-28 sm:pb-12">
        {/* Navigation Tabs (Swipeable Pills on Mobile) */}
        <div className="flex items-center gap-2 border-b border-edge pb-3 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => {
              setActiveTab('questions');
              hapticFeedback.light();
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition ${
              activeTab === 'questions'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-content-muted hover:text-content hover:bg-surface-card'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Questions</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'questions' ? 'bg-blue-700 text-white' : 'bg-surface-elevated text-content-muted'
              }`}
            >
              {totalQuestions}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('categories');
              hapticFeedback.light();
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-content-muted hover:text-content hover:bg-surface-card'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'categories' ? 'bg-blue-700 text-white' : 'bg-surface-elevated text-content-muted'
              }`}
            >
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('types');
              hapticFeedback.light();
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition ${
              activeTab === 'types'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-content-muted hover:text-content hover:bg-surface-card'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Question Types</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'types' ? 'bg-blue-700 text-white' : 'bg-surface-elevated text-content-muted'
              }`}
            >
              {types.length}
            </span>
          </button>

          {/* Master Admin Only Tabs */}
          {currentAdmin.role === 'master_admin' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('admins');
                  hapticFeedback.light();
                }}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition ${
                  activeTab === 'admins'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-content-muted hover:text-content hover:bg-surface-card'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Admins</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit_logs');
                  hapticFeedback.light();
                }}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition ${
                  activeTab === 'audit_logs'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-content-muted hover:text-content hover:bg-surface-card'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit Logs</span>
              </button>
            </>
          )}
        </div>

        {/* TAB 1: QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Desktop Toolbar (Hidden on Mobile, Single Sleek Row) */}
            <div className="hidden md:flex gap-2.5 items-center justify-between">
              {/* Search & Filters */}
              <div className="flex flex-1 items-center gap-2 min-w-0">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[140px] max-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-9 pr-3 py-2 bg-surface-card/90 border border-edge-strong/80 rounded-xl text-content text-xs sm:text-sm placeholder-content-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-content-muted hover:text-content"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="w-[170px] lg:w-[190px] shrink-0">
                  <SearchableDropdown
                    label=""
                    options={[
                      { id: 'all', label: 'All Categories', iconName: 'Layers' },
                      ...categories.map((c): DropdownOption => ({
                        id: c.id,
                        label: c.label,
                        color: c.color,
                        iconName: c.iconName,
                      })),
                    ]}
                    value={selectedCategory}
                    onChange={(val) => { setSelectedCategory(val); setPage(1); }}
                    placeholder="All Categories"
                    searchPlaceholder="Search category..."
                  />
                </div>

                {/* Type Filter */}
                <div className="w-[155px] lg:w-[175px] shrink-0">
                  <SearchableDropdown
                    label=""
                    options={[
                      { id: 'all', label: 'All Formats', iconName: 'MessageSquareQuote' },
                      ...types.map((t): DropdownOption => ({
                        id: t.id,
                        label: t.label,
                        iconName: t.iconName,
                      })),
                    ]}
                    value={selectedType}
                    onChange={(val) => { setSelectedType(val); setPage(1); }}
                    placeholder="All Formats"
                    searchPlaceholder="Search format..."
                  />
                </div>

                {/* Author Filter (Wide & Comfortable) */}
                <div className="w-[160px] lg:w-[180px] shrink-0">
                  <SearchableDropdown
                    label=""
                    options={authorOptions}
                    value={selectedAuthor}
                    onChange={(val) => { setSelectedAuthor(val); setPage(1); }}
                    placeholder="All Authors"
                    searchPlaceholder="Search author..."
                  />
                </div>

                {/* Refresh button */}
                <button
                  onClick={() => triggerReloadQuestions()}
                  title="Reload questions"
                  className="p-2 bg-surface-card hover:bg-surface-elevated border border-edge-strong/80 rounded-xl text-content-muted hover:text-content transition shrink-0"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingQuestions ? 'animate-spin text-blue-400' : ''}`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsImportExportOpen(true)}
                  title="Import / Export Questions (JSON/Excel)"
                  className="flex items-center gap-1.5 p-2 xl:px-3 xl:py-2 text-xs sm:text-sm font-medium text-content-secondary hover:text-white bg-surface-card hover:bg-surface-elevated border border-edge-strong/80 rounded-xl transition shrink-0"
                >
                  <DownloadCloud className="w-4 h-4 text-blue-400" />
                  <span className="hidden xl:inline">Import / Export</span>
                </button>

                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsQuestionModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Question</span>
                </button>
              </div>
            </div>

            {/* Mobile Toolbar (Compact 2-row Layout for Screens < md) */}
            <div className="flex md:hidden flex-col gap-2">
              {/* Row 1: Search input */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-9 py-2.5 bg-surface-card border border-edge-strong/80 rounded-xl text-content text-sm placeholder-content-muted focus:outline-none focus:border-blue-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Row 2: Filter Drawer Button, Select Mode Toggle, Import/Export, Refresh */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Filter Button */}
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                      activeFilterCount > 0
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-surface-card border-edge-strong/80 text-content-secondary hover:text-content'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Select Mode Toggle */}
                  <button
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      if (isSelectMode) setSelectedIds([]);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                      isSelectMode
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-surface-card border-edge-strong/80 text-content-secondary hover:text-content'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isSelectMode ? 'Done' : 'Select'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Import / Export */}
                  <button
                    onClick={() => setIsImportExportOpen(true)}
                    className="p-2 bg-surface-card border border-edge-strong/80 rounded-xl text-content-secondary hover:text-content transition"
                    title="Import / Export Data"
                  >
                    <DownloadCloud className="w-4 h-4 text-blue-400" />
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={() => triggerReloadQuestions()}
                    className="p-2 bg-surface-card border border-edge-strong/80 rounded-xl text-content-muted hover:text-content transition"
                    title="Reload questions"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingQuestions ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="hidden md:flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                    {selectedIds.length} question{selectedIds.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-content-muted hover:text-content underline transition"
                  >
                    Deselect all
                  </button>
                </div>
                <button
                  onClick={() => {
                    setDeleteTarget({
                      type: 'bulk_questions',
                      title: `Delete ${selectedIds.length} Questions?`,
                      message: `Are you sure you want to permanently delete these ${selectedIds.length} selected questions from the database? This action cannot be undone.`,
                      count: selectedIds.length,
                    });
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}

            {/* Desktop Questions Table (Visible on md and above) */}
            <div className="hidden md:block border border-edge bg-surface-card/60 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-content-secondary">
                  <thead className="bg-surface/80 text-xs uppercase font-semibold text-content-muted border-b border-edge">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <button
                          onClick={handleToggleSelectAllOnPage}
                          className="text-content-muted hover:text-content"
                        >
                          {isPageAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-4 w-20">
                        <button
                          onClick={() => handleToggleSort('id')}
                          className={`flex items-center gap-1.5 transition ${
                            sortBy === 'id' ? 'text-blue-400 font-semibold' : 'hover:text-content text-content-muted'
                          }`}
                        >
                          <span>ID</span>
                          <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'id' ? 'text-blue-400' : 'text-content-muted'}`} />
                        </button>
                      </th>
                      <th className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSort('text')}
                            className={`flex items-center gap-1.5 transition ${
                              sortBy === 'text' ? 'text-blue-400 font-semibold' : 'hover:text-content text-content-muted'
                            }`}
                          >
                            <span>Question Text</span>
                            <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'text' ? 'text-blue-400' : 'text-content-muted'}`} />
                          </button>

                          <button
                            onClick={() => handleToggleSort('updatedAt')}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border transition ${
                              sortBy === 'updatedAt'
                                ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold shadow-sm'
                                : 'bg-surface-elevated/70 border-edge text-content-muted hover:text-content'
                            }`}
                            title="Sort by Recently Updated"
                          >
                            <span>Recently Updated</span>
                            <ArrowUpDown className="w-3 h-3" />
                            {sortBy === 'updatedAt' && (
                              <span className="text-[9px] font-mono text-blue-400 uppercase">
                                {sortOrder}
                              </span>
                            )}
                          </button>
                        </div>
                      </th>
                      <th className="p-4 w-52">Category</th>
                      <th className="p-4 w-48">Format</th>
                      <th className="p-4 w-40">Tags</th>
                      <th className="p-4 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge/60">
                    {isLoadingQuestions && questions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-content-muted">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Loading questions from database...
                        </td>
                      </tr>
                    ) : questions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-content-muted">
                          <div className="max-w-md mx-auto space-y-2">
                            <p className="text-sm font-semibold text-content-secondary">
                              {selectedAuthor === currentAdmin.id
                                ? "You haven't created any questions yet"
                                : 'No questions found matching your filters'}
                            </p>
                            <p className="text-xs text-content-muted">
                              {selectedAuthor === currentAdmin.id
                                ? 'Switch to "All Authors" to browse the complete library or create your first question.'
                                : 'Try adjusting your search, category, format, or author filter.'}
                            </p>
                            {selectedAuthor === currentAdmin.id && (
                              <div className="pt-2 flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAuthor('all');
                                    setPage(1);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition"
                                >
                                  Show All Authors
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuestion(null);
                                    setIsQuestionModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                                >
                                  + Create Question
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      questions.map((q) => {
                        const isSelected = selectedIds.includes(q.id);
                        const catMeta = getCategoryMeta(q.category);
                        const tMeta = getTypeMeta(q.type);

                        return (
                          <tr
                            key={q.id}
                            className={`transition hover:bg-surface-elevated/40 ${
                              isSelected ? 'bg-blue-500/10' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleSelectRow(q.id)}
                                className="text-content-muted hover:text-content"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-content-muted hover:text-content-secondary" />
                                )}
                              </button>
                            </td>

                            {/* ID */}
                            <td className="p-4 font-mono text-xs text-content-muted font-semibold">
                              #{q.id}
                            </td>

                            {/* Text & History Attribution */}
                            <td className="p-4 text-content font-medium leading-relaxed max-w-md">
                              <div className="text-sm text-content font-medium leading-relaxed">{q.text}</div>
                              <div className="mt-2 pt-1.5 border-t border-edge/40 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                {/* Created By & Created At */}
                                <div className="flex items-center gap-1 text-content-muted">
                                  <span className="text-content-muted">Created:</span>
                                  <span className="font-semibold text-content-secondary">{q.createdBy?.name || 'System'}</span>
                                  {q.createdAt && (
                                    <span className="text-[10px] font-mono text-content-muted">
                                      ({formatDateTime(q.createdAt)})
                                    </span>
                                  )}
                                </div>

                                {/* Updated By & Updated At */}
                                <div className="flex items-center gap-1 text-content-muted">
                                  <span className="text-content-muted">• Updated:</span>
                                  {q.updatedBy ? (
                                    <>
                                      <span className="font-semibold text-content-secondary">{q.updatedBy.name}</span>
                                      {q.updatedAt && (
                                        <span className="text-[10px] font-mono text-content-muted">
                                          ({formatDateTime(q.updatedAt)})
                                        </span>
                                      )}
                                    </>
                                  ) : q.updatedAt ? (
                                    <span className="text-[10px] font-mono text-content-muted">
                                      ({formatDateTime(q.updatedAt)})
                                    </span>
                                  ) : (
                                    <span className="text-content-muted italic">Never</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="p-4 whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                                style={{
                                  backgroundColor: `${catMeta.color}15`,
                                  borderColor: `${catMeta.color}35`,
                                  color: catMeta.color,
                                }}
                              >
                                <IconHelper name={catMeta.iconName} className="w-3.5 h-3.5" />
                                {catMeta.label}
                              </span>
                            </td>

                            {/* Type Pill */}
                            <td className="p-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs text-content-secondary bg-surface-elevated/80 border border-edge-strong/60">
                                <IconHelper name={tMeta.iconName} className="w-3 h-3 text-blue-400" />
                                {tMeta.label}
                              </span>
                            </td>

                            {/* Tags */}
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {q.tags && q.tags.length > 0 ? (
                                  q.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-content-muted"
                                    >
                                      #{tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-content-muted">-</span>
                                )}
                                {q.tags && q.tags.length > 3 && (
                                  <span className="text-[10px] text-content-muted self-center">
                                    +{q.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingQuestion(q);
                                    setIsQuestionModalOpen(true);
                                  }}
                                  title="Edit question"
                                  className="p-1.5 text-content-muted hover:text-blue-400 hover:bg-surface-elevated rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: 'single_question',
                                      id: q.id,
                                      title: `Delete Question #${q.id}?`,
                                      message: `Are you sure you want to delete question #${q.id}: "${q.text.slice(
                                        0,
                                        60
                                      )}..."?`,
                                    });
                                    setIsDeleteModalOpen(true);
                                  }}
                                  title="Delete question"
                                  className="p-1.5 text-content-muted hover:text-red-400 hover:bg-surface-elevated rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Question Cards View (Visible on screens < md) */}
            <div className="block md:hidden space-y-3">
              {/* Select all bar in Select Mode */}
              {isSelectMode && questions.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-surface-card/90 border border-edge rounded-xl text-xs font-semibold">
                  <button
                    onClick={handleToggleSelectAllOnPage}
                    className="flex items-center gap-2 text-content-secondary hover:text-content"
                  >
                    {isPageAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-content-muted" />
                    )}
                    <span>Select all on page</span>
                  </button>
                  <span className="text-content-muted font-mono">{selectedIds.length} selected</span>
                </div>
              )}

              {isLoadingQuestions && questions.length === 0 ? (
                <div className="p-8 text-center text-content-muted bg-surface-card/60 border border-edge rounded-2xl">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading questions from database...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-8 text-center text-content-muted bg-surface-card/60 border border-edge rounded-2xl space-y-2">
                  <p className="text-sm font-semibold text-content-secondary">
                    {selectedAuthor === currentAdmin.id
                      ? "You haven't created any questions yet"
                      : 'No questions found'}
                  </p>
                  <p className="text-xs text-content-muted">
                    {selectedAuthor === currentAdmin.id
                      ? 'Switch to "All Authors" to browse the whole question library.'
                      : 'Try adjusting your search or active filters.'}
                  </p>
                  {selectedAuthor === currentAdmin.id && (
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAuthor('all');
                          setPage(1);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition"
                      >
                        Show All Authors
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                questions.map((q) => {
                  const isSelected = selectedIds.includes(q.id);
                  const catMeta = getCategoryMeta(q.category);
                  const tMeta = getTypeMeta(q.type);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 bg-surface-card/80 border rounded-2xl transition space-y-3 shadow-sm ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                          : 'border-edge/90 hover:border-edge-strong'
                      }`}
                    >
                      {/* Top Card Meta Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelectMode && (
                            <button
                              onClick={() => handleToggleSelectRow(q.id)}
                              className="text-content-muted hover:text-content shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Square className="w-5 h-5 text-content-muted" />
                              )}
                            </button>
                          )}
                          <span className="font-mono text-xs font-bold text-content-muted shrink-0">
                            #{q.id}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border truncate max-w-[130px]"
                            style={{
                              backgroundColor: `${catMeta.color}15`,
                              borderColor: `${catMeta.color}35`,
                              color: catMeta.color,
                            }}
                          >
                            <IconHelper name={catMeta.iconName} className="w-3 h-3 shrink-0" />
                            <span className="truncate">{catMeta.label}</span>
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-content-secondary bg-surface-elevated/90 border border-edge-strong/60 shrink-0">
                          <IconHelper name={tMeta.iconName} className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[110px]">{tMeta.label}</span>
                        </span>
                      </div>

                      {/* Question Text in Vietnamese */}
                      <p className="text-sm font-medium text-content leading-relaxed">
                        {q.text}
                      </p>

                      {/* Attribution & Timestamps */}
                      <div className="pt-2 border-t border-edge/60 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between gap-2 text-content-muted">
                          <span className="text-content-muted">Created:</span>
                          <span className="text-content-secondary font-medium truncate">
                            {q.createdBy?.name || 'System'}
                            {q.createdAt && (
                              <span className="text-[10px] font-mono text-content-muted ml-1.5">
                                ({formatDateTime(q.createdAt)})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-content-muted">
                          <span className="text-content-muted">Updated:</span>
                          <span className="text-content-secondary font-medium truncate">
                            {q.updatedBy ? (
                              <>
                                {q.updatedBy.name}
                                {q.updatedAt && (
                                  <span className="text-[10px] font-mono text-content-muted ml-1.5">
                                    ({formatDateTime(q.updatedAt)})
                                  </span>
                                )}
                              </>
                            ) : q.updatedAt ? (
                              <span className="text-[10px] font-mono text-content-muted">
                                ({formatDateTime(q.updatedAt)})
                              </span>
                            ) : (
                              <span className="text-content-muted italic">Never</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface/80 text-content-muted border border-edge"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Actions Row (Min 44px Touch Target) */}
                      <div className="pt-2.5 border-t border-edge/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyQuestionText(q)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-content-secondary hover:text-content bg-surface-elevated/80 hover:bg-surface-elevated border border-edge rounded-xl transition min-h-[44px] active:scale-95 cursor-pointer"
                        >
                          {copiedId === q.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingQuestion(q);
                              setIsQuestionModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/25 border border-blue-500/25 dark:border-blue-500/30 rounded-xl transition min-h-[44px] shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'single_question',
                                id: q.id,
                                title: `Delete Question #${q.id}?`,
                                message: `Are you sure you want to delete question #${q.id}: "${q.text.slice(
                                  0,
                                  60
                                )}..."?`,
                              });
                              setIsDeleteModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/25 dark:border-red-500/30 rounded-xl transition min-h-[44px] shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Bar (Responsive for Desktop & Mobile) */}
            <div className="p-3.5 sm:p-4 bg-surface/80 border border-edge rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-content-muted w-full sm:w-auto">
                <span>
                  Showing {Math.min(totalQuestions, (page - 1) * limit + 1)} -{' '}
                  {Math.min(totalQuestions, page * limit)} of {totalQuestions} questions
                </span>

                <div className="flex items-center gap-1">
                  <span>Rows:</span>
                  {[10, 20, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setLimit(n); setPage(1); }}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition ${
                        limit === n
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                          : 'bg-surface-card border-edge-strong text-content-muted hover:text-content'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 sm:p-1.5 rounded-xl border border-edge-strong bg-surface-card text-content-secondary hover:text-content disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Previous page"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-semibold px-2 text-content-secondary">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 sm:p-1.5 rounded-xl border border-edge-strong bg-surface-card text-content-secondary hover:text-content disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Next page"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-content">Categories Management</h2>
                <p className="text-xs text-content-muted">
                  Customize themes, labels, colors, and visual identifiers
                </p>
              </div>
              <button
                onClick={() => {
                  setCatTypeMode('category');
                  setEditingCatType(null);
                  setIsCatTypeModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 sm:p-5 rounded-2xl border bg-surface-card/70 relative overflow-hidden flex flex-col justify-between transition hover:border-edge-strong"
                  style={{ borderColor: `${cat.color}35` }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}40`,
                          color: cat.color,
                        }}
                      >
                        <IconHelper name={cat.iconName} className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCatTypeMode('category');
                            setEditingCatType(cat);
                            setIsCatTypeModalOpen(true);
                          }}
                          className="p-2.5 text-content-muted hover:text-blue-400 hover:bg-surface-elevated rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({
                              type: 'category',
                              id: cat.id,
                              title: `Delete Category "${cat.label}"?`,
                              message: `Are you sure you want to delete category "${cat.label}"? Questions assigned to this category will keep their tag but the category metadata will be removed.`,
                            });
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2.5 text-content-muted hover:text-red-400 hover:bg-surface-elevated rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-content mb-1">{cat.label}</h3>
                    <p className="text-[11px] font-mono text-content-muted/70 mb-2">Key: {cat.id}</p>
                    <p className="text-xs text-content-muted leading-relaxed">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-edge/80 flex items-center justify-between text-xs">
                    <span className="text-content-muted">Accent:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-edge-strong"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-mono text-content-muted">{cat.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUESTION TYPES */}
        {activeTab === 'types' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-content">Question Formats & Types</h2>
                <p className="text-xs text-content-muted">
                  Define interaction rules and gameplay instructions for questions
                </p>
              </div>
              <button
                onClick={() => {
                  setCatTypeMode('type');
                  setEditingCatType(null);
                  setIsCatTypeModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question Type</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {types.map((t) => (
                <div
                  key={t.id}
                  className="p-4 sm:p-5 rounded-2xl border border-edge bg-surface-card/70 hover:border-edge-strong transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <IconHelper name={t.iconName} className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCatTypeMode('type');
                            setEditingCatType(t);
                            setIsCatTypeModalOpen(true);
                          }}
                          className="p-2.5 text-content-muted hover:text-blue-400 hover:bg-surface-elevated rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Edit Type"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({
                              type: 'type',
                              id: t.id,
                              title: `Delete Format "${t.label}"?`,
                              message: `Are you sure you want to delete question format "${t.label}"?`,
                            });
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2.5 text-content-muted hover:text-red-400 hover:bg-surface-elevated rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Delete Type"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-content mb-1">{t.label}</h3>
                    <p className="text-[11px] font-mono text-content-muted/70 mb-2">Key: {t.id}</p>
                    <p className="text-xs text-content-muted leading-relaxed">
                      {t.hint || 'No interaction hint provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-edge/80 flex items-center justify-between text-xs text-content-muted">
                    <span>Icon:</span>
                    <span className="font-mono text-content-muted">{t.iconName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ADMINS (MASTER ADMIN ONLY) */}
        {activeTab === 'admins' && currentAdmin.role === 'master_admin' && (
          <AdminUsersTab
            currentAdmin={currentAdmin}
            onToast={(type, message) => {
              toast({
                type,
                title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice',
                description: message,
              });
            }}
          />
        )}

        {/* TAB 5: AUDIT LOGS (MASTER ADMIN ONLY) */}
        {activeTab === 'audit_logs' && currentAdmin.role === 'master_admin' && (
          <AuditLogsTab
            onToast={(type, message) => {
              toast({
                type,
                title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice',
                description: message,
              });
            }}
          />
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) (Option 4.A) */}
      <div className="fixed bottom-6 right-4 sm:hidden z-30">
        {activeTab === 'questions' && (
          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsQuestionModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 active:scale-95 text-white font-semibold rounded-full shadow-2xl shadow-blue-600/60 transition-transform"
            aria-label="New Question"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">New Question</span>
          </button>
        )}
        {activeTab === 'categories' && (
          <button
            onClick={() => {
              setCatTypeMode('category');
              setEditingCatType(null);
              setIsCatTypeModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 active:scale-95 text-white font-semibold rounded-full shadow-2xl shadow-blue-600/60 transition-transform"
            aria-label="Add Category"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Add Category</span>
          </button>
        )}
        {activeTab === 'types' && (
          <button
            onClick={() => {
              setCatTypeMode('type');
              setEditingCatType(null);
              setIsCatTypeModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 active:scale-95 text-white font-semibold rounded-full shadow-2xl shadow-blue-600/60 transition-transform"
            aria-label="Add Question Type"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Add Type</span>
          </button>
        )}
      </div>

      {/* Mobile Sticky Bulk Action Bar (Option 7.A) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 inset-x-3 z-40 md:hidden bg-surface-card/95 border border-blue-500/60 rounded-2xl shadow-2xl p-3 flex items-center justify-between backdrop-blur-xl ring-1 ring-white/10 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-300">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-content-muted hover:text-content underline"
            >
              Clear
            </button>
          </div>
          <button
            onClick={() => {
              setDeleteTarget({
                type: 'bulk_questions',
                title: `Delete ${selectedIds.length} Questions?`,
                message: `Are you sure you want to permanently delete these ${selectedIds.length} selected questions from the database? This action cannot be undone.`,
                count: selectedIds.length,
              });
              setIsDeleteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Mobile Filter Drawer / Bottom Sheet (Standardized with ModalShell) */}
      <ModalShell
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filters & Sorting"
        icon={<SlidersHorizontal className="w-5 h-5 text-blue-400" />}
        maxWidth="md"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Scrollable Filters Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {/* Filter Category */}
            <div>
              <SearchableDropdown
                label="Filter by Category"
                icon={<Layers className="w-3.5 h-3.5 text-blue-400" />}
                options={[
                  { id: 'all', label: 'All Categories', iconName: 'Layers' },
                  ...categories.map((c): DropdownOption => ({
                    id: c.id,
                    label: c.label,
                    color: c.color,
                    iconName: c.iconName,
                  })),
                ]}
                value={selectedCategory}
                onChange={(val) => { setSelectedCategory(val); setPage(1); }}
                placeholder="All Categories"
                searchPlaceholder="Search category..."
              />
            </div>

            {/* Filter Format */}
            <div>
              <SearchableDropdown
                label="Filter by Format"
                icon={<MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />}
                options={[
                  { id: 'all', label: 'All Formats', iconName: 'MessageSquareQuote' },
                  ...types.map((t): DropdownOption => ({
                    id: t.id,
                    label: t.label,
                    iconName: t.iconName,
                  })),
                ]}
                value={selectedType}
                onChange={(val) => { setSelectedType(val); setPage(1); }}
                placeholder="All Formats"
                searchPlaceholder="Search format..."
              />
            </div>

            {/* Filter Author */}
            <div>
              <SearchableDropdown
                label="Filter by Author"
                icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                options={authorOptions}
                value={selectedAuthor}
                onChange={(val) => { setSelectedAuthor(val); setPage(1); }}
                placeholder="All Authors"
                searchPlaceholder="Search author..."
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Sort Questions By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'updatedAt', label: 'Recently Updated' },
                  { key: 'id', label: 'ID Number' },
                  { key: 'text', label: 'Question Text' },
                  { key: 'category', label: 'Category' },
                  { key: 'type', label: 'Format' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      hapticFeedback.light();
                      if (sortBy === s.key) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(s.key as 'id' | 'text' | 'category' | 'type' | 'updatedAt');
                        setSortOrder(s.key === 'updatedAt' || s.key === 'id' ? 'desc' : 'asc');
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition text-left flex items-center justify-between ${
                      sortBy === s.key
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-surface border-edge text-content-muted hover:text-content'
                    }`}
                  >
                    <span>{s.label}</span>
                    {sortBy === s.key && (
                      <span className="text-[10px] font-mono text-blue-400">
                        {sortOrder.toUpperCase()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Sticky Footer Actions */}
          <div className="p-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedAuthor(currentAdmin.id);
                setSortBy('updatedAt');
                setSortOrder('desc');
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-edge-strong text-xs font-semibold text-content-muted hover:text-content transition min-h-[44px]"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => {
                hapticFeedback.medium();
                setIsMobileFilterOpen(false);
              }}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition text-center min-h-[44px] flex items-center justify-center"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </ModalShell>

      {/* MODALS */}
      <QuestionFormModal
        isOpen={isQuestionModalOpen}
        question={editingQuestion}
        categories={categories}
        types={types}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSubmitQuestion}
      />

      <CategoryTypeModal
        isOpen={isCatTypeModalOpen}
        mode={catTypeMode}
        initialData={editingCatType}
        onClose={() => {
          setIsCatTypeModalOpen(false);
          setEditingCatType(null);
        }}
        onSubmitCategory={handleSubmitCategory}
        onSubmitType={handleSubmitType}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title={deleteTarget?.title || 'Confirm Deletion'}
        message={deleteTarget?.message || 'Are you sure you want to proceed?'}
        itemCount={deleteTarget?.count}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportSuccess={() => {
          triggerReloadQuestions();
          toast({ type: 'success', title: 'Import successful', description: 'Questions have been imported and the list has been refreshed.' });
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        isForced={Boolean(currentAdmin.mustChangePassword)}
        onSuccess={() => {
          toast({
            type: 'success',
            title: 'Password updated',
            description: 'Your password has been changed successfully.',
          });
        }}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};
