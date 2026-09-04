'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Sparkles, Tag, Layers, MessageSquareQuote, Keyboard } from 'lucide-react';
import { CategoryMeta, Question, TypeMeta } from '@/types/question';

import { SearchableDropdown, DropdownOption } from './SearchableDropdown';

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
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Esc → close, Ctrl+Enter → submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

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
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
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
      setError('Question text is required.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (!type) {
      setError('Please select a question type.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {question ? `Edit Question #${question.id}` : 'Create New Question'}
              </h2>
              <p className="text-xs text-slate-400">
                {question
                  ? 'Modify the prompt, category, or interaction format'
                  : 'Add a new prompt to the icebreaker collection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl">
              {error}
            </div>
          )}

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Question Text (Vietnamese) *
            </label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Nếu bạn được chọn một siêu năng lực trong 24 giờ tới, bạn sẽ chọn gì?"
              rows={4}
              required
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed"
            />
          </div>

          {/* Category and Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Custom Searchable Dropdown */}
            <SearchableDropdown
              label="Category *"
              icon={<Layers className="w-3.5 h-3.5 text-blue-400" />}
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Select Category..."
              searchPlaceholder="Search category..."
            />

            {/* Type Custom Searchable Dropdown */}
            <SearchableDropdown
              label="Format / Type *"
              icon={<MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />}
              options={typeOptions}
              value={type}
              onChange={setType}
              placeholder="Select Format / Type..."
              searchPlaceholder="Search format or type..."
            />
          </div>

          {/* Optional ID (Only if creating new) */}
          {!question && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Custom ID <span className="text-slate-500 font-normal">(optional, auto-generated if left empty)</span>
              </label>
              <input
                type="number"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="Leave blank for automatic sequential ID"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Tags
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Type tag and press Enter (e.g. food, travel)"
                className="flex-1 px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Tag pills */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-950/40 border border-slate-800 rounded-xl">
              {tags.length === 0 ? (
                <span className="text-xs text-slate-500 italic py-0.5">No tags added yet</span>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 p-0.5 rounded transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {/* Keyboard hint */}
            <div className="hidden sm:flex items-center gap-2 text-slate-600">
              <Keyboard className="w-3.5 h-3.5" />
              <span className="text-[11px]">
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Esc</kbd>
                {' '}cancel
                {' · '}
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Ctrl</kbd>
                {' + '}
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Enter</kbd>
                {' '}save
              </span>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {question ? 'Save Changes' : 'Create Question'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
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
  if (!isOpen) return null;

  return (
    <QuestionFormInner
      key={question ? `edit-${question.id}` : 'create-new'}
      question={question}
      categories={categories}
      types={types}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};
