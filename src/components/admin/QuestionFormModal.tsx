'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Sparkles, Tag, Layers, MessageSquareQuote, Keyboard } from 'lucide-react';
import { CategoryMeta, Question, TypeMeta } from '@/types/question';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';
import { ModalShell } from '@/components/ui/ModalShell';
import { hapticFeedback } from '@/lib/haptics';

interface QuestionFormModalProps {
  isOpen: boolean;
  question: Question | null;
  categories: CategoryMeta[];
  types: TypeMeta[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: number;
    text: string;
    category: string;
    type: string;
    tags: string[];
  }) => Promise<void>;
}

interface QuestionFormInnerProps {
  question: Question | null;
  categories: CategoryMeta[];
  types: TypeMeta[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: number;
    text: string;
    category: string;
    type: string;
    tags: string[];
  }) => Promise<void>;
}

function QuestionFormInner({
  question,
  categories,
  types,
  isSubmitting,
  onClose,
  onSubmit,
}: QuestionFormInnerProps) {
  const [text, setText] = useState(question?.text || '');
  const [category, setCategory] = useState(
    question?.category || categories[0]?.id || 'group'
  );
  const [type, setType] = useState(question?.type || types[0]?.id || 'open');
  const [tags, setTags] = useState<string[]>(question?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [customId, setCustomId] = useState<string>(
    question ? String(question.id) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus question text on open
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Ctrl+Enter → submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting]);

  const categoryOptions: DropdownOption[] = categories.map((c) => ({
    id: c.id,
    label: c.label,
    sublabel: c.description,
    color: c.color,
    iconName: c.iconName,
  }));

  const typeOptions: DropdownOption[] = types.map((t) => ({
    id: t.id,
    label: t.label,
    sublabel: t.hint,
    iconName: t.iconName,
  }));

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    hapticFeedback.light();
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    hapticFeedback.light();
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please provide question text');
      hapticFeedback.warning();
      return;
    }

    try {
      setError(null);
      await onSubmit({
        id: question ? question.id : customId ? parseInt(customId, 10) : undefined,
        text: text.trim(),
        category,
        type,
        tags,
      });
      hapticFeedback.success();
    } catch (err: unknown) {
      hapticFeedback.warning();
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 overflow-hidden min-h-0"
    >
      <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
        {error && (
          <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl">
            {error}
          </div>
        )}

        {/* Question Text */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
            Question Text (Vietnamese) *
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Nếu bạn được chọn một siêu năng lực trong 24 giờ tới, bạn sẽ chọn gì?"
            rows={4}
            required
            className="w-full px-4 py-3 bg-surface-input border border-edge-strong rounded-xl text-content placeholder-content-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed transition"
          />
        </div>

        {/* Category and Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableDropdown
            label="Category *"
            icon={<Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />}
            options={categoryOptions}
            value={category}
            onChange={setCategory}
            placeholder="Select Category..."
            searchPlaceholder="Search category..."
          />

          <SearchableDropdown
            label="Format / Type *"
            icon={<MessageSquareQuote className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
            options={typeOptions}
            value={type}
            onChange={setType}
            placeholder="Select Format / Type..."
            searchPlaceholder="Search format or type..."
          />
        </div>

        {/* Custom ID (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
              Question ID
            </label>
            <span className="text-xs text-content-muted">Auto-assigned if empty</span>
          </div>
          <input
            type="number"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="Auto (next available integer)"
            disabled={Boolean(question)}
            className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-content placeholder-content-muted text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Type a tag and press Enter or comma..."
                className="w-full pl-9 pr-3.5 py-2 bg-surface-input border border-edge-strong rounded-xl text-content placeholder-content-muted text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 text-content-secondary hover:text-content border border-edge text-xs font-semibold transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Existing tags chips */}
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-surface-elevated/50 border border-edge-strong/60 rounded-xl">
            {tags.length === 0 ? (
              <span className="text-xs text-content-muted italic">No tags added yet</span>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-elevated border border-edge text-xs text-content-secondary font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-content-muted hover:text-red-500 transition ml-0.5"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Actions Footer */}
      <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <div className="text-xs text-content-muted hidden sm:flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Ctrl + Enter to save</span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:text-content bg-surface-elevated hover:bg-surface-elevated/80 border border-edge rounded-xl transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{question ? 'Save Changes' : 'Create Question'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  question,
  categories,
  types,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={question ? `Edit Question #${question.id}` : 'Create New Question'}
      subtitle={
        question
          ? 'Modify the prompt, category, or interaction format'
          : 'Add a new prompt to the icebreaker collection'
      }
      icon={<Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
      maxWidth="2xl"
      isSubmitting={isSubmitting}
      contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
    >
      <QuestionFormInner
        key={question ? `edit-${question.id}` : 'create-new'}
        question={question}
        categories={categories}
        types={types}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </ModalShell>
  );
};
