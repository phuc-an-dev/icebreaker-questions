'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Keyboard, Palette, Plus } from 'lucide-react';
import { CategoryMeta, TypeMeta } from '@/types/question';
import { IconHelper } from '@/components/ui/IconHelper';
import { ModalShell } from '@/components/ui/ModalShell';
import { hapticFeedback } from '@/lib/haptics';
import { slugify } from '@/lib/utils';

interface CategoryTypeModalProps {
  isOpen: boolean;
  mode: 'category' | 'type';
  initialData: CategoryMeta | TypeMeta | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmitCategory?: (cat: CategoryMeta) => Promise<void>;
  onSubmitType?: (type: TypeMeta) => Promise<void>;
}

// ─── Extended icon set ────────────────────────────────────────────────────────
const COMMON_ICONS = [
  // People & social
  'Users', 'UsersRound', 'UserCheck', 'UserPlus', 'HeartHandshake', 'Heart',
  // Fun & play
  'Sparkles', 'Smile', 'Laugh', 'PartyPopper', 'Gamepad2', 'Dice5',
  // Work & growth
  'Briefcase', 'TrendingUp', 'BarChart2', 'Target', 'Award', 'Trophy',
  // Learning & knowledge
  'Lightbulb', 'Book', 'BookOpen', 'GraduationCap', 'Compass', 'Globe',
  // Nature & wellness
  'Flame', 'Leaf', 'Sun', 'Moon', 'Cloud', 'Zap',
  // Communication
  'MessageSquareQuote', 'MessageCircle', 'Mic', 'Megaphone', 'Radio', 'Volume2',
  // Activity & hobbies
  'Music', 'Camera', 'Coffee', 'Utensils', 'Palette', 'Brush',
  // Tech & tools
  'Rocket', 'Code2', 'Cpu', 'Link2', 'Globe2', 'Wifi',
  // Misc
  'Star', 'Shield', 'Lock', 'Key', 'FilePenLine', 'Scale',
  'RotateCcw', 'Sliders', 'Vote', 'Theater', 'History', 'HelpCircle',
];

// ─── Preset color swatches ─────────────────────────────────────────────────
const PRESET_COLORS = [
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#f43f5e', // rose
  '#ec4899', // pink
  '#a855f7', // purple
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#64748b', // slate
  '#78716c', // stone
  '#d97706', // yellow-dark
  '#7c3aed', // violet
];

interface CategoryTypeInnerProps {
  mode: 'category' | 'type';
  initialData: CategoryMeta | TypeMeta | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitCategory?: (cat: CategoryMeta) => Promise<void>;
  onSubmitType?: (type: TypeMeta) => Promise<void>;
}

const CategoryTypeInner: React.FC<CategoryTypeInnerProps> = ({
  mode,
  initialData,
  isSubmitting,
  onClose,
  onSubmitCategory,
  onSubmitType,
}) => {
  const isEditing = Boolean(initialData);

  const [id, setId] = useState(initialData?.id || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [descriptionOrHint, setDescriptionOrHint] = useState(
    mode === 'category'
      ? (initialData as CategoryMeta)?.description || ''
      : (initialData as TypeMeta)?.hint || ''
  );
  const [color, setColor] = useState(
    mode === 'category' ? (initialData as CategoryMeta)?.color || '#3b82f6' : '#3b82f6'
  );
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [iconName, setIconName] = useState(
    initialData?.iconName || (mode === 'category' ? 'Sparkles' : 'MessageSquareQuote')
  );
  const [error, setError] = useState<string | null>(null);

  const labelRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const colorSwatchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nativeColorRef = useRef<HTMLInputElement>(null);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedColorIdx, setFocusedColorIdx] = useState(() =>
    PRESET_COLORS.indexOf(mode === 'category' ? (initialData as CategoryMeta)?.color || '#3b82f6' : '#3b82f6')
  );
  const [focusedIconIdx, setFocusedIconIdx] = useState(() => {
    const initial = initialData?.iconName || (mode === 'category' ? 'Sparkles' : 'MessageSquareQuote');
    const idx = COMMON_ICONS.indexOf(initial);
    return idx >= 0 ? idx : 0;
  });

  // Auto-focus label on open
  useEffect(() => {
    const t = setTimeout(() => labelRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Esc → close, Ctrl+Enter → submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) { onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleIdFromLabel = (newLabel: string) => {
    setLabel(newLabel);
    if (!isEditing) {
      setId(slugify(newLabel));
    }
  };

  // Roving tabindex keyboard nav for color swatches
  const handleSwatchKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const total = PRESET_COLORS.length;
    const cols = 8;
    let next = -1;
    if (e.key === 'ArrowRight') { e.preventDefault(); next = (idx + 1) % total; }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); next = (idx - 1 + total) % total; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); next = Math.min(idx + cols, total - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = Math.max(idx - cols, 0); }
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const activeIcon = COMMON_ICONS.indexOf(iconName);
      iconRefs.current[activeIcon >= 0 ? activeIcon : 0]?.focus();
      return;
    }
    if (next >= 0) {
      setFocusedColorIdx(next);
      colorSwatchRefs.current[next]?.focus();
    }
  };

  // Roving tabindex keyboard nav for icon grid
  const ICON_COLS = 6;
  const handleIconKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const total = COMMON_ICONS.length;
    let next = -1;
    if (e.key === 'ArrowRight') { e.preventDefault(); next = (idx + 1) % total; }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); next = (idx - 1 + total) % total; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); next = Math.min(idx + ICON_COLS, total - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = Math.max(idx - ICON_COLS, 0); }
    if (next >= 0) {
      setFocusedIconIdx(next);
      iconRefs.current[next]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !label.trim()) {
      setError('Both ID and Label are required.');
      return;
    }
    try {
      setError(null);
      if (mode === 'category' && onSubmitCategory) {
        const cat: CategoryMeta = {
          id: id.trim().toLowerCase(),
          label: label.trim(),
          description: descriptionOrHint.trim(),
          color: color || '#3b82f6',
          gradient: `linear-gradient(135deg, ${color || '#3b82f6'} 0%, #1e40af 100%)`,
          glowColor: `${color || '#3b82f6'}40`,
          borderGlow: `${color || '#3b82f6'}80`,
          iconName,
        };
        await onSubmitCategory(cat);
        hapticFeedback.success();
      } else if (mode === 'type' && onSubmitType) {
        await onSubmitType({
          id: id.trim().toLowerCase(),
          label: label.trim(),
          hint: descriptionOrHint.trim(),
          iconName,
        });
        hapticFeedback.success();
      }
    } catch (err: unknown) {
      hapticFeedback.warning();
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const footer = (
    <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
      <div className="hidden sm:flex items-center gap-2 text-content-muted">
        <Keyboard className="w-3.5 h-3.5" />
        <span className="text-[11px]">
          <kbd className="px-1 py-0.5 bg-surface-elevated border border-edge rounded text-content-muted font-mono text-[10px]">Esc</kbd>
          {' '}cancel
          {' · '}
          <kbd className="px-1 py-0.5 bg-surface-elevated border border-edge rounded text-content-muted font-mono text-[10px]">Ctrl</kbd>
          {' + '}
          <kbd className="px-1 py-0.5 bg-surface-elevated border border-edge rounded text-content-muted font-mono text-[10px]">Enter</kbd>
          {' '}save
        </span>
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
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <span>{isEditing ? 'Save Changes' : 'Create'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 overflow-hidden min-h-0"
    >
      <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
        {error && (
          <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl">
            {error}
          </div>
        )}

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
            Display Name / Label *
          </label>
          <input
            ref={labelRef}
            type="text"
            value={label}
            onChange={(e) => handleIdFromLabel(e.target.value)}
            placeholder={mode === 'category' ? 'e.g. Science & Space' : 'e.g. Speed Round'}
            required
            className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-content text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* ID Key */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
              Unique ID Key *
            </label>
            <span className="text-[11px] text-content-muted">
              Internal key (Display Name above will be shown to users)
            </span>
          </div>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={isEditing}
            placeholder="e.g. science-space"
            required
            className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-content text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-mono text-xs transition"
          />
        </div>

        {/* Description / Hint */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
            {mode === 'category' ? 'Description' : 'Format Hint / Instructions'}
          </label>
          <input
            type="text"
            value={descriptionOrHint}
            onChange={(e) => setDescriptionOrHint(e.target.value)}
            placeholder={
              mode === 'category'
                ? 'Brief explanation of this theme'
                : 'How players should respond'
            }
            className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-content text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Color — category only */}
        {mode === 'category' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
              Category Accent Color
            </label>

            {/* Swatch grid */}
            <div
              className="flex flex-wrap gap-2 p-2.5 bg-surface-elevated/50 border border-edge rounded-xl"
              role="radiogroup"
              aria-label="Color swatches"
            >
              {PRESET_COLORS.map((c, idx) => (
                <button
                  key={c}
                  ref={(el) => { colorSwatchRefs.current[idx] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={c}
                  tabIndex={focusedColorIdx === idx || (focusedColorIdx < 0 && idx === 0) ? 0 : -1}
                  onClick={() => { setColor(c); setFocusedColorIdx(idx); }}
                  onFocus={() => setFocusedColorIdx(idx)}
                  onKeyDown={(e) => handleSwatchKeyDown(e, idx)}
                  className="w-7 h-7 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'var(--text-primary)' : 'transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}

              {/* Custom color toggle */}
              <button
                type="button"
                onClick={() => setShowCustomColorPicker((v) => !v)}
                title="Custom color"
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  showCustomColorPicker
                    ? 'border-blue-500 bg-blue-500/20 text-blue-500 dark:text-blue-400'
                    : 'border-edge-strong bg-surface-elevated text-content-muted hover:border-edge-strong/80'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom picker — only shown on demand */}
            {showCustomColorPicker && (
              <div className="mt-2 flex items-center gap-3 p-3 bg-surface-elevated/60 border border-edge rounded-xl">
                <div className="relative w-10 h-10 shrink-0">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-edge-strong cursor-pointer shadow-inner"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    ref={nativeColorRef}
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    tabIndex={-1}
                    aria-label="Open color picker"
                  />
                </div>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="w-28 px-3 py-1.5 bg-surface-input border border-edge-strong rounded-xl text-content text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => nativeColorRef.current?.click()}
                  className="flex-1 h-8 rounded-lg border border-edge-strong cursor-pointer hover:border-edge-strong/80 transition"
                  style={{ backgroundColor: color }}
                  title="Click to open color picker"
                />
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-content-muted" />
                  <span className="text-xs text-content-muted">Custom</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Icon picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
            Select Icon
          </label>
          <div
            className="grid grid-cols-6 gap-2 max-h-[220px] overflow-y-auto p-2 bg-surface-elevated/50 border border-edge rounded-xl custom-scrollbar"
            role="radiogroup"
            aria-label="Icon selection"
          >
            {COMMON_ICONS.map((icon, idx) => {
              const isSelected = iconName === icon;
              const isFocused = focusedIconIdx === idx;
              return (
                <button
                  key={icon}
                  ref={(el) => { iconRefs.current[idx] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => { setIconName(icon); setFocusedIconIdx(idx); }}
                  onFocus={() => setFocusedIconIdx(idx)}
                  onKeyDown={(e) => handleIconKeyDown(e, idx)}
                  title={icon}
                  className={`h-9 flex items-center justify-center rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500 text-blue-500 dark:text-blue-400 shadow-sm'
                      : 'border-edge text-content-muted hover:text-content hover:bg-surface-elevated'
                  }`}
                >
                  <IconHelper name={icon} className="w-4 h-4" />
                </button>
              );
            })}
          </div>
          {/* Selected icon preview */}
          <div className="mt-2 flex items-center gap-2 text-xs text-content-muted">
            <IconHelper name={iconName} className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="font-mono text-content-muted">{iconName}</span>
          </div>
        </div>
      </div>
      {footer}
    </form>
  );
};

export const CategoryTypeModal: React.FC<CategoryTypeModalProps> = ({
  isOpen,
  mode,
  initialData,
  isSubmitting = false,
  onClose,
  onSubmitCategory,
  onSubmitType,
}) => {
  const isEditing = Boolean(initialData);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${mode === 'category' ? 'Category' : 'Question Type'}` : `New ${mode === 'category' ? 'Category' : 'Question Type'}`}
      subtitle="Configure display label, icon, and visual attributes"
      icon={
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ color: mode === 'category' && initialData && 'color' in initialData ? (initialData as CategoryMeta).color : '#60a5fa' }}
        >
          <IconHelper name={initialData?.iconName || (mode === 'category' ? 'Sparkles' : 'MessageSquareQuote')} className="w-5 h-5" />
        </div>
      }
      maxWidth="lg"
      isSubmitting={isSubmitting}
      contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
    >
      <CategoryTypeInner
        key={initialData ? `${mode}-${initialData.id}` : `new-${mode}`}
        mode={mode}
        initialData={initialData}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmitCategory={onSubmitCategory}
        onSubmitType={onSubmitType}
      />
    </ModalShell>
  );
};
